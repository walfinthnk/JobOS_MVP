import { createClient } from '@/lib/supabase/server';
import { JOB_STATUS_LABELS, type JobApplication, type JobStatus } from '@/lib/types';

const STATUS_COLORS: Record<JobStatus, string> = {
  considering: 'bg-purple-300',
  applied:     'bg-gray-400',
  screening:   'bg-blue-400',
  interview:   'bg-amber-400',
  offered:     'bg-green-400',
  accepted:    'bg-green-600',
  declined:    'bg-red-300',
};

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from('job_applications')
    .select('status, applied_date')
    .eq('user_id', user!.id);

  const safeJobs = (jobs ?? []) as Pick<JobApplication, 'status' | 'applied_date'>[];
  const total = safeJobs.length;

  // ステータス別カウント
  const by_status = safeJobs.reduce<Record<JobStatus, number>>(
    (acc, j) => { acc[j.status as JobStatus]++; return acc; },
    { considering: 0, applied: 0, screening: 0, interview: 0, offered: 0, accepted: 0, declined: 0 }
  );

  // 通過率
  const reached_screening = by_status.screening + by_status.interview + by_status.offered + by_status.accepted;
  const reached_interview  = by_status.interview + by_status.offered + by_status.accepted;
  const screening_rate = total > 0 ? Math.round(reached_screening / total * 100) : 0;
  const interview_rate = reached_screening > 0 ? Math.round(reached_interview / reached_screening * 100) : 0;

  // 活動日数
  let earliest: Date | null = null;
  for (const job of safeJobs) {
    if (job.applied_date) {
      const d = new Date(job.applied_date);
      if (!earliest || d < earliest) earliest = d;
    }
  }
  const active_days = earliest
    ? Math.max(1, Math.ceil((Date.now() - earliest.getTime()) / 86_400_000))
    : 0;

  // 月別応募数（直近6ヶ月）
  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
  }
  for (const job of safeJobs) {
    if (job.applied_date) {
      const key = job.applied_date.slice(0, 7);
      if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }
  }
  const monthly = Array.from(monthlyMap.entries()).map(([key, count]) => ({
    label: `${parseInt(key.split('-')[1])}月`,
    count,
  }));
  const maxMonthly = Math.max(...monthly.map(m => m.count), 1);

  // ファネル用データ
  const funnelRows: { label: string; count: number; pct: number }[] = [
    { label: '応募',       count: total,             pct: 100 },
    { label: '書類選考以降', count: reached_screening, pct: total > 0 ? Math.round(reached_screening / total * 100) : 0 },
    { label: '面接以降',    count: reached_interview,  pct: total > 0 ? Math.round(reached_interview / total * 100) : 0 },
    { label: '内定',        count: by_status.offered + by_status.accepted, pct: total > 0 ? Math.round((by_status.offered + by_status.accepted) / total * 100) : 0 },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">統計・振り返り</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '総応募数', value: `${total}件` },
          { label: '書類通過率', value: `${screening_rate}%` },
          { label: '活動日数', value: `${active_days}日` },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <p className="text-center text-gray-400 py-12">まだ求人が登録されていません</p>
      ) : (
        <>
          {/* 選考ファネル */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">選考ファネル</h2>
            <div className="space-y-3">
              {funnelRows.map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 shrink-0">{row.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-700 w-20 shrink-0 text-right">
                    {row.count}件 ({row.pct}%)
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-6 text-sm text-gray-500">
              <span>書類通過率 <strong className="text-gray-800">{screening_rate}%</strong></span>
              <span>面接通過率 <strong className="text-gray-800">{interview_rate}%</strong></span>
            </div>
          </div>

          {/* ステータス別内訳 */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">ステータス別内訳</h2>
            <div className="space-y-2">
              {(Object.entries(by_status) as [JobStatus, number][])
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 shrink-0">{JOB_STATUS_LABELS[status]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full ${STATUS_COLORS[status]} rounded-full`}
                        style={{ width: `${Math.round(count / total * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-700 w-10 shrink-0 text-right">{count}件</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* 月別応募数 */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">月別応募数（直近6ヶ月）</h2>
            <div className="flex items-end gap-3 h-32">
              {monthly.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{m.count > 0 ? m.count : ''}</span>
                  <div
                    className="w-full bg-blue-400 rounded-t"
                    style={{ height: `${Math.round((m.count / maxMonthly) * 90)}%`, minHeight: m.count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
