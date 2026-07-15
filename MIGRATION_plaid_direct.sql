-- Plaid without Dwolla: store the item/account reference + display mask only.
-- Full account + routing numbers are fetched live from Plaid at CSV time and
-- never persisted.
alter table public.retailer_accounts add column if not exists plaid_account_id  text;
alter table public.retailer_accounts add column if not exists plaid_item_id     text;
alter table public.retailer_accounts add column if not exists institution_name  text;
alter table public.retailer_accounts add column if not exists account_mask      text;
alter table public.retailer_accounts add column if not exists account_name      text;
alter table public.retailer_accounts add column if not exists linked_at         timestamptz default now();

create unique index if not exists uq_retailer_accounts_retailer
  on public.retailer_accounts (retailer_id);
