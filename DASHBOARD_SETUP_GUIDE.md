# 🚀 Dashboard Setup Guide

## ✅ Issues Fixed

### 1. **Infinite Loading Spinner** ✅
- Dashboard now handles missing data gracefully
- Shows error toast if no retailer profile found
- Always sets `loading = false` to stop spinner

### 2. **Login Protection** ✅
- Redirects to `/login` if user is not authenticated
- Checks auth state before rendering dashboard
- Prevents unauthorized access

---

## 🧪 Testing the Dashboard

### Option 1: Create a Test Retailer (Recommended)

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Create a test retailer (use your actual email)
INSERT INTO retailers (id, name, location, linked_vendor_id, created_at)
VALUES (
  gen_random_uuid(),
  'your-email@example.com',  -- Replace with your actual login email
  'San Francisco, CA',
  NULL,
  NOW()
)
RETURNING *;

-- Optionally, add some test scans for data visualization
INSERT INTO scans (uid, clicked, converted, revenue, timestamp, location)
VALUES 
  ('TEST-UID-001', true, true, 25.99, NOW() - INTERVAL '1 day', 'San Francisco'),
  ('TEST-UID-001', true, false, 0, NOW() - INTERVAL '2 days', 'Oakland'),
  ('TEST-UID-002', true, true, 45.50, NOW() - INTERVAL '3 days', 'Berkeley'),
  ('TEST-UID-002', true, true, 12.00, NOW() - INTERVAL '4 days', 'San Jose');

-- Optionally, add test UIDs
INSERT INTO uids (uid, business_id, registered_at)
VALUES 
  ('TEST-UID-001', NULL, NOW() - INTERVAL '30 days'),
  ('TEST-UID-002', NULL, NOW() - INTERVAL '15 days');
```

**Important:** Replace `'your-email@example.com'` with the **exact email** you use to log in!

### Option 2: Test Empty State

If you don't add any data, the dashboard will:
- Show an error toast: "No retailer profile found"
- Display empty states for all tabs
- Show zeros in all stat cards
- Show "No data yet" messages

This is perfectly fine for testing!

---

## 🔐 How Login Protection Works

```javascript
// Checks auth state
if (user === undefined) {
  // Still loading auth, wait...
}

if (!user) {
  // Not logged in → redirect to /login
  router.push('/login');
}
```

### Test the Protection:
1. **Log out** of your account
2. Navigate to `/onboard/dashboard`
3. You should be **redirected to `/login`**
4. Log in and try again

---

## 📊 Expected Behavior

### ✅ **If you have a retailer profile:**
- Dashboard loads successfully
- Shows your data (or zeros if no scans/payouts)
- All 5 tabs work
- Charts display properly

### ✅ **If you DON'T have a retailer profile:**
- Dashboard loads (no infinite spinner!)
- Shows error toast: "No retailer profile found. Contact support to get set up."
- All tabs show empty states
- Stats show zeros
- No errors in console

### ✅ **If you're NOT logged in:**
- Instantly redirected to `/login`
- Dashboard doesn't load at all

---

## 🐛 Troubleshooting

### Dashboard still spinning?
1. **Check browser console** for errors
2. Verify you're logged in (check `localStorage` for Supabase auth token)
3. Make sure your email matches the `name` field in `retailers` table

### Can't find retailer?
The dashboard tries two methods:
1. **Exact match:** `retailers.name = user.email`
2. **Fuzzy match:** `retailers.name ILIKE '%email%'`

If neither works, the SQL script above will fix it.

### Still redirects to login?
- Clear browser cache and cookies
- Check if AuthContext is working: `console.log(user)` in dashboard
- Verify Supabase auth is configured properly

---

## 🎯 Quick Test Checklist

- [ ] Navigate to `/onboard/dashboard` while **logged out**
  - Should redirect to `/login`
  
- [ ] Log in with your account
  
- [ ] Navigate to `/onboard/dashboard` while **logged in**
  - Should load (no infinite spinner)
  
- [ ] If no retailer profile:
  - See error toast
  - Dashboard shows empty states
  
- [ ] Run SQL script above to create retailer
  
- [ ] Refresh dashboard
  - Should now show your retailer data
  - Stats may be zeros (no scans yet)
  
- [ ] Click through all 5 tabs
  - All should load without errors

---

## 📝 Next Steps

1. **Create your retailer profile** using the SQL above
2. **Test the dashboard** - it should load instantly now
3. **Add test data** (scans, payouts, UIDs) to see visualizations
4. **Verify login protection** works

Your dashboard is now fully protected and handles empty data gracefully! 🎉
