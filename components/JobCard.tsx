'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { JobApplication } from '@/lib/types';

const MEMO_MAX = 60;

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

interface JobCardProps {
  job: JobApplication;
  gmailMessageId?: string;
}

export function JobCard({ job, gmailMessageId }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMemo = !!job.notes?.trim();
  const isTruncated = hasMemo && (job.notes?.length ?? 0) > MEMO_MAX;
  const displayMemo = hasMemo
    ? (expanded || !isTruncated ? job.notes : `${job.notes!.substring(0, MEMO_MAX)}…`)
    : null;

  const gmailHref = gmailMessageId
    ? `https://mail.google.com/mail/u/0/#all/${gmailMessageId}`
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all overflow-hidden">
      <Link href={`/jobs/${job.id}`} className="block p-3 pb-2">
        <p className="font-medium text-gray-900 text-sm truncate">{job.company_name}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{job.position}</p>
        {job.applied_date && (
          <p className="text-xs text-gray-400 mt-1.5">{formatDate(job.applied_date)} 応募</p>
        )}
      </Link>

      {hasMemo && (
        <div className="px-3 pb-2">
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap break-words">{displayMemo}</p>
          {isTruncated && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-blue-500 hover:underline mt-0.5"
            >
              {expanded ? '閉じる' : '続きを読む'}
            </button>
          )}
        </div>
      )}

      {gmailHref && (
        <div className={`px-3 pb-2.5 ${hasMemo ? 'border-t border-gray-100 pt-2' : ''}`}>
          <a
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
          >
            <span>📧 最新メール</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
