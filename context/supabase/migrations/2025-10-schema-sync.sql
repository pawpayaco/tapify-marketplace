-- Tapify Infrastructure System v2.0 schema sync
-- Ensures required tables/columns/indexes/policies exist per /context specs

BEGIN;

-- Ensure businesses tracking columns exist
ALTER TABLE IF EXISTS businesses
  ADD COLUMN IF NOT EXISTS connected_at timestamptz;

-- Retailers: link back to businesses + creator metadata
ALTER TABLE IF EXISTS retailers
  ADD COLUMN IF NOT EXISTS business_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

-- Orders table alignment with Shopify payload
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS shopify_order_id text,
  ADD COLUMN IF NOT EXISTS shopify_order_number text,
  ADD COLUMN IF NOT EXISTS shop_domain text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS financial_status text,
  ADD COLUMN IF NOT EXISTS fulfillment_status text,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_uid text,
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS business_id uuid,
  ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb,
  ADD COLUMN IF NOT EXISTS retailer_id uuid;

-- UID metadata for attribution
ALTER TABLE IF EXISTS uids
  ADD COLUMN IF NOT EXISTS retailer_id uuid,
  ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_scan_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_scan_ip text,
  ADD COLUMN IF NOT EXISTS last_scan_user_agent text,
  ADD COLUMN IF NOT EXISTS last_scan_location text,
  ADD COLUMN IF NOT EXISTS last_order_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_order_total numeric,
  ADD COLUMN IF NOT EXISTS scan_count integer DEFAULT 0;

-- Scans table enrichment
ALTER TABLE IF EXISTS scans
  ADD COLUMN IF NOT EXISTS retailer_id uuid,
  ADD COLUMN IF NOT EXISTS business_id uuid,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Payout jobs enhancements
ALTER TABLE IF EXISTS payout_jobs
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS total_amount numeric,
  ADD COLUMN IF NOT EXISTS source_uid text,
  ADD COLUMN IF NOT EXISTS transfer_ids jsonb DEFAULT '[]'::jsonb;

-- Payouts logging
ALTER TABLE IF EXISTS payouts
  ADD COLUMN IF NOT EXISTS payout_job_id uuid,
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS sourcer_id uuid,
  ADD COLUMN IF NOT EXISTS total_amount numeric,
  ADD COLUMN IF NOT EXISTS transfer_summary jsonb,
  ADD COLUMN IF NOT EXISTS triggered_by uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Ensure retailer_outreach table exists
CREATE TABLE IF NOT EXISTS retailer_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailers(id) ON DELETE CASCADE,
  campaign text,
  channel text,
  registered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Ensure leaderboards aggregation table supports daily metrics
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period date NOT NULL,
  retailer_id uuid REFERENCES retailers(id) ON DELETE CASCADE,
  scan_count integer DEFAULT 0,
  order_count integer DEFAULT 0,
  revenue_total numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (period, retailer_id)
);

-- Add missing columns to pre-existing leaderboards if table already existed
ALTER TABLE IF EXISTS leaderboards
  ADD COLUMN IF NOT EXISTS period date,
  ADD COLUMN IF NOT EXISTS retailer_id uuid,
  ADD COLUMN IF NOT EXISTS scan_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Foreign key safeguards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_retailer_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_retailer_id_fkey FOREIGN KEY (retailer_id)
      REFERENCES retailers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_vendor_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id)
      REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_business_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_business_id_fkey FOREIGN KEY (business_id)
      REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uids_retailer_id_fkey'
  ) THEN
    ALTER TABLE uids
      ADD CONSTRAINT uids_retailer_id_fkey FOREIGN KEY (retailer_id)
      REFERENCES retailers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'retailers_business_id_fkey'
  ) THEN
    ALTER TABLE retailers
      ADD CONSTRAINT retailers_business_id_fkey FOREIGN KEY (business_id)
      REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payout_jobs_order_id_fkey'
  ) THEN
    ALTER TABLE payout_jobs
      ADD CONSTRAINT payout_jobs_order_id_fkey FOREIGN KEY (order_id)
      REFERENCES orders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payouts_payout_job_id_fkey'
  ) THEN
    ALTER TABLE payouts
      ADD CONSTRAINT payouts_payout_job_id_fkey FOREIGN KEY (payout_job_id)
      REFERENCES payout_jobs(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Helpful indexes for analytics/perf
CREATE INDEX IF NOT EXISTS idx_orders_retailer_processed_at ON orders (retailer_id, processed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_scans_uid_retailer ON scans (uid, retailer_id);
CREATE INDEX IF NOT EXISTS idx_payout_jobs_vendor ON payout_jobs (vendor_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_retailer_period ON leaderboards (retailer_id, period DESC);

-- Increment helper for UID scan count
CREATE OR REPLACE FUNCTION increment_uid_scan_count(p_uid text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE uids
  SET scan_count = COALESCE(scan_count, 0) + 1
  WHERE uid = p_uid;
END;
$$;

-- Helper to check admin status inside policies
CREATE OR REPLACE FUNCTION tapify_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid());
$$;

-- Enable RLS and policies
ALTER TABLE IF EXISTS uids ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_jobs ENABLE ROW LEVEL SECURITY;

-- UIDs policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'uids_select_owner_or_admin'
  ) THEN
    CREATE POLICY uids_select_owner_or_admin ON uids
    FOR SELECT
    USING (
      tapify_is_admin()
      OR claimed_by_user_id = auth.uid()
      OR retailer_id IN (
        SELECT id FROM retailers WHERE created_by_user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'uids_update_admin_only'
  ) THEN
    CREATE POLICY uids_update_admin_only ON uids
    FOR UPDATE
    USING (tapify_is_admin())
    WITH CHECK (tapify_is_admin());
  END IF;
END
$$;

-- Orders policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'orders_select_owner_or_admin'
  ) THEN
    CREATE POLICY orders_select_owner_or_admin ON orders
    FOR SELECT
    USING (
      tapify_is_admin()
      OR retailer_id IN (
        SELECT id FROM retailers WHERE created_by_user_id = auth.uid()
      )
    );
  END IF;
END
$$;

-- Payout jobs policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'payout_jobs_select_owner_or_admin'
  ) THEN
    CREATE POLICY payout_jobs_select_owner_or_admin ON payout_jobs
    FOR SELECT
    USING (
      tapify_is_admin()
      OR retailer_id IN (
        SELECT id FROM retailers WHERE created_by_user_id = auth.uid()
      )
    );
  END IF;
END
$$;

COMMIT;
