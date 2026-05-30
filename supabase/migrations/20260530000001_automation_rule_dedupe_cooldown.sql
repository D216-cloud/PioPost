ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS dedupe_cooldown_hours integer NOT NULL DEFAULT 24;
