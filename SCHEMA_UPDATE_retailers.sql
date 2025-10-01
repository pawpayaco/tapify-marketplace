-- ============================================
-- RETAILERS TABLE SCHEMA UPDATE
-- ============================================
-- Run this in your Supabase SQL Editor to extend the retailers table
-- to support all fields collected in the registration form

-- Add new columns to retailers table
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS manager_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS express_shipping BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'registered';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_retailers_email ON retailers(email);

-- Optional: Add a check constraint to validate email format
-- ALTER TABLE retailers
--   ADD CONSTRAINT retailers_email_check 
--   CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Update the RLS policy if needed (already has dev_allow_all in your schema)

-- NOTES:
-- - name column already exists (stores storeName)
-- - location column already exists (stores storeAddress)
-- - The form now captures: owner_name, manager_name, email, phone, express_shipping
-- - onboarding_completed and onboarding_step help track where they are in the funnel

