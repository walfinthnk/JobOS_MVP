'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { JobStatus } from '@/lib/types';

export async function updateStatusAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id         = formData.get('id') as string;
  const new_status = formData.get('status') as JobStatus;

  const { data: current } = await supabase
    .from('job_applications')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!current) redirect('/dashboard');

  await supabase
    .from('job_applications')
    .update({ status: new_status })
    .eq('id', id)
    .eq('user_id', user.id);

  if (new_status !== current.status) {
    await supabase.from('status_histories').insert({
      application_id: id,
      from_status:    current.status,
      to_status:      new_status,
    });
  }

  revalidatePath(`/jobs/${id}`);
  revalidatePath('/dashboard');
}

export async function deleteJobAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;

  await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  redirect('/dashboard');
}
