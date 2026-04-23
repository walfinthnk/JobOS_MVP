import { JobApplication, JobStatus } from '@/lib/types';
import { JobCard } from './JobCard';

const COLUMNS: { status: JobStatus; label: string; color: string }[] = [
  { status: 'applied',   label: '応募中',   color: 'border-gray-300' },
  { status: 'screening', label: '書類選考', color: 'border-blue-300' },
  { status: 'interview', label: '面接中',   color: 'border-amber-300' },
  { status: 'offered',   label: '内定',     color: 'border-green-300' },
];

export function KanbanBoard({ jobs }: { jobs: JobApplication[] }) {
  const declined = jobs.filter(j => j.status === 'declined');
  const accepted = jobs.filter(j => j.status === 'accepted');

  return (
    <div>
      {/* メインカンバン */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {COLUMNS.map(({ status, label, color }) => {
          const colJobs = jobs.filter(j =>
            j.status === status || (status === 'offered' && j.status === 'accepted')
          );
          const displayJobs = status === 'offered'
            ? jobs.filter(j => j.status === 'offered' || j.status === 'accepted')
            : colJobs;

          return (
            <div key={status} className={`bg-gray-50 rounded-lg border-t-2 ${color} p-3 min-h-[200px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 border">
                  {displayJobs.length}
                </span>
              </div>
              <div className="space-y-2">
                {displayJobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 辞退・不採用 */}
      {(declined.length > 0 || accepted.length > 0) && declined.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">辞退・不採用</h3>
          <div className="flex flex-wrap gap-3">
            {declined.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}
    </div>
  );
}
