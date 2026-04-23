import { createClient } from '@/lib/supabase/server';
import { GmailConnectSection } from '@/components/GmailConnectSection';
import { GmailSyncButton } from '@/components/GmailSyncButton';
import { SyncLogList, type SyncLog } from '@/components/SyncLogList';
import type { GmailIntegration } from '@/lib/types';

export default async function GmailSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('id, gmail_address, is_active, last_synced_at, watch_expiry')
    .eq('user_id', user.id)
    .single();

  const { data: logs } = await supabase
    .from('gmail_sync_logs')
    .select(`
      id, raw_subject, action, parsed_company, parsed_position,
      detected_status, confidence_score, error_message, processed_at,
      application_id,
      job_applications ( company_name, position )
    `)
    .eq('user_id', user.id)
    .order('processed_at', { ascending: false })
    .limit(30);

  const pendingCount = (logs ?? []).filter(l => l.action === 'pending_review').length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gmail連携</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gmail と連携することで、受信メールから求人応募の状況を自動で追跡できます。
          </p>
        </div>
        {integration && <GmailSyncButton autoSync />}
      </div>

      <GmailConnectSection integration={integration as GmailIntegration | null} />

      {integration && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">同期ログ</h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                確認待ち {pendingCount} 件
              </span>
            )}
          </div>
          <SyncLogList initialLogs={(logs ?? []) as unknown as SyncLog[]} />
        </section>
      )}
    </div>
  );
}
