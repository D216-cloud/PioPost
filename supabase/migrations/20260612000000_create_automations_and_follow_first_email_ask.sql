-- Create automations table
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'all_posts', -- 'specific_post', 'all_posts', 'next_post'
  specific_post_id VARCHAR(100),
  specific_post_thumbnail TEXT,
  trigger_keywords JSONB DEFAULT '[]'::jsonb, -- ['keyword1', 'keyword2']
  exclude_keywords JSONB DEFAULT '[]'::jsonb, -- ['spam']
  dm_message_text TEXT,
  dm_button_text VARCHAR(100),
  dm_button_url TEXT,
  dm_media_url TEXT,
  dm_message_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'image', 'video', 'card', 'voice'
  
  -- Follow Gate / First Settings
  follow_first_enabled BOOLEAN DEFAULT false,
  follow_first_opening_message TEXT,
  follow_first_btn_label VARCHAR(100) DEFAULT 'Send me the access',
  follow_check_msg TEXT,
  follow_check_btn1_label VARCHAR(100) DEFAULT 'Visit Profile',
  follow_check_btn2_label VARCHAR(100) DEFAULT 'I''m following ✅',
  
  -- Email Gate / Ask First Settings
  email_ask_enabled BOOLEAN DEFAULT false,
  email_ask_message TEXT,
  email_ask_btn_label VARCHAR(100) DEFAULT 'Send Guide to My DMs',
  
  -- Follow Up settings
  follow_up_enabled BOOLEAN DEFAULT false,
  follow_up_hours INTEGER DEFAULT 24,
  follow_up_message TEXT,
  
  is_active BOOLEAN DEFAULT true,
  total_triggers INTEGER DEFAULT 0,
  total_success INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and add basic security policy for automations
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own automations" ON public.automations
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Drop old logs table if it conflicts (or create a clean copy)
DROP TABLE IF EXISTS public.automation_logs CASCADE;

-- Create new automation_logs table
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  commenter_username VARCHAR(100) NOT NULL,
  commenter_instagram_id VARCHAR(100) NOT NULL,
  comment_text VARCHAR(500),
  matched_keyword VARCHAR(100),
  follow_check_passed BOOLEAN DEFAULT false,
  email_collected TEXT,
  dm_sent_status VARCHAR(50) DEFAULT 'pending', -- 'sent', 'failed', 'blocked', 'pending'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Collected Emails table
CREATE TABLE IF NOT EXISTS public.collected_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  instagram_username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.collected_emails ENABLE ROW LEVEL SECURITY;

-- Email Pending Requests table
CREATE TABLE IF NOT EXISTS public.email_pending_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  commenter_instagram_id VARCHAR(100) NOT NULL,
  commenter_username VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting_for_email', -- 'waiting_for_email', 'email_collected', 'expired'
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.email_pending_requests ENABLE ROW LEVEL SECURITY;

-- Pending Follow Requests table
CREATE TABLE IF NOT EXISTS public.pending_follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  commenter_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting', -- 'waiting', 'completed', 'expired'
  first_check_time TIMESTAMPTZ DEFAULT now(),
  reminder_sent_count INTEGER DEFAULT 0
);

ALTER TABLE public.pending_follow_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automations_profile ON public.automations(profile_id);
CREATE INDEX IF NOT EXISTS idx_automations_ig_account ON public.automations(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_automations_post_id ON public.automations(specific_post_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON public.automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_collected_emails_automation ON public.collected_emails(automation_id);
CREATE INDEX IF NOT EXISTS idx_email_pending_requests_token ON public.email_pending_requests(token);
CREATE INDEX IF NOT EXISTS idx_pending_follow_requests_automation ON public.pending_follow_requests(automation_id);
