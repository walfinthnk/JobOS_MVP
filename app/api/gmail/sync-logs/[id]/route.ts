import { NextResponse } from 'next/server';
import type { JobStatus } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

const VALID_JOB_STATUSES: JobStatus[] = ['applied', 'screening', 'interview', 'offered', 'declined'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { confirmed_status?: JobStatus; application_id?: string; skip?: boolean };

  // 操作対象ログの所有者確認
  const { data: log } = await supabase
    .from('gmail_sync_logs')
    .select('id, action, detected_status, application_id, parsed_company, parsed_position')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!log) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (log.action !== 'pending_review') {
    return NextResponse.json({ error: 'Already resolved' }, { status: 409 });
  }

  // スキップ（無視）の場合
  if (body.skip) {
    await supabase
      .from('gmail_sync_logs')
      .update({ action: 'skipped' })
      .eq('id', id);
    return NextResponse.json({ success: true });
  }

  const confirmedStatus = body.confirmed_status;
  if (!confirmedStatus || !VALID_JOB_STATUSES.includes(confirmedStatus)) {
    return NextResponse.json({ error: 'Invalid confirmed_status' }, { status: 400 });
  }

  const targetApplicationId = body.application_id ?? log.application_id;

  // application_id がない場合は新規作成
  let applicationId = targetApplicationId;
  if (!applicationId && log.parsed_company) {
    const { data: newJob } = await supabase
      .from('job_applications')
      .insert({
        user_id:      user.id,
        company_name: log.parsed_company,
        position:     log.parsed_position ?? '',
        status:       confirmedStatus,
      })
      .select('id')
      .single();

    if (newJob) {
      applicationId = newJob.id;
      await supabase.from('status_histories').insert({
        application_id: applicationId,
        from_status:    null,
        to_status:      confirmedStatus,
        changed_at:     new Date().toISOString(),
        note:           'Gmail 同期（手動確認）',
      });
    }
  } else if (applicationId) {
    // 既存 job のステータス更新
    const { data: job } = await supabase
      .from('job_applications')
      .select('status')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (job && job.status !== confirmedStatus) {
      await supabase
        .from('job_applications')
        .update({ status: confirmedStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      await supabase.from('status_histories').insert({
        application_id: applicationId,
        from_status:    job.status,
        to_status:      confirmedStatus,
        changed_at:     new Date().toISOString(),
        note:           'Gmail 同期（手動確認）',
      });
    }
  }

  // sync_log を更新
  await supabase
    .from('gmail_sync_logs')
    .update({
      action:         'updated',
      application_id: applicationId,
    })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
