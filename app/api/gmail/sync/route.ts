import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGmailClient, getValidAccessToken, extractBody } from '@/lib/gmail/client';
import { parseEmail, shouldExcludeEmail } from '@/lib/gmail/parser';

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 });
  }

  // アクセストークン取得・更新
  const { accessToken, newAccessTokenEnc, newExpiresAt } = await getValidAccessToken(
    integration.access_token_enc,
    integration.refresh_token_enc,
    integration.token_expires_at,
  );

  if (newAccessTokenEnc) {
    await supabase
      .from('gmail_integrations')
      .update({ access_token_enc: newAccessTokenEnc, token_expires_at: newExpiresAt })
      .eq('id', integration.id);
  }

  const gmail = createGmailClient(accessToken);

  // 現在の historyId を取得
  const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
  const currentHistoryId = profile.historyId?.toString();

  if (!currentHistoryId) {
    return NextResponse.json({ error: 'Failed to get historyId' }, { status: 500 });
  }

  // 前回同期以降のメッセージを取得
  const startHistoryId = integration.history_id ?? String(Number(currentHistoryId) - 1);
  const messageIds: string[] = [];

  try {
    const historyRes = await gmail.users.history.list({
      userId:         'me',
      startHistoryId,
      historyTypes:   ['messageAdded'],
    });

    for (const record of historyRes.data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        if (added.message?.id) messageIds.push(added.message.id);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Sync] history.list failed:', message);
    await supabase
      .from('gmail_integrations')
      .update({ history_id: currentHistoryId, last_synced_at: new Date().toISOString() })
      .eq('id', integration.id);
    return NextResponse.json({ synced: 0 });
  }

  let synced = 0;

  for (const messageId of messageIds) {
    const { data: existingLog } = await supabase
      .from('gmail_sync_logs')
      .select('id')
      .eq('gmail_message_id', messageId)
      .single();

    if (existingLog) continue;

    let subject = '';
    let from = '';
    let receivedAt = new Date().toISOString();
    let body = '';

    try {
      const msg = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
      const headers = msg.data.payload?.headers ?? [];
      subject    = headers.find(h => h.name === 'Subject')?.value ?? '';
      from       = headers.find(h => h.name === 'From')?.value ?? '';
      const date = headers.find(h => h.name === 'Date')?.value;
      if (date) receivedAt = new Date(date).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body = extractBody(msg.data.payload as any);
    } catch {
      continue;
    }

    // FR-033: 非求人メール早期除外
    if (shouldExcludeEmail(from, subject)) {
      await supabase.from('gmail_sync_logs').insert({
        user_id:          user.id,
        integration_id:   integration.id,
        gmail_message_id: messageId,
        action:           'skipped',
        raw_subject:      subject,
        error_message:    '非求人メールとして除外',
      });
      continue;
    }

    const parsed = await parseEmail(subject, body, from);

    // FR-034: 転職サイト経由で企業名が特定できない場合は pending_review
    if (parsed.site_name && !parsed.company) {
      await supabase.from('gmail_sync_logs').insert({
        user_id:          user.id,
        integration_id:   integration.id,
        gmail_message_id: messageId,
        action:           'pending_review',
        parsed_company:   null,
        parsed_position:  parsed.position,
        detected_status:  parsed.status,
        confidence_score: 0,
        raw_subject:      subject,
        body_summary:     parsed.body_summary,
      });
      synced++;
      continue;
    }

    if (!parsed.status && !parsed.company) continue;

    const isLowConfidence = parsed.confidence < 0.7;
    let applicationId: string | null = null;
    let syncAction: 'created' | 'updated' | 'pending_review' = isLowConfidence ? 'pending_review' : 'created';

    if (parsed.company && !isLowConfidence) {
      const { data: existingJob } = await supabase
        .from('job_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .ilike('company_name', parsed.company)
        .order('applied_date', { ascending: false })
        .limit(1)
        .single();

      if (existingJob) {
        applicationId = existingJob.id;
        if (parsed.status && parsed.status !== existingJob.status) {
          await supabase
            .from('job_applications')
            .update({ status: parsed.status, updated_at: new Date().toISOString() })
            .eq('id', applicationId);
          await supabase.from('status_histories').insert({
            application_id: applicationId,
            from_status:    existingJob.status,
            to_status:      parsed.status,
            changed_at:     receivedAt,
          });
        }
        syncAction = 'updated';
      } else if (parsed.status === 'applied') {
        const { data: newJob } = await supabase
          .from('job_applications')
          .insert({
            user_id:      user.id,
            company_name: parsed.company,
            position:     parsed.position ?? '',
            status:       'applied',
            applied_date: receivedAt.split('T')[0],
            site_name:    parsed.site_name,
          })
          .select('id')
          .single();

        if (newJob) {
          applicationId = newJob.id;
          await supabase.from('status_histories').insert({
            application_id: applicationId,
            from_status:    null,
            to_status:      'applied',
            changed_at:     receivedAt,
          });
          syncAction = 'created';
        }
      }
    } else if (parsed.company && isLowConfidence) {
      const { data: existingJob } = await supabase
        .from('job_applications')
        .select('id')
        .eq('user_id', user.id)
        .ilike('company_name', parsed.company)
        .order('applied_date', { ascending: false })
        .limit(1)
        .single();
      applicationId = existingJob?.id ?? null;
    }

    await supabase.from('gmail_sync_logs').insert({
      user_id:          user.id,
      integration_id:   integration.id,
      gmail_message_id: messageId,
      application_id:   applicationId,
      action:           syncAction,
      parsed_company:   parsed.company,
      parsed_position:  parsed.position,
      detected_status:  parsed.status,
      confidence_score: parsed.confidence,
      raw_subject:      subject,
      body_summary:     parsed.body_summary,
    });

    synced++;
  }

  await supabase
    .from('gmail_integrations')
    .update({ history_id: currentHistoryId, last_synced_at: new Date().toISOString() })
    .eq('id', integration.id);

  return NextResponse.json({ synced });
}
