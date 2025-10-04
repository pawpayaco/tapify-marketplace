# Foreign-Key Candidates (by naming convention)

| table_name          | column_name      | data_type |
| ------------------- | ---------------- | --------- |
| auto_rotation_rules | retailer_id      | uuid      |
| bank_accounts       | retailer_id      | uuid      |
| displays            | retailer_id      | uuid      |
| leaderboards        | sourcer_id       | uuid      |
| offer_tests         | vendor_id        | uuid      |
| orders              | retailer_id      | uuid      |
| payout_jobs         | retailer_id      | uuid      |
| payout_jobs         | sourcer_id       | uuid      |
| payout_jobs         | vendor_id        | uuid      |
| payouts             | retailer_id      | uuid      |
| retailer_accounts   | retailer_id      | uuid      |
| retailer_outreach   | retailer_id      | uuid      |
| retailer_owners     | retailer_id      | uuid      |
| retailers           | linked_vendor_id | uuid      |
| uids                | business_id      | uuid      |
| vendor_accounts     | vendor_id        | uuid      |