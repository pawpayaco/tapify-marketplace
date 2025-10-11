-- Check recent payouts
SELECT 
  id,
  retailer_id,
  vendor_id,
  total_amount,
  status,
  transfer_summary,
  triggered_by,
  created_at
FROM payouts
ORDER BY created_at DESC
LIMIT 5;

-- Check payout jobs
SELECT 
  id,
  order_id,
  retailer_id,
  vendor_id,
  total_amount,
  retailer_cut,
  vendor_cut,
  sourcer_cut,
  status,
  date_paid,
  transfer_ids
FROM payout_jobs
ORDER BY created_at DESC
LIMIT 5;
