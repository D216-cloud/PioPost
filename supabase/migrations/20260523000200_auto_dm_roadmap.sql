-- Add missing columns to automation_rules
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS instagram_account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS executions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_execution timestamp with time zone,
  ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'keyword';

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  instagram_user_id text,
  comment_text text,
  dm_sent boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for automation_logs
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automation logs"
  ON public.automation_logs
  FOR SELECT
  TO authenticated
  USING (
    automation_id IN (
      SELECT id FROM public.automation_rules WHERE user_id = auth.uid()
    )
  );

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text,
  payload jsonb,
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Note: Webhook events are for system/admin tracking, usually we don't need RLS for authenticated users, 
-- but we enable it and only allow service_role to access them, or we leave RLS disabled.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
