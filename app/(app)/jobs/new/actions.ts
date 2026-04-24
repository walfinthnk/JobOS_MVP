'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { JobStatus } from '@/lib/types';

export async function createJobAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const company_name = (formData.get('company_name') as string)?.trim();
  const position     = (formData.get('position') as string)?.trim();
  const job_url      = (formData.get('job_url') as string)?.trim() || null;
  const status       = (formData.get('status') as JobStatus) || 'applied';
  const applied_date = (formData.get('applied_date') as string) || null;
  const notes        = (formData.get('notes') as string)?.trim() || null;
  const site_name_raw = (formData.get('site_name') as string)?.trim();
  const site_name_other = (formData.get('site_name_other') as string)?.trim();
  const site_name = site_name_raw === 'その他' ? (site_name_other || null) : (site_name_raw || null);

  if (!company_name || !position) {
    redirect('/jobs/new?error=企業名とポジションは必須です');
  }

  const { data: job, error } = await supabase
    .from('job_applications')
    .insert({ user_id: user.id, company_name, position, job_url, status, applied_date, notes, site_name })
    .select()
    .single();

  if (error || !job) {
    redirect('/jobs/new?error=保存に失敗しました');
  }

  await supabase.from('status_histories').insert({
    application_id: job.id,
    from_status:    null,
    to_status:      job.status,
  });

  redirect('/dashboard');
}
