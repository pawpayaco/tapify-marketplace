# 🏪 Stores / Outreach Admin Flow - Setup Guide

## ✅ What Was Implemented

A complete admin flow for managing store outreach campaigns with:

1. **Database Schema** - Tables and indexes for retailers, owners, and outreach tracking
2. **Admin UI** - Full-featured stores management dashboard
3. **Data Grid** - Filterable, searchable store list with bulk actions
4. **Registration Form** - Store owner registration with autocomplete
5. **API Endpoints** - Server-side transaction handling with `pg`
6. **CSV Export** - Export filtered store data
7. **Bulk Operations** - Mark multiple stores as "cold email sent"

---

## 📋 Files Created/Modified

### **New Files:**
```
/migrations/stores_outreach.sql          # Database migration
/pages/api/register-store.js             # Store registration API (pg transaction)
/pages/api/stores/bulk-update.js         # Bulk operations API
/pages/admin/stores.js                   # Main stores admin page
/components/StoresDataGrid.js            # Store list with filters
/components/StoreRegistrationForm.js     # Owner registration form
```

### **Modified Files:**
```
/pages/admin.js                          # Added "Stores" tab
/package.json                            # Added pg dependency
```

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

Open your **Supabase SQL Editor** and run:

```sql
-- Copy and paste the ENTIRE contents of migrations/stores_outreach.sql
-- OR run these commands directly:

-- Add owner_email column
ALTER TABLE IF EXISTS public.retailer_owners
  ADD COLUMN IF NOT EXISTS owner_email text;

-- Create unique index for upsert
CREATE UNIQUE INDEX IF NOT EXISTS ux_retailer_owner_by_retailer_email
ON public.retailer_owners (retailer_id, owner_email);

-- Add place_id to retailers
ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS place_id text;

-- Create unique index on place_id
CREATE UNIQUE INDEX IF NOT EXISTS ux_retailers_place_id 
ON public.retailers (place_id);

-- Add outreach tracking columns
ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS cold_email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cold_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS store_phone text,
  ADD COLUMN IF NOT EXISTS store_website text,
  ADD COLUMN IF NOT EXISTS address text;

-- Create filter indexes
CREATE INDEX IF NOT EXISTS idx_retailers_source ON public.retailers (source);
CREATE INDEX IF NOT EXISTS idx_retailers_converted ON public.retailers (converted);
CREATE INDEX IF NOT EXISTS idx_retailers_cold_email_sent ON public.retailers (cold_email_sent);

-- Create retailer_outreach table
CREATE TABLE IF NOT EXISTS public.retailer_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE CASCADE,
  campaign text,
  channel text DEFAULT 'email',
  registered boolean DEFAULT false,
  registered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create outreach indexes
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_retailer_id ON public.retailer_outreach (retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_campaign ON public.retailer_outreach (campaign);

-- Add owner columns
ALTER TABLE public.retailer_owners
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS owner_phone text,
  ADD COLUMN IF NOT EXISTS collected_by text,
  ADD COLUMN IF NOT EXISTS collected_at timestamptz DEFAULT now();
```

**Verify:**
```sql
-- Check retailers columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'retailers' AND table_schema = 'public';

-- Check retailer_outreach exists
SELECT * FROM public.retailer_outreach LIMIT 1;
```

---

### **Step 2: Add Database Connection String**

The `/api/register-store` endpoint requires direct database access via `pg`.

**Option A: Use Supabase Connection String (Recommended)**

Add to `.env.local`:
```bash
# Get this from Supabase Dashboard → Project Settings → Database → Connection string
# Make sure to use "Connection pooling" mode for production
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Where to find:**
1. Go to Supabase Dashboard
2. Click **Project Settings** → **Database**
3. Scroll to **Connection string**
4. Select **URI** (or **Pooler** for production)
5. Copy the connection string (replace `[YOUR-PASSWORD]` with your actual password)

**Option B: Use Service Role URL (Alternative)**

If you prefer to use the service role key instead:
```bash
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

---

### **Step 3: Restart Dev Server**

After adding `DATABASE_URL`:
```bash
# Stop your dev server (Ctrl+C)
npm run dev
```

---

## 🎯 How to Use

### **Access the Stores Dashboard**

1. Open `http://localhost:3000/admin`
2. Log in with admin credentials
3. Click the **"Stores"** tab
4. Click **"Open Stores Dashboard"**

You'll see two views:

#### **📊 Store List View**
- **Search**: Filter by name or address
- **State Filter**: Filter by US state
- **Checkboxes**: "Converted Only" or "Email Sent Only"
- **Bulk Actions**:
  - Select multiple stores (checkboxes)
  - Click **"📧 Mark Cold Email Sent"**
- **Export CSV**: Downloads filtered results
- **Register**: Click on any store to register an owner

#### **✍️ Register Owner View**
- **Select Store**: Autocomplete dropdown
- **Owner Contact**: Name, phone, email (at least one required)
- **Campaign**: Tracking identifier (e.g., `cold-email-2025-10`)
- **Submit**: Runs DB transaction that:
  1. Marks retailer as `converted = true`
  2. Upserts owner contact (updates if email exists)
  3. Creates outreach record

---

## 🔒 Security Notes

### **API Endpoints:**

1. **`/api/register-store`**:
   - Uses `pg` with `DATABASE_URL` (server-side only)
   - Never exposed to browser
   - Runs atomic transaction (all or nothing)

2. **`/api/stores/bulk-update`**:
   - Uses `supabaseAdmin` (service role key)
   - Server-side only
   - Validates admin authentication via `getServerSideProps`

### **Admin Protection:**

Both `/admin` and `/admin/stores` use the same auth pattern:
- Server-side auth check in `getServerSideProps`
- Validates user is in `admins` table
- Redirects to login if unauthorized

---

## 📊 Database Transaction Details

When you register a store owner, `/api/register-store` runs:

```sql
BEGIN;

-- 1. Mark retailer as converted
UPDATE public.retailers 
SET converted = true, converted_at = now() 
WHERE id = $1;

-- 2. Upsert owner contact
INSERT INTO public.retailer_owners 
  (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at)
VALUES ($1, $2, $3, $4, $5, now())
ON CONFLICT (retailer_id, owner_email) DO UPDATE
  SET owner_name = EXCLUDED.owner_name, 
      owner_phone = EXCLUDED.owner_phone, 
      collected_at = now();

-- 3. Create outreach record
INSERT INTO public.retailer_outreach 
  (retailer_id, campaign, channel, registered, registered_at, notes)
VALUES ($1, $2, 'email', true, now(), $3);

COMMIT;
```

If any step fails, the entire transaction is rolled back.

---

## 🧪 Testing the Flow

### **Test 1: List Stores**
1. Open `/admin/stores`
2. Verify stores load from `retailers` table
3. Test filters (search, state, converted)

### **Test 2: Register Owner**
1. Click "Register Owner" tab
2. Select a store from dropdown
3. Fill in owner info (name, phone, email)
4. Submit form
5. Verify success toast

**Check Database:**
```sql
-- Check retailer was marked converted
SELECT id, name, converted, converted_at 
FROM retailers 
WHERE id = '<retailer-id>';

-- Check owner was created
SELECT * FROM retailer_owners 
WHERE retailer_id = '<retailer-id>';

-- Check outreach record
SELECT * FROM retailer_outreach 
WHERE retailer_id = '<retailer-id>';
```

### **Test 3: Bulk Mark Cold Email Sent**
1. Select multiple stores (checkboxes)
2. Click "📧 Mark Cold Email Sent"
3. Confirm dialog
4. Verify success toast

**Check Database:**
```sql
SELECT id, name, cold_email_sent, cold_email_sent_at 
FROM retailers 
WHERE cold_email_sent = true;
```

### **Test 4: Export CSV**
1. Apply some filters
2. Click "📥 Export CSV"
3. Verify CSV downloads with filtered data

### **Test 5: Duplicate Registration**
1. Register the same owner (same email) for the same store
2. Verify it updates existing record instead of creating duplicate
3. Check `collected_at` timestamp was updated

---

## 🐛 Troubleshooting

### **Error: "DATABASE_URL is required"**
- Add `DATABASE_URL` to `.env.local`
- Restart dev server
- Verify connection string is correct

### **Error: "relation retailer_outreach does not exist"**
- Run the database migration SQL in Supabase SQL Editor
- Verify table was created: `SELECT * FROM retailer_outreach LIMIT 1;`

### **Error: "User not in admins table"**
- Run: `INSERT INTO admins (id, email) VALUES ('<user-id>', '<user-email>');`
- Get user ID from error message or Supabase Auth dashboard

### **Store dropdown is empty**
- Verify `retailers` table has data
- Check browser console for Supabase errors
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set

### **Transaction fails**
- Check server logs (terminal where `npm run dev` is running)
- Verify all required columns exist in database
- Check `DATABASE_URL` has correct permissions

---

## 📈 Next Steps (Optional Enhancements)

1. **Add Campaigns Table**:
   ```sql
   CREATE TABLE campaigns (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text UNIQUE NOT NULL,
     channel text,
     started_at timestamptz,
     ended_at timestamptz
   );
   ```

2. **Add Pagination** (if >1000 stores):
   - Use Supabase `.range(start, end)`
   - Add page controls to data grid

3. **Add Email Logging**:
   - Track each email send event
   - Calculate open rates and conversions

4. **Add Owner Details View**:
   - Click store → view all associated owners
   - Edit/delete owner contacts

5. **Add Charts/Analytics**:
   - Conversion rate by campaign
   - Timeline of cold emails sent
   - Geographic distribution

---

## 📝 Summary of Changes

| File | Purpose | Type |
|------|---------|------|
| `migrations/stores_outreach.sql` | DB schema | SQL Migration |
| `pages/api/register-store.js` | Store registration endpoint | API (pg transaction) |
| `pages/api/stores/bulk-update.js` | Bulk operations | API (Supabase Admin) |
| `pages/admin/stores.js` | Main admin page | Next.js Page |
| `components/StoresDataGrid.js` | Store list with filters | React Component |
| `components/StoreRegistrationForm.js` | Owner registration form | React Component |
| `pages/admin.js` | Added Stores tab | Modified |
| `package.json` | Added pg dependency | Modified |

---

## 🎉 You're All Set!

The Stores/Outreach admin flow is now fully implemented and ready to use.

**Quick Start Checklist:**
- ✅ Run migration SQL in Supabase
- ✅ Add `DATABASE_URL` to `.env.local`
- ✅ Restart dev server
- ✅ Navigate to `/admin` → **Stores** tab
- ✅ Test registration flow

**Questions?** Check the troubleshooting section above or review the inline comments in each file.

