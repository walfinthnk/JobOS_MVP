// ============================================================
// JobOS MVP — 共通型定義
// 要件定義書 v1.1 テーブル設計準拠
// ============================================================

export type JobStatus =
  | 'applied'    // 応募中
  | 'screening'  // 書類選考
  | 'interview'  // 面接中
  | 'offered'    // 内定
  | 'accepted'   // 承諾
  | 'declined';  // 辞退・不採用

export type SyncAction =
  | 'created'        // 新規求人を登録した
  | 'updated'        // 既存求人のステータスを更新した
  | 'skipped'        // 重複・既処理のためスキップした
  | 'pending_review' // 確信度が低く、ユーザー確認待ち
  | 'error';         // 解析エラー

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  applied:   '応募中',
  screening: '書類選考',
  interview: '面接中',
  offered:   '内定',
  accepted:  '承諾',
  declined:  '辞退・不採用',
};

// ── テーブル型 ────────────────────────────────────────────────

export interface Profile {
  id:           string;
  display_name: string;
  created_at:   string;
  updated_at:   string;
}

export interface JobApplication {
  id:           string;
  user_id:      string;
  company_name: string;
  position:     string;
  job_url:      string | null;
  status:       JobStatus;
  applied_date: string | null;
  notes:        string | null;
  site_name:    string | null;
  created_at:   string;
  updated_at:   string;
}

export interface StatusHistory {
  id:             string;
  application_id: string;
  from_status:    JobStatus | null;
  to_status:      JobStatus;
  changed_at:     string;
  note:           string | null;
}

export interface GmailIntegration {
  id:                string;
  user_id:           string;
  gmail_address:     string;
  access_token_enc:  string;
  refresh_token_enc: string;
  token_expires_at:  string;
  label_name:        string;
  history_id:        string | null;
  watch_expiry:      string | null;
  is_active:         boolean;
  last_synced_at:    string | null;
  created_at:        string;
  updated_at:        string;
}

export interface GmailSyncLog {
  id:               string;
  user_id:          string;
  integration_id:   string;
  gmail_message_id: string;
  application_id:   string | null;
  action:           SyncAction;
  parsed_company:   string | null;
  parsed_position:  string | null;
  detected_status:  JobStatus | null;
  confidence_score: number | null;
  raw_subject:      string | null;
  error_message:    string | null;
  processed_at:     string;
}

// ── API リクエスト/レスポンス型 ───────────────────────────────

export interface CreateJobRequest {
  company_name: string;
  position:     string;
  job_url?:     string;
  status?:      JobStatus;
  applied_date?: string;
  notes?:       string;
  site_name?:   string;
}

export interface UpdateJobRequest {
  company_name?: string;
  position?:     string;
  job_url?:      string;
  status?:       JobStatus;
  applied_date?: string;
  notes?:        string;
  site_name?:    string;
}

export interface JobWithHistory extends JobApplication {
  status_histories: StatusHistory[];
}

// ── 統計型 ───────────────────────────────────────────────────

export interface JobStats {
  total:           number;
  by_status:       Record<JobStatus, number>;
  screening_rate:  number; // 書類通過率（%）
  interview_rate:  number; // 面接通過率（%）
  active_days:     number; // 最初の応募日〜今日の日数
}
