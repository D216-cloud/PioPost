-- Create instagram_accounts table
CREATE TABLE IF NOT EXISTS public.instagram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_business_id text NOT NULL,
  facebook_page_id text,
  access_token text NOT NULL,
  username text NOT NULL,
  profile_picture_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own instagram account"
  ON public.instagram_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram account"
  ON public.instagram_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram account"
  ON public.instagram_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram account"
  ON public.instagram_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
