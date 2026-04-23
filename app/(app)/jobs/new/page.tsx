import Link from 'next/link';
import { createJobAction } from './actions';
import { JOB_STATUS_LABELS, JobStatus } from '@/lib/types';

const STATUS_OPTIONS = Object.entries(JOB_STATUS_LABELS) as [JobStatus, string][];

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
          ← ダッシュボード
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">求人を追加する</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={createJobAction} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
            企業名 <span className="text-red-500">*</span>
          </label>
          <input
            id="company_name" name="company_name" type="text"
            required maxLength={100} placeholder="例：株式会社〇〇"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            職種・ポジション <span className="text-red-500">*</span>
          </label>
          <input
            id="position" name="position" type="text"
            required maxLength={100} placeholder="例：フロントエンドエンジニア"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="job_url" className="block text-sm font-medium text-gray-700">
            求人URL
          </label>
          <input
            id="job_url" name="job_url" type="url"
            maxLength={2000} placeholder="https://"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              ステータス <span className="text-red-500">*</span>
            </label>
            <select
              id="status" name="status" defaultValue="applied"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="applied_date" className="block text-sm font-medium text-gray-700">
              応募日
            </label>
            <input
              id="applied_date" name="applied_date" type="date"
              defaultValue={today} max={today}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            メモ
          </label>
          <textarea
            id="notes" name="notes" rows={3} maxLength={2000}
            placeholder="面接官の印象・企業の特徴など"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 text-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            保存する
          </button>
        </div>
      </form>
    </div>
  );
}
