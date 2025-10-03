# 🔧 Fix DATABASE_URL - URL Encode Special Characters

## ❌ Problem

Your `DATABASE_URL` has special characters in the password that need to be URL-encoded:

**Current (broken):**
```
DATABASE_URL=postgresql://postgres:O!nv3st202521$@db.hoaixfylzqnpkojsfnvv.supabase.co:5432/postgres
```

The `!` and `$` characters break the connection string.

## ✅ Solution

**Open `.env.local` and replace line 38 with:**

```env
DATABASE_URL=postgresql://postgres:O%21nv3st202521%24@db.hoaixfylzqnpkojsfnvv.supabase.co:5432/postgres
```

**Changes:**
- `!` → `%21`
- `$` → `%24`

## 🚀 After Fixing

1. **Save `.env.local`**
2. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C in terminal)
   # Then restart:
   npm run dev
   ```

3. **Test autocomplete:**
   - Go to `http://localhost:3000/onboard/register`
   - Type any text in Store Name field
   - Autocomplete should now work! ✨

## 🧪 Quick Test

After restarting, run this to verify the connection works:

```bash
curl "http://localhost:3000/api/retailers/search?query=store"
```

**Expected:** `{"results":[...]}`  
**Not:** `{"error":"Search failed"...}`

---

## 📊 Check Your Data

Once connected, you can verify you have retailers in the database:

**Run in Supabase SQL Editor:**
```sql
SELECT COUNT(*) FROM retailers;
SELECT name, address FROM retailers LIMIT 10;
```

If you have 0 retailers, you can:
1. Use the sample data from `sql/sample-retailers.sql`, OR
2. Import from your staging_stores table

Let me know if you need help importing data!

