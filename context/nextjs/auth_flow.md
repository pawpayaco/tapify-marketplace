# 🔐 Authentication Flow & Session Management

Documents how Tapify handles user authentication, session persistence, and role-based access control using Supabase Auth and @supabase/ssr.

---

## 💡 Purpose
This file explains the complete authentication lifecycle — from signup to session management to server-side auth checks — ensuring secure access across client and server components.

---

## 🧩 Architecture Overview

### Two-Client System
Tapify uses a dual-client pattern for Supabase:

1. **Browser Client (`supabase`)** — Used in client components and browser
   - Created with `@supabase/ssr` → `createBrowserClient`
   - Sets cookies that SSR can read
   - Supports Row Level Security (RLS)
   - File: `lib/supabase.js:19-43`

2. **Admin Client (`supabaseAdmin`)** — Used in API routes and `getServerSideProps`
   - Created with `@supabase/supabase-js` → `createClient`
   - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - **Bypasses RLS** — full database access
   - **NEVER exposed to browser**
   - File: `lib/supabase.js:50-57`

---

## 🔑 Authentication Methods

### 1. Email/Password Signup
**File:** `hooks/useAuth.js:115-153`

**Flow:**
1. User enters email + password in signup form
2. Frontend calls `useAuthContext().signUp(email, password)`
3. `useAuth` hook calls `supabase.auth.signUp({ email, password })`
4. Supabase creates user account
5. If email confirmation disabled → returns session immediately
6. If email confirmation enabled → sends confirmation email
7. Session stored in cookies (via `@supabase/ssr`)

**Response:**
```js
{
  user: { id, email, ... },
  session: { access_token, refresh_token, expires_at },
  error: null
}
```

---

### 2. Email/Password Login
**File:** `hooks/useAuth.js:76-112`

**Flow:**
1. User enters credentials in `/login`
2. Frontend calls `useAuthContext().signIn(email, password)`
3. `useAuth` hook calls `supabase.auth.signInWithPassword({ email, password })`
4. Supabase validates credentials
5. Returns session with JWT tokens
6. Session cookies set automatically (via `@supabase/ssr`)
7. User redirected to dashboard or admin panel

**Cookie Structure:**
```
sb-{projectRef}-auth-token = {
  access_token: "jwt...",
  refresh_token: "...",
  expires_at: timestamp
}
```

---

### 3. Password Reset
**File:** `pages/reset-password.js`

**Flow:**
1. User enters email in reset form
2. Frontend calls `supabase.auth.resetPasswordForEmail(email)`
3. Supabase sends magic link email
4. User clicks link → redirects to `/update-password?access_token=...`
5. User enters new password
6. Calls `supabase.auth.updateUser({ password: newPassword })`
7. Session refreshed, user redirected to `/login`

---

### 4. Sign Out
**File:** `hooks/useAuth.js:156-199`

**Flow:**
1. User clicks "Sign Out"
2. Frontend calls `useAuthContext().signOut()`
3. Hook calls `supabase.auth.signOut()`
4. Supabase invalidates session server-side
5. Auth cookies cleared from browser
6. User state set to `null`
7. Redirects to `/login`

**Error Handling:**
- Catches `AuthSessionMissingError` gracefully (treats as success)
- Still clears local user state even on errors

---

## 🧠 Session Management

### Client-Side Session (`useAuth` Hook)
**File:** `hooks/useAuth.js`

**State:**
- `user` — Current user object or `null`
- `loading` — Boolean (true while checking session)

**Session Check on Mount:**
1. `useEffect` runs on component mount
2. Calls `supabase.auth.getSession()`
3. If session exists → sets `user` state
4. If no session → sets `user = null`
5. Sets `loading = false`

**Real-Time Session Listener:**
```js
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
  setUser(session?.user ?? null);
});
```

**Events:**
- `SIGNED_IN` → User logs in
- `SIGNED_OUT` → User logs out
- `TOKEN_REFRESHED` → Supabase auto-refreshes JWT
- `USER_UPDATED` → User changes email/password

---

### Server-Side Session (SSR)
**File:** `pages/admin.js:15-214` (example)

**Pattern:**
```js
export async function getServerSideProps(context) {
  const { req, res } = context;

  // Parse cookies manually from headers
  const cookieHeader = req.headers.cookie || '';
  const parsedCookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    parsedCookies[name] = rest.join('=');
  });

  // Create SSR client
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return parsedCookies[name]; },
        set(name, value, options) { res.setHeader('Set-Cookie', ...); },
        remove(name, options) { res.setHeader('Set-Cookie', `${name}=; Max-Age=0`); }
      }
    }
  );

  // Get user from session
  const { data: { user }, error } = await supabaseServer.auth.getUser();

  // Always return props (never redirect)
  return { props: { user, error } };
}
```

**Key Differences from Client:**
- Reads cookies from `req.headers.cookie`
- Custom cookie handlers for `get`, `set`, `remove`
- Returns props with auth state (no redirects)

---

## 🧑‍💻 AuthContext & Provider

### AuthContext Setup
**File:** `context/AuthContext.js`

**Purpose:** Makes auth state and methods available to all components.

**Structure:**
```jsx
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const auth = useAuth(); // { user, loading, signIn, signUp, signOut }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  // Returns auth object or fallback if used outside provider
  return context;
}
```

**App Wrapper:**
**File:** `pages/_app.js`

```jsx
import { AuthProvider } from '../context/AuthContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
```

**Usage in Components:**
```jsx
import { useAuthContext } from '../context/AuthContext';

function Dashboard() {
  const { user, loading, signOut } = useAuthContext();

  if (loading) return <div>Loading...</div>;
  if (!user) router.push('/login');

  return <div>Welcome {user.email}</div>;
}
```

---

## 🔒 Role-Based Access Control

### Admin Role Check
**Pattern:**
1. Get user session (client or server)
2. Query `admins` table with `supabaseAdmin`
3. Check if `user.id` exists in `admins.id`

**Server-Side (Admin Dashboard):**
**File:** `pages/admin.js:86-100`

```js
// Check admin status using admin client (bypasses RLS)
const { data: adminRecord, error: adminError } = await supabaseAdmin
  .from('admins')
  .select('id')
  .eq('id', user.id)
  .single();

const isAdmin = !!adminRecord && !adminError;

return {
  props: {
    user,
    isAdmin,
    error: isAdmin ? null : 'Not authorized'
  }
};
```

**Client-Side Helper:**
**File:** `lib/auth.js:97-119`

```js
export async function isUserAdmin(userId) {
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userId)
    .single();

  return !!data && !error;
}
```

---

### Retailer Access Control
**Pattern:**
1. User logs in
2. Dashboard queries `retailers` table by `user.email`
3. If no match → shows "No retailer account found"
4. If match → displays retailer data

**File:** `pages/onboard/dashboard.js:68-79`

```js
const { data: retailerData } = await supabase
  .from('retailers')
  .select('*')
  .eq('name', user.email) // or .eq('email', user.email)
  .maybeSingle();
```

---

### Vendor Access Control
**Pattern:** Similar to retailer, queries `vendors` table.

**Future Enhancement:** Add `user_id` foreign key to `retailers`/`vendors` tables for direct user → entity linking.

---

## 🛡️ Security Best Practices

### ✅ DO:
- Use `supabaseAdmin` **only** in API routes and `getServerSideProps`
- Validate user sessions on every protected route
- Return auth errors as props (don't expose in client console)
- Use `@supabase/ssr` for cookie-based session management
- Check role permissions (admin/retailer/vendor) before showing UI

### ❌ DON'T:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser
- Never use `supabaseAdmin` in client components
- Don't redirect in `getServerSideProps` (use error props instead)
- Don't store sensitive tokens in localStorage (use cookies)
- Don't skip auth checks on "hidden" admin routes

---

## 🔄 Session Lifecycle Diagram

```
┌─────────────────────────────────────────────────────┐
│ 1. User Visits App                                  │
│    └─> useAuth hook calls getSession()              │
│        └─> Checks cookies for auth token            │
│            ├─> Token valid → setUser(user)          │
│            └─> No token → setUser(null)             │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 2. User Logs In                                     │
│    └─> signInWithPassword(email, password)          │
│        └─> Supabase returns session                 │
│            └─> Cookies set via @supabase/ssr        │
│                └─> onAuthStateChange fires           │
│                    └─> setUser(session.user)        │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 3. Token Auto-Refresh (Background)                  │
│    └─> Supabase checks expires_at                   │
│        └─> If near expiry → refresh token           │
│            └─> onAuthStateChange('TOKEN_REFRESHED') │
│                └─> New cookies set automatically     │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 4. User Logs Out                                    │
│    └─> signOut() called                             │
│        └─> Supabase invalidates session             │
│            └─> Cookies cleared                      │
│                └─> onAuthStateChange('SIGNED_OUT')  │
│                    └─> setUser(null)                │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Environment Variables

**Required for Auth:**
```env
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Server-only (never exposed)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

**Security Notes:**
- `ANON_KEY` → Safe to expose, respects RLS
- `SERVICE_ROLE_KEY` → **NEVER send to browser**, bypasses RLS

---

## 🔗 Relations
- See **@context/nextjs/frontend_flow.md** for page-level auth requirements
- See **@context/nextjs/pages_api_summary.md** for API auth patterns
- See **@context/supabase/overview.md** for RLS policies (verify)
- See **@context/CLAUDE.md** for auth implementation examples
