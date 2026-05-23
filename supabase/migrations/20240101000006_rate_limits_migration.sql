-- Create rate_limits table
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Add index for performance on rate limit checks
CREATE INDEX idx_rate_limits_user_endpoint_time ON public.rate_limits (user_id, endpoint, created_at DESC);

-- Explicit deny-all for client access; only service-role accesses this table
CREATE POLICY "No client access" ON public.rate_limits
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
