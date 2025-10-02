# 🔍 Debug Admin Access Issue

## Current Situation
- ✅ You're in the `admins` table (email: oscarmullikin@icloud.com, id: e4f07745-73c5-40f9-9564-aa2b6744bae0)
- ❌ Getting redirected when trying to access `/admin`
- You said it redirects to "dashboard page" (not home `/`)

## 🐛 Debug Steps

### Step 1: Check Server Logs
1. **Open your terminal** where Next.js is running (`npm run dev`)
2. **Try to access** `/admin` in your browser
3. **Look for console logs** that start with `[Admin SSR]`
4. You should see something like:
   ```
   [Admin SSR] User check: { hasUser: true, userId: '...', email: 'oscarmullikin@icloud.com' }
   [Admin SSR] Admin check: { userId: '...', hasAdminData: true, adminError: null }
   [Admin SSR] User authorized! Rendering admin page for: oscarmullikin@icloud.com
   ```

### Step 2: Check Your Cookies
1. Open **Browser DevTools** (F12 or Cmd+Option+I)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Look for a cookie named: `sb-hoaixfylzqnpkojsfnvv-auth-token`
5. **Does it exist?**
   - ❌ **No cookie** = You're not logged in properly
   - ✅ **Cookie exists** = Session should work

### Step 3: Verify You're Logged In
```javascript
// Open browser console and run:
const { data } = await (await fetch('/api/auth/user')).json();
console.log('Current user:', data);

// OR check Supabase directly:
import { supabase } from './lib/supabase';
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### Step 4: Check Admin Table
Run this SQL in Supabase:
```sql
-- Check if your user ID matches
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  a.id as admin_id,
  a.email as admin_email
FROM auth.users u
LEFT JOIN admins a ON u.id = a.id
WHERE u.email = 'oscarmullikin@icloud.com';
```

**Expected:**
- `auth_user_id` = `admin_id` (both should be `e4f07745-73c5-40f9-9564-aa2b6744bae0`)

---

## 🔧 Common Issues & Fixes

### Issue 1: Cookie Not Being Read
**Symptom:** Server logs show "No user found"
**Fix:**
```bash
# Clear all cookies
# In browser: DevTools → Application → Clear Site Data

# Log out and log in again
# Then try /admin
```

### Issue 2: Wrong User ID in Admins Table
**Symptom:** Server logs show user but no admin data
**Fix:**
```sql
-- First, find your ACTUAL user ID
SELECT id FROM auth.users WHERE email = 'oscarmullikin@icloud.com';

-- Then update admins table with the correct ID
UPDATE admins 
SET id = 'your-actual-user-id'
WHERE email = 'oscarmullikin@icloud.com';
```

### Issue 3: Middleware Intercepting
**Symptom:** Gets redirected before server-side check runs
**Check:** Look at `middleware.js` - is it redirecting `/admin`?

### Issue 4: Session Expired
**Fix:**
```javascript
// In browser console
await supabase.auth.signOut();
// Then log in again
```

---

## 🎯 Quick Test

Run this in your browser console:
```javascript
// Test 1: Check if logged in
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session ? 'EXISTS' : 'MISSING');
console.log('User:', session?.user?.email);

// Test 2: Check if user ID matches admin table
console.log('User ID:', session?.user?.id);
// Compare with your admin table ID: e4f07745-73c5-40f9-9564-aa2b6744bae0
```

---

## 📊 What The Logs Mean

### Scenario A: No User Found
```
[Admin SSR] User check: { hasUser: false, userId: undefined, email: undefined }
[Admin SSR] No user found, redirecting to /login
```
**Problem:** Session cookies not being read
**Fix:** Clear cookies, log in again

### Scenario B: User But Not Admin
```
[Admin SSR] User check: { hasUser: true, userId: 'e4f...', email: 'oscarmullikin@icloud.com' }
[Admin SSR] Admin check: { userId: 'e4f...', hasAdminData: false, adminError: 'No rows found' }
[Admin SSR] User not authorized as admin
```
**Problem:** User ID doesn't match admin table ID
**Fix:** Update admin table with correct user ID

### Scenario C: Success! 
```
[Admin SSR] User check: { hasUser: true, userId: 'e4f...', email: 'oscarmullikin@icloud.com' }
[Admin SSR] Admin check: { userId: 'e4f...', hasAdminData: true, adminError: null }
[Admin SSR] User authorized! Rendering admin page
```
**Result:** Admin page loads! 🎉

---

## 🆘 Still Not Working?

### Try This Nuclear Option:
```sql
-- Delete and recreate admin record
DELETE FROM admins WHERE email = 'oscarmullikin@icloud.com';

-- Get your CURRENT user ID
SELECT id FROM auth.users WHERE email = 'oscarmullikin@icloud.com';

-- Insert with the CORRECT ID
INSERT INTO admins (id, email)
VALUES ('paste-id-from-above', 'oscarmullikin@icloud.com');
```

Then:
1. Clear all browser cookies
2. Sign out completely
3. Sign in again
4. Try `/admin`

---

**Next:** Run the debug steps above and share what you see in the server logs!
