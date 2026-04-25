import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteButton, JobEditForm } from './client';
import { JOB_STATUS_LABELS, type JobApplication, type JobStatus, type StatusHistory } from '@/lib/types';

const PROGRESS_STEPS: { status: JobStatus; label: string }[] = [
  { status: 'applied',   label: '応募中' },
  { status: 'screening', label: '書類選考' },
  { status: 'interview', label: '面接中' },
  { status: 'offered',   label: '内定' },
];

const STATUS_ORDER: Record<JobStatus, number> = {
  considering: -1, applied: 0, screening: 1, interview: 2, offered: 3, accepted: 3, declined: -1,
};

function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ja-JP', opts ?? { year: 'numeric', month: 'long', day: 'numeric' });
}

type Params = { params: Promise<{ id: string }> };

export default async function JobDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from('job_applications')
    .select('*, status_histories(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .order('changed_at', { ascending: true, referencedTable: 'status_histories' })
    .single();

  if (!job) notFound();

  const currentOrder = STATUS_ORDER[job.status as JobStatus];
  const histories = (job.status_histories ?? []) as StatusHistory[];

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← ダッシュボード
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">{job.company_name}</h1>
          <p className="text-gray-500">{job.position}</p>
        </div>
        <DeleteButton jobId={id} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">

        {/* ステータス進捗 */}
        {job.status !== 'declined' && job.status !== 'considering' ? (
          <div className="p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">現在のステータス</p>
            <div className="flex items-center gap-1">
              {PROGRESS_STEPS.map((step, i) => {
                const stepOrder = STATUS_ORDER[step.status];
                const isActive  = currentOrder === stepOrder;
                const isDone    = currentOrder > stepOrder;
                return (
                  <div key={step.status} className="flex items-center gap-1 flex-1">
                    <div className="flex-1 text-center">
                      <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                        {i + 1}
                      </div>
                      <p className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : isDone ? 'text-blue-500' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                    {i < PROGRESS_STEPS.length - 1 && (
                      <div className={`h-0.5 w-4 ${isDone ? 'bg-blue-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-5">
            <StatusBadge status={job.status as JobStatus} />
          </div>
        )}

        {/* 全フィールド編集フォーム */}
        <JobEditForm job={job as JobApplication} />

        {/* ステータス変更履歴 */}
        {histories.length > 0 && (
          <div className="p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">ステータス変更履歴</p>
            <ol className="space-y-2">
              {histories.map(h => (
                <li key={h.id} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 text-xs w-32 shrink-0">
                    {formatDate(h.changed_at, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-700">
                    {h.from_status
                      ? `${JOB_STATUS_LABELS[h.from_status as JobStatus]} → ${JOB_STATUS_LABELS[h.to_status as JobStatus]}`
                      : `${JOB_STATUS_LABELS[h.to_status as JobStatus]} に設定`
                    }
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
