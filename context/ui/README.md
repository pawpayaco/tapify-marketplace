# 🎨 Tapify UI System

**The complete visual and interactive design system powering Tapify's conversion-optimized marketplace platform.**

---

## 💡 Purpose

The Tapify UI layer is a cohesive design system built on Next.js, React, Tailwind CSS, and Framer Motion that transforms business logic into delightful, conversion-focused user experiences. It bridges the gap between technical functionality (Supabase data, Shopify commerce, Dwolla payouts) and human interaction through:

- **Conversion-optimized interfaces** engineered for maximum retailer and vendor onboarding
- **Playful professionalism** blending Pawpaya's pastel brand aesthetic with clear business functionality
- **Motion-enhanced interactions** that guide users through complex multi-step flows
- **Consistent design tokens** ensuring brand cohesion across admin dashboards, retailer portals, and public landing pages

This system enables rapid development of new features while maintaining visual consistency and delightful UX across the entire Tapify ecosystem.

---

## 📂 Structure

### UI Documentation Files

| File | Purpose |
|------|---------|
| **README.md** (this file) | Master UI overview and integration guide |
| **ui_overview.md** | Detailed component architecture and patterns |
| **design_system_tokens.md** | Visual design language (colors, spacing, typography) |

### Related Context Files

- **@context/nextjs/components_overview.md** — Component API reference and usage patterns
- **@context/nextjs/frontend_flow.md** — User journeys and page routing through the UI
- **@context/nextjs/overview.md** — Frontend architecture and data flow
- **@context/GAME_PLAN_2.0.md** — Business strategy driving UI/UX decisions
- **@context/data_model.md** — Database entities the UI interacts with

---

## 🎨 Core Design Principles

### 1. Conversion-Optimized UX
Every interaction is engineered for maximum conversion, especially for onboarding franchise managers and store owners. Multi-step forms include progress indicators, real-time validation, and contextual help text to reduce drop-off.

### 2. Playful Professionalism
Combines Pawpaya's pastel brand aesthetic (pinks, purples, oranges) with clear, professional business functionality. The UI feels approachable and friendly while maintaining credibility for B2B transactions.

### 3. Mobile-First Responsiveness
All components built with responsive design patterns using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`). Grid layouts adapt from single-column mobile to multi-column desktop seamlessly.

### 4. Motion-Enhanced Interactions
Framer Motion provides smooth transitions, hover effects, and micro-interactions that guide user attention and provide feedback. Every button, modal, and page transition includes purposeful animation.

### 5. Accessibility & Form UX
Clear labels, placeholder examples, validation states, and error messaging throughout. Focus states use high-contrast rings, and loading states prevent double-submissions.

---

## 🎨 Design System Tokens

### Color Palette

#### Brand Colors (Pawpaya Pastel Palette)
```css
/* Primary Gradient (Most Common) */
background: linear-gradient(to right, #ff7a4a, #ff6fb3);
```

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| **Primary Orange** | `#ff7a4a` | `from-[#ff7a4a]` | Gradient start, accent highlights |
| **Primary Pink** | `#ff6fb3` | `to-[#ff6fb3]` | Gradient end, focus rings, hover states |
| **Background Cream** | `#faf8f3` | `bg-[#faf8f3]` | Navbar, page backgrounds |

**Used for:**
- Primary action buttons (CTA buttons, login buttons)
- Active tab states
- Brand headings and success confirmations
- Gradient overlays on hero sections

#### Semantic Colors

**Success/Positive:**
```css
background: linear-gradient(to right, #4ade80, #10b981);
/* Tailwind: bg-gradient-to-r from-green-400 to-emerald-500 */
```

**Error/Danger:**
```css
background: linear-gradient(to right, #f87171, #f43f5e);
/* Tailwind: bg-gradient-to-r from-red-400 to-rose-500 */
```

**Neutral Scale:**
- Gray 50 → Gray 900 for backgrounds, text, and borders
- White for cards, inputs, and buttons

### Typography

**Font Family:** System font stack (Tailwind default)
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Font Sizes:**
- `text-xs` (12px) — Helper text, disclaimers
- `text-sm` (14px) — Body text, tab labels
- `text-base` (16px) — Default text, form inputs
- `text-lg` (18px) — Section subheadings
- `text-xl` to `text-5xl` — Headings and hero text

**Font Weights:**
- `font-medium` (500) — Subtle emphasis, links
- `font-semibold` (600) — User email display
- `font-bold` (700) — Buttons, labels, headings (primary pattern)

### Spacing & Layout

**Border Radius:**
- `rounded-3xl` (24px) — Card containers, major sections
- `rounded-2xl` (16px) — Buttons, inputs, modals (primary)
- `rounded-xl` (12px) — Icons, badges, secondary elements
- `rounded-full` — Spinners, circular elements

**Shadows:**
- `shadow-xl` — Card containers, major UI sections
- `shadow-lg` — Active buttons, navbar
- `shadow-2xl` — Modals, overlays, toast notifications

**Padding Pattern:**
```css
p-6 md:p-8  /* 1.5rem mobile → 2rem desktop */
```

### Focus States

**Standard Input Focus:**
```css
focus:outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent
```

**Button Focus:**
```css
focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
```

---

## 🧩 Core Components

### Layout Components

#### `Layout` (`/components/layout.js`)
Global app wrapper providing consistent navbar and footer structure.

```jsx
<Layout>
  <Component {...pageProps} />
</Layout>
```

#### `Navbar` (`/components/navbar.js`)
Fixed top navigation with logo, auth state, and dashboard link.

**Features:**
- Auth-aware (shows user email + sign out or login button)
- Logo with hover scale animation (`hover:scale-105`)
- Gradient CTA buttons
- Mobile-responsive (hides dashboard link on mobile)

**Design:**
- Background: `#faf8f3` with `backdrop-blur-sm`
- Border: `border-gray-200/50`
- Gradient buttons: `from-[#ff7a4a] to-[#ff6fb3]`

#### `Footer` (`/components/footer.js`)
Global footer with links, social media, and branding.

**Design:**
- Gradient background: `from-pink-50 via-purple-50 to-blue-50`
- Three-column grid (brand, links, social)
- Framer Motion scroll-triggered animations

### Form Components

#### `FormInput` (`/components/FormInput.js`)
Reusable form input with validation and error states.

**Standard Styling:**
```css
w-full h-12 px-4 rounded-2xl border-2 border-gray-200
outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent
```

#### `AddressInput` (`/components/AddressInput.js`)
Google Places autocomplete for address entry.

**Integration:** Uses `use-places-autocomplete` library for suggestions

### Dashboard Components

#### `DashboardCard` (`/components/DashboardCard.js`)
KPI display card for dashboard stats.

**Structure:**
```jsx
<div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100">
  <div className="text-4xl mb-2">{icon}</div>
  <div className="text-3xl font-bold">{value}</div>
  <div className="text-gray-600 text-sm">{label}</div>
</div>
```

**Use Cases:**
- Revenue display
- Scan counts
- Conversion rates
- Unpaid earnings

#### `ProgressBar` (`/components/ProgressBar.js`)
Multi-step form progress indicator.

**Visual Pattern:**
```
[✓] Details  →  [●] Business  →  [ ] Contact  →  [ ] Review
```

### UI Primitives

#### `Button` (`/components/button.js`)
Base button component with variant system.

**Variants:**
- **Primary:** Gradient background (`from-[#ff7a4a] to-[#ff6fb3]`)
- **Secondary:** Gray with border
- **Outline:** Transparent with border
- **Danger:** Red background
- **Success:** Green background
- **Ghost:** Transparent

**Sizes:** `sm`, `md`, `lg`, `xl`

**Animation Pattern:**
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

### Modal Components

#### `AdminAddOwnerModal` (`/components/AdminAddOwnerModal.js`)
Admin modal for adding franchise owners.

**Pattern:**
```jsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-50"
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Specialized Components

#### `StoresDataGrid` (`/components/StoresDataGrid.js`)
Paginated table/grid for store management.

**Features:**
- Sortable columns
- Filtering by business/status
- Pagination controls
- CSV export capability

#### `ErrorBoundary` (`/components/ErrorBoundary.js`)
React error boundary for graceful error handling.

```jsx
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

---

## 🎬 Animation Patterns

### Framer Motion Conventions

**Fade In Up** (Page sections):
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {content}
</motion.div>
```

**Modal Animations:**
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 20 }}
  transition={{ duration: 0.3 }}
/>
```

**Button Hover:**
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

**Scroll-Triggered Animations:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
/>
```

**Toast Notifications:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 50, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 50, scale: 0.9 }}
  className="fixed top-4 right-4"
/>
```

---

## 🎯 Common UI Patterns

### Tab Navigation Pattern
Used consistently across admin and dashboard pages.

```jsx
<div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-4 mb-6">
  <div className="flex flex-wrap gap-3">
    {tabs.map(tab => (
      <motion.button
        key={tab.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={isActive
          ? "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg rounded-2xl px-6 py-3 text-sm font-bold"
          : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl px-6 py-3 text-sm font-bold"
        }
        onClick={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </motion.button>
    ))}
  </div>
</div>
```

### Form Input Pattern
Consistent styling across all input fields.

```jsx
<input
  type="text"
  className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200
             outline-none focus:ring-2 focus:ring-[#ff6fb3]
             focus:border-transparent text-gray-900
             placeholder-gray-400 transition-all"
  placeholder="Enter your email"
/>
```

### Toast Notification Pattern
Success/error toasts with gradient backgrounds.

```jsx
<motion.div
  initial={{ opacity: 0, y: 50, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 50, scale: 0.9 }}
  className={toast.type === 'success'
    ? "bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-green-300 text-white rounded-2xl px-6 py-4 shadow-2xl font-bold"
    : "bg-gradient-to-r from-red-400 to-rose-500 border-2 border-red-300 text-white rounded-2xl px-6 py-4 shadow-2xl font-bold"
  }
>
  {toast.message}
</motion.div>
```

### Loading Spinner Pattern
Consistent spinner across all loading states.

```jsx
<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
```

### Card Pattern
Standard card container design.

```jsx
<div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 md:p-8">
  {/* Card content */}
</div>
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind Defaults)
- `sm`: 640px (tablets)
- `md`: 768px (small laptops)
- `lg`: 1024px (desktops)
- `xl`: 1280px (large screens)

### Mobile-First Patterns

**Grid Layouts:**
```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

**Hidden Elements:**
```css
hidden sm:flex  /* Show on tablet+ */
hidden md:block /* Show on laptop+ */
```

**Padding Adjustments:**
```css
p-4 md:p-6 lg:p-8
```

**Text Sizing:**
```css
text-sm md:text-base lg:text-lg
```

---

## 🔗 Integration with Business Logic

### Supabase Data Reads/Writes

**Client-Side Pattern:**
```jsx
import { supabase } from '@/lib/supabase';

function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('retailers')
        .select('*, scans(*), payout_jobs(*)')
        .eq('user_id', user.id)
        .single();
      setStats(data);
    }
    fetchStats();
  }, [user]);

  return <DashboardCard value={stats?.revenue} label="Total Revenue" />;
}
```

**Server-Side Pattern (getServerSideProps):**
```jsx
export async function getServerSideProps(context) {
  const supabaseServer = createServerClient(/* ... */);
  const { data: { user } } = await supabaseServer.auth.getUser();

  const { data: retailers } = await supabaseAdmin
    .from('retailers')
    .select('*')
    .order('created_at', { ascending: false });

  return { props: { user, retailers } };
}
```

### Shopify Commerce Integration

**NFC Redirect Flow:**
```
Customer taps display → /t?u=ABC123 → /api/uid-redirect
→ Checks uids table → Redirects to Shopify affiliate URL
→ Customer completes checkout → Webhook syncs order
```

**UI Components Involved:**
- `/claim` page for unclaimed UIDs
- Dashboard "Displays" tab showing claimed UIDs
- Admin "UIDs" tab for UID management

### Tapify Dashboards

#### Retailer Dashboard (`/onboard/dashboard`)
**Tabs:**
1. **Stats** — Revenue, scans, conversion metrics (DashboardCard components)
2. **Scans** — Real-time scan log table
3. **Displays** — Claimed UIDs with performance data
4. **Payouts** — Payout history and status
5. **Settings** — Bank account connection (Plaid Link)

#### Admin Dashboard (`/admin`)
**Tabs:**
1. **Vendors** — Vendor management grid
2. **Retailers** — Retailer management grid
3. **Stores** — Business location management
4. **Payouts** — Payout approval and processing
5. **Analytics** — Platform-wide metrics
6. **Sourcers** — Sourcing agent leaderboard
7. **UIDs** — NFC tag management

### Onboarding Flows

**Retailer Onboarding:**
```
Landing (/) → Onboard Landing (/onboard) → Multi-Step Form (/onboard/register)
→ Dashboard (/onboard/dashboard)
```

**UI Components:**
- `ProgressBar` — Step indicator (1/4, 2/4, etc.)
- `FormInput` — Validated form fields
- `AddressInput` — Google Places autocomplete
- Toast notifications for success/error

**Vendor Onboarding (Phase 2):**
```
Vendor Form → Shopify OAuth (/onboard/shopify-connect) → Dashboard
```

---

## 🧪 Third-Party UI Integrations

### Supabase Auth UI (`@supabase/auth-ui-react`)
Pre-built auth components for login/signup with custom theming.

**Usage:** `/pages/login.js`

### Plaid Link (`react-plaid-link`)
Bank account connection modal for payout setup.

**Integration:**
```jsx
import { usePlaidLink } from 'react-plaid-link';

const { open, ready } = usePlaidLink({
  token: linkToken,
  onSuccess: (public_token) => {
    // Exchange token via /api/plaid-exchange
  },
});
```

### Google Places Autocomplete (`use-places-autocomplete`)
Address input with autocomplete suggestions.

**Component:** `AddressInput.js`

---

## 🎨 Brand Personality & UX Principles

### Visual Identity
- **Primary:** Orange-to-pink gradient (`#ff7a4a` → `#ff6fb3`)
- **Background:** Warm cream (`#faf8f3`)
- **Vibe:** Playful, friendly, pastel-driven (pet-focused brand)
- **Typography:** Bold, clear, simple (system fonts only)

### UX Philosophy

**Conversion Focus:**
- Multi-step forms with clear progress indicators
- Real-time validation with helpful error messages
- Loading states prevent double-submissions
- Success confirmations with animations

**Delight Factors:**
- Micro-interactions on hover/tap
- Smooth page transitions
- Gradient backgrounds and shadows
- Scroll-triggered animations

**Clarity:**
- High-contrast text on backgrounds
- Clear visual hierarchy (primary → secondary → tertiary)
- Consistent spacing and alignment
- Accessible focus states

**Consistency:**
- Reusable component library
- Standardized design tokens
- Uniform animation timings
- Predictable interaction patterns

---

## 📊 Component Usage Matrix

| Component | Used In | Purpose |
|-----------|---------|---------|
| `Layout` | All pages | Global wrapper |
| `Navbar` | All pages | Fixed header with auth |
| `Footer` | All pages | Global footer |
| `Button` | Forms, CTAs | Interactive actions |
| `FormInput` | Registration, admin | Form fields |
| `DashboardCard` | Dashboards | KPI display |
| `ProgressBar` | Multi-step forms | Step indicator |
| `AdminAddOwnerModal` | Admin dashboard | Owner creation |
| `AddProspectModal` | Admin dashboard | Outreach logging |
| `StoresDataGrid` | Admin stores page | Data table |
| `ErrorBoundary` | App root | Error handling |

---

## 🔗 Relation to Other Context Files

### Frontend Architecture
- **@context/nextjs/overview.md** — Complete Next.js architecture map
- **@context/nextjs/components_overview.md** — Detailed component API reference
- **@context/nextjs/frontend_flow.md** — User journey and page flow diagrams
- **@context/nextjs/auth_flow.md** — Authentication logic underlying auth UI
- **@context/nextjs/pages_api_summary.md** — API route endpoints used by UI

### Business Logic
- **@context/GAME_PLAN_2.0.md** — Business strategy and design intent
- **@context/data_model.md** — Database entities UI components interact with
- **@context/shopify/integration_points.md** — Commerce layer UI integrations

### Infrastructure
- **@context/supabase/overview.md** — Database architecture and queries
- **@context/environment.md** — Environment setup for UI development

---

## 🚀 Tech Stack Summary

### Core UI
- **React** (18.3.1) — Component-based UI library
- **Next.js** (latest) — React framework with SSR and routing
- **Tailwind CSS** (3.4.10) — Utility-first CSS framework
- **Framer Motion** (12.23.22) — Animation and transition library

### Styling & Animation
- **Tailwind CSS** — Design system tokens
- **Framer Motion** — Interactive animations
- **GSAP** (3.13.0) — Advanced animations (minimal usage)

### Auth & Data
- **@supabase/auth-helpers-nextjs** (0.10.0) — Server-side auth
- **@supabase/auth-helpers-react** (0.5.0) — Client-side auth
- **@supabase/auth-ui-react** (0.4.7) — Pre-built auth components

### External Integrations
- **react-plaid-link** (4.1.1) — Bank account connection UI
- **use-places-autocomplete** (4.0.1) — Google Places address autocomplete

---

## ✅ Quick Reference

### Standard Button
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white font-bold rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all"
>
  Click Me
</motion.button>
```

### Standard Input
```jsx
<input
  className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent"
/>
```

### Standard Card
```jsx
<div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 md:p-8">
  {content}
</div>
```

### Active Tab
```jsx
<button className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg rounded-2xl px-6 py-3 text-sm font-bold" />
```

### Inactive Tab
```jsx
<button className="text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl px-6 py-3 text-sm font-bold transition-all" />
```

---

## 🎯 For New Engineers

**To rebuild the entire Tapify interface from scratch, you would:**

1. **Install dependencies:** `npm install react next tailwindcss framer-motion @supabase/auth-ui-react react-plaid-link use-places-autocomplete`

2. **Set up Tailwind config** with custom brand colors:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'pawpaya-orange': '#ff7a4a',
        'pawpaya-pink': '#ff6fb3',
        'pawpaya-cream': '#faf8f3',
      },
    },
  },
}
```

3. **Build core components** using the patterns in this doc:
   - Layout (navbar + footer wrapper)
   - Button (with variants and Framer Motion)
   - FormInput (with validation states)
   - DashboardCard (KPI display)

4. **Implement authentication** using Supabase Auth Context

5. **Create pages** following the routing structure in `@context/nextjs/frontend_flow.md`

6. **Connect to Supabase** for data fetching using patterns in `@context/nextjs/db_calls_summary.md`

7. **Integrate Shopify** for commerce using `@context/shopify/integration_points.md`

8. **Apply animations** using Framer Motion patterns documented here

---

## 📝 Notes

- All colors use inline Tailwind arbitrary values (`from-[#ff7a4a]`) — consider moving to Tailwind config for better caching
- GSAP is installed but minimally used — verify if needed for future animations
- No custom fonts defined — using system font stack only
- Dark mode tokens not currently defined — confirm if needed for Phase 2

---

**This README serves as the single source of truth for Tapify's visual and interactive system. Start here for UI work, then dive into specific component or design token documentation as needed.**
