import Link from 'next/link';
import { JobApplication } from '@/lib/types';

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  });
}

export function JobCard({ job }: { job: JobApplication }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
        <p className="font-medium text-gray-900 text-sm truncate">{job.company_name}</p>
        <p className="text-sm text-gray-500 truncate mt-0.5">{job.position}</p>
        {job.applied_date && (
          <p className="text-xs text-gray-400 mt-2">{formatDate(job.applied_date)} 応募</p>
        )}
      </div>
    </Link>
  );
}
