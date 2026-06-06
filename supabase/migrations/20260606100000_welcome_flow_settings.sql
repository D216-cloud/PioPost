-- Create welcome_flow_settings table
CREATE TABLE IF NOT EXISTS public.welcome_flow_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_message TEXT NOT NULL DEFAULT 'Hi {{first_name}}! Welcome to our page! 👋',
  buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_dms_sent INTEGER DEFAULT 0,
  executions INTEGER DEFAULT 0,
  last_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instagram_account_id)
);

-- Enable RLS
ALTER TABLE public.welcome_flow_settings ENABLE ROW LEVEL SECURITY;

-- Policies (cast auth.uid() to TEXT to match user_id column type)
CREATE POLICY "Users can manage welcome flow settings for their accounts"
  ON public.welcome_flow_settings
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
CREATE INDEX IF NOT EXISTS idx_welcome_flow_settings_account ON public.welcome_flow_settings(instagram_account_id);
