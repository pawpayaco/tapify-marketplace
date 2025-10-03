# 🚀 Quick Start: Register Store Implementation

## ⏱️ 3-Minute Setup

### Step 1: Run Migration (2 minutes)

**Copy-paste this into Supabase SQL Editor:**

Open file: `migrations/2025-10-register-store.sql`

**Or use this one-liner:**
```sql
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS owner_name text, ADD COLUMN IF NOT EXISTS manager_name text, ADD COLUMN IF NOT EXISTS phone text, ADD COLUMN IF NOT EXISTS express_shipping boolean DEFAULT false, ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false, ADD COLUMN IF NOT EXISTS onboarding_step text; CREATE UNIQUE INDEX IF NOT EXISTS retailer_owners_retailer_email_uniq ON public.retailer_owners (retailer_id, owner_email); CREATE OR REPLACE FUNCTION public.register_store_transaction(p_retailer_id uuid,p_owner_name text,p_owner_phone text,p_owner_email text,p_campaign text,p_collected_by text,p_notes text) RETURNS jsonb LANGUAGE plpgsql AS $$ DECLARE v_owner_id uuid; v_outreach_id uuid; v_retailer_row public.retailers%ROWTYPE; BEGIN UPDATE public.retailers SET converted = true, converted_at = now(), owner_name = COALESCE(NULLIF(p_owner_name, ''), owner_name), phone = COALESCE(NULLIF(p_owner_phone, ''), phone), email = COALESCE(NULLIF(p_owner_email, ''), email) WHERE id = p_retailer_id RETURNING * INTO v_retailer_row; IF NOT FOUND THEN RAISE EXCEPTION 'Retailer not found: %', p_retailer_id; END IF; IF COALESCE(p_owner_email, '') <> '' THEN INSERT INTO public.retailer_owners (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at) VALUES (p_retailer_id, p_owner_name, p_owner_phone, p_owner_email, p_collected_by, now()) ON CONFLICT (retailer_id, owner_email) DO UPDATE SET owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), retailer_owners.owner_name), owner_phone = COALESCE(NULLIF(EXCLUDED.owner_phone, ''), retailer_owners.owner_phone), collected_at = now() RETURNING id INTO v_owner_id; ELSE INSERT INTO public.retailer_owners (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at) VALUES (p_retailer_id, p_owner_name, p_owner_phone, NULL, p_collected_by, now()) RETURNING id INTO v_owner_id; END IF; INSERT INTO public.retailer_outreach (retailer_id, campaign, channel, registered, registered_at, notes, created_at) VALUES (p_retailer_id, p_campaign, 'email', true, now(), COALESCE(p_notes, ''), now()) RETURNING id INTO v_outreach_id; RETURN jsonb_build_object('ok', true, 'retailer', to_jsonb(v_retailer_row), 'owner_id', v_owner_id, 'outreach_id', v_outreach_id); EXCEPTION WHEN OTHERS THEN RAISE; END; $$;
```

---

### Step 2: Add Env Var (30 seconds)

Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-from-supabase-dashboard"
```

Get from: **Supabase Dashboard** → **Project Settings** → **API** → **service_role key**

---

### Step 3: Restart (30 seconds)

```bash
npm run dev
```

---

## ✅ Quick Test

```bash
# Get a retailer UUID from your database first
curl -X POST http://localhost:3000/api/register-store \
  -H "Content-Type: application/json" \
  -d '{"retailer_id":"PASTE_UUID_HERE","owner_name":"Test","owner_email":"test@example.com"}'
```

**Expected:** `{"ok":true,"result":{...}}`

---

## 📚 Full Documentation

- **Complete Setup & Testing**: `dev-setup/README_REGISTER_STORE.md`
- **Implementation Details**: `REGISTER_STORE_IMPLEMENTATION.md`
- **Migration File**: `migrations/2025-10-register-store.sql`
- **Rollback**: `migrations/rollback.sql`

---

## 🎯 What Changed

| File | What Changed |
|------|-------------|
| `pages/api/register-store.js` | ✅ Now uses Supabase RPC (cleaner, simpler) |
| `pages/onboard/register.js` | ✅ Calls API after creating retailer |
| `components/StoresDataGrid.js` | ✅ Shows new fields (phone, owner_name) |
| `migrations/2025-10-register-store.sql` | ✨ **NEW** - Run this in Supabase! |

---

## 🔒 Security

- ✅ Uses service role key (server-side only)
- ✅ Never exposed to browser
- ✅ Atomic transactions (all or nothing)
- ✅ No pg package needed

---

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| "function does not exist" | Run the migration SQL |
| "Missing SERVICE_ROLE_KEY" | Add to `.env.local` and restart |
| "column does not exist" | Run the migration SQL |

---

**Need help?** Check `dev-setup/README_REGISTER_STORE.md` for detailed instructions.

