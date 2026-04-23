import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/admin';
import { getValidAccessToken } from '@/lib/gmail/client';

// Vercel Cron は Authorization: Bearer <CRON_SECRET> を付与する
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 有効期限が2日以内 or 未登録（null）の連携を対象にする
  const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const { data: integrations, error } = await supabase
    .from('gmail_integrations')
    .select('*')
    .eq('is_active', true)
    .or(`watch_expiry.is.null,watch_expiry.lte.${twoDaysLater}`);

  if (error) {
    console.error('[Cron] fetch integrations failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { userId: string; status: string; error?: string }[] = [];

  for (const integration of integrations ?? []) {
    try {
      const { accessToken, newAccessTokenEnc, newExpiresAt } = await getValidAccessToken(
        integration.access_token_enc,
        integration.refresh_token_enc,
        integration.token_expires_at,
      );

      if (newAccessTokenEnc) {
        await supabase
          .from('gmail_integrations')
          .update({ access_token_enc: newAccessTokenEnc, token_expires_at: newExpiresAt })
          .eq('id', integration.id);
      }

      const oauth2 = new google.auth.OAuth2();
      oauth2.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2 });

      const watchRes = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: process.env.GOOGLE_PUBSUB_TOPIC,
          labelIds:  ['INBOX'],
        },
      });

      await supabase
        .from('gmail_integrations')
        .update({
          history_id:   watchRes.data.historyId?.toString() ?? integration.history_id,
          watch_expiry: new Date(Number(watchRes.data.expiration)).toISOString(),
        })
        .eq('id', integration.id);

      results.push({ userId: integration.user_id, status: 'renewed' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Cron] watch renewal failed for ${integration.user_id}:`, message);
      results.push({ userId: integration.user_id, status: 'failed', error: message });
    }
  }

  console.log('[Cron] gmail-rewatch completed:', results);
  return NextResponse.json({ processed: results.length, results });
}
