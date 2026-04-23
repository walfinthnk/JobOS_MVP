import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOAuth2Client } from '@/lib/gmail/client';
import { decrypt } from '@/lib/gmail/crypto';

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('refresh_token_enc')
    .eq('user_id', user.id)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 });
  }

  // Google 側でトークンを失効
  try {
    const oauth2 = createOAuth2Client();
    await oauth2.revokeToken(decrypt(integration.refresh_token_enc));
  } catch (err) {
    console.error('[Gmail] token revocation failed:', err);
    // 失効失敗でも DB からは削除する
  }

  // DB からレコードを削除（gmail_sync_logs は CASCADE で連鎖削除）
  await supabase
    .from('gmail_integrations')
    .delete()
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
