-- Check if retailers table has data
-- Run this in Supabase SQL Editor to see what you have

-- 1. Total count
SELECT COUNT(*) as total_retailers FROM public.retailers;

-- 2. Sample of data
SELECT id, name, address, location, email, phone, source, created_at 
FROM public.retailers 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Search for stores with 'pet' in the name (test autocomplete query)
SELECT id, name, address, location, email 
FROM public.retailers
WHERE (name ILIKE '%pet%' OR address ILIKE '%pet%' OR location ILIKE '%pet%' OR email ILIKE '%pet%')
LIMIT 20;

-- 4. Check if you have staging_stores data to import
SELECT COUNT(*) as staging_count FROM staging_stores;

-- 5. Sample from staging_stores (if exists)
SELECT name, formatted_address, formatted_phone_number, source 
FROM staging_stores 
LIMIT 5;

