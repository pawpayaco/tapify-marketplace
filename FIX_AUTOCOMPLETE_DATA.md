# 🔧 Fix: Autocomplete Shows "Add New Store" Only

## ✅ Problem

The autocomplete dropdown works, but it only shows "No stores found" and "Add new store" button. This means your `retailers` table is empty or has no matching data.

## 🎯 Solution: Add Sample Data

### **Quick Fix (2 minutes)**

1. **Open Supabase SQL Editor:**
   - Go to your Supabase Dashboard
   - Click **SQL Editor** in the left sidebar

2. **Run this query to add sample retailers:**

Open the file I just created: **`sql/sample-retailers.sql`**

Copy the entire contents and paste into Supabase SQL Editor, then click **"Run"**.

This will add 10 sample retailers including:
- Pet Paradise
- Petco Store
- Pet Supplies Plus
- Pet Grooming Plus
- Coffee Corner
- Yoga Studio
- And more...

3. **Test autocomplete:**
   - Go back to `http://localhost:3000/onboard/register`
   - Type "pet" in Store Name field
   - **You should now see:** 4 pet-related stores!

---

## 🧪 Verify It Worked

### **In Supabase SQL Editor, run:**

```sql
-- Check total retailers
SELECT COUNT(*) FROM retailers;

-- Search for "pet" stores
SELECT name, address FROM retailers 
WHERE name ILIKE '%pet%';

-- Should return:
-- Pet Paradise
-- Petco Store
-- Pet Supplies Plus
-- Pet Grooming Plus
```

### **In your app:**

1. Type "pet" → Should show 4 stores ✅
2. Type "coffee" → Should show Coffee Corner ✅
3. Type "yoga" → Should show Yoga Studio Downtown ✅

---

## 🔄 Alternative: Check Current Data

If you think you already have retailers, run this to see what's there:

```sql
SELECT id, name, address, email, created_at 
FROM retailers 
ORDER BY created_at DESC 
LIMIT 20;
```

If you see data but autocomplete doesn't work, the issue might be:

1. **Server needs restart:**
   ```bash
   # Stop server (Ctrl+C), then:
   npm run dev
   ```

2. **Check server logs** when you type in the autocomplete field - you should see:
   ```
   [Autocomplete] Searching for: pet
   [Autocomplete] Found X results
   ```

3. **Test the API directly:**
   ```bash
   curl "http://localhost:3000/api/retailers/search?query=pet"
   ```
   Should return: `{"results":[...]}`

---

## 🎨 Import Your Own Retailers

If you have a CSV or existing data, you can import it:

### **From CSV:**

```sql
-- Example: Import from a CSV-like format
INSERT INTO retailers (name, address, email, phone, source)
VALUES 
  ('Your Store Name', '123 Your Address', 'email@store.com', '555-1234', 'import'),
  ('Another Store', '456 Another St', 'info@store2.com', '555-5678', 'import');
```

### **From staging_stores table:**

If you have data in `staging_stores`:

```sql
INSERT INTO retailers (name, address, location, phone, email, source, place_id, created_at)
SELECT 
  name,
  formatted_address,
  formatted_address,
  formatted_phone_number,
  NULL, -- email (add if available)
  source,
  place_id,
  now()
FROM staging_stores
WHERE name IS NOT NULL
ON CONFLICT (place_id) DO NOTHING;
```

---

## ✅ Success Criteria

After adding sample data:

- ✅ Type "pet" → Shows 4 pet stores
- ✅ Type "coffee" → Shows Coffee Corner
- ✅ Click on a store → Auto-fills address, email, phone
- ✅ No more "No stores found" for common searches
- ✅ "Add new store" button still available if nothing matches

---

## 🚀 Next Steps

Once autocomplete works with sample data:

1. Replace sample data with your actual retailers
2. Or keep testing with sample data
3. The "Add new store" button will let users add stores that aren't in the database

---

**Quick Start:**
1. Copy `sql/sample-retailers.sql` to Supabase SQL Editor
2. Click "Run"
3. Refresh your onboarding page
4. Type "pet" - autocomplete should work! 🎉

