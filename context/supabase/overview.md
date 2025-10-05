# Supabase Overview

## Purpose
Central DB for **Tapify (Next.js app)** and **Pawpaya (Shopify integrations)**.  
Source of truth for managers, retailers, vendors, NFC UIDs, orders, payouts, and outreach.

## Access
- `@supabase/supabase-js` in Next.js (client + server routes)
- Shopify → webhooks → Next.js API → Supabase

## Key Entities (Plain English)
- **retailers** – Franchise locations; contact info, onboarding status, conversion tracking  
- **businesses** – Brand or company grouping for retailers  
- **uids** – NFC/QR tag → business mapping + connection status  
- **orders / payouts / payout_jobs** – Revenue, commissions, and split logic  
- **bank_accounts / retailer_accounts / vendor_accounts / sourcer_accounts** – Financial linkage  
- **vendors** – Sellers supplying product (Etsy/Shopify makers)  
- **displays / scans** – Physical placements and scan tracking  
- **retailer_outreach / retailer_owners / leaderboards / logs** – Operations and growth tracking

## Relationship Summary
- retailers.business_id → businesses.id
- retailers.linked_vendor_id → vendors.id
- bank_accounts.retailer_id → retailers.id
- displays.retailer_id → retailers.id
- retailer_accounts.retailer_id → retailers.id
- retailer_outreach.retailer_id → retailers.id
- retailer_owners.retailer_id → retailers.id
- orders.retailer_id → retailers.id
- orders.vendor_id → vendors.id
- orders.business_id → businesses.id
- uids.business_id → businesses.id
- uids.retailer_id → retailers.id
- payout_jobs.order_id → orders.id
- payout_jobs.retailer_id → retailers.id
- payout_jobs.vendor_id → vendors.id
- payout_jobs.sourcer_id → sourcer_accounts.id
- payouts.payout_job_id → payout_jobs.id
- leaderboards.retailer_id → retailers.id

## Webhooks / Flows
- Shopify `orders/create` → Next.js `/api/shopify/order-webhook` → insert/update `orders`
- Checkout URLs append `attributes[user_id]` + `attributes[store_id]` → reconciled to Supabase retailer/user

## Data Lifecycle (Simplified)
1. Retailer claims a display via NFC → creates or links a `retailer` + `uid`
2. Customer scans display → `scans` logged; Shopify order includes `attributes`
3. Shopify webhook → `/api/shopify/order-webhook` inserts into `orders`
4. `payout_jobs` auto-created from order metadata
5. Admin triggers Dwolla payouts → recorded in `payouts`

## v2.0 Enhancements
- `orders` now store the full Shopify payload (IDs, totals, currency, status, raw JSON) for audit-ready payouts.
- `uids` capture claim status, attribution activity, and rolling scan/order metadata; `increment_uid_scan_count(p_uid)` keeps totals in sync with real-time events.
- `scans` persist request context (retailer, business, IP, user agent) to close the analytics loop.
- `leaderboards` aggregate daily performance by retailer via the `period`, `scan_count`, `order_count`, and `revenue_total` columns.
- `payout_jobs` reference the originating `orders` row and track Dwolla transfer IDs; `payouts` log multi-party transfer summaries and the admin user who initiated them.

## Security & Policies
- Row Level Security is enabled on `uids`, `orders`, and `payout_jobs`.
- The helper function `tapify_is_admin()` checks the `admins` table for the current `auth.uid()` and powers admin-only policies.
- Selection policies allow retailers (via `created_by_user_id`) to see their own data while restricting mutations to admins.

## Example Supabase Pattern (Next.js)
```js
// Client-side
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('retailer_id', retailerId);

// Server-side (service role)
await supabaseAdmin
  .from('payout_jobs')
  .insert([{ order_id, vendor_id, retailer_id, amount }]);
For detailed table structures, see tables_and_columns.md
For actual FK definitions, see foreign_keys.md
