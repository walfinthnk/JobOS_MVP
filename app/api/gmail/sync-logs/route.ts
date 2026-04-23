import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('gmail_sync_logs')
    .select(`
      id,
      gmail_message_id,
      raw_subject,
      action,
      parsed_company,
      parsed_position,
      detected_status,
      confidence_score,
      error_message,
      processed_at,
      application_id,
      job_applications ( company_name, position )
    `)
    .eq('user_id', user.id)
    .order('processed_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
