import { google } from 'googleapis';
import { encrypt, decrypt } from './crypto';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',  // メッセージへのラベル付与に必要（readonlyの上位互換）
  'https://www.googleapis.com/auth/gmail.labels',
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
  );
}

// OAuth 認可 URL を生成（CSRF state を含む）
export function generateAuthUrl(state: string): string {
  const oauth2 = createOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope:       SCOPES,
    state,
    prompt:      'consent', // 毎回同意を求めて refresh_token を確実に取得
  });
}

// 認可コードをトークンに交換
export async function exchangeCodeForTokens(code: string) {
  const oauth2 = createOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

// アクセストークンを更新（有効期限 5分前に実行）
export async function refreshAccessToken(refreshTokenEnc: string) {
  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({ refresh_token: decrypt(refreshTokenEnc) });
  const { credentials } = await oauth2.refreshAccessToken();
  return credentials;
}

// 有効なアクセストークンを取得し、必要に応じてリフレッシュ
export async function getValidAccessToken(
  accessTokenEnc: string,
  refreshTokenEnc: string,
  tokenExpiresAt: string
): Promise<{ accessToken: string; newAccessTokenEnc?: string; newExpiresAt?: string }> {
  const expiresAt = new Date(tokenExpiresAt);
  const isExpiringSoon = expiresAt < new Date(Date.now() + 5 * 60 * 1000);

  if (!isExpiringSoon) {
    return { accessToken: decrypt(accessTokenEnc) };
  }

  const credentials = await refreshAccessToken(refreshTokenEnc);
  const accessToken = credentials.access_token!;
  return {
    accessToken,
    newAccessTokenEnc: encrypt(accessToken),
    newExpiresAt:      new Date(credentials.expiry_date!).toISOString(),
  };
}

// Gmail インスタンスを生成（アクセストークン指定）
export function createGmailClient(accessToken: string) {
  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2 });
}

// Gmail ラベル ID を名前で検索
export async function getLabelIdByName(accessToken: string, labelName: string): Promise<string | null> {
  const gmail = createGmailClient(accessToken);
  const res = await gmail.users.labels.list({ userId: 'me' });
  const label = res.data.labels?.find(l => l.name === labelName);
  return label?.id ?? null;
}

// メール本文（プレーンテキスト）を取得
export function extractBody(payload: { body?: { data?: string | null }; parts?: { mimeType?: string; body?: { data?: string | null } }[] } | null | undefined): string {
  if (!payload) return '';

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf8');
      }
    }
  }
  return '';
}
