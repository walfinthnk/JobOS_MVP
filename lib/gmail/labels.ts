import type { JobStatus } from '@/lib/types';
import { createGmailClient } from './client';

// FR-039: JobOS ラベル名マッピング
const PARENT_LABEL = 'JobOS';

const STATUS_LABEL_NAMES: Partial<Record<JobStatus, string>> = {
  considering: `${PARENT_LABEL}/検討候補`,
  applied:     `${PARENT_LABEL}/応募中`,
  screening:   `${PARENT_LABEL}/書類選考`,
  interview:   `${PARENT_LABEL}/面接中`,
  offered:     `${PARENT_LABEL}/内定`,
  accepted:    `${PARENT_LABEL}/内定`,
  declined:    `${PARENT_LABEL}/辞退・不採用`,
};

const SKIP_LABEL_NAME = `${PARENT_LABEL}/処理済`;

// ラベルIDキャッシュ（リクエスト間は再取得）
const labelCache = new Map<string, string>();

async function getOrCreateLabel(accessToken: string, labelName: string): Promise<string | null> {
  if (labelCache.has(labelName)) return labelCache.get(labelName)!;

  const gmail = createGmailClient(accessToken);

  try {
    // 既存ラベルを検索
    const listRes = await gmail.users.labels.list({ userId: 'me' });
    const existing = listRes.data.labels?.find(l => l.name === labelName);
    if (existing?.id) {
      labelCache.set(labelName, existing.id);
      return existing.id;
    }

    // 親ラベル（JobOS）が必要な場合は先に作成
    if (labelName.includes('/')) {
      const parentName = labelName.split('/')[0];
      const parentExists = listRes.data.labels?.find(l => l.name === parentName);
      if (!parentExists) {
        await gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: parentName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
      }
    }

    // ラベルを新規作成
    const createRes = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });

    const newId = createRes.data.id;
    if (newId) {
      labelCache.set(labelName, newId);
      return newId;
    }
  } catch {
    // ラベル操作失敗は処理継続（非致命的）
  }

  return null;
}

// スキップ時: JobOS/処理済 ラベルを付与
export async function applySkipLabel(accessToken: string, gmailMessageId: string): Promise<void> {
  const labelId = await getOrCreateLabel(accessToken, SKIP_LABEL_NAME);
  if (!labelId) return;

  const gmail = createGmailClient(accessToken);
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: { addLabelIds: [labelId] },
    });
  } catch {
    // ラベル付与失敗は処理継続
  }
}

// ステータス確定時: JobOS/<ステータス名> ラベルを付与
export async function applyStatusLabel(
  accessToken: string,
  gmailMessageId: string,
  status: JobStatus
): Promise<void> {
  const labelName = STATUS_LABEL_NAMES[status];
  if (!labelName) return;

  const labelId = await getOrCreateLabel(accessToken, labelName);
  if (!labelId) return;

  const gmail = createGmailClient(accessToken);
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: { addLabelIds: [labelId] },
    });
  } catch {
    // ラベル付与失敗は処理継続
  }
}
