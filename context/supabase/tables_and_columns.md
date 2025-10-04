# Tables & Columns (public schema)

Source: information_schema.columns. This is structure only (no data).

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
| displays                              | id                       | uuid                        | NO          | uuid_generate_v4() |
| displays                              | retailer_id              | uuid                        | YES         | null               |
| displays                              | uid                      | text                        | NO          | null               |
| displays                              | location                 | text                        | YES         | null               |
| displays                              | status                   | text                        | YES         | 'active'::text     |
| displays                              | created_at               | timestamp with time zone    | YES         | now()              |
| leaderboards                          | id                       | uuid                        | NO          | gen_random_uuid()  |
| leaderboards                          | sourcer_id               | uuid                        | YES         | null               |
| leaderboards                          | total_sourced            | integer                     | YES         | 0                  |
| leaderboards                          | total_revenue            | numeric                     | YES         | 0                  |
| leaderboards                          | updated_at               | timestamp with time zone    | YES         | now()              |
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
| orders                                | retailer_id              | uuid                        | YES         | null               |
| orders                                | product_name             | text                        | NO          | null               |
| orders                                | customer_name            | text                        | YES         | null               |
| orders                                | amount                   | numeric                     | NO          | null               |
| orders                                | commission               | numeric                     | NO          | null               |
| orders                                | status                   | text                        | YES         | 'pending'::text    |
| orders                                | created_at               | timestamp with time zone    | YES         | now()              |
| payout_jobs                           | id                       | uuid                        | NO          | gen_random_uuid()  |
| payout_jobs                           | vendor_id                | uuid                        | YES         | null               |
| payout_jobs                           | retailer_id              | uuid                        | YES         | null               |
| payout_jobs                           | sourcer_id               | uuid                        | YES         | null               |
| payout_jobs                           | total_amount             | numeric                     | YES         | 0                  |
| payout_jobs                           | vendor_cut               | numeric                     | YES         | 0                  |
| payout_jobs                           | retailer_cut             | numeric                     | YES         | 0                  |
| payout_jobs                           | sourcer_cut              | numeric                     | YES         | 0                  |
| payout_jobs                           | tapify_cut               | numeric                     | YES         | 0                  |
| payout_jobs                           | status                   | text                        | YES         | 'pending'::text    |
| payout_jobs                           | date_paid                | timestamp with time zone    | YES         | null               |
| payout_jobs                           | plaid_token              | text                        | YES         | null               |
| payout_jobs                           | created_at               | timestamp with time zone    | YES         | now()              |
| payouts                               | id                       | uuid                        | NO          | uuid_generate_v4() |
| payouts                               | retailer_id              | uuid                        | YES         | null               |
| payouts                               | amount                   | numeric                     | NO          | null               |
| payouts                               | status                   | text                        | YES         | 'pending'::text    |
| payouts                               | payout_date              | timestamp with time zone    | YES         | now()              |
| payouts                               | created_at               | timestamp with time zone    | YES         | now()              |
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
| scans                                 | id                       | uuid                        | NO          | gen_random_uuid()  |
| scans                                 | uid                      | text                        | YES         | null               |
| scans                                 | timestamp                | timestamp with time zone    | YES         | now()              |
| scans                                 | location                 | text                        | YES         | null               |
| scans                                 | clicked                  | boolean                     | YES         | false              |
| scans                                 | converted                | boolean                     | YES         | false              |
| scans                                 | revenue                  | numeric                     | YES         | 0                  |
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
| uids                                  | affiliate_url            | text                        | YES         | null               |
| uids                                  | registered_at            | timestamp with time zone    | YES         | now()              |
| uids                                  | is_connected             | boolean                     | YES         | false              |
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
| vendors                               | created_at               | timestamp with time zone    | YES         | now()              |