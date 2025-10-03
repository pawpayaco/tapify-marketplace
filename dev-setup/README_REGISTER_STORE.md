# 📋 Register Store Setup & Testing Guide

## ⚠️ Important: Migration Required

**Cursor DID NOT run the SQL migration automatically.** You must manually run the migration in Supabase SQL Editor before testing.

---

## 🚀 Setup Instructions

### Step 1: Run SQL Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Copy the **entire contents** of `migrations/2025-10-register-store.sql`
4. Paste into SQL Editor
5. Click **"Run"**

**What this migration does:**
- Adds new columns to `retailers` table: `owner_name`, `manager_name`, `phone`, `express_shipping`, `onboarding_completed`, `onboarding_step`
- Creates unique index on `retailer_owners(retailer_id, owner_email)` for deduplication
- Creates PostgreSQL function `register_store_transaction()` for atomic operations

**Expected output:** "Success. No rows returned"

---

### Step 2: Set Environment Variables

Edit `.env.local` in your project root:

```bash
# Required for server-side operations
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...." # Get from Supabase Dashboard

# Optional: For admin API protection
NEXT_PUBLIC_ADMIN_API_SECRET="your-secret-key-here"
ADMIN_API_SECRET="your-secret-key-here"
```

**Where to find these:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard → Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Project Settings → API → service_role key (⚠️ Keep secret!)

---

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🧪 Testing Checklist

### ✅ Test 1: Verify Migration

Run in **Supabase SQL Editor**:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'retailers' 
AND column_name IN ('owner_name', 'manager_name', 'phone', 'express_shipping', 'onboarding_completed', 'onboarding_step');
```

**Expected:** 6 rows returned

```sql
-- Check function exists
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname = 'register_store_transaction';
```

**Expected:** 1 row with `pronargs = 7`

---

### ✅ Test 2: Test RPC Function Directly

Get a retailer UUID from your database:

```sql
SELECT id, name FROM retailers LIMIT 1;
```

Then test the RPC function:

```sql
SELECT public.register_store_transaction(
  'REPLACE_WITH_ACTUAL_RETAILER_UUID'::uuid,
  'Test Owner',
  '555-000-0000',
  'owner+test@example.com',
  'cold-email-test',
  'admin-ui',
  'Testing RPC function'
);
```

**Expected result:**
```json
{
  "ok": true,
  "retailer": {...},
  "owner_id": "uuid-here",
  "outreach_id": "uuid-here"
}
```

**Verify in database:**
```sql
-- Check retailer was marked as converted
SELECT id, name, converted, converted_at, owner_name, phone, email 
FROM retailers 
WHERE id = 'RETAILER_UUID';

-- Check owner was created
SELECT * FROM retailer_owners 
WHERE retailer_id = 'RETAILER_UUID';

-- Check outreach was tracked
SELECT * FROM retailer_outreach 
WHERE retailer_id = 'RETAILER_UUID';
```

---

### ✅ Test 3: Test API Endpoint (cURL)

```bash
# Replace RETAILER_UUID with actual UUID from your database
curl -X POST http://localhost:3000/api/register-store \
  -H "Content-Type: application/json" \
  -d '{
    "retailer_id": "RETAILER_UUID",
    "owner_name": "Jane Doe",
    "owner_phone": "555-111-2222",
    "owner_email": "jane+curl@example.com",
    "campaign": "curl-test-2025",
    "collected_by": "curl-test"
  }'
```

**Expected response:**
```json
{
  "ok": true,
  "result": {
    "ok": true,
    "retailer": {...},
    "owner_id": "uuid",
    "outreach_id": "uuid"
  }
}
```

---

### ✅ Test 4: Test Public Registration Flow

1. Navigate to `http://localhost:3000/onboard/register`
2. Fill in the registration form:
   - Store Name: "Test Coffee Shop"
   - Owner Name: "John Smith"
   - Email: "john+test@example.com"
   - Phone: "555-123-4567"
   - Store Address: "123 Main St, City, State"
3. Submit the form
4. **Expected behavior:**
   - Form submits successfully
   - Redirects to Shopify connect page
   - Check browser console: should see no errors

**Verify in database:**
```sql
-- Find the newly created retailer
SELECT id, name, owner_name, phone, email, converted, onboarding_step 
FROM retailers 
WHERE email = 'john+test@example.com' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check retailer_owners was created
SELECT * FROM retailer_owners 
WHERE owner_email = 'john+test@example.com';

-- Check retailer_outreach was tracked
SELECT * FROM retailer_outreach 
WHERE campaign = 'public-registration-2025' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### ✅ Test 5: Test Admin Registration (via Admin UI)

1. Navigate to `http://localhost:3000/admin/stores`
2. Log in as admin
3. Click **"Register Owner"** tab
4. Select a store from dropdown
5. Fill in owner details:
   - Owner Name: "Admin Test Owner"
   - Owner Phone: "555-999-8888"
   - Owner Email: "admin+test@example.com"
   - Campaign: "admin-test-2025"
6. Click **"Register Store"**

**Expected behavior:**
- Success toast appears
- Form resets
- Store list refreshes

**Verify in database:**
```sql
SELECT * FROM retailer_owners 
WHERE owner_email = 'admin+test@example.com';

SELECT * FROM retailer_outreach 
WHERE campaign = 'admin-test-2025' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### ✅ Test 6: Test Duplicate Email Handling (Upsert)

Register the **same owner email** for the **same retailer** twice.

**Expected behavior:**
- No duplicate error
- Second registration **updates** the existing `retailer_owners` record
- `collected_at` timestamp is updated
- Only **one** owner record exists per retailer+email combination

**Verify:**
```sql
-- Should return only 1 row (not 2)
SELECT COUNT(*) FROM retailer_owners 
WHERE retailer_id = 'RETAILER_UUID' 
AND owner_email = 'test@example.com';
```

---

### ✅ Test 7: Test Error Handling

**Test with invalid retailer_id:**
```bash
curl -X POST http://localhost:3000/api/register-store \
  -H "Content-Type: application/json" \
  -d '{
    "retailer_id": "00000000-0000-0000-0000-000000000000",
    "owner_name": "Test",
    "owner_email": "test@example.com"
  }'
```

**Expected response:**
```json
{
  "ok": false,
  "error": "Retailer not found: 00000000-0000-0000-0000-000000000000"
}
```

**Test with missing fields:**
```bash
curl -X POST http://localhost:3000/api/register-store \
  -H "Content-Type: application/json" \
  -d '{"retailer_id": "some-uuid"}'
```

**Expected response:**
```json
{
  "ok": false,
  "error": "At least one owner field (name, phone, or email) is required"
}
```

---

## 🐛 Troubleshooting

### Issue: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Solution:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the **service_role** key (not the anon key!)
3. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
   ```
4. Restart server: `npm run dev`

---

### Issue: "function register_store_transaction does not exist"

**Solution:**
1. Run the migration in Supabase SQL Editor (see Step 1)
2. Verify function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'register_store_transaction';
   ```

---

### Issue: "column retailers.owner_name does not exist"

**Solution:**
1. Run the migration in Supabase SQL Editor (see Step 1)
2. Verify columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'retailers' 
   AND column_name IN ('owner_name', 'phone');
   ```

---

### Issue: "duplicate key value violates unique constraint"

**This is expected behavior** if you try to register the same email for the same retailer twice. The RPC function will **UPDATE** instead of insert.

**To verify upsert is working:**
```sql
-- Register twice with same email
SELECT public.register_store_transaction(
  'RETAILER_UUID'::uuid, 'Name 1', '111-1111', 'same@example.com', 'test', 'admin', 'first'
);

SELECT public.register_store_transaction(
  'RETAILER_UUID'::uuid, 'Name 2', '222-2222', 'same@example.com', 'test', 'admin', 'second'
);

-- Check: should be only 1 row with updated name "Name 2"
SELECT owner_name, owner_phone FROM retailer_owners 
WHERE owner_email = 'same@example.com';
```

---

## 📊 Database Schema Reference

### Retailers (New Columns)
```sql
owner_name           text             -- Store owner's name
manager_name         text             -- Store manager's name (if different)
phone                text             -- Primary contact phone
express_shipping     boolean          -- Opted for express shipping
onboarding_completed boolean          -- Onboarding flow completed
onboarding_step      text             -- Current step in onboarding
```

### Retailer Owners (Unique Constraint)
```sql
UNIQUE (retailer_id, owner_email)    -- Prevents duplicate owners per store
```

### RPC Function Signature
```sql
register_store_transaction(
  p_retailer_id    uuid,
  p_owner_name     text,
  p_owner_phone    text,
  p_owner_email    text,
  p_campaign       text,
  p_collected_by   text,
  p_notes          text
) RETURNS jsonb
```

---

## 🔒 Security Notes

1. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It's only used server-side in `/api/register-store`.

2. **Admin API Secret**: Optional protection layer. If set, the API requires `x-admin-secret` header.

3. **RLS (Row Level Security)**: The RPC function runs with elevated privileges, bypassing RLS. Ensure proper validation in the API endpoint.

4. **Input Validation**: The API validates all inputs before calling the RPC function.

---

## 🔄 Rollback Instructions

If you need to rollback the migration (⚠️ **WARNING: This deletes data!**):

```sql
-- Run migrations/rollback.sql in Supabase SQL Editor
-- This will drop all new columns and the RPC function
```

---

## ✅ Success Criteria

After running all tests, you should have:

- ✅ `register_store_transaction()` function exists in Postgres
- ✅ New columns exist on `retailers` table
- ✅ Unique index on `retailer_owners(retailer_id, owner_email)`
- ✅ API endpoint responds at `/api/register-store`
- ✅ Public registration flow creates records in all 3 tables
- ✅ Admin registration flow creates records in all 3 tables
- ✅ Duplicate emails are handled via upsert (no errors)
- ✅ Error handling works for invalid inputs

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `migrations/2025-10-register-store.sql` | New migration (must run manually) |
| `migrations/rollback.sql` | Rollback script (emergency use) |
| `pages/api/register-store.js` | Replaced with RPC-based implementation |
| `pages/onboard/register.js` | Added call to `/api/register-store` after retailer insert |
| `components/StoresDataGrid.js` | Updated select query to include new fields |
| `components/StoreRegistrationForm.js` | Already updated to use API endpoint |
| `dev-setup/README_REGISTER_STORE.md` | This file |

---

## 🎯 Next Steps

After successful testing:

1. ✅ Commit the code changes
2. ✅ Deploy to staging environment
3. ✅ Run migration on staging database
4. ✅ Test on staging
5. ✅ Deploy to production
6. ✅ Run migration on production database (during low-traffic window)

---

## 💡 Tips

- **Use different emails for testing**: Append `+test1`, `+test2` to avoid duplicates (e.g., `user+test1@example.com`)
- **Check browser console**: Look for API errors during registration
- **Check server logs**: Run `npm run dev` in terminal to see server-side errors
- **Use Supabase Table Editor**: Quick way to verify data changes
- **Test edge cases**: Empty strings, null values, special characters in names

---

**Questions?** Check the inline comments in `pages/api/register-store.js` for additional details and unit test examples.

