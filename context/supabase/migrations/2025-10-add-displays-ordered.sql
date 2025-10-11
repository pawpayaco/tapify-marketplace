-- Add displays_ordered tracking to retailers table
-- This tracks how many displays a retailer has ORDERED (not how many UIDs are claimed)
-- When they register, they order 1 display by default
-- When they "Order Another Display", this counter increments

BEGIN;

-- Add displays_ordered column
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS displays_ordered integer DEFAULT 1;

-- Set existing retailers to 1 (they all ordered at least 1 display during registration)
UPDATE retailers
SET displays_ordered = 1
WHERE displays_ordered IS NULL OR displays_ordered = 0;

COMMIT;
