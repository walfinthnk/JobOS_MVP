import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, createOAuth2Client, createGmailClient } from '@/lib/gmail/client';
import { encrypt } from '@/lib/gmail/crypto';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const err   = searchParams.get('error');

  if (err) {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=auth_denied`);
  }

  // CSRF state 検証
  const cookieStore = await cookies();
  const storedState = cookieStore.get('gmail_oauth_state')?.value;
  cookieStore.delete('gmail_oauth_state');

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=no_code`);
  }

  // ユーザー認証確認
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${APP_URL}/login`);

  // 認可コード → トークン交換
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=token_exchange_failed`);
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=missing_tokens`);
  }

  // Gmail アドレスを取得（getProfile は gmail.readonly スコープで動作）
  const oauth2 = createOAuth2Client();
  oauth2.setCredentials(tokens);
  let gmailAddress: string;
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2 });
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
    if (!profile.emailAddress) {
      return NextResponse.redirect(`${APP_URL}/settings/gmail?error=no_email`);
    }
    gmailAddress = profile.emailAddress;
  } catch {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=profile_fetch_failed`);
  }

  // トークンを AES-256-GCM で暗号化して DB に保存
  const { data: integration, error: dbError } = await supabase
    .from('gmail_integrations')
    .upsert({
      user_id:           user.id,
      gmail_address:     gmailAddress,
      access_token_enc:  encrypt(tokens.access_token),
      refresh_token_enc: encrypt(tokens.refresh_token),
      token_expires_at:  new Date(tokens.expiry_date!).toISOString(),
      is_active:         true,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (dbError || !integration) {
    return NextResponse.redirect(`${APP_URL}/settings/gmail?error=db_error`);
  }

  // Gmail Push 通知 (watch) を登録
  try {
    const gmail = createGmailClient(tokens.access_token!);
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
        history_id:   watchRes.data.historyId?.toString() ?? null,
        watch_expiry: new Date(Number(watchRes.data.expiration)).toISOString(),
      })
      .eq('id', integration.id);
  } catch (watchErr) {
    console.error('[Gmail] watch() 登録失敗:', watchErr);
    // watch 失敗は非致命的（手動同期は引き続き可能）
  }

  return NextResponse.redirect(`${APP_URL}/settings/gmail?success=connected`);
}
