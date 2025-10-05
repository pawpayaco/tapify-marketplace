# =� Next.js Frontend Flow & Routing

Documents user journeys, page navigation patterns, and how users move through the Tapify platform from landing to dashboard.

---

## =� Purpose
This file maps the entire frontend user experience, explaining how pages connect, what data flows between them, and how the onboarding funnels convert visitors into retailers or vendors.

---

## <� Landing Page  `/` (index.js)

**Purpose:** Marketing landing page for Pawpaya displays targeting retailers.

**Content:**
- Hero section with Pawpaya branding and value proposition
- Product showcase (Friendship Collars, DIY Boxes)
- "How Pawpaya Works" 3-step explainer (Get Display � Scan � Earn)
- Retailer benefits section with dashboard preview
- Social proof stats (500+ retailers, $2M+ earnings, etc.)

**Key CTAs:**
- "Get Your Free Display =�" � `/onboard`
- "Open Retailer Dashboard" � `/onboard/dashboard`
- "Sign Up Now" � `/onboard`

**Design System:**
- Background: `#faf8f3`
- Primary gradient: `from-[#ff7a4a] to-[#ff6fb3]`
- Framer Motion animations (fadeInUp, staggerContainer)

---

## <� Onboarding Flow  `/onboard/*`

### `/onboard/index.js`  Onboard Landing
**Purpose:** Pre-registration landing page explaining retailer benefits.

**Content:**
- Testimonials from existing retailers (revenue stats, quotes)
- Benefits grid (Guaranteed Revenue, No Setup, Set & Forget)
- 4-step process (Register � Receive � Place � Get Paid)
- Value props tailored for Pet Supplies Plus franchise managers

**Key CTAs:**
- "Start Registration" � `/onboard/register`
- "See Dashboard Demo" � `/onboard/dashboard` (requires login)

---

### `/onboard/register.js`  Multi-Step Registration Form
**Purpose:** Collect retailer information for account creation.

**Flow:**
1. **Step 1:** Store details (name, address, phone)
2. **Step 2:** Business information (franchise/independent, owner details)
3. **Step 3:** Contact preferences (email, SMS notifications)
4. **Step 4:** Review & submit

**Form Submission:**
- POSTs to `/api/onboard/register`
- Creates entry in `retailers` table
- Auto-creates user account in Supabase Auth
- Redirects to `/onboard/dashboard` on success

**UI Pattern:**
- Multi-step progress bar (`ProgressBar` component)
- Framer Motion page transitions
- Form validation with real-time feedback

---

### `/onboard/shopify-connect.js`  Shopify OAuth Flow (Vendors)
**Purpose:** Connect vendor Shopify store for product sync.

**Flow:**
1. Vendor clicks "Connect Shopify Store"
2. Redirects to Shopify OAuth consent screen
3. Shopify redirects back with `code` query param
4. API exchanges code for access token
5. Stores token in `vendors` table
6. Redirects to `/onboard/dashboard`

**Database Update:**
- `UPDATE vendors SET shopify_access_token = ?, shopify_shop_url = ? WHERE id = ?`

---

### `/onboard/dashboard.js`  Retailer Dashboard
**Purpose:** Central hub for retailers to track performance, manage displays, and view payouts.

**Auth:** Requires logged-in session (redirects to `/login` if not authenticated).

**Tabs:**
1. **Stats**  Overview metrics (weekly scans, revenue, conversion rate, unpaid earnings)
2. **Scans**  Real-time scan event log (timestamp, product, clicked, converted)
3. **Displays**  List of claimed UIDs (claim status, affiliate URL, performance)
4. **Payouts**  Payout history (date, amount, status: pending/paid)
5. **Settings**  Bank account connection via Plaid Link

**Data Fetching:**
- Fetches `retailers` by `user.email`
- Joins `scans`, `uids`, `payout_jobs`, `retailer_accounts`
- Aggregates stats (total scans, revenue, conversion rate)
- Displays weekly trend chart (verify)

**Actions:**
- Connect bank account � Plaid Link flow � `/api/plaid-exchange`
- View payout details (modal with breakdown)
- Claim new UID (verify) � `/claim?u=<UID>`

---

## = Authentication Pages

### `/login.js`  User Login
**Purpose:** Email/password login for retailers, vendors, admins.

**Flow:**
1. User enters email + password
2. Calls `useAuthContext().signIn(email, password)`
3. On success � redirects to `/onboard/dashboard` or `/admin` (based on role)
4. On error � displays error message

**Backend:**
- Uses `supabase.auth.signInWithPassword`
- Sets session cookies via `@supabase/ssr`

---

### `/reset-password.js`  Password Reset Request
**Purpose:** Sends password reset email.

**Flow:**
1. User enters email
2. Calls `supabase.auth.resetPasswordForEmail(email)`
3. Supabase sends magic link to email
4. User clicks link � redirects to `/update-password`

---

### `/update-password.js`  Set New Password
**Purpose:** Update password after reset link click.

**Flow:**
1. User lands with `access_token` hash param
2. Supabase validates token
3. User enters new password
4. Calls `supabase.auth.updateUser({ password })`
5. Redirects to `/login`

---

## =h
=� Admin Dashboard  `/admin/*`

### `/admin.js`  Main Admin Command Center
**Purpose:** Multi-tab dashboard for managing entire Tapify ecosystem.

**Auth:** Server-side auth check via `getServerSideProps` (never redirects, returns error props).

**SSR Auth Flow:**
1. Create `@supabase/ssr` server client from cookies
2. Call `supabaseServer.auth.getUser()`
3. Verify `user.id` exists in `admins` table using `supabaseAdmin`
4. Return props with `{ user, isAdmin, error }` (never redirect)

**Tabs:**
1. **Vendors**  List all vendors, approve/reject applications, view Shopify sync status
2. **Retailers**  Manage retailer accounts, view performance, bulk actions
3. **Stores**  Business/franchise management (Pet Supplies Plus locations)
4. **Payouts**  Approve pending payouts, view payout history, trigger Dwolla transfers
5. **Analytics**  Platform-wide metrics (total revenue, conversion rates, top performers)
6. **Sourcers**  Manage sourcing agents (Ecom Kids), track recruitment performance
7. **UIDs**  View all NFC tags (claimed/unclaimed status, affiliate URLs)

**Key Actions:**
- **Trigger Payout:** POSTs to `/api/payout` with `payoutJobId`
- **Add Vendor:** Opens modal � POSTs to `/api/submit-vendor`
- **Add Owner:** Opens modal (`AdminAddOwnerModal`) � POSTs to `/api/admin/add-owner`
- **Bulk Update Stores:** POSTs to `/api/stores/bulk-update`

**Data Sources:**
- All tables via `supabaseAdmin` (bypasses RLS)
- Real-time updates via Supabase subscriptions (verify)

---

### `/admin/stores.js`  Dedicated Stores Management
**Purpose:** (verify) Detailed view for managing business locations.

**Features:**
- Advanced filtering by business, status, region
- Map view of store locations (verify)
- CSV export for outreach campaigns

---

## <� Display Claim Flow  `/claim.js`

**Purpose:** Allow retailers to claim an unclaimed NFC display.

**Entry Point:** User taps unclaimed UID � `/t?u=<UID>` � redirects to `/claim?u=<UID>`

**Flow:**
1. Page loads with UID in query params
2. Displays UID and claim instructions
3. User selects their store from dropdown (if logged in) or creates account
4. POSTs to `/api/register-store` or updates `uids` table
5. Marks UID as claimed with `business_id` link
6. Future scans redirect to retailer's affiliate URL

**Database Update:**
- `UPDATE uids SET is_claimed = true, business_id = ?, affiliate_url = ? WHERE uid = ?`

---

## = NFC Redirect Flow  `/t?u=<UID>`

**Purpose:** Central tap-to-redirect logic (configured in `next.config.js`).

**Flow:**
1. Customer taps NFC tag on display
2. Browser loads `tapify.com/t?u=ABC123`
3. Next.js rewrites to `/api/uid-redirect?u=ABC123`
4. API checks `uids` table:
   - If unclaimed � redirects to `/claim?u=ABC123`
   - If claimed � redirects to `affiliate_url` (Shopify collection)
5. Logs scan event in `scans` table (verify)

**Configuration (next.config.js):**
```js
rewrites: async () => [
  {
    source: '/t',
    destination: '/api/uid-redirect'
  }
]
```

---

## =� Legal Pages

### `/privacy.js`  Privacy Policy
**Purpose:** GDPR/CCPA compliance page.

**Content:**
- Data collection practices
- Cookie usage
- Third-party integrations (Supabase, Shopify, Dwolla, Plaid)
- User rights (access, deletion, portability)

---

## >� Page Routing Summary Table

| Route | Page Component | Auth Required | Purpose | Key Data |
|-------|---------------|---------------|---------|----------|
| `/` | `index.js` | L | Marketing landing | Static |
| `/onboard` | `onboard/index.js` | L | Onboard landing | Static |
| `/onboard/register` | `onboard/register.js` | L | Multi-step registration | Form data |
| `/onboard/shopify-connect` | `onboard/shopify-connect.js` |  | Shopify OAuth | Vendor auth |
| `/onboard/dashboard` | `onboard/dashboard.js` |  | Retailer dashboard | `retailers`, `scans`, `uids`, `payout_jobs` |
| `/login` | `login.js` | L | User login | Supabase Auth |
| `/reset-password` | `reset-password.js` | L | Password reset request | Supabase Auth |
| `/update-password` | `update-password.js` | = | Set new password (magic link) | Supabase Auth |
| `/claim` | `claim.js` | � | Claim unclaimed UID | `uids`, `retailers` |
| `/admin` | `admin.js` |  (Admin) | Main admin dashboard | All tables |
| `/admin/stores` | `admin/stores.js` |  (Admin) | Stores management | `businesses`, `retailers` |
| `/privacy` | `privacy.js` | L | Privacy policy | Static |

**Legend:**
-  = Requires authentication
- L = Public
- � = Optional (better UX if logged in)
- = = Requires magic link token

---

## <� UI/UX Patterns

### Tabs Interface
**Used in:** `/admin`, `/onboard/dashboard`

**Pattern:**
```jsx
<motion.div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-4 mb-6">
  <div className="flex flex-wrap gap-3">
    {tabs.map(tab => (
      <motion.button
        className={active
          ? "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg rounded-2xl px-6 py-3"
          : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl px-6 py-3"
        }
      />
    ))}
  </div>
</motion.div>
```

### Multi-Step Forms
**Used in:** `/onboard/register`

**Components:**
- `ProgressBar`  Shows current step (1/4, 2/4, etc.)
- `FormInput`  Reusable form field with validation
- `motion.div`  Framer Motion page transitions

### Dashboard Cards
**Used in:** `/onboard/dashboard`, `/admin`

**Component:** `DashboardCard`
- Displays KPI (revenue, scans, conversion rate)
- Gradient backgrounds
- Icon + number + label layout

---

## = Relations
- See **@context/nextjs/auth_flow.md** for authentication details
- See **@context/nextjs/pages_api_summary.md** for API endpoints
- See **@context/nextjs/components_overview.md** for component library
- See **@context/ui/ui_overview.md** for design system
- See **@context/data_model.md** for data relationships
