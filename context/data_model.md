# 🧩 Tapify Data Model (Conceptual Overview)

## 💡 Purpose
The Tapify Data Model defines the core logical structure that connects **Supabase**, **Shopify**, and **NFC Displays** into a unified profit engine.  
It ensures every tap, scan, checkout, and payout flows through a single data truth — linking **vendors**, **retailers**, **sourcing agents**, and **Tapify** itself through automated attribution and commission routing.

---

## 🧠 Core Entities (Human Layer)
| Entity | Description |
|--------|--------------|
| **Retailer** | A franchise or independent store that hosts Tapify displays. Each retailer has metadata (name, address, contact, claim status). |
| **Vendor** | A creator or brand whose products are featured on displays. In Phase 1, Pawpaya acts as the only vendor. |
| **Display** | A physical in-store NFC/QR fixture linking a customer to a Shopify product or collection. |
| **UID** | The NFC tag’s unique identifier, stored in Supabase and linked to a business or retailer. |
| **Business** | Parent entity grouping multiple retailers or displays under a shared brand. |
| **Order** | Transaction data synced from Shopify webhooks; each order links back to a retailer and vendor. |
| **Payout Job** | Automated record defining who gets paid what for each order (Retailer, Vendor, Sourcing Agent, Tapify). |
| **Sourcing Agent (Ecom Kid)** | Affiliate who recruits vendors or retailers; receives a percentage of payouts. |
| **Bank Accounts** | Linked accounts for payouts via Plaid/Dwolla. |
| **Leaderboard** | Future gamification structure for sourcing agents and top-performing retailers. |

---

## 🧱 Data Architecture (Supabase)
Each Supabase table fits one layer of the engine:

| Table | Purpose |
|--------|----------|
| `retailers` | Core table for all stores. Linked to `businesses`, `retailer_owners`, `retailer_accounts`, and `retailer_outreach`. |
| `businesses` | Groups multiple retailers under one company (e.g., Pet Supplies Plus). |
| `uids` | Maps NFC tag IDs → `business_id` → `retailer_id` (via claim event). |
| `orders` | Shopify → Webhook → `/api/shopify-webhook` → records order data. |
| `payout_jobs` | Defines commission splits and payout scheduling. |
| `payouts` | Logs executed payouts (Phase 2). |
| `bank_accounts` | Holds Plaid/Dwolla linkage for ACH transfers. |
| `vendors` | Vendor data from onboarding form `/onboard`. |
| `vendor_accounts`, `retailer_accounts`, `sourcer_accounts` | Each holds Dwolla info and payout balance. |
| `displays` | Tracks in-store Tapify display units. |
| `scans` | Logs tap/scan events via `/t?u=<UID>`. |
| `retailer_outreach` | Tracks cold-call progress and contact results. |
| `retailer_owners` | Manual or scraped data on store ownership. |
| `leaderboards` | Used for sourcing agent gamification metrics. |
| `logs` | Audit and debugging data for system events. |

---

## 🔗 Relationships (Simplified ER Map)
Retailer
├── belongs_to → Business
├── has_one → RetailerAccount
├── has_many → Displays
├── has_many → Orders
├── has_many → PayoutJobs
└── linked_to → RetailerOwner(s)

Vendor
├── has_many → Products (Shopify)
├── has_one → VendorAccount
└── has_many → PayoutJobs

UID
├── belongs_to → Business
├── claimed_by → Retailer
└── resolves_to → Shopify Collection or Product URL

Order
├── belongs_to → Retailer
├── belongs_to → Vendor
└── triggers → PayoutJob

PayoutJob
├── connects → Retailer, Vendor, Sourcer, Tapify
└── logs → Payout Record (Dwolla)


---

## 🔄 Data Flow Summary

### 🏪 Retailer Claim Flow
1. Retailer taps unclaimed display → `/t?u=<UID>`  
2. Supabase checks `uids` for claim status  
3. If unclaimed → `/claim` → register retailer → update `uids.business_id`  
4. Future scans from that UID are attributed to the retailer

### 💳 Order → Payout Flow
1. Customer scans → redirects to Shopify → checkout completes  
2. Shopify sends webhook → Next.js API `/api/shopify-webhook`  
3. API creates entry in `orders`  
4. Backend creates a matching `payout_job` with split percentages  
5. Dwolla handles multi-party payout when the admin approves it on the admin dashboard

### 📊 Analytics Flow
- All scans, orders, and payouts push to `logs` and `leaderboards` for internal dashboards.
- Data powers Tapify Command Center for performance visualization.

---

## 🧩 Hybrid Architecture (Concept Level)
Tapify’s data model operates as a **three-layer hybrid**:

| Layer | Platform | Function |
|--------|-----------|-----------|
| **Frontend (Next.js)** | UI + Claim + Dashboards | Reads/Writes to Supabase, triggers webhooks. |
| **Commerce (Shopify)** | Checkout + Orders | Holds product catalog and payment flow. |
| **Backend (Supabase)** | Data Warehouse | Links everything; automates attribution and payouts. |

All three communicate through lightweight, auditable APIs (`/api/...`) that act as translators between Supabase relational logic and Shopify commerce events.

---

## 🧠 Phase Summary

### Phase 1 — *Pawpaya Internal Validation*
- Single Vendor (Pawpaya)
- Payouts: Retailer ↔ Pawpaya only
- Shopify backend = source of truth for all orders
- Supabase logs affiliate performance + outreach

### Phase 2 — *Tapify Platform Expansion*
- Multi-vendor marketplace model
- Payout splits: Retailer, Vendor, Sourcing Agent, Tapify
- Shopify becomes “Marketplace Host”
- Supabase automates onboarding, tracking, and payouts

---
---

## 🔄 October 2025 Migration Updates

### New Relationships Added

**Retailer → Sourcer:**
```
retailers.recruited_by_sourcer_id → sourcer_accounts.id
```
Purpose: Track which sourcing agent recruited this retailer (Phase 2 commission tracking)

**Retailer → Auth User:**
```
retailers.created_by_user_id → auth.users.id
```
Purpose: Proper FK relationship for auth (replaces fragile email string matching)

**Vendor → Auth User:**
```
vendors.created_by_user_id → auth.users.id
```
Purpose: Proper FK relationship for auth

### Data Consolidation

**Before Migration:**
```
Retailer Contact Data:
├── retailers.phone
├── retailers.email
├── retailer_owners.owner_phone  (DUPLICATE!)
└── retailer_owners.owner_email  (DUPLICATE!)
```

**After Migration:**
```
Retailer Contact Data:
└── retailers.phone (single source of truth)
└── retailers.email (single source of truth)

retailer_owners table: DEPRECATED (data consolidated)
```

### Payout Job Flow (Updated)

```
Order Created
    ↓
Lookup retailer.recruited_by_sourcer_id  ← NEW!
    ↓
Create payout_job with:
    - retailer_id
    - vendor_id
    - sourcer_id  ← NEW! (Phase 2 ready)
    - retailer_cut
    - vendor_cut
    - sourcer_cut  ← NEW! (5% if sourcer exists)
```

---
