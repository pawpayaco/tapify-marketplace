-- ================================================================
-- RENAME COLD EMAIL COLUMNS TO COLD CALLED
-- ================================================================
-- Created: 2025-10-12
-- Purpose: Rename cold_email_sent to cold_called in retailers table
--          to better reflect that this tracks phone calls, not emails
-- ================================================================

BEGIN;

-- Rename columns in retailers table
ALTER TABLE retailers
  RENAME COLUMN cold_email_sent TO cold_called;

ALTER TABLE retailers
  RENAME COLUMN cold_email_sent_at TO cold_called_at;

-- Update any indexes that reference the old column names
-- (Check if indexes exist first)
DROP INDEX IF EXISTS idx_retailers_cold_email_sent;
CREATE INDEX IF NOT EXISTS idx_retailers_cold_called ON retailers(cold_called);

-- Verification query
SELECT
  'Total retailers' as metric,
  COUNT(*) as count
FROM retailers
UNION ALL
SELECT
  'Retailers called',
  COUNT(*) FILTER (WHERE cold_called = true)
FROM retailers;

COMMIT;

-- If anything looks wrong, run: ROLLBACK;
