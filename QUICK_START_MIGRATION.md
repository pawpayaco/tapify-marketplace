# ⚡ Quick Start - Database Migration

**Total Time:** ~10 minutes
**Risk:** Low (everything backed up)

---

## Step 1: Run Database Migration (5 min)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Tapify project
   - Click "SQL Editor" in left sidebar

2. **Paste Migration Script**
   - Open `MIGRATION_SCRIPT.sql` from your repo
   - Copy entire contents (all ~300 lines)
   - Paste into SQL Editor
   - Click "Run" button

3. **Review Results**
   - Scroll to bottom - you'll see verification results
   - If numbers look wrong: Run `ROLLBACK;` and message me
   - If numbers look good: ✅ Migration succeeded! (auto-commits)

---

## Step 1.5: Clean Up Test Data (2 min)

⚠️ **Skip this if your database is already clean!**

If you have test retailers you want to remove:

1. **Open CLEANUP_TEST_DATA.sql**
   - Verify the admin email is correct: `oscarmullikin@icloud.com`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"

2. **Review Cleanup Results**
   - You should see:
     - `auth.users`: 1 (your admin account)
     - `retailers`: 0 or 1 (your store if you have one)
     - Everything else: 0
   - If it looks good: ✅ Clean slate ready!
   - If something looks wrong: Run `ROLLBACK;`

---

## Step 2: Import CSV Prospects (2 min)

1. **Run Import Script**
   ```bash
   cd /Users/oscarmullikin/tapify-marketplace
   node scripts/import_prospects.js
   ```

2. **Expected Output**
   ```
   🚀 Starting CSV prospect import...
   📂 Reading CSV from: ./sotres_enricheddddd.csv
   ✅ Parsed 750 rows from CSV
   📦 Inserting batch 1/8 (100 records)...
   ✅ Inserted 100 retailers
   ...
   ✨ Import complete!
   ```

3. **If Import Fails**
   - Check file exists: `ls sotres_enricheddddd.csv`
   - Check Node version: `node --version` (should be 18+)
   - Check .env.local has Supabase credentials

---

## Step 3: Deploy Code (Automatic)

Your code changes are already saved. If using Vercel:

```bash
git add .
git commit -m "feat: database consolidation and schema improvements

- Consolidated phone/email data
- Added sourcer tracking for Phase 2
- Fixed admin panel missing data
- Improved query performance
- Imported 750 Pet Supplies Plus prospects"

git push origin main
```

Vercel auto-deploys in ~2 minutes.

---

## Step 4: Verify (3 min)

1. **Check Admin Panel**
   - Go to `localhost:3000/admin/stores` (or production URL)
   - You should see **~750 stores** (from CSV import)
   - **ALL stores should have phone numbers** visible
   - **ALL stores should have emails** visible
   - All should show `converted: false` (these are prospects)

2. **Test Registration**
   - Go to `/onboard/register`
   - Fill out form with test data
   - Submit registration
   - Should succeed and redirect to dashboard
   - Dashboard should load your store info correctly

3. **Check Supabase**
   - Open Supabase → Table Editor → `retailers`
   - Look at any row
   - New columns should exist:
     - `created_by_user_id` ✅
     - `recruited_by_sourcer_id` ✅
     - `place_id` ✅
     - `lat` ✅
     - `lng` ✅

---

## ✅ Success Checklist

- [ ] Migration completed without errors
- [ ] Test data cleaned (only admin account remains)
- [ ] CSV imported 750 prospects
- [ ] Admin panel shows ~750 total stores
- [ ] All stores have phone numbers visible
- [ ] All stores have emails visible
- [ ] All stores show `converted: false` (prospects)
- [ ] Test registration works
- [ ] Test dashboard loads correctly
- [ ] No console errors

---

## 🚨 If Something Goes Wrong

### Migration Failed?
```sql
-- In Supabase SQL Editor:
ROLLBACK;
-- Then message me with the error
```

### CSV Import Failed?
```bash
# Check error message
# Common fixes:

# Fix 1: Wrong directory
cd /Users/oscarmullikin/tapify-marketplace
node scripts/import_prospects.js

# Fix 2: Missing dependencies
npm install @supabase/supabase-js

# Fix 3: Missing .env.local
cp .env.local.example .env.local
# Then add your Supabase credentials
```

### Admin Panel Shows Blanks?
```sql
-- Re-run consolidation query in Supabase SQL Editor:
UPDATE retailers r
SET
  phone = COALESCE(r.phone, ro.owner_phone),
  email = COALESCE(r.email, ro.owner_email)
FROM retailer_owners ro
WHERE r.id = ro.retailer_id;
```

---

## 📚 Full Documentation

For complete details, see:
- `CHANGES_SUMMARY.md` - What changed and why
- `DATABASE_CONSOLIDATION_PLAN.md` - Original analysis and strategy
- `MIGRATION_SCRIPT.sql` - Complete database migration

---

## 🎉 You're Done!

Once all checkboxes are ✅, you have:

✅ **Phase 1 optimized** - Lean database, no redundant data
✅ **Phase 2 ready** - Sourcer tracking in place
✅ **750 prospects** - Ready for cold calling
✅ **Admin panel fixed** - All contact data visible
✅ **Performance improved** - Faster queries with indexes

Time to start calling those Pet Supplies Plus stores! 🐾📞
