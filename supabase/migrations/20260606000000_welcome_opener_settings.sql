-- Create welcome_opener_settings table
CREATE TABLE IF NOT EXISTS public.welcome_opener_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_message TEXT NOT NULL DEFAULT 'Hi {{first_name}}! Welcome to our page! 👋',
  quick_replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_dms_sent INTEGER DEFAULT 0,
  executions INTEGER DEFAULT 0,
  last_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instagram_account_id)
);

-- Enable RLS
ALTER TABLE public.welcome_opener_settings ENABLE ROW LEVEL SECURITY;

-- Policies (cast auth.uid() to TEXT to match user_id column type)
CREATE POLICY "Users can manage welcome opener settings for their accounts"
  ON public.welcome_opener_settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM public.instagram_accounts ia WHERE ia.id = instagram_account_id AND ia.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM public.instagram_accounts ia WHERE ia.id = instagram_account_id AND ia.user_id = auth.uid()::text
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_welcome_opener_settings_account ON public.welcome_opener_settings(instagram_account_id);

-- Migrate existing Welcome Opener settings if they exist in automation_rules
DO $$
BEGIN
  INSERT INTO public.welcome_opener_settings (
    user_id, 
    instagram_account_id, 
    active, 
    welcome_message, 
    quick_replies, 
    total_dms_sent, 
    executions, 
    last_execution, 
    created_at, 
    updated_at
  )
  SELECT 
    ar.user_id, 
    ar.instagram_account_id, 
    COALESCE(ar.active, false), 
    COALESCE(ar.dm_message, 'Hi {{first_name}}! Welcome to our page! 👋'), 
    CASE 
      WHEN ar.post_caption IS NOT NULL AND ar.post_caption ~ '^\s*\[' 
      THEN ar.post_caption::jsonb 
      ELSE '[]'::jsonb 
    END,
    COALESCE(ar.total_dms_sent, 0), 
    COALESCE(ar.executions, 0), 
    ar.last_execution, 
    ar.created_at, 
    ar.updated_at
  FROM public.automation_rules ar
  WHERE ar.post_id = 'welcome_opener' AND ar.deleted = false
  ON CONFLICT (instagram_account_id) DO UPDATE SET
    active = EXCLUDED.active,
    welcome_message = EXCLUDED.welcome_message,
    quick_replies = EXCLUDED.quick_replies,
    total_dms_sent = EXCLUDED.total_dms_sent,
    executions = EXCLUDED.executions,
    last_execution = EXCLUDED.last_execution;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Welcome Opener migration from automation_rules skipped: %', SQLERRM;
END;
$$;
