'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import type { JobStatus } from '@/lib/types';

const SYNC_ACTION_LABELS: Record<string, string> = {
  created:        '新規登録',
  updated:        'ステータス更新',
  skipped:        'スキップ',
  pending_review: '確認待ち',
  error:          'エラー',
};

const SYNC_ACTION_STYLES: Record<string, string> = {
  created:        'bg-green-100 text-green-700',
  updated:        'bg-blue-100 text-blue-700',
  skipped:        'bg-gray-100 text-gray-500',
  pending_review: 'bg-amber-100 text-amber-700',
  error:          'bg-red-100 text-red-600',
};

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'applied',   label: '応募中' },
  { value: 'screening', label: '書類選考' },
  { value: 'interview', label: '面接中' },
  { value: 'offered',   label: '内定' },
  { value: 'declined',  label: '辞退・不採用' },
];

export interface SyncLog {
  id: string;
  raw_subject: string | null;
  action: string;
  parsed_company: string | null;
  parsed_position: string | null;
  detected_status: JobStatus | null;
  confidence_score: number | null;
  error_message: string | null;
  processed_at: string;
  application_id: string | null;
  job_applications: { company_name: string; position: string } | null;
}

interface ReviewState {
  logId: string;
  confirmedStatus: JobStatus;
}

export function SyncLogList({ initialLogs }: { initialLogs: SyncLog[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState<SyncLog[]>(initialLogs);
  useEffect(() => { setLogs(initialLogs); }, [initialLogs]);
  const [reviewing, setReviewing] = useState<ReviewState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
        同期ログはまだありません
      </div>
    );
  }

  function openReview(log: SyncLog) {
    setReviewing({
      logId: log.id,
      confirmedStatus: log.detected_status ?? 'screening',
    });
  }

  async function submitReview(skip = false) {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      const body = skip
        ? { skip: true }
        : { confirmed_status: reviewing.confirmedStatus };

      const res = await fetch(`/api/gmail/sync-logs/${reviewing.logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('更新に失敗しました');

      // ローカル状態を更新
      setLogs(prev => prev.map(l =>
        l.id === reviewing.logId
          ? { ...l, action: skip ? 'skipped' : 'updated' }
          : l
      ));
      setReviewing(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      {logs.map(log => (
        <div key={log.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {log.raw_subject ?? '(件名なし)'}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {log.parsed_company && (
                  <span className="font-medium text-gray-700">{log.parsed_company}</span>
                )}
                {log.detected_status && (
                  <StatusBadge status={log.detected_status} />
                )}
                {log.confidence_score != null && (
                  <span>確信度 {Math.round(log.confidence_score * 100)}%</span>
                )}
                <span suppressHydrationWarning>
                  {new Date(log.processed_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                </span>
              </div>
              {log.job_applications && (
                <p className="mt-1 text-xs text-blue-600">
                  → {log.job_applications.company_name} / {log.job_applications.position}
                </p>
              )}
              {log.error_message && (
                <p className="mt-1 text-xs text-red-500">{log.error_message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SYNC_ACTION_STYLES[log.action] ?? 'bg-gray-100 text-gray-500'}`}>
                {SYNC_ACTION_LABELS[log.action] ?? log.action}
              </span>
              {log.action === 'pending_review' && reviewing?.logId !== log.id && (
                <button
                  onClick={() => openReview(log)}
                  className="rounded-md border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  確認する
                </button>
              )}
            </div>
          </div>

          {/* インライン確認フォーム */}
          {reviewing?.logId === log.id && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
              <p className="text-xs font-medium text-amber-800">
                このメールのステータスを確認してください
              </p>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-600 shrink-0">ステータス</label>
                <select
                  value={reviewing.confirmedStatus}
                  onChange={e => setReviewing({ ...reviewing, confirmedStatus: e.target.value as JobStatus })}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => submitReview(false)}
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? '更新中...' : '確定する'}
                </button>
                <button
                  onClick={() => submitReview(true)}
                  disabled={submitting}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  スキップ
                </button>
                <button
                  onClick={() => setReviewing(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
