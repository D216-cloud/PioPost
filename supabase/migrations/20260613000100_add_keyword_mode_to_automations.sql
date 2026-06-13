-- Migration: Add keyword_mode column to automations table
-- Values: 'any' (contains any, default), 'all' (contains all), 'exact' (matches exactly), 'any_comment' (triggers on all comments)

ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS keyword_mode VARCHAR(50) DEFAULT 'any';
