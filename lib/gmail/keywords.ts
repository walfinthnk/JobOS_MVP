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
    '採用に至らなかった', '採用は見送', 'ご期待に沿えず',
    '今回は採用を', 'not selected', 'regret to inform',
    'we will not be moving forward',
  ],
};

// declined 判定: 文脈依存キーワード（求人文脈との共起が必要）
export const DECLINED_AMBIGUOUS_KEYWORDS = [
  '残念ながら', 'unfortunately',
];

// 求人文脈キーワード（declined 文脈判定の共起チェック用）
export const JOB_CONTEXT_KEYWORDS = [
  '選考', '採用', '応募', '面接', '書類', 'エントリー',
  'selection', 'hiring', 'application', 'interview', 'recruitment',
];

// 応募受付キーワード（applied ステータス用）
export const APPLIED_KEYWORDS = [
  '応募を受け付けました', 'ご応募ありがとう', 'エントリーを受け付け',
  '応募完了', 'エントリー完了', '応募確認', 'ご応募を確認',
  'application received', 'thank you for applying', 'application confirmed',
];

// 非求人ドメイン（FR-033: 早期除外対象）
export const EXCLUDE_DOMAINS = [
  // ニュースレター・マーケティング
  'mailchimp.com', 'sendgrid.net', 'amazonses.com', 'mandrillapp.com',
  'constantcontact.com', 'campaignmonitor.com',
  // ECサイト・決済
  'amazon.co.jp', 'amazon.com', 'rakuten.co.jp', 'yahoo.co.jp',
  'paypal.com', 'stripe.com',
  // SNS通知
  'facebookmail.com', 'twitter.com', 'linkedin.com', 'instagram.com',
  // その他非求人
  'accounts.google.com', 'noreply.github.com',
];

// 非求人件名キーワード（FR-033: 早期除外対象、大文字小文字区別なし）
export const EXCLUDE_KEYWORDS = [
  '領収書', '請求書', 'ご注文', '発送しました', 'お届け',
  'ポイント', 'セール', 'キャンペーン', 'newsletter', 'unsubscribe',
  'パスワードリセット', 'ワンタイムパスワード', '認証コード',
  '確認コード', 'verification code', 'security alert',
];

// 転職サイトドメイン → サイト名マッピング（FR-034）
export const JOB_SITES: Record<string, string> = {
  // マイナビ転職
  'mynavi.jp':            'マイナビ転職',
  'jinji.mynavi.jp':      'マイナビ転職',
  // doda
  'doda.jp':              'doda',
  'pa-doda.jp':           'doda',
  // リクナビNEXT
  'next.rikunabi.com':    'リクナビNEXT',
  'rikunabi.com':         'リクナビNEXT',
  // リクルートエージェント
  'r-agent.com':          'リクルートエージェント',
  'recruit.co.jp':        'リクルートエージェント',
  // Indeed
  'indeed.com':           'Indeed',
  'indeed.co.jp':         'Indeed',
  'indeedemail.com':      'Indeed',
  // 転職会議
  'kaigi.com':            '転職会議',
  'jobtalk.jp':           '転職会議',
  // OpenWork
  'vorkers.com':          'OpenWork',
  'openwork.jp':          'OpenWork',
  // Wantedly
  'wantedly.com':         'Wantedly',
  // Green
  'green-japan.com':      'Green',
  // ビズリーチ
  'bizreach.jp':          'ビズリーチ',
  // エン転職
  'en-japan.com':         'エン転職',
  // type転職
  'type.jp':              'type転職',
  // Find Job
  'find-job.net':         'Find Job!',
};
