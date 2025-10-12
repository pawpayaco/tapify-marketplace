# Tables & Columns (public schema)

> **⚠️ NOTICE (Updated Oct 11, 2025):**
> This file may be outdated. For the **most accurate and up-to-date schema**:
> - 📄 **Source of Truth:** `full_dump.sql` (complete database export from October 11, 2025)
> - 🚨 **Schema Gaps:** `SCHEMA_GAPS.md` (missing columns and fixes needed)
> - 💳 **Payment Tables:** `../PAYMENT_SYSTEM_COMPLETE.md` (verified schemas with status indicators)

Source: information_schema.columns. This is structure only (no data).

**Last Updated:** 2025-10-06 (Post-consolidation migration - may be missing Oct 11 changes)

## Recent Schema Changes (October 2025)

### ✅ New Columns Added:
- `retailers.recruited_by_sourcer_id` - Links to sourcer who recruited retailer (Phase 2)
- `retailers.created_by_user_id` - Proper FK to auth.users
- `vendors.created_by_user_id` - Proper FK to auth.users

### ⚠️ Deprecated Columns (Not Dropped Yet):
- `retailers.location` - Use `address` instead (always identical)
- `retailers.store_phone` - Use `phone` instead
- `retailers.onboarding_completed` - Use `converted` instead
- `retailers.cold_email_sent` - Moved to `retailer_outreach` table
- `retailers.cold_email_sent_at` - Moved to `retailer_outreach` table

### 🗑️ Tables Dropped:
- `staging_stores` (data migrated)
- `staging_stores_imported_*` (temp import tables)

### 📦 Backup Tables Created:
- `retailers_backup_migration` - Pre-migration backup
- `retailers_archived_demo` - Old test/demo data
- `retailer_owners_backup` - Pre-migration backup

---

| table_name                            | column_name              | data_type                   | is_nullable | column_default     |
| ------------------------------------- | ------------------------ | --------------------------- | ----------- | ------------------ |
| admins                                | id                       | uuid                        | NO          | uuid_generate_v4() |
| admins                                | email                    | text                        | NO          | null               |
| admins                                | created_at               | timestamp without time zone | YES         | now()              |
| auto_rotation_rules                   | id                       | uuid                        | NO          | gen_random_uuid()  |
| auto_rotation_rules                   | retailer_id              | uuid                        | YES         | null               |
| auto_rotation_rules                   | rotate_every_days        | integer                     | YES         | null               |
| auto_rotation_rules                   | next_rotation_date       | date                        | YES         | null               |
| auto_rotation_rules                   | created_at               | timestamp with time zone    | YES         | now()              |
| bank_accounts                         | id                       | uuid                        | NO          | uuid_generate_v4() |
| bank_accounts                         | retailer_id              | uuid                        | YES         | null               |
| bank_accounts                         | plaid_account_id         | text                        | YES         | null               |
| bank_accounts                         | bank_name                | text                        | YES         | null               |
| bank_accounts                         | account_last4            | text                        | YES         | null               |
| bank_accounts                         | status                   | text                        | YES         | 'pending'::text    |
| bank_accounts                         | created_at               | timestamp with time zone    | YES         | now()              |
| businesses                            | id                       | uuid                        | NO          | gen_random_uuid()  |
| businesses                            | name                     | text                        | NO          | null               |
| businesses                            | affiliate_url            | text                        | YES         | null               |
| businesses                            | source                   | text                        | YES         | null               |
| businesses                            | created_at               | timestamp with time zone    | YES         | now()              |
| businesses                            | is_connected             | boolean                     | YES         | false              |
| businesses                            | connected_at             | timestamp with time zone    | YES         | null               |
| displays                              | id                       | uuid                        | NO          | uuid_generate_v4() |
| displays                              | retailer_id              | uuid                        | YES         | null               |
| displays                              | uid                      | text                        | NO          | null               |
| displays                              | location                 | text                        | YES         | null               |
| displays                              | status                   | text                        | YES         | 'active'::text     |
| displays                              | created_at               | timestamp with time zone    | YES         | now()              |
| leaderboards                          | id                       | uuid                        | NO          | gen_random_uuid()  |
| leaderboards                          | period                   | date                        | NO          | null               |
| leaderboards                          | retailer_id              | uuid                        | YES         | null               |
| leaderboards                          | scan_count               | integer                     | YES         | 0                  |
| leaderboards                          | order_count              | integer                     | YES         | 0                  |
| leaderboards                          | revenue_total            | numeric                     | YES         | 0                  |
| leaderboards                          | sourcer_id               | uuid                        | YES         | null               |
| leaderboards                          | total_sourced            | integer                     | YES         | 0                  |
| leaderboards                          | total_revenue            | numeric                     | YES         | 0                  |
| leaderboards                          | updated_at               | timestamp with time zone    | YES         | now()              |
> Sourcer-focused columns remain for historical reporting; daily retailer metrics now live in `period`, `scan_count`, `order_count`, and `revenue_total`.
| logs                                  | id                       | uuid                        | NO          | gen_random_uuid()  |
| logs                                  | user_id                  | text                        | NO          | null               |
| logs                                  | action                   | text                        | NO          | null               |
| logs                                  | metadata                 | jsonb                       | YES         | null               |
| logs                                  | timestamp                | timestamp with time zone    | NO          | null               |
| logs                                  | created_at               | timestamp with time zone    | YES         | now()              |
| offer_tests                           | id                       | uuid                        | NO          | gen_random_uuid()  |
| offer_tests                           | vendor_id                | uuid                        | YES         | null               |
| offer_tests                           | offer_a                  | text                        | YES         | null               |
| offer_tests                           | offer_b                  | text                        | YES         | null               |
| offer_tests                           | start_date               | date                        | YES         | null               |
| offer_tests                           | end_date                 | date                        | YES         | null               |
| offer_tests                           | created_at               | timestamp with time zone    | YES         | now()              |
| orders                                | id                       | uuid                        | NO          | uuid_generate_v4() |
| orders                                | shopify_order_id         | text                        | YES         | null               |
| orders                                | shopify_order_number     | text                        | YES         | null               |
| orders                                | shop_domain              | text                        | YES         | null               |
| orders                                | customer_email           | text                        | YES         | null               |
| orders                                | customer_name            | text                        | YES         | null               |
| orders                                | retailer_id              | uuid                        | YES         | null               |
| orders                                | vendor_id                | uuid                        | YES         | null               |
| orders                                | business_id              | uuid                        | YES         | null               |
| orders                                | currency                 | text                        | YES         | 'USD'::text        |
| orders                                | total                    | numeric                     | YES         | 0                  |
| orders                                | subtotal                 | numeric                     | YES         | 0                  |
| orders                                | tax_total                | numeric                     | YES         | 0                  |
| orders                                | discount_total           | numeric                     | YES         | 0                  |
| orders                                | financial_status         | text                        | YES         | null               |
| orders                                | fulfillment_status       | text                        | YES         | null               |
| orders                                | processed_at             | timestamp with time zone    | YES         | null               |
| orders                                | source_uid               | text                        | YES         | null               |
| orders                                | line_items               | jsonb                       | YES         | '[]'::jsonb        |
| orders                                | raw_payload              | jsonb                       | YES         | null               |
| orders                                | created_at               | timestamp with time zone    | YES         | now()              |
> Legacy columns (`product_name`, `amount`, `commission`, `status`) remain for backward compatibility but are being deprecated in v2.0 flows.
| payout_jobs                           | id                       | uuid                        | NO          | gen_random_uuid()  |
| payout_jobs                           | vendor_id                | uuid                        | YES         | null               |
| payout_jobs                           | retailer_id              | uuid                        | YES         | null               |
| payout_jobs                           | sourcer_id               | uuid                        | YES         | null               |
| payout_jobs                           | order_id                 | uuid                        | YES         | null               |
| payout_jobs                           | total_amount             | numeric                     | YES         | 0                  |
| payout_jobs                           | vendor_cut               | numeric                     | YES         | 0                  |
| payout_jobs                           | retailer_cut             | numeric                     | YES         | 0                  |
| payout_jobs                           | sourcer_cut              | numeric                     | YES         | 0                  |
| payout_jobs                           | tapify_cut               | numeric                     | YES         | 0                  |
| payout_jobs                           | status                   | text                        | YES         | 'pending'::text    |
| payout_jobs                           | date_paid                | timestamp with time zone    | YES         | null               |
| payout_jobs                           | plaid_token              | text                        | YES         | null               |
| payout_jobs                           | source_uid               | text                        | YES         | null               |
| payout_jobs                           | transfer_ids             | jsonb                       | YES         | '[]'::jsonb        |
| payout_jobs                           | created_at               | timestamp with time zone    | YES         | now()              |
| payouts                               | id                       | uuid                        | NO          | uuid_generate_v4() |
| payouts                               | retailer_id              | uuid                        | YES         | null               |
| payouts                               | payout_job_id            | uuid                        | YES         | null               |
| payouts                               | vendor_id                | uuid                        | YES         | null               |
| payouts                               | sourcer_id               | uuid                        | YES         | null               |
| payouts                               | amount                   | numeric                     | YES         | null               |
| payouts                               | total_amount             | numeric                     | YES         | null               |
| payouts                               | status                   | text                        | YES         | 'sent'::text       |
| payouts                               | transfer_summary         | jsonb                       | YES         | null               |
| payouts                               | triggered_by             | uuid                        | YES         | null               |
| payouts                               | payout_date              | timestamp with time zone    | YES         | now()              |
| payouts                               | created_at               | timestamp with time zone    | YES         | now()              |
> Legacy payout columns (`amount`, `payout_date`) remain for historical data; `total_amount`, `transfer_summary`, and `triggered_by` drive v2.0 reconciliation.
| retailer_accounts                     | id                       | uuid                        | NO          | gen_random_uuid()  |
| retailer_accounts                     | retailer_id              | uuid                        | YES         | null               |
| retailer_accounts                     | plaid_access_token       | text                        | YES         | null               |
| retailer_accounts                     | dwolla_customer_id       | text                        | YES         | null               |
| retailer_accounts                     | created_at               | timestamp with time zone    | YES         | now()              |
| retailer_accounts                     | dwolla_funding_source_id | text                        | YES         | null               |
| retailer_outreach                     | id                       | uuid                        | NO          | gen_random_uuid()  |
| retailer_outreach                     | retailer_id              | uuid                        | NO          | null               |
| retailer_outreach                     | campaign                 | text                        | YES         | null               |
| retailer_outreach                     | channel                  | text                        | YES         | null               |
| retailer_outreach                     | email_sent               | boolean                     | YES         | false              |
| retailer_outreach                     | email_sent_at            | timestamp with time zone    | YES         | null               |
| retailer_outreach                     | contacted                | boolean                     | YES         | false              |
| retailer_outreach                     | contacted_at             | timestamp with time zone    | YES         | null               |
| retailer_outreach                     | registered               | boolean                     | YES         | false              |
| retailer_outreach                     | registered_at            | timestamp with time zone    | YES         | null               |
| retailer_outreach                     | notes                    | text                        | YES         | null               |
| retailer_outreach                     | created_at               | timestamp with time zone    | YES         | now()              |
| retailer_owners                       | id                       | uuid                        | NO          | gen_random_uuid()  |
| retailer_owners                       | retailer_id              | uuid                        | NO          | null               |
| retailer_owners                       | owner_name               | text                        | YES         | null               |
| retailer_owners                       | owner_phone              | text                        | YES         | null               |
| retailer_owners                       | owner_email              | text                        | YES         | null               |
| retailer_owners                       | collected_by             | text                        | YES         | null               |
| retailer_owners                       | collected_at             | timestamp with time zone    | YES         | now()              |
| retailer_owners                       | notes                    | text                        | YES         | null               |
| retailers                             | id                       | uuid                        | NO          | gen_random_uuid()  |
| retailers                             | name                     | text                        | NO          | null               |
| retailers                             | linked_vendor_id         | uuid                        | YES         | null               |
| retailers                             | business_id              | uuid                        | YES         | null               |
| retailers                             | location                 | text                        | YES         | null               |
| retailers                             | created_at               | timestamp with time zone    | YES         | now()              |
| retailers                             | place_id                 | text                        | YES         | null               |
| retailers                             | address                  | text                        | YES         | null               |
| retailers                             | lat                      | numeric                     | YES         | null               |
| retailers                             | lng                      | numeric                     | YES         | null               |
| retailers                             | store_phone              | text                        | YES         | null               |
| retailers                             | store_website            | text                        | YES         | null               |
| retailers                             | source                   | text                        | YES         | null               |
| retailers                             | cold_email_sent          | boolean                     | YES         | false              |
| retailers                             | cold_email_sent_at       | timestamp with time zone    | YES         | null               |
| retailers                             | converted                | boolean                     | YES         | false              |
| retailers                             | converted_at             | timestamp with time zone    | YES         | null               |
| retailers                             | outreach_notes           | text                        | YES         | null               |
| retailers                             | email                    | text                        | YES         | null               |
| retailers                             | owner_name               | text                        | YES         | null               |
| retailers                             | manager_name             | text                        | YES         | null               |
| retailers                             | phone                    | text                        | YES         | null               |
| retailers                             | express_shipping         | boolean                     | YES         | false              |
| retailers                             | onboarding_completed     | boolean                     | YES         | false              |
| retailers                             | onboarding_step          | text                        | YES         | null               |
| retailers                             | created_by_user_id       | uuid                        | YES         | null               |
| retailers                             | recruited_by_sourcer_id  | uuid                        | YES         | null               |
| scans                                 | id                       | uuid                        | NO          | gen_random_uuid()  |
| scans                                 | uid                      | text                        | YES         | null               |
| scans                                 | timestamp                | timestamp with time zone    | YES         | now()              |
| scans                                 | location                 | text                        | YES         | null               |
| scans                                 | clicked                  | boolean                     | YES         | false              |
| scans                                 | converted                | boolean                     | YES         | false              |
| scans                                 | revenue                  | numeric                     | YES         | 0                  |
| scans                                 | retailer_id              | uuid                        | YES         | null               |
| scans                                 | business_id              | uuid                        | YES         | null               |
| scans                                 | ip_address               | text                        | YES         | null               |
| scans                                 | user_agent               | text                        | YES         | null               |
| scans                                 | metadata                 | jsonb                       | YES         | null               |
| sourcer_accounts                      | id                       | uuid                        | NO          | gen_random_uuid()  |
| sourcer_accounts                      | name                     | text                        | YES         | null               |
| sourcer_accounts                      | email                    | text                        | YES         | null               |
| sourcer_accounts                      | plaid_access_token       | text                        | YES         | null               |
| sourcer_accounts                      | dwolla_customer_id       | text                        | YES         | null               |
| sourcer_accounts                      | created_at               | timestamp with time zone    | YES         | now()              |
| sourcer_accounts                      | dwolla_funding_source_id | text                        | YES         | null               |
| staging_stores                        | place_id                 | text                        | YES         | null               |
| staging_stores                        | name                     | text                        | YES         | null               |
| staging_stores                        | address                  | text                        | YES         | null               |
| staging_stores                        | lat                      | numeric                     | YES         | null               |
| staging_stores                        | lng                      | numeric                     | YES         | null               |
| staging_stores                        | website                  | text                        | YES         | null               |
| staging_stores                        | formatted_address        | text                        | YES         | null               |
| staging_stores                        | formatted_phone_number   | text                        | YES         | null               |
| staging_stores                        | source                   | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | place_id                 | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | name                     | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | address                  | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | lat                      | numeric                     | YES         | null               |
| staging_stores_imported_20251002_1656 | lng                      | numeric                     | YES         | null               |
| staging_stores_imported_20251002_1656 | website                  | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | formatted_address        | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | formatted_phone_number   | text                        | YES         | null               |
| staging_stores_imported_20251002_1656 | source                   | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | place_id                 | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | name                     | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | address                  | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | lat                      | numeric                     | YES         | null               |
| staging_stores_imported_20251002_1658 | lng                      | numeric                     | YES         | null               |
| staging_stores_imported_20251002_1658 | website                  | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | formatted_address        | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | formatted_phone_number   | text                        | YES         | null               |
| staging_stores_imported_20251002_1658 | source                   | text                        | YES         | null               |
| uids                                  | uid                      | text                        | NO          | null               |
| uids                                  | business_id              | uuid                        | YES         | null               |
| uids                                  | retailer_id              | uuid                        | YES         | null               |
| uids                                  | affiliate_url            | text                        | YES         | null               |
| uids                                  | registered_at            | timestamp with time zone    | YES         | now()              |
| uids                                  | is_connected             | boolean                     | YES         | false              |
| uids                                  | is_claimed               | boolean                     | YES         | false              |
| uids                                  | claimed_at               | timestamp with time zone    | YES         | null               |
| uids                                  | claimed_by_user_id       | uuid                        | YES         | null               |
| uids                                  | last_scan_at             | timestamp with time zone    | YES         | null               |
| uids                                  | last_scan_ip             | text                        | YES         | null               |
| uids                                  | last_scan_user_agent     | text                        | YES         | null               |
| uids                                  | last_scan_location       | text                        | YES         | null               |
| uids                                  | last_order_at            | timestamp with time zone    | YES         | null               |
| uids                                  | last_order_total         | numeric                     | YES         | null               |
| uids                                  | scan_count               | integer                     | YES         | 0                  |
| v_uid_redirect                        | uid                      | text                        | YES         | null               |
| v_uid_redirect                        | affiliate_url            | text                        | YES         | null               |
| v_uid_redirect                        | is_connected             | boolean                     | YES         | null               |
| vendor_accounts                       | id                       | uuid                        | NO          | gen_random_uuid()  |
| vendor_accounts                       | vendor_id                | uuid                        | YES         | null               |
| vendor_accounts                       | plaid_access_token       | text                        | YES         | null               |
| vendor_accounts                       | dwolla_customer_id       | text                        | YES         | null               |
| vendor_accounts                       | created_at               | timestamp with time zone    | YES         | now()              |
| vendor_accounts                       | dwolla_funding_source_id | text                        | YES         | null               |
| vendors                               | id                       | uuid                        | NO          | gen_random_uuid()  |
| vendors                               | name                     | text                        | NO          | null               |
| vendors                               | email                    | text                        | NO          | null               |
| vendors                               | store_type               | text                        | YES         | null               |
| vendors                               | website_url              | text                        | YES         | null               |
| vendors                               | platform_url             | text                        | YES         | null               |
| vendors                               | fulfillment_speed        | text                        | YES         | null               |
| vendors                               | inventory_cap            | integer                     | YES         | null               |
| vendors                               | collection_name          | text                        | YES         | null               |
| vendors                               | product_photo_url        | text                        | YES         | null               |
| vendors                               | onboarded_by             | uuid                        | YES         | null               |
| vendors                               | created_by_user_id       | uuid                        | YES         | null               |
| vendors                               | created_at               | timestamp with time zone    | YES         | now()              |
