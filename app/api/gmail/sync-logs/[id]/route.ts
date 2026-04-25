import { NextResponse } from 'next/server';
import type { JobStatus } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { applySkipLabel, applyStatusLabel } from '@/lib/gmail/labels';
import { getValidAccessToken } from '@/lib/gmail/client';

const VALID_JOB_STATUSES: JobStatus[] = ['considering', 'applied', 'screening', 'interview', 'offered', 'declined'];

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
  const body = await request.json() as {
    confirmed_status?: JobStatus;
    application_id?: string;
    skip?: boolean;
    company_name?: string;
    position?: string;
  };

  // 操作対象ログの取得
  const { data: log } = await supabase
    .from('gmail_sync_logs')
    .select('id, action, detected_status, application_id, parsed_company, parsed_position, parsed_site_name, parsed_job_url, gmail_message_id, integration_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (log.action !== 'pending_review') return NextResponse.json({ error: 'Already resolved' }, { status: 409 });

  // Gmail アクセストークン取得（ラベル付与用）
  async function getAccessToken(): Promise<string | null> {
    const { data: integration } = await supabase
      .from('gmail_integrations')
      .select('access_token_enc, refresh_token_enc, token_expires_at')
      .eq('id', log!.integration_id)
      .eq('user_id', user!.id)
      .single();
    if (!integration) return null;
    try {
      const { accessToken } = await getValidAccessToken(
        integration.access_token_enc,
        integration.refresh_token_enc,
        integration.token_expires_at
      );
      return accessToken;
    } catch { return null; }
  }

  // スキップ処理
  if (body.skip) {
    await supabase.from('gmail_sync_logs').update({ action: 'skipped' }).eq('id', id);

    // FR-039: スキップラベル付与
    const accessToken = await getAccessToken();
    if (accessToken && log.gmail_message_id) {
      await applySkipLabel(accessToken, log.gmail_message_id);
    }

    return NextResponse.json({ success: true });
  }

  const confirmedStatus = body.confirmed_status;
  if (!confirmedStatus || !VALID_JOB_STATUSES.includes(confirmedStatus)) {
    return NextResponse.json({ error: 'Invalid confirmed_status' }, { status: 400 });
  }

  const targetApplicationId = body.application_id ?? log.application_id;
  const resolvedCompany  = body.company_name?.trim() || log.parsed_company;
  const resolvedPosition = body.position?.trim() || log.parsed_position;

  let applicationId = targetApplicationId;

  if (!applicationId && resolvedCompany) {
    const { data: newJob } = await supabase
      .from('job_applications')
      .insert({
        user_id:      user.id,
        company_name: resolvedCompany,
        position:     resolvedPosition ?? '',
        status:       confirmedStatus,
        site_name:    log!.parsed_site_name ?? null,
        job_url:      log!.parsed_job_url ?? null,
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
    const { data: job } = await supabase
      .from('job_applications')
      .select('status, company_name, position')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (job) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (resolvedCompany && resolvedCompany !== job.company_name) updates.company_name = resolvedCompany;
      if (resolvedPosition && resolvedPosition !== job.position) updates.position = resolvedPosition;
      if (job.status !== confirmedStatus) updates.status = confirmedStatus;

      if (Object.keys(updates).length > 1) {
        await supabase.from('job_applications').update(updates).eq('id', applicationId);
      }

      if (job.status !== confirmedStatus) {
        await supabase.from('status_histories').insert({
          application_id: applicationId,
          from_status:    job.status,
          to_status:      confirmedStatus,
          changed_at:     new Date().toISOString(),
          note:           'Gmail 同期（手動確認）',
        });
      }
    }
  }

  await supabase
    .from('gmail_sync_logs')
    .update({ action: 'updated', application_id: applicationId })
    .eq('id', id);

  // FR-039: ステータスラベル付与
  const accessToken = await getAccessToken();
  if (accessToken && log.gmail_message_id) {
    await applyStatusLabel(accessToken, log.gmail_message_id, confirmedStatus);
  }

  return NextResponse.json({ success: true });
}
