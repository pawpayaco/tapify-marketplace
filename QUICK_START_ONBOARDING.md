# 🚀 Quick Start: Onboarding Integration

## ⏱️ 3 Required Manual Steps

### **1️⃣ Run SQL Setup** (2 minutes)

**Open file:** `sql/README--setup.sql`

**Copy-paste into Supabase SQL Editor** → Click "Run"

**Verify:**
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'retailers' 
AND indexname LIKE 'idx_retailers%';
```
Expected: 3 rows ✅

---

### **2️⃣ Add DATABASE_URL** (1 minute)

Edit `.env.local`:

```bash
# Get from: Supabase Dashboard → Project Settings → Database → Connection string (URI)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.YOUR_PROJECT.supabase.co:5432/postgres"
```

**Replace `[PASSWORD]` with your actual database password!**

---

### **3️⃣ Restart Server** (30 seconds)

```bash
npm run dev
```

---

## ✅ Quick Test

**Test autocomplete:**
```bash
curl "http://localhost:3000/api/retailers/search?query=coffee"
```

Expected: `{"results":[...]}`

**Test in browser:**
1. Go to `http://localhost:3000/onboard/register`
2. Start typing a store name
3. Suggestions should appear! ✨

---

## 🎯 What This Enables

### **For Public Users:**
- Search existing stores (autocomplete)
- Add new stores
- Create password + Supabase auth account
- Complete registration in one flow

### **For Admins:**
- Add owner info for outreach tracking
- Track leads without creating accounts
- Two-button approach:
  - "📧 Add Owner" = Outreach tracking only
  - "Register" = Full account creation

---

## 🔄 Two Registration Paths

### **Path 1: Public Onboarding** (creates auth user)
```
/onboard/register → autocomplete → password → creates Supabase auth user
```

### **Path 2: Admin Outreach** (no auth user)
```
/admin/stores → Add Owner → tracks contact info only
```

---

## 📁 New API Endpoints

| Endpoint | Purpose | Creates Auth User? |
|----------|---------|-------------------|
| `GET /api/retailers/search` | Autocomplete | No |
| `POST /api/retailers/create` | Add new store | No |
| `POST /api/onboard/register` | Full registration | **YES** ✅ |
| `POST /api/admin/add-owner` | Admin tracking | No |

---

## 🐛 Troubleshooting

### **Autocomplete not working?**
→ Run SQL setup, verify indexes created

### **"DATABASE_URL is required"?**
→ Add to `.env.local`, restart server

### **"Failed to create user"?**
→ Email already exists, or `SUPABASE_SERVICE_ROLE_KEY` not set

---

## 📚 Full Documentation

- **Complete Guide**: `ONBOARDING_INTEGRATION_PR.md`
- **SQL Setup**: `sql/README--setup.sql`
- **Testing**: See PR guide for 7 comprehensive tests

---

**Ready?** Run the 3 steps above and test at `/onboard/register` 🎉

