import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TodoList } from '@/components/TodoList';
import type { JobApplication, JobStatus } from '@/lib/types';

function computeSummary(jobs: JobApplication[]) {
  const total = jobs.length;
  const reached_screening = jobs.filter(j =>
    (['screening', 'interview', 'offered', 'accepted'] as JobStatus[]).includes(j.status)
  ).length;
  const screening_rate = total > 0 ? Math.round(reached_screening / total * 100) : 0;

  let earliest: Date | null = null;
  for (const job of jobs) {
    if (job.applied_date) {
      const d = new Date(job.applied_date);
      if (!earliest || d < earliest) earliest = d;
    }
  }
  const active_days = earliest
    ? Math.max(1, Math.ceil((Date.now() - earliest.getTime()) / 86_400_000))
    : 0;

  return { total, screening_rate, active_days };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const safeJobs = (jobs ?? []) as JobApplication[];
  const { total, screening_rate, active_days } = computeSummary(safeJobs);

  // 最新Gmailメッセージ ID を求人ごとに取得（FR-028: 最新メールリンク）
  const { data: syncLogs } = await supabase
    .from('gmail_sync_logs')
    .select('application_id, gmail_message_id')
    .eq('user_id', user!.id)
    .in('action', ['created', 'updated'])
    .not('application_id', 'is', null)
    .order('processed_at', { ascending: false });

  const gmailMessages: Record<string, string> = {};
  for (const log of syncLogs ?? []) {
    if (log.application_id && !gmailMessages[log.application_id]) {
      gmailMessages[log.application_id] = log.gmail_message_id;
    }
  }

  return (
    <div>
      {/* ヘッダー：サマリー + 追加ボタン */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-6 text-sm text-gray-600">
          <span>
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="ml-1">件応募</span>
          </span>
          <span>
            <span className="text-2xl font-bold text-gray-900">{screening_rate}</span>
            <span className="ml-1">%通過率</span>
          </span>
          {active_days > 0 && (
            <span>
              <span className="text-2xl font-bold text-gray-900">{active_days}</span>
              <span className="ml-1">日活動中</span>
            </span>
          )}
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          ＋ 求人を追加する
        </Link>
      </div>

      {/* カンバンボード */}
      {safeJobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">まだ求人が登録されていません</p>
          <p className="text-sm mt-1">「求人を追加する」から応募求人を登録しましょう</p>
        </div>
      ) : (
        <KanbanBoard jobs={safeJobs} gmailMessages={gmailMessages} />
      )}

      {/* ToDoリスト */}
      {safeJobs.some(j => j.todo_note && !j.todo_completed) && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">ToDoリスト</h2>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-2">
            <TodoList jobs={safeJobs} />
          </div>
        </div>
      )}
    </div>
  );
}
