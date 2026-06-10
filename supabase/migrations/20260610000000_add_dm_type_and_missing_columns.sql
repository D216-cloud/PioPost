-- Add dm_type column back to automation_rules (was lost when 20260526000000
-- dropped and recreated the table without it).
-- Also add any other columns that may be missing.

ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS dm_type              TEXT DEFAULT 'message_only',
  ADD COLUMN IF NOT EXISTS executions           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_execution       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_delay_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dedupe_cooldown_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS instagram_media_id   TEXT,
  ADD COLUMN IF NOT EXISTS trigger_type         TEXT,
  ADD COLUMN IF NOT EXISTS comment_scope        TEXT,
  ADD COLUMN IF NOT EXISTS post_thumbnail       TEXT;

-- Ensure dm_message is nullable (for comment-only rules)
ALTER TABLE public.automation_rules ALTER COLUMN dm_message DROP NOT NULL;

-- Ensure post_id is nullable (for global rules)
ALTER TABLE public.automation_rules ALTER COLUMN post_id DROP NOT NULL;
