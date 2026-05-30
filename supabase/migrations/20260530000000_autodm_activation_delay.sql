ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS activation_delay_days integer NOT NULL DEFAULT 0;