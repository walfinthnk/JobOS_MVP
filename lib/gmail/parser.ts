import type { JobStatus } from '@/lib/types';
import { STATUS_KEYWORDS, APPLIED_KEYWORDS } from './keywords';

export interface ParseResult {
  company:    string | null;
  position:   string | null;
  status:     JobStatus | null;
  confidence: number; // 0.00 〜 1.00
}

// ── ステータス判定 ────────────────────────────────────────────

export function detectStatus(subject: string, body: string): { status: JobStatus | null; confidence: number } {
  const text = `${subject} ${body}`.toLowerCase();

  // declined は最優先でチェック（誤検知を防ぐ）
  const declinedMatches = STATUS_KEYWORDS.declined.filter(kw => text.includes(kw.toLowerCase()));
  if (declinedMatches.length > 0) {
    return { status: 'declined', confidence: Math.min(0.5 + declinedMatches.length * 0.2, 1.0) };
  }

  // 各ステータスのマッチ数を集計
  const scores: Partial<Record<JobStatus, number>> = {};

  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS) as [JobStatus, string[]][]) {
    if (status === 'accepted') continue;
    const matched = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matched > 0) scores[status] = matched;
  }

  // applied キーワードチェック
  const appliedMatches = APPLIED_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())).length;
  if (appliedMatches > 0) scores.applied = appliedMatches;

  if (Object.keys(scores).length === 0) {
    return { status: null, confidence: 0 };
  }

  // 最高スコアのステータスを採用
  const [bestStatus, bestScore] = Object.entries(scores).sort(([, a], [, b]) => b - a)[0] as [JobStatus, number];
  const confidence = Math.min(0.4 + bestScore * 0.2, 1.0);

  return { status: bestStatus, confidence };
}

// ── 企業名抽出 ────────────────────────────────────────────────

export function extractCompany(from: string, subject: string): string | null {
  // From ヘッダーの表示名から抽出
  // 例: "株式会社ABC 採用担当 <recruit@abc.co.jp>"
  const displayMatch = from.match(/^"?([^"<]+?)"?\s*</);
  if (displayMatch) {
    let name = displayMatch[1].trim();
    // 採用担当・人事部等のサフィックスを除去
    name = name.replace(/[\s　]*(採用担当|人事部|人事課|リクルート|採用チーム|HR|recruit|careers?)$/i, '').trim();
    if (name.length > 1 && name.length <= 50) return name;
  }

  // 件名から【企業名】パターンを抽出
  const bracketMatch = subject.match(/[【\[](.*?)[】\]]/);
  if (bracketMatch) {
    const candidate = bracketMatch[1].trim();
    if (candidate.length > 1 && candidate.length <= 50) return candidate;
  }

  // 件名から「〇〇株式会社」「〇〇社」パターンを抽出
  const corpMatch = subject.match(/([\w぀-鿿]{2,20}(?:株式会社|合同会社|有限会社|Inc\.|Corp\.|Ltd\.))/);
  if (corpMatch) return corpMatch[1];

  return null;
}

// ── ポジション抽出 ────────────────────────────────────────────

export function extractPosition(subject: string): string | null {
  // 「〇〇エンジニア」「〇〇職」などを抽出
  const posMatch = subject.match(
    /([\w぀-鿿]{2,20}(?:エンジニア|デザイナー|マネージャー|営業|企画|開発|プログラマー|PM|SE))/
  );
  return posMatch ? posMatch[1] : null;
}

// ── メイン解析関数 ────────────────────────────────────────────

export function parseEmail(subject: string, body: string, from: string): ParseResult {
  const { status, confidence } = detectStatus(subject, body);
  const company  = extractCompany(from, subject);
  const position = extractPosition(subject);

  return { company, position, status, confidence };
}
