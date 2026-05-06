-- Update profiles table with extra fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text DEFAULT '',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT '';

-- Create automation_rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  name text NOT NULL DEFAULT 'Untitled rule',
  trigger_keyword text NOT NULL DEFAULT '',
  reply_message text NOT NULL DEFAULT '',
  target_post_url text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own automation rules"
  ON public.automation_rules
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  caption text NOT NULL DEFAULT '',
  media_url text DEFAULT '',
  media_type text NOT NULL DEFAULT 'image',
  platforms text[] NOT NULL DEFAULT '{instagram}',
  scheduled_for timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own scheduled posts"
  ON public.scheduled_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
