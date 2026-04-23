-- ============================================================
-- JobOS MVP — Database Schema
-- 要件定義書 v1.1 準拠
-- ============================================================

-- ── ENUM 型定義 ──────────────────────────────────────────────

CREATE TYPE job_status AS ENUM (
  'applied',    -- 応募中
  'screening',  -- 書類選考
  'interview',  -- 面接中
  'offered',    -- 内定
  'accepted',   -- 承諾
  'declined'    -- 辞退・不採用
);

CREATE TYPE sync_action AS ENUM (
  'created',        -- 新規求人を登録した
  'updated',        -- 既存求人のステータスを更新した
  'skipped',        -- 重複・既処理のためスキップした
  'pending_review', -- 確信度が低く、ユーザー確認待ち
  'error'           -- 解析エラー
);

-- ── テーブル定義 ─────────────────────────────────────────────

-- ① profiles（プロフィール）
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ② job_applications（求人応募）
CREATE TABLE job_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL,
  position     VARCHAR(100) NOT NULL,
  job_url      TEXT,
  status       job_status NOT NULL DEFAULT 'applied',
  applied_date DATE DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ③ status_histories（ステータス変更履歴）
CREATE TABLE status_histories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  from_status    job_status,
  to_status      job_status NOT NULL,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  note           TEXT
);

-- ④ gmail_integrations（Gmail連携情報）
CREATE TABLE gmail_integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_address     TEXT NOT NULL,
  access_token_enc  TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  token_expires_at  TIMESTAMPTZ NOT NULL,
  label_name        VARCHAR(50) NOT NULL DEFAULT '求人応募',
  history_id        TEXT,
  watch_expiry      TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ⑤ gmail_sync_logs（Gmail同期ログ）
CREATE TABLE gmail_sync_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id   UUID NOT NULL REFERENCES gmail_integrations(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE,
  application_id   UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  action           sync_action NOT NULL,
  parsed_company   TEXT,
  parsed_position  TEXT,
  detected_status  job_status,
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  raw_subject      TEXT,
  error_message    TEXT,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── インデックス ──────────────────────────────────────────────

CREATE INDEX idx_job_applications_user_id   ON job_applications(user_id);
CREATE INDEX idx_job_applications_status    ON job_applications(status);
CREATE INDEX idx_status_histories_app_id   ON status_histories(application_id);
CREATE INDEX idx_gmail_sync_logs_user_id   ON gmail_sync_logs(user_id);
CREATE INDEX idx_gmail_sync_logs_action    ON gmail_sync_logs(action);

-- ── updated_at 自動更新トリガー ───────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_gmail_integrations_updated_at
  BEFORE UPDATE ON gmail_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_histories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_sync_logs    ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のレコードのみ
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- job_applications: 自分のレコードのみ
CREATE POLICY "job_applications_own" ON job_applications
  FOR ALL USING (auth.uid() = user_id);

-- status_histories: 自分の求人に紐づく履歴のみ
CREATE POLICY "status_histories_own" ON status_histories
  FOR ALL USING (
    application_id IN (
      SELECT id FROM job_applications WHERE user_id = auth.uid()
    )
  );

-- gmail_integrations: 自分のレコードのみ
CREATE POLICY "gmail_integrations_own" ON gmail_integrations
  FOR ALL USING (auth.uid() = user_id);

-- gmail_sync_logs: 自分のレコードのみ
CREATE POLICY "gmail_sync_logs_own" ON gmail_sync_logs
  FOR ALL USING (auth.uid() = user_id);

-- ── ユーザー登録トリガー（profiles 自動作成）─────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
