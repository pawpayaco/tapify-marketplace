# 🚀 START HERE: Stores / Outreach Admin Setup

## ⏱️ 5-Minute Setup

Everything is implemented and ready. Follow these 3 steps:

---

## 📋 Step 1: Run Database Migration (2 minutes)

### **Option A: One-Click Copy-Paste (Easiest)**

1. Open the file: **`QUICK_SQL_MIGRATION.sql`** (in this directory)
2. Copy **entire file** (Cmd+A, Cmd+C)
3. Go to **Supabase Dashboard** → **SQL Editor**
4. Paste the SQL
5. Click **"Run"** ✅

### **Option B: Manual Commands**

Or paste this into Supabase SQL Editor:

```sql
-- Essential migration (copy-paste this entire block)
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS owner_email text;
CREATE UNIQUE INDEX IF NOT EXISTS ux_retailer_owner_by_retailer_email ON public.retailer_owners (retailer_id, owner_email);
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS place_id text;
CREATE UNIQUE INDEX IF NOT EXISTS ux_retailers_place_id ON public.retailers (place_id);
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS cold_email_sent boolean DEFAULT false;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS cold_email_sent_at timestamptz;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS converted boolean DEFAULT false;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS store_phone text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS store_website text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS address text;
CREATE INDEX IF NOT EXISTS idx_retailers_source ON public.retailers (source);
CREATE INDEX IF NOT EXISTS idx_retailers_converted ON public.retailers (converted);
CREATE INDEX IF NOT EXISTS idx_retailers_cold_email_sent ON public.retailers (cold_email_sent);
CREATE TABLE IF NOT EXISTS public.retailer_outreach (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), retailer_id uuid REFERENCES public.retailers(id) ON DELETE CASCADE, campaign text, channel text DEFAULT 'email', registered boolean DEFAULT false, registered_at timestamptz, notes text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_retailer_id ON public.retailer_outreach (retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_campaign ON public.retailer_outreach (campaign);
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS owner_phone text;
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS collected_by text;
ALTER TABLE public.retailer_owners ADD COLUMN IF NOT EXISTS collected_at timestamptz DEFAULT now();
```

### **Verify it worked:**
```sql
SELECT * FROM retailer_outreach LIMIT 1;
```
✅ If this runs without error, you're good!

---

## 🔑 Step 2: Add Database Connection (1 minute)

### **Get your connection string:**

1. Go to **Supabase Dashboard**
2. Click **Project Settings** (gear icon) → **Database**
3. Scroll to **"Connection string"**
4. Select **"URI"** (or "Pooler" for production)
5. Copy the string (looks like: `postgresql://postgres.xxxxx:...`)
6. **Replace `[YOUR-PASSWORD]` with your actual database password**

### **Add to .env.local:**

Edit `/Users/oscarmullikin/tapify-marketplace/.env.local` and add:

```bash
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Don't have .env.local?** Create it in the project root:
```bash
cd /Users/oscarmullikin/tapify-marketplace
touch .env.local
```

Then add the line above.

---

## ▶️ Step 3: Restart & Launch (1 minute)

```bash
# Stop your dev server (Ctrl+C if running)
# Then restart:
npm run dev
```

**Open in browser:**
```
http://localhost:3000/admin
```

1. Log in with your admin account
2. Click the **"Stores"** tab (new!)
3. Click **"Open Stores Dashboard"**
4. 🎉 You're in!

---

## ✅ Quick Test

Try this to verify everything works:

1. **View stores:** Click "Store List" → see your retailers
2. **Search:** Type a store name in search box
3. **Register owner:**
   - Click "Register Owner" tab
   - Select a store from dropdown
   - Enter owner name, phone, email
   - Click "Register Store"
   - ✅ Should see success toast
4. **Check database:**
   ```sql
   SELECT * FROM retailers WHERE converted = true LIMIT 5;
   SELECT * FROM retailer_owners LIMIT 5;
   SELECT * FROM retailer_outreach LIMIT 5;
   ```

---

## 📚 Documentation

- **Quick Setup:** This file (START_HERE.md)
- **Complete Guide:** `STORES_OUTREACH_SETUP.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`
- **SQL Migration:** `QUICK_SQL_MIGRATION.sql`

---

## 🎯 What You Can Do Now

### **Store List View:**
- 🔍 Search by name or address
- 🗺️ Filter by US state
- ✅ Filter by "converted" or "cold email sent"
- ☑️ Select multiple stores (checkboxes)
- 📧 Bulk action: "Mark Cold Email Sent"
- 📥 Export filtered data to CSV
- ➕ Click "Register" on any store

### **Register Owner View:**
- 🏪 Autocomplete store selection
- 📝 Enter owner contact (name, phone, email)
- 🏷️ Track campaign (e.g., "cold-email-2025-10")
- 💾 Submit → atomic transaction:
  - Marks retailer as converted
  - Saves/updates owner contact
  - Creates outreach tracking record

---

## 🐛 Troubleshooting

### **Error: "DATABASE_URL is required"**
→ Did you add `DATABASE_URL` to `.env.local`?  
→ Did you restart the dev server?

### **Error: "relation retailer_outreach does not exist"**
→ Run the SQL migration (Step 1 above)

### **Store dropdown is empty**
→ Check if `retailers` table has data:
```sql
SELECT COUNT(*) FROM retailers;
```

### **"User not in admins table"**
→ Add yourself as admin:
```sql
INSERT INTO admins (id, email) VALUES ('<your-id>', '<your-email>');
```
(Get your ID from Supabase Dashboard → Authentication → Users)

---

## 🎉 That's It!

You now have a complete stores/outreach management system with:

✅ Filterable store list  
✅ Owner registration with autocomplete  
✅ Bulk cold email tracking  
✅ CSV export  
✅ Atomic database transactions  
✅ Campaign tracking  

**Having issues?** Check `STORES_OUTREACH_SETUP.md` for detailed troubleshooting.

**Questions about implementation?** See `IMPLEMENTATION_SUMMARY.md` for architecture details.

---

**Quick Links:**
- Admin Dashboard: `http://localhost:3000/admin`
- Stores Dashboard: `http://localhost:3000/admin/stores`
- Supabase Dashboard: `https://supabase.com/dashboard`

