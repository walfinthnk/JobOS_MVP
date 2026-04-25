import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { JobStatus, JobStats } from '@/lib/types';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: jobs, error } = await supabase
    .from('job_applications')
    .select('status, applied_date')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = jobs.length;

  const by_status: Record<JobStatus, number> = {
    considering: 0,
    applied:     0,
    screening:   0,
    interview:   0,
    offered:     0,
    accepted:    0,
    declined:    0,
  };

  let earliest: Date | null = null;

  for (const job of jobs) {
    by_status[job.status as JobStatus]++;

    if (job.applied_date) {
      const d = new Date(job.applied_date);
      if (!earliest || d < earliest) earliest = d;
    }
  }

  // 書類通過率：書類選考以降に進んだ件数 / 全応募数
  const reached_screening = by_status.screening + by_status.interview +
    by_status.offered + by_status.accepted;
  const screening_rate = total > 0
    ? Math.round((reached_screening / total) * 100)
    : 0;

  // 面接通過率：面接以降に進んだ件数 / 書類選考以降の件数
  const reached_interview = by_status.interview + by_status.offered + by_status.accepted;
  const interview_rate = reached_screening > 0
    ? Math.round((reached_interview / reached_screening) * 100)
    : 0;

  // 活動日数：最初の応募日〜今日
  const active_days = earliest
    ? Math.max(1, Math.ceil((Date.now() - earliest.getTime()) / 86_400_000))
    : 0;

  const stats: JobStats = {
    total,
    by_status,
    screening_rate,
    interview_rate,
    active_days,
  };

  return NextResponse.json(stats);
}
