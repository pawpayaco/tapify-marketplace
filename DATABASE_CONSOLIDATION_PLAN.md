# 🔧 Tapify Database Consolidation Plan
## Deep Dive Analysis & Migration Strategy

**Created:** 2025-01-15
**Status:** Proposal - Awaiting Approval
**Impact:** High - Affects core data model and all queries

---

## 📋 Executive Summary

After comprehensive analysis of your Tapify system architecture, database schema, API routes, and business flows, I've identified **10 critical data fragmentation issues** that are causing:

- Missing data in admin panels (phone numbers, emails scattered across tables)
- Inability to calculate sourcer commissions (no retailer → sourcer link)
- 5x redundant conversion tracking fields
- Performance overhead from unnecessary JOINs
- Data integrity risks from duplicate storage

**This plan provides a complete migration strategy to consolidate your schema** while maintaining backward compatibility and zero downtime.

---

## 🎯 System Understanding

### Business Model (Current - Phase 1)
- **Pawpaya** (single vendor) sells via NFC displays in retail stores
- **Retailers** host displays, earn 20% commission per sale
- **Businesses** (e.g., Pet Supplies Plus) are parent franchises
- **Cold outreach** to ~750 scraped Pet Supplies Plus locations
- **Manager funnel**: Manager refers owner → owner registers → display ships

### Key Data Flows
1. **Retailer Onboarding**: Cold call → Manager landing → Owner registration → Display claim
2. **Purchase Attribution**: Customer taps NFC → Shopify checkout → Order webhook → Payout job
3. **Payout Execution**: Admin triggers → Dwolla ACH transfers to retailer + Pawpaya

---

## 🚨 Critical Issues Identified

### Issue #1: **Retailer Contact Data Fragmentation** (HIGH PRIORITY)

**Problem:**
Phone numbers and emails are scattered across **3 different storage locations**, causing missing data in admin panels.

**Current State:**
```sql
-- LOCATION 1: retailers table
retailers.email          -- Owner email for login
retailers.phone          -- Owner phone
retailers.owner_name     -- Owner name
retailers.manager_name   -- Manager name (multi-location only)
retailers.store_phone    -- Store main phone (NEVER USED!)

-- LOCATION 2: retailer_owners table (DUPLICATE!)
retailer_owners.owner_email  -- Same as retailers.email
retailer_owners.owner_phone  -- Same as retailers.phone
retailer_owners.owner_name   -- Same as retailers.owner_name

-- LOCATION 3: Different entry points store data differently
- /api/admin/add-prospect → stores in retailers table
- /api/onboard/register → stores in BOTH tables
- Admin UI StoresDataGrid → fetches from BOTH tables
```

**Business Impact:**
- Admin panel shows blank phone numbers for prospects added via UI
- Data inconsistency: email could be in one table but not the other
- Requires complex JOIN queries to display basic contact info

**Root Cause:**
- Multiple APIs create retailers with different field mappings
- `retailer_owners` table was added later for "multi-owner" support but became a duplicate storage location

---

### Issue #2: **Redundant Address Fields** (MEDIUM PRIORITY)

**Problem:**
Every retailer has `address` and `location` fields **always set to identical values**.

**Current State:**
```sql
-- From /api/onboard/register.js:118-119
INSERT INTO retailers (
  address,
  location  -- ALWAYS set to same value as address!
)
```

**Business Impact:**
- Wasted storage (736 retailers × 2 fields)
- Confusion about which field to use
- Must update both fields simultaneously

**Solution:**
Deprecate `retailers.location`, use only `retailers.address`

---

### Issue #3: **5x Redundant Conversion Tracking** (HIGH PRIORITY)

**Problem:**
The same "retailer converted/registered" status is tracked in **5 different places**.

**Current State:**
```sql
-- ALL track the exact same thing: "retailer completed registration"

retailers.converted           -- Boolean
retailers.converted_at        -- Timestamp
retailers.onboarding_completed -- Boolean (DUPLICATE!)
retailer_outreach.registered  -- Boolean (DUPLICATE!)
retailer_outreach.registered_at -- Timestamp (DUPLICATE!)
```

**Business Impact:**
- Update queries must write to 3 tables for one event
- Potential for inconsistency if one UPDATE fails
- Confusion about "source of truth"

**Root Cause:**
- `onboarding_completed` added for UI logic but duplicates `converted`
- `retailer_outreach` table tracks outreach campaigns but duplicates conversion status

---

### Issue #4: **Missing Sourcer Attribution Chain** (CRITICAL - Phase 2 Blocker)

**Problem:**
**There's no way to determine which sourcing agent recruited a retailer**, blocking sourcer commission calculations for Phase 2.

**Current State:**
```sql
-- retailers table has NO sourcer_id column!
SELECT * FROM retailers;
-- Result: No field linking retailer to the sourcer who recruited them

-- payout_jobs expects sourcer_id
payout_jobs.sourcer_id  -- Exists but can't be populated!

-- orders table also missing sourcer tracking
orders.sourcer_id  -- Doesn't exist at all
```

**Business Impact:**
- **BLOCKS Phase 2 launch** - Can't calculate sourcer commissions
- No attribution for sourcing agent recruitment efforts
- No leaderboard for sourcer performance

**Required Fix:**
```sql
ALTER TABLE retailers ADD COLUMN recruited_by_sourcer_id UUID REFERENCES sourcer_accounts(id);
```

---

### Issue #5: **No Direct User → Entity Link** (HIGH PRIORITY)

**Problem:**
Retailers/vendors are matched to auth users by **email string matching** instead of foreign key, causing brittle lookups.

**Current State:**
```js
// pages/onboard/dashboard.js:68-72
const { data: retailer } = await supabase
  .from('retailers')
  .select('*')
  .eq('name', user.email)  // ⚠️ Fragile string match!
  .maybeSingle();
```

**Business Impact:**
- Breaks if user changes email in auth.users
- Can't enforce referential integrity
- Slower queries (no index on email)

**Required Fix:**
```sql
ALTER TABLE retailers ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE vendors ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_retailers_user_id ON retailers(created_by_user_id);
```

---

### Issue #6: **Cold Email Tracking Duplication** (MEDIUM PRIORITY)

**Problem:**
Cold email status is tracked in **both** `retailers` and `retailer_outreach` tables.

**Current State:**
```sql
-- LOCATION 1
retailers.cold_email_sent        -- Boolean
retailers.cold_email_sent_at     -- Timestamp

-- LOCATION 2 (DUPLICATE!)
retailer_outreach.email_sent     -- Boolean
retailer_outreach.email_sent_at  -- Timestamp
```

**Solution:**
Keep only in `retailer_outreach` (purpose-built for outreach tracking)

---

### Issue #7: **Three Separate Account Tables** (MEDIUM PRIORITY - Phase 2 Optimization)

**Problem:**
Identical structure duplicated across 3 tables.

**Current State:**
```sql
-- All have EXACT same structure:
CREATE TABLE vendor_accounts (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  plaid_access_token TEXT,
  dwolla_customer_id TEXT,
  dwolla_funding_source_id TEXT,
  created_at TIMESTAMP
);

CREATE TABLE retailer_accounts (
  id UUID PRIMARY KEY,
  retailer_id UUID REFERENCES retailers(id),
  plaid_access_token TEXT,
  dwolla_customer_id TEXT,
  dwolla_funding_source_id TEXT,
  created_at TIMESTAMP
);

CREATE TABLE sourcer_accounts (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  plaid_access_token TEXT,
  dwolla_customer_id TEXT,
  dwolla_funding_source_id TEXT,
  created_at TIMESTAMP
);
```

**Better Design (Polymorphic):**
```sql
CREATE TABLE payment_accounts (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,  -- 'vendor' | 'retailer' | 'sourcer'
  entity_id UUID NOT NULL,     -- References vendors/retailers/sourcer_accounts
  plaid_access_token TEXT,
  dwolla_customer_id TEXT,
  dwolla_funding_source_id TEXT,
  created_at TIMESTAMP,
  UNIQUE(entity_type, entity_id)
);
```

**Note:** This is lower priority - current structure works fine for now.

---

### Issue #8: **Staging Tables Not Cleaned Up** (LOW PRIORITY)

**Problem:**
Import staging tables still in production schema.

**Current State:**
```sql
staging_stores
staging_stores_imported_20251002_1656
staging_stores_imported_20251002_1658
```

**Solution:**
Drop after verifying data imported successfully.

---

### Issue #9: **Missing Foreign Key Constraint** (LOW PRIORITY)

**Problem:**
`scans.uid` references `uids.uid` but no FK constraint enforces it.

**Current State:**
```sql
-- Listed in fk_candidates.md but not in foreign_keys.md
scans.uid → uids.uid (not enforced)
```

**Solution:**
```sql
ALTER TABLE scans ADD CONSTRAINT fk_scans_uid
  FOREIGN KEY (uid) REFERENCES uids(uid);
```

---

## 🏗️ Proposed Solution: Consolidated Schema

### Phase 1: Core Consolidation (Do This First)

#### 1. Consolidate Retailer Contact Data

**Migration Strategy:**
```sql
-- Step 1: Backfill missing data from retailer_owners → retailers
UPDATE retailers r
SET
  phone = COALESCE(r.phone, ro.owner_phone),
  email = COALESCE(r.email, ro.owner_email),
  owner_name = COALESCE(r.owner_name, ro.owner_name)
FROM (
  SELECT DISTINCT ON (retailer_id)
    retailer_id,
    owner_phone,
    owner_email,
    owner_name
  FROM retailer_owners
  ORDER BY retailer_id, collected_at DESC
) ro
WHERE r.id = ro.retailer_id;

-- Step 2: Verify no data loss
SELECT
  COUNT(*) as total_retailers,
  COUNT(phone) as have_phone,
  COUNT(email) as have_email
FROM retailers;

-- Step 3: Drop redundant columns (LATER, after testing)
-- ALTER TABLE retailers DROP COLUMN location;
-- ALTER TABLE retailers DROP COLUMN store_phone;
```

#### 2. Add Sourcer Attribution

```sql
-- Add column
ALTER TABLE retailers
  ADD COLUMN recruited_by_sourcer_id UUID REFERENCES sourcer_accounts(id);

-- Create index for queries
CREATE INDEX idx_retailers_sourcer ON retailers(recruited_by_sourcer_id);

-- Update existing retailers (if known from outreach data)
UPDATE retailers r
SET recruited_by_sourcer_id = (
  SELECT sourcer_id
  FROM retailer_outreach ro
  WHERE ro.retailer_id = r.id
  LIMIT 1
)
WHERE recruited_by_sourcer_id IS NULL;
```

#### 3. Add User ID Links

```sql
-- Add columns
ALTER TABLE retailers
  ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);

ALTER TABLE vendors
  ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);

-- Backfill from email matches
UPDATE retailers r
SET created_by_user_id = (
  SELECT id FROM auth.users WHERE email = r.email LIMIT 1
)
WHERE created_by_user_id IS NULL AND r.email IS NOT NULL;

-- Create indexes
CREATE INDEX idx_retailers_user_id ON retailers(created_by_user_id);
CREATE INDEX idx_vendors_user_id ON vendors(created_by_user_id);
```

#### 4. Consolidate Conversion Tracking

**Decision:** Keep only `retailers.converted` + `retailers.converted_at` as source of truth.

```sql
-- Backfill any missing converted status from outreach
UPDATE retailers r
SET
  converted = TRUE,
  converted_at = ro.registered_at
FROM retailer_outreach ro
WHERE r.id = ro.retailer_id
  AND ro.registered = TRUE
  AND r.converted = FALSE;

-- Verify sync
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN converted THEN 1 END) as converted_retailers,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) as onboarding_completed
FROM retailers;

-- Drop redundant column (AFTER verification)
-- ALTER TABLE retailers DROP COLUMN onboarding_completed;
```

#### 5. Consolidate Outreach Tracking

**Decision:** Move `cold_email_sent` from `retailers` to `retailer_outreach` (purpose-built table).

```sql
-- Backfill outreach records for retailers with cold_email_sent
INSERT INTO retailer_outreach (retailer_id, campaign, channel, email_sent, email_sent_at, created_at)
SELECT
  id as retailer_id,
  'admin-cold-call' as campaign,
  'email' as channel,
  TRUE as email_sent,
  cold_email_sent_at as email_sent_at,
  created_at
FROM retailers
WHERE cold_email_sent = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM retailer_outreach WHERE retailer_id = retailers.id
  );

-- Drop from retailers (AFTER verification)
-- ALTER TABLE retailers DROP COLUMN cold_email_sent;
-- ALTER TABLE retailers DROP COLUMN cold_email_sent_at;
```

---

### Phase 2: Optimization (Do This Later, After Phase 1 Validated)

#### 1. Add Missing Foreign Keys

```sql
ALTER TABLE scans
  ADD CONSTRAINT fk_scans_uid
  FOREIGN KEY (uid) REFERENCES uids(uid) ON DELETE CASCADE;
```

#### 2. Drop Staging Tables

```sql
-- Verify data imported successfully first!
DROP TABLE IF EXISTS staging_stores;
DROP TABLE IF EXISTS staging_stores_imported_20251002_1656;
DROP TABLE IF EXISTS staging_stores_imported_20251002_1658;
```

#### 3. Consider Polymorphic Accounts Table (Optional)

⚠️ **NOT RECOMMENDED for Phase 1** - current structure works fine.

---

## 🔄 Application Code Changes Required

### 1. Update StoresDataGrid Query (Already Done!)

```js
// components/StoresDataGrid.js - ALREADY FIXED
const { data: retailersData } = await supabase
  .from('retailers')
  .select('id, name, address, phone, store_phone, email, owner_name, ...')
  .order('created_at', { ascending: false});

// Merge logic now pulls from retailer_owners as fallback
```

### 2. Update Dashboard Auth Lookup

```js
// pages/onboard/dashboard.js - CHANGE FROM:
const { data: retailer } = await supabase
  .from('retailers')
  .select('*')
  .eq('name', user.email)  // ❌ Brittle!
  .maybeSingle();

// TO:
const { data: retailer } = await supabase
  .from('retailers')
  .select('*')
  .eq('created_by_user_id', user.id)  // ✅ Proper FK
  .maybeSingle();
```

### 3. Update Registration API

```js
// pages/api/onboard/register.js - ADD user_id:
INSERT INTO retailers (
  name, address, email, owner_name, phone,
  created_by_user_id,  // ← ADD THIS
  recruited_by_sourcer_id,  // ← ADD THIS if known
  ...
)
```

### 4. Update Payout Job Creation

```js
// pages/api/shopify-webhook.js or wherever payout_jobs are created
// ADD sourcer lookup:
const { data: retailer } = await supabase
  .from('retailers')
  .select('id, recruited_by_sourcer_id')
  .eq('id', retailer_id)
  .single();

await supabase.from('payout_jobs').insert({
  order_id,
  vendor_id,
  retailer_id,
  sourcer_id: retailer.recruited_by_sourcer_id,  // ← Now populated!
  ...
});
```

### 5. Stop Writing to Redundant Fields

```js
// All APIs creating retailers should NOT set:
// - location (use only address)
// - onboarding_completed (use only converted)
// - cold_email_sent (use retailer_outreach table)
```

---

## 📊 Migration Execution Plan

### Step 1: Pre-Migration Validation
```sql
-- Count data in each location
SELECT
  'retailers.phone' as field,
  COUNT(*) FILTER (WHERE phone IS NOT NULL) as populated
FROM retailers
UNION ALL
SELECT
  'retailer_owners.owner_phone',
  COUNT(*) FILTER (WHERE owner_phone IS NOT NULL)
FROM retailer_owners
UNION ALL
SELECT
  'retailers.email',
  COUNT(*) FILTER (WHERE email IS NOT NULL)
FROM retailers
UNION ALL
SELECT
  'retailer_owners.owner_email',
  COUNT(*) FILTER (WHERE owner_email IS NOT NULL)
FROM retailer_owners;
```

### Step 2: Backup Database
```bash
# Using Supabase CLI or pg_dump
pg_dump -h <host> -U postgres -d <database> > tapify_backup_$(date +%Y%m%d).sql
```

### Step 3: Run Consolidation Scripts (Transaction)
```sql
BEGIN;

-- Run all Phase 1 migrations here
-- (Each one from "Proposed Solution" section above)

-- Verify counts match
-- If anything looks wrong: ROLLBACK;

COMMIT;
```

### Step 4: Update Application Code
- Deploy StoresDataGrid changes (✅ Already done!)
- Update dashboard auth lookup
- Update registration API to set new fields

### Step 5: Monitor for Issues
- Check admin panel for missing data
- Verify new registrations populate all fields
- Test payout job creation includes sourcer_id

### Step 6: Drop Redundant Columns (2 weeks later)
```sql
-- ONLY after confirming app works perfectly:
ALTER TABLE retailers DROP COLUMN location;
ALTER TABLE retailers DROP COLUMN store_phone;
ALTER TABLE retailers DROP COLUMN onboarding_completed;
ALTER TABLE retailers DROP COLUMN cold_email_sent;
ALTER TABLE retailers DROP COLUMN cold_email_sent_at;
```

---

## ✅ Success Metrics

After migration, you should see:

1. ✅ **Admin panel shows ALL phone numbers and emails** (no more blanks)
2. ✅ **Single source of truth** for each data point (no duplicates)
3. ✅ **Sourcer attribution working** (ready for Phase 2 commissions)
4. ✅ **Faster queries** (fewer JOINs needed)
5. ✅ **Data integrity** (foreign keys enforce relationships)
6. ✅ **Reduced storage** (5 redundant fields removed)

---

## 🚀 Next Steps

1. **Review this plan** - Confirm it aligns with your business needs
2. **Approve migration scope** - Which issues are highest priority?
3. **Test on staging database** - Run migrations on copy first
4. **Execute Phase 1** - Core consolidation (1-2 hours)
5. **Deploy code changes** - Update queries to use new fields
6. **Monitor production** - Watch for issues (1-2 weeks)
7. **Execute Phase 2** - Drop redundant columns (optional)

---

## 🎯 Recommendation

**Start with Phase 1 migrations immediately.** These fix critical issues (missing phone numbers, sourcer attribution) with minimal risk. Phase 2 optimizations (dropping columns) can wait until you're 100% confident.

**Estimated Time:**
- Migration scripts: 30 minutes
- Code updates: 2 hours
- Testing: 1 hour
- **Total: ~3-4 hours of development time**

**Risk Level:** Low (all changes are additive, no data deletion until Phase 2)

---

## 📞 Questions to Answer Before Proceeding

1. **Sourcer tracking**: Do you currently have sourcer accounts in the system? Should we backfill `recruited_by_sourcer_id` from any existing data?

2. **Cold email tracking**: Should we keep `retailers.cold_email_sent` for now, or move it to `retailer_outreach` immediately?

3. **Staging tables**: Can we confirm data from `staging_stores_*` has been fully imported and these tables can be dropped?

4. **Testing**: Do you have a staging Supabase project where we can test these migrations first?

Let me know if you want me to proceed with writing the complete migration SQL script!
