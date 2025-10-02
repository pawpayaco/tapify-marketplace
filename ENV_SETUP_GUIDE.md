# 🔐 Environment Variables Setup Guide

## ✅ What's Already Configured

### **Plaid (Sandbox)**
- ✅ `PLAID_CLIENT_ID`: 68db07dc1059f30020727751
- ✅ `PLAID_SECRET`: a0e905ba7d104e24e66408023f6351
- ✅ `PLAID_ENV`: sandbox

---

## ⚠️ What You Still Need to Add

Open `.env.local` and replace these placeholders:

### **1. Supabase Keys**
Get from: https://supabase.com/dashboard/project/hoaixfylzqnpkojsfnvv/settings/api

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

**Where to find:**
- Go to Supabase Dashboard → Project Settings → API
- `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANT:** Never commit `service_role` key to git! It has full database access.

---

### **2. Dwolla Keys (Sandbox)**
Get from: https://dashboard.dwolla.com/applications-legacy (Sandbox environment)

```bash
DWOLLA_KEY=your-key-here
DWOLLA_SECRET=your-secret-here
```

**Where to find:**
- Log in to Dwolla Dashboard
- Switch to **Sandbox** environment (top right)
- Go to Applications
- Copy your Key and Secret

---

## 🚀 How to Use

### **Step 1: Fill in Missing Keys**
Edit `.env.local` and replace the placeholder values:
```bash
nano .env.local
# or
code .env.local
```

### **Step 2: Restart Your Dev Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### **Step 3: Test Plaid Connection**
Once all keys are added, you can test the bank connection flow in your dashboard!

---

## 📝 Quick Reference

### **File Location**
```
/Users/oscarmullikin/tapify-marketplace/.env.local
```

### **Which Files Use These?**
- `pages/api/plaid-link-token.js` - Creates Plaid Link tokens
- `pages/api/plaid-exchange.js` - Exchanges tokens with Plaid
- `pages/api/plaid-link.js` - Full Plaid + Dwolla integration
- All Supabase API endpoints

---

## 🔒 Security Notes

1. ✅ `.env.local` is in `.gitignore` - won't be committed
2. ⚠️ Never share your `service_role` key
3. ⚠️ Never expose `DWOLLA_SECRET` to the client
4. ✅ Only `NEXT_PUBLIC_*` variables are exposed to browser
5. 🔐 These are **sandbox** keys - safe for development

---

## 🐛 Troubleshooting

### **Error: "Missing environment variable"**
- Make sure you restarted your dev server after editing `.env.local`
- Verify the variable names match exactly (case-sensitive)

### **Error: "Invalid credentials"**
- Double-check you copied the full key (no spaces)
- Verify you're using **sandbox** keys for Plaid/Dwolla
- For Dwolla, make sure you're in the **Sandbox** environment

### **Plaid Link not opening**
- Check browser console for errors
- Verify `NEXT_PUBLIC_BASE_URL` matches your dev server URL
- Make sure all 3 Plaid variables are set

---

## 📊 Current Status

| Service | Status | Notes |
|---------|--------|-------|
| **Plaid** | ✅ Configured | Sandbox mode |
| **Supabase** | ⚠️ Needs keys | Add anon + service_role keys |
| **Dwolla** | ⚠️ Needs keys | Add sandbox key + secret |

---

**Next Steps:**
1. Get your Supabase keys from the dashboard
2. Get your Dwolla sandbox keys
3. Add them to `.env.local`
4. Restart your dev server
5. Test the bank connection feature! 🎉
