-- migrations/2025-10-register-store.sql
-- Add missing retailer columns, unique index on retailer_owners, and create register_store_transaction RPC

ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS express_shipping boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step text;

CREATE UNIQUE INDEX IF NOT EXISTS retailer_owners_retailer_email_uniq
  ON public.retailer_owners (retailer_id, owner_email);

CREATE OR REPLACE FUNCTION public.register_store_transaction(
  p_retailer_id uuid,
  p_owner_name text,
  p_owner_phone text,
  p_owner_email text,
  p_campaign text,
  p_collected_by text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner_id uuid;
  v_outreach_id uuid;
  v_retailer_row public.retailers%ROWTYPE;
BEGIN
  UPDATE public.retailers
  SET converted = true,
      converted_at = now(),
      owner_name = COALESCE(NULLIF(p_owner_name, ''), owner_name),
      phone = COALESCE(NULLIF(p_owner_phone, ''), phone),
      email = COALESCE(NULLIF(p_owner_email, ''), email)
  WHERE id = p_retailer_id
  RETURNING * INTO v_retailer_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Retailer not found: %', p_retailer_id;
  END IF;

  IF COALESCE(p_owner_email, '') <> '' THEN
    INSERT INTO public.retailer_owners
      (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at)
    VALUES
      (p_retailer_id, p_owner_name, p_owner_phone, p_owner_email, p_collected_by, now())
    ON CONFLICT (retailer_id, owner_email)
    DO UPDATE SET
      owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), retailer_owners.owner_name),
      owner_phone = COALESCE(NULLIF(EXCLUDED.owner_phone, ''), retailer_owners.owner_phone),
      collected_at = now()
    RETURNING id INTO v_owner_id;
  ELSE
    INSERT INTO public.retailer_owners
      (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at)
    VALUES
      (p_retailer_id, p_owner_name, p_owner_phone, NULL, p_collected_by, now())
    RETURNING id INTO v_owner_id;
  END IF;

  INSERT INTO public.retailer_outreach
    (retailer_id, campaign, channel, registered, registered_at, notes, created_at)
  VALUES
    (p_retailer_id, p_campaign, 'email', true, now(), COALESCE(p_notes, ''), now())
  RETURNING id INTO v_outreach_id;

  RETURN jsonb_build_object(
    'ok', true,
    'retailer', to_jsonb(v_retailer_row),
    'owner_id', v_owner_id,
    'outreach_id', v_outreach_id
  );
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

