-- Add missing columns to automation_rules for follow-gate and auto-reply features
-- These columns were only in the DROP+CREATE migration (20260526000000) which
-- does not update existing tables.

ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS require_follow       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS follow_gate_message   TEXT,
  ADD COLUMN IF NOT EXISTS auto_reply_comment    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS comment_reply_text    TEXT,
  ADD COLUMN IF NOT EXISTS total_dms_sent        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rule_name             TEXT;
