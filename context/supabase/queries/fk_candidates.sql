SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%\_id' ESCAPE '\'
  AND data_type IN ('uuid','integer','bigint')
ORDER BY table_name, column_name;
