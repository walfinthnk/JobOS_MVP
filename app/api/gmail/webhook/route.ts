import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGmailClient, getValidAccessToken, extractBody } from '@/lib/gmail/client';
import { parseEmail, shouldExcludeEmail } from '@/lib/gmail/parser';
import { applyStatusLabel } from '@/lib/gmail/labels';

interface PubSubMessage {
  emailAddress: string;
  historyId: number;
}

export async function POST(request: Request) {

  // 2. Pub/Sub メッセージをデコード
  let pubsubData: PubSubMessage;
  try {
    const body = await request.json() as { message?: { data?: string } };
    const dataB64 = body?.message?.data;
    if (!dataB64) {
      return NextResponse.json({ error: 'No message data' }, { status: 400 });
    }
    pubsubData = JSON.parse(Buffer.from(dataB64, 'base64').toString('utf8'));
  } catch {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const { emailAddress, historyId: newHistoryId } = pubsubData;

  // 3. gmail_integrations を admin client で取得（RLS バイパス）
  const supabase = createAdminClient();
  const { data: integration } = await supabase
    .from('gmail_integrations')
    .select('*')
    .eq('gmail_address', emailAddress)
    .eq('is_active', true)
    .single();

  if (!integration) {
    return NextResponse.json({ ok: true });
  }

  // 4. アクセストークン取得・更新
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

  // 5. Gmail History API で差分取得
  const gmail = createGmailClient(accessToken);
  const startHistoryId = integration.history_id ?? String(newHistoryId - 1);

  const messageIds: string[] = [];
  try {
    const historyRes = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: String(startHistoryId),
      historyTypes: ['messageAdded'],
      labelId: 'INBOX',
    });

    for (const record of historyRes.data.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        if (added.message?.id) messageIds.push(added.message.id);
      }
    }
  } catch (err) {
    console.error('[Gmail webhook] history.list failed:', err);
    await supabase
      .from('gmail_integrations')
      .update({ history_id: String(newHistoryId), last_synced_at: new Date().toISOString() })
      .eq('id', integration.id);
    return NextResponse.json({ ok: true });
  }

  // 6. 各メッセージを処理
  for (const messageId of messageIds) {
    // 重複チェック
    const { data: existingLog } = await supabase
      .from('gmail_sync_logs')
      .select('id')
      .eq('gmail_message_id', messageId)
      .single();

    if (existingLog) continue;

    // メッセージ取得
    let subject = '';
    let from = '';
    let receivedAt = new Date().toISOString();
    let body = '';

    try {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const headers = msg.data.payload?.headers ?? [];
      subject    = headers.find(h => h.name === 'Subject')?.value ?? '';
      from       = headers.find(h => h.name === 'From')?.value ?? '';
      const date = headers.find(h => h.name === 'Date')?.value;
      if (date) receivedAt = new Date(date).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body = extractBody(msg.data.payload as any);
    } catch (err) {
      console.error(`[Gmail webhook] message.get(${messageId}) failed:`, err);
      await supabase.from('gmail_sync_logs').insert({
        user_id:          integration.user_id,
        integration_id:   integration.id,
        gmail_message_id: messageId,
        action:           'error',
        error_message:    String(err),
      });
      continue;
    }

    // FR-033: 非求人メール早期除外
    if (shouldExcludeEmail(from, subject)) {
      await supabase.from('gmail_sync_logs').insert({
        user_id:          integration.user_id,
        integration_id:   integration.id,
        gmail_message_id: messageId,
        action:           'skipped',
        raw_subject:      subject,
        error_message:    '非求人メールとして除外',
      });
      continue;
    }

    // FR-036: Claude API によるメール解析（async）
    const parsed = await parseEmail(subject, body, from);

    // FR-034: 転職サイト経由で企業名が特定できない場合は pending_review
    if (parsed.site_name && !parsed.company) {
      await supabase.from('gmail_sync_logs').insert({
        user_id:           integration.user_id,
        integration_id:    integration.id,
        gmail_message_id:  messageId,
        action:            'pending_review',
        parsed_company:    null,
        parsed_position:   parsed.position,
        detected_status:   parsed.status,
        confidence_score:  0,
        raw_subject:       subject,
        body_summary:      parsed.body_summary,
        parsed_site_name:  parsed.site_name,
        parsed_job_url:    parsed.job_url,
      });
      continue;
    }

    if (!parsed.status && !parsed.company) continue;

    const isLowConfidence = parsed.confidence < 0.7;

    // 既存の job_application を企業名で検索
    let applicationId: string | null = null;
    let syncAction: 'created' | 'updated' | 'pending_review' = isLowConfidence ? 'pending_review' : 'created';

    if (parsed.company && !isLowConfidence) {
      const { data: existingJob } = await supabase
        .from('job_applications')
        .select('id, status')
        .eq('user_id', integration.user_id)
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

          syncAction = 'updated';
        } else {
          syncAction = 'updated';
        }
      } else if (parsed.status === 'applied') {
        // 新規応募
        const { data: newJob } = await supabase
          .from('job_applications')
          .insert({
            user_id:      integration.user_id,
            company_name: parsed.company,
            position:     parsed.position ?? '',
            status:       'applied',
            applied_date: receivedAt.split('T')[0],
            site_name:    parsed.site_name,
            job_url:      parsed.job_url,
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
          // FR-039: 自動登録時にステータスラベル付与
          await applyStatusLabel(accessToken, messageId, 'applied');
        }
      }
    } else if (parsed.company && isLowConfidence) {
      // 低確信度: 既存 job を紐付けるだけ（更新しない）
      const { data: existingJob } = await supabase
        .from('job_applications')
        .select('id')
        .eq('user_id', integration.user_id)
        .ilike('company_name', parsed.company)
        .order('applied_date', { ascending: false })
        .limit(1)
        .single();

      applicationId = existingJob?.id ?? null;
    }

    // sync_log に記録
    await supabase.from('gmail_sync_logs').insert({
      user_id:           integration.user_id,
      integration_id:    integration.id,
      gmail_message_id:  messageId,
      application_id:    applicationId,
      action:            syncAction,
      parsed_company:    parsed.company,
      parsed_position:   parsed.position,
      detected_status:   parsed.status,
      confidence_score:  parsed.confidence,
      raw_subject:       subject,
      body_summary:      parsed.body_summary,
      parsed_site_name:  parsed.site_name,
      parsed_job_url:    parsed.job_url,
    });

    // FR-039: ステータス更新時にラベル付与
    if (syncAction === 'updated' && parsed.status) {
      await applyStatusLabel(accessToken, messageId, parsed.status);
    }
  }

  // 7. history_id と last_synced_at を更新
  await supabase
    .from('gmail_integrations')
    .update({
      history_id:     String(newHistoryId),
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  return NextResponse.json({ ok: true });
}
