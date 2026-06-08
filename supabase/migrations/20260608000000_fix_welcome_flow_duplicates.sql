-- Migration: Fix Welcome Flow Duplicates and constraints
-- 1. See duplicates (for reference, though this runs as part of migration)
-- SELECT instagram_business_id, COUNT(*) FROM instagram_accounts GROUP BY instagram_business_id HAVING COUNT(*) > 1;

-- 2. Re-link welcome_flow_settings to the surviving (newest) account
UPDATE public.welcome_flow_settings wfs
SET instagram_account_id = survivor.id,
    user_id = survivor.user_id
FROM (
  SELECT DISTINCT ON (instagram_business_id) id, user_id, instagram_business_id
  FROM public.instagram_accounts
  ORDER BY instagram_business_id, updated_at DESC
) survivor
JOIN public.instagram_accounts old_acc ON old_acc.instagram_business_id = survivor.instagram_business_id
  AND old_acc.id != survivor.id
WHERE wfs.instagram_account_id = old_acc.id;

-- 3. Re-link welcome_opener_settings the same way
UPDATE public.welcome_opener_settings wos
SET instagram_account_id = survivor.id,
    user_id = survivor.user_id
FROM (
  SELECT DISTINCT ON (instagram_business_id) id, user_id, instagram_business_id
  FROM public.instagram_accounts
  ORDER BY instagram_business_id, updated_at DESC
) survivor
JOIN public.instagram_accounts old_acc ON old_acc.instagram_business_id = survivor.instagram_business_id
  AND old_acc.id != survivor.id
WHERE wos.instagram_account_id = old_acc.id;

-- 4. Delete older duplicate accounts (keep newest per business ID)
DELETE FROM public.instagram_accounts a
USING public.instagram_accounts b
WHERE a.instagram_business_id = b.instagram_business_id
  AND a.updated_at < b.updated_at;

-- 5. Drop the old composite unique constraint and add a single-column one
ALTER TABLE public.instagram_accounts
  DROP CONSTRAINT IF EXISTS instagram_accounts_user_id_instagram_business_id_key;
ALTER TABLE public.instagram_accounts
  DROP CONSTRAINT IF EXISTS instagram_accounts_instagram_business_id_key;
ALTER TABLE public.instagram_accounts
  DROP CONSTRAINT IF EXISTS unique_instagram_business_id;

ALTER TABLE public.instagram_accounts
  ADD CONSTRAINT instagram_accounts_instagram_business_id_key UNIQUE (instagram_business_id);
