'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteJobAction } from './actions';
import { SiteNameSelector } from '@/components/SiteNameSelector';
import { JOB_STATUS_LABELS, type JobApplication, type JobStatus } from '@/lib/types';

// ── 削除ボタン ─────────────────────────────────────────────

export function DeleteButton({ jobId }: { jobId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">本当に削除しますか？</span>
        <form action={deleteJobAction}>
          <input type="hidden" name="id" value={jobId} />
          <button
            type="submit"
            className="text-sm font-medium text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            削除
          </button>
        </form>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
    >
      削除
    </button>
  );
}

// ── 全フィールド編集フォーム（FR-029・FR-030） ──────────────

const STATUS_OPTIONS = Object.entries(JOB_STATUS_LABELS) as [JobStatus, string][];

interface JobEditFormProps {
  job: JobApplication;
}

export function JobEditForm({ job }: JobEditFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    company_name: job.company_name,
    position:     job.position,
    job_url:      job.job_url ?? '',
    status:       job.status,
    applied_date: job.applied_date ?? '',
    notes:        job.notes ?? '',
    todo_type:    job.todo_type ?? '',
    todo_note:    job.todo_note ?? '',
  });
  const [siteName, setSiteName] = useState(job.site_name ?? '');
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');

  function field(name: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          position:     form.position.trim(),
          job_url:      form.job_url.trim() || null,
          status:       form.status,
          applied_date: form.applied_date || null,
          notes:        form.notes.trim() || null,
          site_name:    siteName.trim() || null,
          todo_type:    form.todo_type.trim() || null,
          todo_note:    form.todo_note.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      setToast('保存しました');
      setTimeout(() => setToast(''), 3000);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5">
      <h2 className="text-sm font-semibold text-gray-700">基本情報</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          企業名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text" required maxLength={100} value={form.company_name} onChange={field('company_name')}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          職種・ポジション <span className="text-red-500">*</span>
        </label>
        <input
          type="text" required maxLength={100} value={form.position} onChange={field('position')}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">応募サイト名</label>
        <SiteNameSelector defaultValue={job.site_name} onChangeSiteName={setSiteName} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">求人URL</label>
        <div className="mt-1 flex gap-2">
          <input
            type="url" maxLength={2000} value={form.job_url} onChange={field('job_url')}
            placeholder="https://"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {form.job_url && (
            <a
              href={form.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
            >
              開く ↗
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">応募日</label>
          <input
            type="date" max={today} value={form.applied_date} onChange={field('applied_date')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ステータス <span className="text-red-500">*</span>
          </label>
          <select
            value={form.status} onChange={field('status')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">ToDo</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">種別</label>
            <select
              value={form.todo_type}
              onChange={field('todo_type')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">なし</option>
              <option value="書類提出">書類提出</option>
              <option value="面接準備">面接準備</option>
              <option value="回答待ち">回答待ち</option>
              <option value="調査">調査</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">内容</label>
            <input
              type="text"
              value={form.todo_note}
              onChange={field('todo_note')}
              maxLength={200}
              placeholder="例：職務経歴書を送付する"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">メモ</label>
        <textarea
          value={form.notes} onChange={field('notes')}
          rows={4} maxLength={2000}
          placeholder="面接官の印象・企業の特徴など"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '変更を保存する'}
        </button>
        {toast && (
          <span className="text-sm text-green-600">{toast}</span>
        )}
      </div>
    </form>
  );
}
