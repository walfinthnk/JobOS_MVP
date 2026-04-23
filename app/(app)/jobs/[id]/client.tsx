'use client';

import { useState, useRef, useCallback } from 'react';
import { deleteJobAction } from './actions';

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

// ── メモエディタ（500msデバウンス自動保存） ─────────────────

interface NotesEditorProps {
  jobId: string;
  initialNotes: string | null;
}

export function NotesEditor({ jobId, initialNotes }: NotesEditorProps) {
  const [notes, setNotes]   = useState(initialNotes ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (value: string) => {
    setStatus('saving');
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes: value }),
      });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  }, [jobId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    setStatus('idle');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), 500);
  };

  return (
    <div>
      <textarea
        value={notes}
        onChange={handleChange}
        rows={4}
        maxLength={2000}
        placeholder="面接官の印象・企業の特徴など"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
      <p className="text-xs text-gray-400 mt-1 h-4">
        {status === 'saving' && '保存中...'}
        {status === 'saved'  && '保存しました'}
      </p>
    </div>
  );
}
