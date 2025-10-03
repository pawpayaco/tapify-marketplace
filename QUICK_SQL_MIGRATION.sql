-- ================================================================
-- QUICK MIGRATION: Stores / Outreach Admin Flow
-- ================================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Click "Run" to execute all statements
-- ================================================================

-- 1. Add owner_email column to retailer_owners if missing
ALTER TABLE IF EXISTS public.retailer_owners ADD COLUMN IF NOT EXISTS owner_email text;

-- 2. Create unique index for ON CONFLICT upsert on (retailer_id, owner_email)
CREATE UNIQUE INDEX IF NOT EXISTS ux_retailer_owner_by_retailer_email ON public.retailer_owners (retailer_id, owner_email);

-- 3. Ensure place_id column exists on retailers
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS place_id text;

-- 4. Create unique index on place_id
CREATE UNIQUE INDEX IF NOT EXISTS ux_retailers_place_id ON public.retailers (place_id);

-- 5. Add outreach tracking columns to retailers if missing
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS cold_email_sent boolean DEFAULT false;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS cold_email_sent_at timestamptz;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS converted boolean DEFAULT false;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS store_phone text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS store_website text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS address text;

-- 6. Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_retailers_source ON public.retailers (source);
CREATE INDEX IF NOT EXISTS idx_retailers_converted ON public.retailers (converted);
CREATE INDEX IF NOT EXISTS idx_retailers_cold_email_sent ON public.retailers (cold_email_sent);

-- 7. Create retailer_outreach table if not exists
CREATE TABLE IF NOT EXISTS public.retailer_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE CASCADE,
  campaign text,
  channel text DEFAULT 'email',
  registered boolean DEFAULT false,
  registered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Create index on retailer_outreach for fast lookups
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_retailer_id ON public.retailer_outreach (retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_campaign ON public.retailer_outreach (campaign);

-- 9. Ensure retailer_owners has all required columns
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS owner_phone text;
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS collected_by text;
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS collected_at timestamptz DEFAULT now();

-- ================================================================
-- DONE! ✅
-- ================================================================
-- Next steps:
-- 1. Add DATABASE_URL to .env.local (see STORES_OUTREACH_SETUP.md)
-- 2. Restart dev server: npm run dev
-- 3. Navigate to http://localhost:3000/admin → Stores tab
-- ================================================================

