'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { GmailIntegration } from '@/lib/types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

interface Props {
  integration: Pick<GmailIntegration, 'id' | 'gmail_address' | 'is_active' | 'last_synced_at' | 'watch_expiry'> | null;
}

export function GmailConnectSection({ integration }: Props) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleDisconnect() {
    if (!confirm('Gmail 連携を解除しますか？同期ログはすべて削除されます。')) return;
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/gmail/disconnect', { method: 'POST' });
      if (!res.ok) throw new Error('解除に失敗しました');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解除に失敗しました');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">接続状態</h2>

      {integration ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-gray-900">連携済み</span>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <dt className="text-gray-500">Gmail アドレス</dt>
            <dd className="text-gray-900 font-medium">{integration.gmail_address}</dd>

            <dt className="text-gray-500">最終同期</dt>
            <dd className="text-gray-900" suppressHydrationWarning>
              {mounted ? (integration.last_synced_at ? formatDate(integration.last_synced_at) : '未同期') : '—'}
            </dd>

            <dt className="text-gray-500">Watch 有効期限</dt>
            <dd className="text-gray-900" suppressHydrationWarning>
              {mounted ? formatDate(integration.watch_expiry) : '—'}
            </dd>
          </dl>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="mt-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {disconnecting ? '解除中...' : '連携を解除する'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="text-sm text-gray-500">未連携</span>
          </div>
          <p className="text-sm text-gray-600">
            Gmail を連携すると、受信トレイのメールを自動的に解析して求人ステータスを更新します。
          </p>
          <a
            href="/api/gmail/connect"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Gmail を連携する
          </a>
        </div>
      )}
    </section>
  );
}
