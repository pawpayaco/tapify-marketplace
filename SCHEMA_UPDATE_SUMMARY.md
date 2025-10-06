# 📋 Shopify AI Briefing Documents - Schema Update Summary

**Date:** 2025-10-05
**Status:** ✅ Complete

---

## 🎯 What Was Updated

The Shopify AI briefing documents have been updated to reflect the **actual current Supabase schema** after the October 2025 database consolidation migration.

### Files Updated

1. **SHOPIFY_AI_BRIEF.md**
   - Database schema section completely rewritten
   - Webhook handler code updated with full schema support
   - Migration warnings added
   - Deprecated columns documented

2. **SHOPIFY_INTEGRATION_DIAGRAMS.md**
   - Data structure reference updated with full schemas
   - Migration notes added to all table diagrams
   - Deprecated columns clearly marked

---

## 🔍 Key Schema Changes Reflected

### October 2025 Migration (2025-10-06)

#### ✅ New Columns Added

**retailers table:**
- `created_by_user_id` UUID → auth.users (proper FK instead of email matching)
- `recruited_by_sourcer_id` UUID → sourcer_accounts (Phase 2 ready)
- `place_id`, `lat`, `lng` (geographic data from CSV import)

**vendors table:**
- `created_by_user_id` UUID → auth.users

#### ⚠️ Deprecated Columns (still exist, don't use)

**retailers table:**
- `location` → use `address` instead
- `store_phone` → use `phone` instead
- `onboarding_completed` → use `converted` instead
- `cold_email_sent` / `cold_email_sent_at` → use `retailer_outreach` table

**retailer_owners table:**
- ⚠️ ENTIRE TABLE DEPRECATED (data consolidated into `retailers`)
- Still exists in database but should NOT be used for new code
- Will be dropped after 1-2 months of validation

---

## 📊 Complete Schema Changes

### 1. **orders** Table - NOW INCLUDES:

**Previously simplified in docs, now showing FULL schema:**
```sql
-- ADDED TO DOCUMENTATION:
shopify_order_number TEXT,
shop_domain TEXT,
customer_name TEXT,
currency TEXT DEFAULT 'USD',
subtotal NUMERIC DEFAULT 0,
tax_total NUMERIC DEFAULT 0,
discount_total NUMERIC DEFAULT 0,
financial_status TEXT,
fulfillment_status TEXT,
processed_at TIMESTAMPTZ,
source_uid TEXT,  -- UID that generated order
line_items JSONB DEFAULT '[]'::jsonb,  -- Phase 2 multi-vendor
raw_payload JSONB,  -- Full webhook for audit
business_id UUID REFERENCES businesses(id)
```

**Why this matters for Shopify AI:**
- `line_items` (jsonb) is critical for Phase 2 multi-vendor orders
- `raw_payload` stores full webhook for debugging
- `financial_status` / `fulfillment_status` enable refund handling
- `source_uid` directly links order to NFC display

---

### 2. **payout_jobs** Table - NOW INCLUDES:

**Previously missing:**
```sql
-- ADDED TO DOCUMENTATION:
total_amount NUMERIC DEFAULT 0,
sourcer_id UUID REFERENCES sourcer_accounts(id),
sourcer_cut NUMERIC DEFAULT 0,
tapify_cut NUMERIC DEFAULT 0,
plaid_token TEXT,
source_uid TEXT,
transfer_ids JSONB DEFAULT '[]'::jsonb  -- Dwolla transfer IDs
```

**Why this matters:**
- `sourcer_id` enables Phase 2 commission tracking (already implemented in webhook!)
- `transfer_ids` tracks Dwolla ACH transfers for reconciliation
- `total_amount` validates sum of all cuts

---

### 3. **uids** Table - NOW INCLUDES:

**Previously missing extensive tracking fields:**
```sql
-- ADDED TO DOCUMENTATION:
is_connected BOOLEAN DEFAULT false,
claimed_at TIMESTAMPTZ,
claimed_by_user_id UUID,
last_scan_at TIMESTAMPTZ,
last_scan_ip TEXT,
last_scan_user_agent TEXT,
last_scan_location TEXT,
last_order_at TIMESTAMPTZ,
last_order_total NUMERIC,
scan_count INTEGER DEFAULT 0
```

**Why this matters:**
- Real-time analytics on UID performance
- Tracks when/where/who last scanned
- `scan_count` for leaderboards

---

### 4. **scans** Table - NOW INCLUDES:

**Previously missing:**
```sql
-- ADDED TO DOCUMENTATION:
business_id UUID REFERENCES businesses(id),
ip_address TEXT,
user_agent TEXT,
metadata JSONB
```

**Why this matters:**
- `business_id` links scans to business entity
- `ip_address` / `user_agent` for fraud detection
- `metadata` for future extensibility

---

### 5. **retailers** Table - UPDATED:

**New migration columns documented:**
```sql
-- HIGHLIGHTED AS NEW:
created_by_user_id UUID REFERENCES auth.users(id),  -- ⭐ NEW
recruited_by_sourcer_id UUID REFERENCES sourcer_accounts(id),  -- ⭐ Phase 2
place_id TEXT,  -- Google Maps ID
lat NUMERIC,  -- Geographic data
lng NUMERIC,
owner_name TEXT,
manager_name TEXT
```

**Deprecated columns now clearly marked:**
```sql
-- ⚠️ DEPRECATED (still exist, don't use):
location → use address
store_phone → use phone
onboarding_completed → use converted
```

---

## 🔧 Code Updates in Briefing Docs

### Webhook Handler - Now Includes Full Schema

**Updated `pages/api/shopify-webhook.js` implementation to:**

1. **Insert complete order data:**
   ```js
   // Before: Only 5 fields
   {
     shopify_order_id, customer_email, total,
     retailer_id, vendor_id, created_at
   }

   // After: ALL 17 fields
   {
     shopify_order_id, shopify_order_number, shop_domain,
     customer_email, customer_name, retailer_id, vendor_id,
     business_id, currency, total, subtotal, tax_total,
     discount_total, financial_status, fulfillment_status,
     processed_at, source_uid, line_items, raw_payload, created_at
   }
   ```

2. **Lookup sourcer before creating payout:**
   ```js
   // NEW: Phase 2 ready!
   const { data: retailerData } = await supabase
     .from('retailers')
     .select('recruited_by_sourcer_id')
     .eq('id', retailerId)
     .single();

   const sourcerId = retailerData?.recruited_by_sourcer_id;
   ```

3. **Calculate multi-party splits:**
   ```js
   // Phase 1: No sourcer
   retailer_cut: 20%, vendor_cut: 80%

   // Phase 2: With sourcer
   retailer_cut: 20%, vendor_cut: 60%,
   sourcer_cut: 10%, tapify_cut: 10%
   ```

4. **Insert payout job with all fields:**
   ```js
   {
     order_id, retailer_id, vendor_id, sourcer_id,
     total_amount, retailer_cut, vendor_cut,
     sourcer_cut, tapify_cut, source_uid,
     status: 'pending'
   }
   ```

---

## 📚 Documentation Changes Summary

### SHOPIFY_AI_BRIEF.md

**Section: Database Schema**
- ✅ Added migration warning box at top
- ✅ Updated all 5 table schemas to match actual current state
- ✅ Added "FULL SCHEMA" labels to clarify completeness
- ✅ Added inline comments explaining field purposes
- ✅ Documented deprecated columns with warnings

**Section: Webhook Implementation**
- ✅ Updated STEP 4 (order insert) with all 17 fields
- ✅ Added STEP 5 (sourcer lookup)
- ✅ Updated STEP 6 (payout job) with conditional logic

### SHOPIFY_INTEGRATION_DIAGRAMS.md

**Section: Data Structure Reference**
- ✅ Added migration note banner
- ✅ Updated all ASCII table diagrams
- ✅ Added ⭐ symbols to highlight new migration fields
- ✅ Added deprecation warning box at bottom
- ✅ Updated field counts and examples

---

## ⚠️ Critical Information for AI Coder

### What the AI MUST Know:

1. **retailer_owners is DEPRECATED**
   - Data has been consolidated into `retailers` table
   - DO NOT insert into `retailer_owners`
   - DO NOT query `retailer_owners` for new features

2. **Use proper foreign keys**
   - Use `created_by_user_id` for auth lookups (NOT email matching)
   - Use `recruited_by_sourcer_id` for sourcer attribution

3. **Phase 2 is already wired**
   - `sourcer_id`, `sourcer_cut`, `tapify_cut` fields exist
   - Webhook handler already looks up sourcer
   - Commission calculation already conditional

4. **Store full webhook payloads**
   - `orders.raw_payload` should contain entire Shopify webhook
   - `orders.line_items` should be jsonb array
   - This enables audit trail and Phase 2 multi-vendor

5. **Don't use deprecated columns**
   - `retailers.location` → use `address`
   - `retailers.store_phone` → use `phone`
   - `retailers.onboarding_completed` → use `converted`

---

## ✅ Validation Checklist

When AI implements the webhook handler, verify:

- [ ] All 17 `orders` table fields populated
- [ ] `raw_payload` contains full webhook JSON
- [ ] `line_items` contains order line items array
- [ ] Sourcer lookup happens before payout job creation
- [ ] `payout_jobs.total_amount` equals order total
- [ ] `source_uid` populated in both orders and payout_jobs
- [ ] Commission splits conditional on sourcer existence
- [ ] No inserts into `retailer_owners` table
- [ ] No usage of deprecated columns

---

## 📝 Files Reference

**Migration Documentation:**
- `MIGRATION_SCRIPT.sql` - Actual SQL that was run
- `MIGRATION_HISTORY.md` - Complete migration documentation
- `CHANGES_SUMMARY.md` - User-friendly changelog
- `DATABASE_CONSOLIDATION_PLAN.md` - Analysis and strategy

**Context Documentation:**
- `context/supabase/tables_and_columns.md` - Current schema (source of truth)
- `context/supabase/foreign_keys.md` - FK relationships
- `context/supabase/overview.md` - Entity relationship summary
- `context/CLAUDE.md` - Recent migration notes for developers

**Briefing Documents (NOW UPDATED):**
- `SHOPIFY_AI_BRIEF.md` - Master integration guide
- `SHOPIFY_QUICK_START.md` - Action plan
- `SHOPIFY_INTEGRATION_DIAGRAMS.md` - Visual workflows
- `AI_HANDOFF_INSTRUCTIONS.md` - How to use the docs

---

## 🎯 Impact on Shopify Integration

**Before Schema Update:**
- AI would implement simplified webhook handler
- Missing 12 order fields → incomplete data
- Missing sourcer logic → Phase 2 blocked
- No audit trail → debugging impossible

**After Schema Update:**
- AI implements production-ready handler
- Complete order data captured
- Sourcer logic already included
- Full webhook audit trail
- Phase 2 ready out of the box

---

## 🚀 Next Steps

**For Oscar:**
1. ✅ Schema documentation is now accurate
2. ✅ AI briefing docs reflect current database
3. ✅ Migration context is clear
4. → Ready to hand off to Shopify AI coder

**For AI Coder:**
1. Read updated SHOPIFY_AI_BRIEF.md
2. Implement webhook handler with FULL schema
3. Test with actual Shopify webhooks
4. Verify all fields populate correctly
5. Confirm sourcer logic works (even if null in Phase 1)

---

## ✅ Summary

**What Changed:**
- Database schema documentation updated to match reality
- Webhook handler code examples now production-complete
- Migration notes and warnings added throughout
- Deprecated columns clearly documented

**Why It Matters:**
- AI will implement correct schema from day 1
- No need to refactor when Phase 2 launches
- Complete audit trail for all orders
- Sourcer system ready when needed

**Validation:**
- Compared briefing docs to `context/supabase/tables_and_columns.md`
- Incorporated October 2025 migration changes
- Referenced MIGRATION_HISTORY.md for context
- Ensured deprecated columns are clearly marked

**Status:** ✅ Ready for AI handoff

---

*Schema Update Completed: 2025-10-05*
*All briefing documents now reflect October 2025 database state*
