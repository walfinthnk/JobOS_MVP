import type { JobStatus } from '@/lib/types';

// ステータス判定キーワード（件名・本文を対象に大文字小文字区別なしでマッチ）
export const STATUS_KEYWORDS: Record<Exclude<JobStatus, 'applied'>, string[]> = {
  screening: [
    '書類選考通過', '書類選考を通過', '書類審査通過', '書類審査を通過',
    '次のステップ', '書類選考結果', '一次選考通過', '書類選考合格',
    'resume review', 'document screening passed',
  ],
  interview: [
    '面接のご案内', '面接日程', '日程調整のお願い', '面接について',
    'オンライン面接', '一次面接', '二次面接', '三次面接', '最終面接',
    '選考面接', '採用面接', '面接ご案内', 'interview invitation',
    'interview schedule',
  ],
  offered: [
    '内定のご連絡', '内定をご通知', '内定のお知らせ', '内定おめでとう',
    'オファーレター', 'オファーをご提案', '採用のご連絡', '採用内定',
    'offer letter', 'job offer', 'employment offer',
  ],
  accepted: [],  // 承諾は手動操作のみ
  declined: [
    '今回は見送り', 'ご縁がなかった', '採用を見送', '不採用', '選考を見送',
    '採用に至らなかった', '採用は見送', 'ご期待に沿えず', '残念ながら',
    '今回は採用を', 'not selected', 'regret to inform', 'unfortunately',
    'we will not be moving forward',
  ],
};

// 応募受付キーワード（applied ステータス用）
export const APPLIED_KEYWORDS = [
  '応募を受け付けました', 'ご応募ありがとう', 'エントリーを受け付け',
  '応募完了', 'エントリー完了', '応募確認', 'ご応募を確認',
  'application received', 'thank you for applying', 'application confirmed',
];
