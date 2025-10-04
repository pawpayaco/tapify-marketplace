# Primary Keys & Unique Constraints

| table_name          | constraint_name          | constraint_type | columns  |
| ------------------- | ------------------------ | --------------- | -------- |
| admins              | admins_pkey              | PRIMARY KEY     | id       |
| admins              | admins_email_key         | UNIQUE          | email    |
| auto_rotation_rules | auto_rotation_rules_pkey | PRIMARY KEY     | id       |
| bank_accounts       | bank_accounts_pkey       | PRIMARY KEY     | id       |
| businesses          | businesses_pkey          | PRIMARY KEY     | id       |
| displays            | displays_pkey            | PRIMARY KEY     | id       |
| displays            | displays_uid_key         | UNIQUE          | uid      |
| leaderboards        | leaderboards_pkey        | PRIMARY KEY     | id       |
| logs                | logs_pkey                | PRIMARY KEY     | id       |
| offer_tests         | offer_tests_pkey         | PRIMARY KEY     | id       |
| orders              | orders_pkey              | PRIMARY KEY     | id       |
| payout_jobs         | payout_jobs_pkey         | PRIMARY KEY     | id       |
| payouts             | payouts_pkey             | PRIMARY KEY     | id       |
| retailer_accounts   | retailer_accounts_pkey   | PRIMARY KEY     | id       |
| retailer_outreach   | retailer_outreach_pkey   | PRIMARY KEY     | id       |
| retailer_owners     | retailer_owners_pkey     | PRIMARY KEY     | id       |
| retailers           | retailers_pkey           | PRIMARY KEY     | id       |
| retailers           | retailers_place_id_key   | UNIQUE          | place_id |
| scans               | scans_pkey               | PRIMARY KEY     | id       |
| sourcer_accounts    | sourcer_accounts_pkey    | PRIMARY KEY     | id       |
| uids                | uids_pkey                | PRIMARY KEY     | uid      |
| vendor_accounts     | vendor_accounts_pkey     | PRIMARY KEY     | id       |
| vendors             | vendors_pkey             | PRIMARY KEY     | id       |