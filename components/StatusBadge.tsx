import { JobStatus, JOB_STATUS_LABELS } from '@/lib/types';

const STATUS_STYLES: Record<JobStatus, string> = {
  considering: 'bg-purple-100 text-purple-700',
  applied:     'bg-gray-100 text-gray-700',
  screening:   'bg-blue-100 text-blue-700',
  interview:   'bg-amber-100 text-amber-700',
  offered:     'bg-green-100 text-green-700',
  accepted:    'bg-green-200 text-green-800',
  declined:    'bg-red-100 text-red-600',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
