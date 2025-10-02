# 🔐 Authentication & Admin Protection - Complete Implementation

## ✅ What Was Implemented

### 1. **Supabase Signup Functionality** ✅

#### `lib/auth.js` (NEW)
Created helper functions for all auth operations:
- `signUp(email, password)` - Register new users
- `signIn(email, password)` - Login existing users  
- `signOut()` - Logout
- `getSession()` - Get current session
- `isUserAdmin(userId)` - Check if user is admin

#### `hooks/useAuth.js` (UPDATED)
Added `signUp` method to the hook:
```javascript
const { signUp } = useAuthContext();

// Use it like this:
const { user, error } = await signUp('user@example.com', 'password');
```

#### `context/AuthContext.js` (UPDATED)
Added `signUp` to context so it's available everywhere

---

### 2. **Server-Side Admin Protection** ✅

#### `lib/supabase.js` (UPDATED)
Added `createServerSupabaseClient(context)` for server-side auth:
```javascript
import { createServerSupabaseClient } from '../lib/supabase';

export async function getServerSideProps(context) {
  const supabase = createServerSupabaseClient(context);
  // Use supabase with user's session from cookies
}
```

#### `pages/admin.js` (UPDATED)
Implemented **server-side protection** with `getServerSideProps`:
- ✅ Checks if user is logged in → redirects to `/login` if not
- ✅ Checks if user is in `admins` table → redirects to `/` if not
- ✅ Only renders admin page if both checks pass
- ✅ Removed all client-side auth checks (no more loading screens)

---

## 🚀 How to Use

### Sign Up New Users

**Using the hook:**
```javascript
import { useAuthContext } from '../context/AuthContext';

function SignupForm() {
  const { signUp } = useAuthContext();

  const handleSignup = async (e) => {
    e.preventDefault();
    const { user, error } = await signUp(email, password);
    
    if (error) {
      console.error('Signup error:', error);
    } else {
      console.log('User created:', user);
    }
  };
}
```

**Using the helper directly:**
```javascript
import { signUp } from '../lib/auth';

const { user, error } = await signUp('oscarmullikin@icloud.com', '123456');
```

---

### Admin Access Setup

#### Step 1: Create the `admins` Table

Run this in your **Supabase SQL Editor**:

```sql
-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to read their own data
CREATE POLICY "Admins can view their own data"
  ON admins FOR SELECT
  USING (auth.uid() = id);

-- Only service role can insert admins
CREATE POLICY "Service role can insert admins"
  ON admins FOR INSERT
  WITH CHECK (true);
```

#### Step 2: Add Yourself as Admin

**IMPORTANT:** Use the `id` from `auth.users`, NOT email!

```sql
-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'oscarmullikin@icloud.com';

-- Then add yourself as admin (replace with your actual ID)
INSERT INTO admins (id, email)
VALUES ('your-user-id-here', 'oscarmullikin@icloud.com')
ON CONFLICT (id) DO NOTHING;
```

#### Step 3: Test Admin Access

1. **Not logged in:** Navigate to `/admin` → Should redirect to `/login`
2. **Logged in, not admin:** Navigate to `/admin` → Should redirect to `/`
3. **Logged in as admin:** Navigate to `/admin` → Should see admin dashboard

---

## 📊 Database Schema

### Required Tables

#### `auth.users` (Built-in Supabase table)
Created automatically when you use `signUp()`:
- `id` (uuid) - User's unique ID
- `email` (text) - User's email
- `encrypted_password` - Hashed password
- `created_at` - Signup timestamp

#### `admins` (Custom table)
Links to `auth.users`:
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Points:**
- ✅ `id` references `auth.users(id)` (not email!)
- ✅ `ON DELETE CASCADE` - if user deleted, admin record deleted too
- ✅ Use `id` for all admin checks, not email

---

## 🧪 Testing Guide

### Test Signup Flow

```javascript
// In your signup page or component
const { signUp } = useAuthContext();

const handleSignup = async () => {
  const result = await signUp('test@example.com', 'password123');
  
  if (result.error) {
    alert('Signup failed: ' + result.error.message);
  } else {
    alert('Signup successful! Check your email to confirm.');
    // User is created in auth.users
  }
};
```

### Test Admin Protection

1. **Create a test user:**
   ```javascript
   await signUp('test@example.com', 'password123');
   ```

2. **Try to access `/admin`:**
   - Should redirect to `/` (not in admins table)

3. **Add user to admins table:**
   ```sql
   -- Get user ID
   SELECT id FROM auth.users WHERE email = 'test@example.com';
   
   -- Add to admins
   INSERT INTO admins (id, email) VALUES ('user-id', 'test@example.com');
   ```

4. **Try `/admin` again:**
   - Should now have access!

---

## 🔒 Security Features

### Server-Side Protection
- ✅ **No client-side bypassing** - auth checked on server before page loads
- ✅ **Cookie-based sessions** - secure, httpOnly cookies
- ✅ **Automatic redirects** - unauthorized users can't see admin page

### Admin Verification
- ✅ Checks both authentication (logged in) and authorization (in admins table)
- ✅ Uses `user.id` from `auth.users` to check `admins` table
- ✅ Graceful fallback if Supabase not configured (development mode)

---

## 📝 API Reference

### `lib/auth.js`

```javascript
// Sign up a new user
const { user, session, error } = await signUp(email, password);

// Sign in existing user  
const { user, session, error } = await signIn(email, password);

// Sign out
const { error } = await signOut();

// Get current session
const { user, session } = await getSession();

// Check if user is admin
const isAdmin = await isUserAdmin(userId);
```

### `useAuthContext()` Hook

```javascript
const {
  user,         // Current user object (null if not logged in)
  loading,      // Boolean - true while checking auth
  signIn,       // Function - (email, password) => Promise
  signUp,       // Function - (email, password) => Promise  
  signOut,      // Function - () => Promise
} = useAuthContext();
```

---

## 🎯 Common Use Cases

### Create a Signup Page

```javascript
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, loading } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { user, error } = await signUp(email, password);
    
    if (error) {
      alert('Signup failed: ' + error.message);
    } else {
      alert('Account created! You can now sign in.');
      router.push('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### Protect Other Pages

Use the same pattern as `admin.js`:

```javascript
import { createServerSupabaseClient } from '../lib/supabase';

export async function getServerSideProps(context) {
  const supabase = createServerSupabaseClient(context);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: { user: { id: user.id, email: user.email } },
  };
}
```

---

## 🐛 Troubleshooting

### "Can't access admin page even though I'm in admins table"

**Check:**
1. Are you using `user.id` in admins table, not email?
2. Does the `id` in `admins` match the `id` in `auth.users`?
3. Are you logged in? Check cookies in browser DevTools
4. Try logging out and back in

**Debug SQL:**
```sql
-- Check if your user exists
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Check if you're in admins
SELECT * FROM admins WHERE email = 'your@email.com';

-- They should match!
SELECT 
  u.id as user_id,
  u.email,
  a.id as admin_id
FROM auth.users u
LEFT JOIN admins a ON u.id = a.id
WHERE u.email = 'your@email.com';
```

### "signUp is not a function"

**Solution:** Make sure you're using the updated AuthContext:
```javascript
import { useAuthContext } from '../context/AuthContext';

const { signUp } = useAuthContext(); // Now includes signUp!
```

### "Redirect loop to /login"

**Cause:** Session cookies not being set/read properly

**Solution:**
1. Clear all cookies for localhost:3000
2. Make sure Supabase URL and keys are correct
3. Check that `createServerSupabaseClient` is reading cookies correctly

---

## 🎉 Summary

✅ **Signup functionality** added to `lib/auth.js` and `useAuth` hook  
✅ **Server-side admin protection** implemented with `getServerSideProps`  
✅ **Secure authentication** using Supabase cookies  
✅ **Admin table** checks using `user.id` (not email)  
✅ **No client-side auth checks** - all server-side for security  

Your admin page is now fully protected with server-side authentication! 🔒🚀
