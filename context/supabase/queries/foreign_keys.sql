SELECT
  tc.table_name   AS table_from,
  kcu.column_name AS column_from,
  ccu.table_name  AS table_to,
  ccu.column_name AS column_to,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY table_from, column_from;
