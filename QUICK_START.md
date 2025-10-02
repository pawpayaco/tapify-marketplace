# ⚡ Quick Start - Auth & Admin Setup

## 📝 Files Changed

### Created:
- ✅ `lib/auth.js` - Auth helper functions
- ✅ `setup_admin.sql` - SQL script to run in Supabase

### Updated:
- ✅ `hooks/useAuth.js` - Added signUp method
- ✅ `context/AuthContext.js` - Added signUp to context
- ✅ `lib/supabase.js` - Added server-side client
- ✅ `pages/admin.js` - Server-side auth protection

---

## 🚀 3-Step Setup

### 1️⃣ Run SQL Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open `setup_admin.sql` file (in project root)
3. **Run the first part** (creates table)
4. **Find your user ID:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'oscarmullikin@icloud.com';
   ```
5. **Copy the ID** and paste it into the INSERT statement
6. **Run the INSERT** to add yourself as admin

### 2️⃣ Test Signup

In your browser console or a test component:
```javascript
import { signUp } from './lib/auth';

await signUp('oscarmullikin@icloud.com', '123456');
// Creates user in auth.users
```

### 3️⃣ Test Admin Access

1. **Log in** with your account
2. Navigate to `/admin`
3. Should see the admin dashboard! ✅

If redirected to `/`:
- Check you ran the SQL to add yourself to `admins` table
- Make sure you used the correct `user.id` (not email)
- Try logging out and back in

---

## 🔑 Key Concepts

### User ID vs Email
- ❌ **Don't use email** in admins table `id` field
- ✅ **Use the UUID** from `auth.users.id`

### Server-Side Protection
- Auth checked **before** page loads
- No loading spinners or client-side checks
- Automatic redirects via `getServerSideProps`

### How It Works
```
User visits /admin
    ↓
getServerSideProps runs on server
    ↓
Check 1: Is user logged in? (cookies)
    ↓ No → Redirect to /login
    ↓ Yes
Check 2: Is user in admins table?
    ↓ No → Redirect to /
    ↓ Yes
    ↓
Admin page renders
```

---

## 📖 Usage Examples

### Sign Up New User
```javascript
const { signUp } = useAuthContext();
const { user, error } = await signUp(email, password);
```

### Check if Admin (Server-Side)
```javascript
import { isUserAdmin } from './lib/auth';

const isAdmin = await isUserAdmin(user.id);
```

### Protect Any Page
```javascript
export async function getServerSideProps(context) {
  const supabase = createServerSupabaseClient(context);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  
  return { props: { user } };
}
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access /admin | Check you're in `admins` table with correct ID |
| signUp not found | Import from `useAuthContext()` |
| Redirect loop | Clear cookies, check Supabase keys |
| Table doesn't exist | Run `setup_admin.sql` |

---

## 📚 Full Documentation

- **Complete Guide:** `AUTH_SETUP_COMPLETE.md`
- **SQL Script:** `setup_admin.sql`
- **Dashboard Guide:** `DASHBOARD_SETUP_GUIDE.md`

---

**Ready to go!** Your auth is set up and admin page is protected. 🔒✨
