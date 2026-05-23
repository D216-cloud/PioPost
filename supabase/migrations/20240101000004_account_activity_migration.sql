-- Create account_activity table
CREATE TABLE public.account_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add performance index
CREATE INDEX idx_account_activity_user_created ON public.account_activity(user_id, created_at DESC);

ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own activity"
  ON public.account_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.account_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
