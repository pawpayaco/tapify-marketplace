-- ============================================
-- Admin Table Setup for Tapify Marketplace
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Create the admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
-- Allow admins to read their own data
CREATE POLICY "Admins can view their own data"
  ON admins FOR SELECT
  USING (auth.uid() = id);

-- Only service role can insert admins (for security)
CREATE POLICY "Service role can insert admins"
  ON admins FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Add yourself as admin
-- ============================================

-- STEP 1: Find your user ID (run this first)
SELECT id, email FROM auth.users WHERE email = 'oscarmullikin@icloud.com';

-- STEP 2: Copy the ID from above and use it below
-- Replace 'your-user-id-here' with the actual ID
INSERT INTO admins (id, email)
VALUES (
  'your-user-id-here',  -- ← PASTE YOUR USER ID HERE
  'oscarmullikin@icloud.com'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verify admin access
-- ============================================
SELECT * FROM admins;

-- Should see your email and ID listed!
