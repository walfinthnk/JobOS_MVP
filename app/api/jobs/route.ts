import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateJobRequest } from '@/lib/types';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateJobRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.company_name?.trim() || !body.position?.trim()) {
    return NextResponse.json(
      { error: '企業名とポジションは必須です' },
      { status: 400 }
    );
  }

  const { data: job, error } = await supabase
    .from('job_applications')
    .insert({
      user_id:      user.id,
      company_name: body.company_name.trim(),
      position:     body.position.trim(),
      job_url:      body.job_url?.trim() || null,
      status:       body.status ?? 'applied',
      applied_date: body.applied_date ?? null,
      notes:        body.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 初回ステータス履歴を記録
  await supabase.from('status_histories').insert({
    application_id: job.id,
    from_status:    null,
    to_status:      job.status,
  });

  return NextResponse.json(job, { status: 201 });
}
