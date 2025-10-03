# 🔧 Autocomplete Dropdown Fix

## ❌ Problem

The store name autocomplete dropdown is not showing because `DATABASE_URL` is not configured.

## ✅ Solution

### **Step 1: Get Your Database Password**

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `hoaixfylzqnpkojsfnvv`
3. Click **Project Settings** (gear icon)
4. Click **Database** in the sidebar
5. Scroll to **Connection string**
6. Select **URI** tab
7. Copy the password (or reset it if needed)

### **Step 2: Add DATABASE_URL to .env.local**

I've added a template to your `.env.local`. Now edit it:

```bash
# Open .env.local and replace [YOUR-PASSWORD] with your actual password:
nano .env.local

# Or use your code editor:
code .env.local
```

**Replace this line:**
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.hoaixfylzqnpkojsfnvv.supabase.co:5432/postgres
```

**With your actual password:**
```bash
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.hoaixfylzqnpkojsfnvv.supabase.co:5432/postgres
```

### **Step 3: Restart Dev Server**

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

---

## 🧪 Test It Works

1. Go to `http://localhost:3000/onboard/register`
2. Click in the "Store Name" field
3. Type any 2+ characters (e.g., "co")
4. **Expected:** Dropdown appears with:
   - Loading spinner (while searching)
   - List of matching stores OR
   - "No stores found" message + "Add new store" button

### **Check Browser Console:**

Open DevTools (F12) → Console tab

You should see:
```
[Autocomplete] Searching for: co
[Autocomplete] API response: {results: [...]}
[Autocomplete] Found X results
```

---

## 🐛 Still Not Working?

### **Check 1: DATABASE_URL is correct**

```bash
# Test the connection:
curl "http://localhost:3000/api/retailers/search?query=test"

# Expected: {"results":[...]}
# Not: {"error":"..."}
```

### **Check 2: Verify env var is loaded**

Add this temporarily to `pages/api/retailers/search.js` at the top:
```javascript
console.log('DATABASE_URL set?', !!process.env.DATABASE_URL);
```

Then check server logs when you type in the store name field.

### **Check 3: Run SQL setup**

If you haven't already, run the SQL indexes:

1. Open `sql/README--setup.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"

### **Check 4: Verify retailers table has data**

Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM retailers;
```

If it returns 0, you need to add some test data:
```sql
INSERT INTO retailers (name, address, email, source)
VALUES 
  ('Coffee Shop', '123 Main St, New York, NY', 'coffee@example.com', 'test'),
  ('Yoga Studio', '456 Oak Ave, Los Angeles, CA', 'yoga@example.com', 'test'),
  ('Bookstore', '789 Elm St, Chicago, IL', 'books@example.com', 'test');
```

---

## ✅ Success Criteria

After fixing:

- ✅ Type in store name → dropdown appears (even if empty)
- ✅ Shows "Searching..." spinner
- ✅ Shows results if found
- ✅ Shows "No stores found" + "Add new store" if not found
- ✅ Console shows search logs
- ✅ No error messages

---

## 📝 What Changed

I've also updated the autocomplete to:
- ✅ Always show dropdown when typing 2+ characters (even if empty)
- ✅ Show loading spinner while searching
- ✅ Show helpful "No stores found" message
- ✅ Better error handling with console logs
- ✅ Error messages display on page if API fails

---

**Next:** After adding `DATABASE_URL` and restarting, the autocomplete should work! 🎉

