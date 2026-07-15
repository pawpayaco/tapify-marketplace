-- Tapify schema — regenerated from SUPABASE_SCHEMA_OVERVIEW.csv (2025-10-06)
-- + defaults/constraints recovered from db_cluster-26-09-2025 backup
create extension if not exists pgcrypto;

create table if not exists public."businesses" (
  "id" uuid not null default gen_random_uuid(),
  "name" text,
  "affiliate_url" text,
  "source" text,
  "created_at" timestamp with time zone default now(),
  "is_connected" boolean default false,
  "connected_at" timestamp with time zone,
  constraint businesses_pkey primary key ("id")
);

create table if not exists public."sourcer_accounts" (
  "id" uuid not null default gen_random_uuid(),
  "name" text,
  "email" text,
  "plaid_access_token" text,
  "dwolla_customer_id" text,
  "created_at" timestamp with time zone default now(),
  "dwolla_funding_source_id" text,
  constraint sourcer_accounts_pkey primary key ("id")
);

create table if not exists public."vendors" (
  "id" uuid not null default gen_random_uuid(),
  "name" text,
  "email" text,
  "store_type" text,
  "website_url" text,
  "platform_url" text,
  "fulfillment_speed" text,
  "inventory_cap" integer,
  "collection_name" text,
  "product_photo_url" text,
  "onboarded_by" uuid,
  "created_at" timestamp with time zone default now(),
  "created_by_user_id" uuid,
  constraint vendors_pkey primary key ("id")
);

create table if not exists public."retailers" (
  "id" uuid not null default gen_random_uuid(),
  "name" text,
  "linked_vendor_id" uuid,
  "location" text,
  "created_at" timestamp with time zone default now(),
  "place_id" text,
  "address" text,
  "lat" numeric,
  "lng" numeric,
  "store_phone" text,
  "store_website" text,
  "source" text,
  "cold_email_sent" boolean default false,
  "cold_email_sent_at" timestamp with time zone,
  "converted" boolean default false,
  "converted_at" timestamp with time zone,
  "outreach_notes" text,
  "email" text,
  "owner_name" text,
  "manager_name" text,
  "phone" text,
  "express_shipping" boolean default false,
  "onboarding_completed" boolean default false,
  "onboarding_step" text,
  "business_id" uuid,
  "created_by_user_id" uuid,
  "recruited_by_sourcer_id" uuid,
  "priority_display_active" boolean default false,
  constraint retailers_pkey primary key ("id")
);

create table if not exists public."uids" (
  "uid" text not null,
  "business_id" uuid,
  "affiliate_url" text,
  "registered_at" timestamp with time zone default now(),
  "is_connected" boolean default false,
  "retailer_id" uuid,
  "is_claimed" boolean default false,
  "claimed_at" timestamp with time zone,
  "claimed_by_user_id" uuid,
  "last_scan_at" timestamp with time zone,
  "last_scan_ip" text,
  "last_scan_user_agent" text,
  "last_scan_location" text,
  "last_order_at" timestamp with time zone,
  "last_order_total" numeric,
  "scan_count" integer default 0,
  constraint uids_pkey primary key ("uid")
);

create table if not exists public."displays" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "uid" text,
  "location" text,
  "status" text,
  "created_at" timestamp with time zone default now(),
  constraint displays_pkey primary key ("id")
);

create table if not exists public."scans" (
  "id" uuid not null default gen_random_uuid(),
  "uid" text,
  "timestamp" timestamp with time zone default now(),
  "location" text,
  "clicked" boolean default false,
  "converted" boolean default false,
  "revenue" numeric,
  "retailer_id" uuid,
  "business_id" uuid,
  "ip_address" text,
  "user_agent" text,
  "metadata" jsonb,
  constraint scans_pkey primary key ("id")
);

create table if not exists public."orders" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "product_name" text,
  "customer_name" text,
  "amount" numeric,
  "commission" numeric,
  "status" text,
  "created_at" timestamp with time zone default now(),
  "shopify_order_id" text,
  "shopify_order_number" text,
  "shop_domain" text,
  "customer_email" text,
  "currency" text default 'USD',
  "total" numeric,
  "subtotal" numeric,
  "tax_total" numeric,
  "discount_total" numeric,
  "financial_status" text,
  "fulfillment_status" text,
  "processed_at" timestamp with time zone,
  "source_uid" text,
  "vendor_id" uuid,
  "business_id" uuid,
  "line_items" jsonb default '[]'::jsonb,
  "raw_payload" jsonb,
  "is_priority_display" boolean default false,
  constraint orders_pkey primary key ("id")
);

create table if not exists public."payout_jobs" (
  "id" uuid not null default gen_random_uuid(),
  "vendor_id" uuid,
  "retailer_id" uuid,
  "sourcer_id" uuid,
  "total_amount" numeric,
  "vendor_cut" numeric,
  "retailer_cut" numeric,
  "sourcer_cut" numeric,
  "tapify_cut" numeric,
  "status" text,
  "date_paid" timestamp with time zone,
  "plaid_token" text,
  "created_at" timestamp with time zone default now(),
  "order_id" uuid,
  "source_uid" text,
  "transfer_ids" jsonb,
  constraint payout_jobs_pkey primary key ("id")
);

create table if not exists public."payouts" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "amount" numeric,
  "status" text,
  "payout_date" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "payout_job_id" uuid,
  "vendor_id" uuid,
  "sourcer_id" uuid,
  "total_amount" numeric,
  "transfer_summary" jsonb,
  "triggered_by" uuid,
  constraint payouts_pkey primary key ("id")
);

create table if not exists public."admins" (
  "id" uuid not null default gen_random_uuid(),
  "email" text,
  "created_at" timestamp without time zone default now(),
  constraint admins_pkey primary key ("id")
);

create table if not exists public."managers" (
  "id" uuid not null default gen_random_uuid(),
  "phone" text,
  "reward_sent" boolean,
  "reward_type" text,
  "reward_date" timestamp with time zone,
  "total_referrals" integer,
  "successful_referrals" integer,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone,
  constraint managers_pkey primary key ("id")
);

create table if not exists public."logs" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" text,
  "action" text,
  "metadata" jsonb,
  "timestamp" timestamp with time zone default now(),
  "created_at" timestamp with time zone default now(),
  constraint logs_pkey primary key ("id")
);

create table if not exists public."bank_accounts" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "plaid_account_id" text,
  "bank_name" text,
  "account_last4" text,
  "status" text,
  "created_at" timestamp with time zone default now(),
  constraint bank_accounts_pkey primary key ("id")
);

create table if not exists public."vendor_accounts" (
  "id" uuid not null default gen_random_uuid(),
  "vendor_id" uuid,
  "plaid_access_token" text,
  "dwolla_customer_id" text,
  "created_at" timestamp with time zone default now(),
  "dwolla_funding_source_id" text,
  constraint vendor_accounts_pkey primary key ("id")
);

create table if not exists public."retailer_accounts" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "plaid_access_token" text,
  "dwolla_customer_id" text,
  "created_at" timestamp with time zone default now(),
  "dwolla_funding_source_id" text,
  constraint retailer_accounts_pkey primary key ("id")
);

create table if not exists public."retailer_outreach" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "campaign" text,
  "channel" text,
  "email_sent" boolean,
  "email_sent_at" timestamp with time zone,
  "contacted" boolean,
  "contacted_at" timestamp with time zone,
  "registered" boolean,
  "registered_at" timestamp with time zone default now(),
  "notes" text,
  "created_at" timestamp with time zone default now(),
  constraint retailer_outreach_pkey primary key ("id")
);

create table if not exists public."retailer_owners" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "owner_name" text,
  "owner_phone" text,
  "owner_email" text,
  "collected_by" text,
  "collected_at" timestamp with time zone,
  "notes" text,
  constraint retailer_owners_pkey primary key ("id")
);

create table if not exists public."leaderboards" (
  "id" uuid not null default gen_random_uuid(),
  "sourcer_id" uuid,
  "total_sourced" integer,
  "total_revenue" numeric,
  "updated_at" timestamp with time zone,
  "period" date,
  "retailer_id" uuid,
  "scan_count" integer default 0,
  "order_count" integer,
  "revenue_total" numeric,
  constraint leaderboards_pkey primary key ("id")
);

create table if not exists public."offer_tests" (
  "id" uuid not null default gen_random_uuid(),
  "vendor_id" uuid,
  "offer_a" text,
  "offer_b" text,
  "start_date" date,
  "end_date" date,
  "created_at" timestamp with time zone default now(),
  constraint offer_tests_pkey primary key ("id")
);

create table if not exists public."auto_rotation_rules" (
  "id" uuid not null default gen_random_uuid(),
  "retailer_id" uuid,
  "rotate_every_days" integer,
  "next_rotation_date" date,
  "created_at" timestamp with time zone default now(),
  constraint auto_rotation_rules_pkey primary key ("id")
);

-- foreign keys
alter table public."vendors" add constraint vendors_onboarded_by_fkey foreign key ("onboarded_by") references public."sourcer_accounts"("id") on delete SET NULL;
alter table public."retailers" add constraint retailers_linked_vendor_id_fkey foreign key ("linked_vendor_id") references public."vendors"("id") on delete SET NULL;
alter table public."retailers" add constraint retailers_business_id_fkey foreign key ("business_id") references public."businesses"("id") on delete SET NULL;
alter table public."retailers" add constraint retailers_recruited_by_sourcer_id_fkey foreign key ("recruited_by_sourcer_id") references public."sourcer_accounts"("id") on delete SET NULL;
alter table public."uids" add constraint uids_business_id_fkey foreign key ("business_id") references public."businesses"("id") on delete SET NULL;
alter table public."uids" add constraint uids_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."displays" add constraint displays_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."scans" add constraint scans_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."scans" add constraint scans_business_id_fkey foreign key ("business_id") references public."businesses"("id") on delete SET NULL;
alter table public."orders" add constraint orders_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."orders" add constraint orders_vendor_id_fkey foreign key ("vendor_id") references public."vendors"("id") on delete SET NULL;
alter table public."orders" add constraint orders_business_id_fkey foreign key ("business_id") references public."businesses"("id") on delete SET NULL;
alter table public."payout_jobs" add constraint payout_jobs_vendor_id_fkey foreign key ("vendor_id") references public."vendors"("id") on delete SET NULL;
alter table public."payout_jobs" add constraint payout_jobs_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."payout_jobs" add constraint payout_jobs_sourcer_id_fkey foreign key ("sourcer_id") references public."sourcer_accounts"("id") on delete SET NULL;
alter table public."payout_jobs" add constraint payout_jobs_order_id_fkey foreign key ("order_id") references public."orders"("id") on delete SET NULL;
alter table public."payouts" add constraint payouts_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."payouts" add constraint payouts_payout_job_id_fkey foreign key ("payout_job_id") references public."payout_jobs"("id") on delete SET NULL;
alter table public."payouts" add constraint payouts_vendor_id_fkey foreign key ("vendor_id") references public."vendors"("id") on delete SET NULL;
alter table public."payouts" add constraint payouts_sourcer_id_fkey foreign key ("sourcer_id") references public."sourcer_accounts"("id") on delete SET NULL;
alter table public."bank_accounts" add constraint bank_accounts_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."vendor_accounts" add constraint vendor_accounts_vendor_id_fkey foreign key ("vendor_id") references public."vendors"("id") on delete SET NULL;
alter table public."retailer_accounts" add constraint retailer_accounts_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."retailer_outreach" add constraint retailer_outreach_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."retailer_owners" add constraint retailer_owners_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."leaderboards" add constraint leaderboards_sourcer_id_fkey foreign key ("sourcer_id") references public."sourcer_accounts"("id") on delete SET NULL;
alter table public."leaderboards" add constraint leaderboards_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;
alter table public."offer_tests" add constraint offer_tests_vendor_id_fkey foreign key ("vendor_id") references public."vendors"("id") on delete SET NULL;
alter table public."auto_rotation_rules" add constraint auto_rotation_rules_retailer_id_fkey foreign key ("retailer_id") references public."retailers"("id") on delete SET NULL;

-- vendors commission config (audit issue #1: these never existed -> code fell back to hardcoded 20)
alter table public.vendors add column if not exists retailer_commission_percent numeric default 30;
alter table public.vendors add column if not exists sourcer_commission_percent  numeric default 10;
alter table public.vendors add column if not exists tapify_commission_percent   numeric default 10;
alter table public.vendors add column if not exists vendor_commission_percent   numeric default 60;

-- indexes (from BACKEND_SCHEMA_AUDIT / PAYMENT_SYSTEM_COMPLETE)
create index if not exists idx_orders_retailer_processed_at on public.orders (retailer_id, processed_at desc);
create index if not exists idx_orders_shopify_order_id      on public.orders (shopify_order_id);
create unique index if not exists uq_orders_shopify_order_id on public.orders (shopify_order_id) where shopify_order_id is not null;
create index if not exists idx_payout_jobs_vendor           on public.payout_jobs (vendor_id);
create index if not exists idx_payout_jobs_status           on public.payout_jobs (status);
create index if not exists idx_scans_uid                    on public.scans (uid);
create index if not exists idx_uids_retailer                on public.uids (retailer_id);
create index if not exists idx_retailers_priority_display   on public.retailers (priority_display_active) where priority_display_active = true;
create index if not exists idx_orders_is_priority_display   on public.orders (is_priority_display) where is_priority_display = true;

-- RPC used by /api/uid-redirect (atomic scan counter)
create or replace function public.increment_uid_scan_count(p_uid text)
returns void language sql as $$
  update public.uids set scan_count = coalesce(scan_count,0) + 1 where uid = p_uid;
$$;
