-- Check payouts table schema and constraints
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payouts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check check constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payouts'::regclass
  AND contype = 'c';
