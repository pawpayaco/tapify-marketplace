SELECT
  relname AS table_name,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
ORDER BY relname;
