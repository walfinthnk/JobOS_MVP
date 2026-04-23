'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  autoSync?: boolean;
}

export function GmailSyncButton({ autoSync = false }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ synced: number } | null>(null);

  async function runSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json() as { synced?: number };
      setResult({ synced: data.synced ?? 0 });
      router.refresh();
    } catch {
      // 同期失敗はサイレントに無視
    } finally {
      setSyncing(false);
    }
  }

  // ページロード時に自動同期
  useEffect(() => {
    if (autoSync) runSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={runSync}
        disabled={syncing}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <svg
          className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {syncing ? '同期中...' : 'Gmail同期'}
      </button>
      {result && (
        <span className="text-xs text-gray-500">
          {result.synced > 0 ? `${result.synced} 件を同期しました` : '新着メールはありません'}
        </span>
      )}
    </div>
  );
}
