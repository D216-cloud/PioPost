-- Migration to allow comment-only replies without DMs

-- Alter dm_message to be nullable in automation_rules
ALTER TABLE public.automation_rules ALTER COLUMN dm_message DROP NOT NULL;
