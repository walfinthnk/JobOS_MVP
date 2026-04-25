'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { JobApplication } from '@/lib/types';

interface TodoListProps {
  jobs: JobApplication[];
}

export function TodoList({ jobs }: TodoListProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const pendingJobs = jobs.filter(j =>
    j.todo_note && !j.todo_completed && !doneIds.has(j.id)
  );

  async function completeTodo(jobId: string) {
    setCompleting(jobId);
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todo_completed: true }),
      });
      setDoneIds(prev => { const next = new Set(prev); next.add(jobId); return next; });
      router.refresh();
    } catch {
      // silent
    } finally {
      setCompleting(null);
    }
  }

  if (pendingJobs.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">未完了のToDoはありません</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {pendingJobs.map(job => (
        <li key={job.id} className="flex items-start gap-3 py-2.5">
          <button
            onClick={() => completeTodo(job.id)}
            disabled={completing === job.id}
            className="mt-0.5 shrink-0 h-4 w-4 rounded border border-gray-400 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors disabled:opacity-40"
            aria-label="完了にする"
          >
            {completing === job.id && (
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <Link
              href={`/jobs/${job.id}`}
              className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
            >
              {job.company_name}
            </Link>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {job.todo_type && (
                <span className="mr-1.5 rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                  {job.todo_type}
                </span>
              )}
              {job.todo_note}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
