-- rollback: remove columns added (only if safe in dev)
-- WARNING: This will delete data in these columns. Only run in development!

ALTER TABLE public.retailers
  DROP COLUMN IF EXISTS owner_name,
  DROP COLUMN IF EXISTS manager_name,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS express_shipping,
  DROP COLUMN IF EXISTS onboarding_completed,
  DROP COLUMN IF EXISTS onboarding_step;

DROP INDEX IF EXISTS retailer_owners_retailer_email_uniq;
DROP FUNCTION IF EXISTS public.register_store_transaction(uuid,text,text,text,text,text,text);

