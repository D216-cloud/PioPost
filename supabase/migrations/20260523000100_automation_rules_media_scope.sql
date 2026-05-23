-- Add media targeting fields for automation rules
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS comment_scope text NOT NULL DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS instagram_media_id text;

CREATE INDEX IF NOT EXISTS automation_rules_instagram_media_id_idx
  ON public.automation_rules (instagram_media_id);
