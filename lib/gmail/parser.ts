import Anthropic from '@anthropic-ai/sdk';
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
  company:      string | null;
  position:     string | null;
  status:       JobStatus | null;
  confidence:   number;
  site_name:    string | null;
  job_url:      string | null;
  body_summary: string | null;
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

// ── FR-034: 転職サイト送信者の検出（フォールバック用） ────────────

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

// ── フォールバック: 正規表現によるステータス判定 ──────────────────

export function detectStatus(subject: string, body: string): { status: JobStatus | null; confidence: number } {
  const text = `${subject} ${body}`.toLowerCase();

  const declinedMatches = STATUS_KEYWORDS.declined.filter(kw => text.includes(kw.toLowerCase()));
  const hasJobContext = JOB_CONTEXT_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  const ambiguousMatches = hasJobContext
    ? DECLINED_AMBIGUOUS_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()))
    : [];

  const totalDeclined = declinedMatches.length + ambiguousMatches.length;
  if (totalDeclined > 0) {
    return { status: 'declined', confidence: Math.min(0.5 + totalDeclined * 0.2, 1.0) };
  }

  const scores: Partial<Record<JobStatus, number>> = {};
  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS) as [JobStatus, string[]][]) {
    if (status === 'accepted') continue;
    const matched = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matched > 0) scores[status] = matched;
  }

  const appliedMatches = APPLIED_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())).length;
  if (appliedMatches > 0) scores.applied = appliedMatches;

  if (Object.keys(scores).length === 0) return { status: null, confidence: 0 };

  const [bestStatus, bestScore] = Object.entries(scores).sort(([, a], [, b]) => b - a)[0] as [JobStatus, number];
  return { status: bestStatus, confidence: Math.min(0.4 + bestScore * 0.2, 1.0) };
}

// ── フォールバック: 正規表現による企業名抽出 ──────────────────────

export function extractCompany(from: string, subject: string): string | null {
  const displayMatch = from.match(/^"?([^"<]+?)"?\s*</);
  if (displayMatch) {
    let name = displayMatch[1].trim();
    name = name.replace(/[\s　]*(採用担当|人事部|人事課|リクルート|採用チーム|HR|recruit|careers?)$/i, '').trim();
    if (name.length > 1 && name.length <= 50) return name;
  }
  const bracketMatch = subject.match(/[【\[](.*?)[】\]]/);
  if (bracketMatch) {
    const candidate = bracketMatch[1].trim();
    if (candidate.length > 1 && candidate.length <= 50) return candidate;
  }
  const corpMatch = subject.match(/([\w぀-鿿]{2,20}(?:株式会社|合同会社|有限会社|Inc\.|Corp\.|Ltd\.))/);
  if (corpMatch) return corpMatch[1];
  return null;
}

// ── フォールバック: 正規表現による職種抽出 ───────────────────────

export function extractPosition(subject: string): string | null {
  const posMatch = subject.match(
    /([\w぀-鿿]{2,20}(?:エンジニア|デザイナー|マネージャー|営業|企画|開発|プログラマー|PM|SE))/
  );
  return posMatch ? posMatch[1] : null;
}

// ── FR-036: Claude API による一括解析 ────────────────────────────

const VALID_STATUSES: JobStatus[] = ['considering', 'applied', 'screening', 'interview', 'offered', 'accepted', 'declined'];

async function parseWithClaude(subject: string, body: string, from: string): Promise<ParseResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const truncatedBody = body.slice(0, 1500);

  const prompt = `以下の求人関連メールを解析し、JSONのみで回答してください。

送信者: ${from}
件名: ${subject}
本文（抜粋）:
${truncatedBody}

以下のJSONフォーマットで返してください（コードブロック不要、JSONのみ）:
{
  "company": "企業名（不明な場合はnull）",
  "position": "職種・ポジション名（不明な場合はnull）",
  "status": "applying/screening/interview/offered/accepted/declined/considering のいずれか（不明な場合はnull）",
  "site_name": "応募サイト名 例:doda、マイナビ転職（不明な場合はnull）",
  "job_url": "メール本文中の求人詳細URL（見つからない場合はnull）",
  "body_summary": "メール内容の要約（40〜100文字の日本語）",
  "confidence": 0.0〜1.0の数値（抽出精度の自己評価）
}

statusの対応:
- considering: 検討候補・気になる求人
- applied: 応募完了・エントリー
- screening: 書類選考中・書類審査
- interview: 面接・選考中
- offered: 内定・オファー
- accepted: 内定承諾
- declined: 不採用・落選・辞退・見送り`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const status: JobStatus | null = VALID_STATUSES.includes(parsed.status) ? parsed.status : null;
    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(Math.max(parsed.confidence, 0), 1)
      : 0.5;

    return {
      company:      typeof parsed.company === 'string' ? parsed.company.trim() || null : null,
      position:     typeof parsed.position === 'string' ? parsed.position.trim() || null : null,
      status,
      confidence,
      site_name:    typeof parsed.site_name === 'string' ? parsed.site_name.trim() || null : null,
      job_url:      typeof parsed.job_url === 'string' ? parsed.job_url.trim() || null : null,
      body_summary: typeof parsed.body_summary === 'string' ? parsed.body_summary.trim().slice(0, 100) || null : null,
    };
  } catch {
    return null;
  }
}

// ── メイン解析関数 ────────────────────────────────────────────

export async function parseEmail(subject: string, body: string, from: string): Promise<ParseResult> {
  // FR-036: まず Claude API で解析を試みる
  const claudeResult = await parseWithClaude(subject, body, from);
  if (claudeResult) return claudeResult;

  // フォールバック: 正規表現ロジック
  const { status, confidence } = detectStatus(subject, body);
  const position = extractPosition(subject);
  const site_name = detectJobSite(from);

  let company: string | null;
  if (site_name) {
    const bracketMatch = subject.match(/[【\[](.*?)[】\]]/);
    company = bracketMatch ? bracketMatch[1].trim() : null;
    if (!company) {
      const corpMatch = subject.match(/([\w぀-鿿]{2,20}(?:株式会社|合同会社|有限会社|Inc\.|Corp\.|Ltd\.))/);
      company = corpMatch ? corpMatch[1] : null;
    }
  } else {
    company = extractCompany(from, subject);
  }

  return { company, position, status, confidence, site_name, job_url: null, body_summary: null };
}
