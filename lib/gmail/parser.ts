import type { JobStatus } from '@/lib/types';
import {
  STATUS_KEYWORDS,
  APPLIED_KEYWORDS,
  DECLINED_AMBIGUOUS_KEYWORDS,
  JOB_CONTEXT_KEYWORDS,
  EXCLUDE_DOMAINS,
  EXCLUDE_KEYWORDS,
  JOB_SITES,
} from './keywords';

export interface ParseResult {
  company:    string | null;
  position:   string | null;
  status:     JobStatus | null;
  confidence: number; // 0.00 〜 1.00
  site_name:  string | null;
}

// ── ドメイン抽出 ───────────────────────────────────────────────

function extractDomain(from: string): string {
  const match = from.match(/<[^@]+@([^>]+)>/) ?? from.match(/@([^\s>]+)/);
  return match ? match[1].toLowerCase() : '';
}

// ── FR-033: 非求人メール除外判定 ────────────────────────────────

export function shouldExcludeEmail(from: string, subject: string): boolean {
  const domain = extractDomain(from);
  if (domain && EXCLUDE_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`))) {
    return true;
  }
  const subjectLower = subject.toLowerCase();
  return EXCLUDE_KEYWORDS.some(kw => subjectLower.includes(kw.toLowerCase()));
}

// ── FR-034: 転職サイト送信者の検出 ──────────────────────────────

function detectJobSite(from: string): string | null {
  const domain = extractDomain(from);
  if (!domain) return null;
  for (const [siteDomain, siteName] of Object.entries(JOB_SITES)) {
    if (domain === siteDomain || domain.endsWith(`.${siteDomain}`)) {
      return siteName;
    }
  }
  return null;
}

// ── ステータス判定 ────────────────────────────────────────────

export function detectStatus(subject: string, body: string): { status: JobStatus | null; confidence: number } {
  const text = `${subject} ${body}`.toLowerCase();

  // declined: 明確なキーワード優先
  const declinedMatches = STATUS_KEYWORDS.declined.filter(kw => text.includes(kw.toLowerCase()));

  // FR-035: 文脈依存キーワードは求人文脈との共起がある場合のみカウント
  const hasJobContext = JOB_CONTEXT_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  const ambiguousMatches = hasJobContext
    ? DECLINED_AMBIGUOUS_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()))
    : [];

  const totalDeclined = declinedMatches.length + ambiguousMatches.length;
  if (totalDeclined > 0) {
    return { status: 'declined', confidence: Math.min(0.5 + totalDeclined * 0.2, 1.0) };
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
  const displayMatch = from.match(/^"?([^"<]+?)"?\s*</);
  if (displayMatch) {
    let name = displayMatch[1].trim();
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
  const posMatch = subject.match(
    /([\w぀-鿿]{2,20}(?:エンジニア|デザイナー|マネージャー|営業|企画|開発|プログラマー|PM|SE))/
  );
  return posMatch ? posMatch[1] : null;
}

// ── メイン解析関数 ────────────────────────────────────────────

export function parseEmail(subject: string, body: string, from: string): ParseResult {
  const { status, confidence } = detectStatus(subject, body);
  const position = extractPosition(subject);

  // FR-034: 転職サイト送信者の場合は件名から採用企業名を抽出、site_nameを自動セット
  const site_name = detectJobSite(from);
  let company: string | null;

  if (site_name) {
    // 転職サイト経由: 件名の【】か会社名パターンから採用企業を抽出（送信者名は使わない）
    const bracketMatch = subject.match(/[【\[](.*?)[】\]]/);
    company = bracketMatch ? bracketMatch[1].trim() : null;

    if (!company) {
      const corpMatch = subject.match(/([\w぀-鿿]{2,20}(?:株式会社|合同会社|有限会社|Inc\.|Corp\.|Ltd\.))/);
      company = corpMatch ? corpMatch[1] : null;
    }
    // company が null の場合は pending_review に回す（呼び出し側で confidence < 0.7 扱い）
  } else {
    company = extractCompany(from, subject);
  }

  return { company, position, status, confidence, site_name };
}
