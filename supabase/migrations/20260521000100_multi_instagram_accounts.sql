-- Allow multiple Instagram accounts per user
ALTER TABLE public.instagram_accounts
  DROP CONSTRAINT IF EXISTS instagram_accounts_user_id_key;

-- Remove duplicates before adding unique constraint
WITH ranked AS (
  SELECT
    id,
    instagram_business_id,
    ROW_NUMBER() OVER (
      PARTITION BY instagram_business_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
    ) AS rn
  FROM public.instagram_accounts
)
DELETE FROM public.instagram_accounts
USING ranked
WHERE public.instagram_accounts.id = ranked.id
  AND ranked.rn > 1;

ALTER TABLE public.instagram_accounts
  ADD CONSTRAINT instagram_accounts_instagram_business_id_key UNIQUE (instagram_business_id);

CREATE INDEX IF NOT EXISTS instagram_accounts_user_id_idx
  ON public.instagram_accounts (user_id);

-- Link automation rules to a specific Instagram account (optional)
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS instagram_account_id uuid
  REFERENCES public.instagram_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS automation_rules_instagram_account_id_idx
  ON public.automation_rules (instagram_account_id);
