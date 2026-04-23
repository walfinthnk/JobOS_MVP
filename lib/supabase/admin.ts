import { createClient } from '@supabase/supabase-js';

// サービスロールキーを使用（RLS をバイパス）
// Webhook など認証セッションがない場所で使用する
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
