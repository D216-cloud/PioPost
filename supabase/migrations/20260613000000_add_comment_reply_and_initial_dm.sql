-- Migration: Add comment_reply_text and initial_dm_message columns to automations table
-- comment_reply_text  -> the public reply posted in comments when triggered
-- initial_dm_message  -> the first DM body shown with the "Send Access" postback button (no-gate flow)

ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS comment_reply_text TEXT,
  ADD COLUMN IF NOT EXISTS initial_dm_message TEXT;

-- Set sensible defaults for existing rows
UPDATE public.automations
  SET comment_reply_text = 'Thanks for the comment! Check your DMs!'
  WHERE comment_reply_text IS NULL;

UPDATE public.automations
  SET initial_dm_message = 'Thanks for commenting! Tap below to get access instantly!'
  WHERE initial_dm_message IS NULL
    AND follow_first_enabled = false
    AND email_ask_enabled = false;
