import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/gmail/client';

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 });
  }

  const { accessToken } = await getValidAccessToken(
    integration.access_token_enc,
    integration.refresh_token_enc,
    integration.token_expires_at,
  );

  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });

  const topicName = process.env.GOOGLE_PUBSUB_TOPIC;

  try {
    const watchRes = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });

    await supabase
      .from('gmail_integrations')
      .update({
        history_id:   watchRes.data.historyId?.toString() ?? null,
        watch_expiry: new Date(Number(watchRes.data.expiration)).toISOString(),
      })
      .eq('id', integration.id);

    return NextResponse.json({
      success:     true,
      historyId:   watchRes.data.historyId,
      expiration:  watchRes.data.expiration,
      topicName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, topicName }, { status: 500 });
  }
}
