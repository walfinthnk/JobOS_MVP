import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateJobRequest } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('*, status_histories(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .order('changed_at', { ascending: true, referencedTable: 'status_histories' })
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UpdateJobRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 現在のレコードを取得（ステータス変更履歴のため）
  const { data: current, error: fetchError } = await supabase
    .from('job_applications')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.company_name !== undefined) updateData.company_name = body.company_name.trim();
  if (body.position     !== undefined) updateData.position     = body.position.trim();
  if (body.job_url      !== undefined) updateData.job_url      = body.job_url?.trim() || null;
  if (body.status       !== undefined) updateData.status       = body.status;
  if (body.applied_date !== undefined) updateData.applied_date = body.applied_date || null;
  if (body.notes        !== undefined) updateData.notes        = body.notes?.trim() || null;

  const { data: updated, error } = await supabase
    .from('job_applications')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ステータスが変更された場合は履歴を追記
  if (body.status && body.status !== current.status) {
    await supabase.from('status_histories').insert({
      application_id: id,
      from_status:    current.status,
      to_status:      body.status,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
