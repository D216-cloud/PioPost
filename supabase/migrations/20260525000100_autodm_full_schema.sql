-- AutoDM Full Schema: add missing columns to automation_rules
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS keyword_mode    text NOT NULL DEFAULT 'specific',
  ADD COLUMN IF NOT EXISTS keywords        text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_reply_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reply_text text,
  ADD COLUMN IF NOT EXISTS dm_type         text NOT NULL DEFAULT 'message_only',
  ADD COLUMN IF NOT EXISTS dm_button_label text,
  ADD COLUMN IF NOT EXISTS dm_button_url   text,
  ADD COLUMN IF NOT EXISTS ask_follow      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ask_email       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_thumbnail  text,
  ADD COLUMN IF NOT EXISTS deleted         boolean NOT NULL DEFAULT false;

-- Add missing columns to automation_logs
ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS comment_id              text,
  ADD COLUMN IF NOT EXISTS triggered_by_username   text,
  ADD COLUMN IF NOT EXISTS dm_sent_at              timestamp with time zone;

-- Index for fast deduplication queries
CREATE INDEX IF NOT EXISTS automation_logs_automation_user_idx
  ON public.automation_logs (automation_id, instagram_user_id, created_at);
