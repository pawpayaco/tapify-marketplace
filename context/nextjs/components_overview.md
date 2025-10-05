# 🧩 Next.js Component Architecture

Documents the reusable React components and UI patterns that build Tapify's frontend experience.

---

## 💡 Purpose
This file catalogs all React components in `/components`, explaining their props, usage patterns, and design system integration.

---

## 🏗️ Component Structure

### Layout Components

#### `Layout` (`layout.js`)
**Purpose:** Global app wrapper providing navbar and footer structure.

**Structure:**
```jsx
<div className="flex flex-col min-h-screen">
  <Navbar />
  <main className="flex-grow">
    {children}
  </main>
  <Footer />
</div>
```

**Usage:**
```jsx
// pages/_app.js
<Layout>
  <Component {...pageProps} />
</Layout>
```

**File:** `components/layout.js:4-14`

---

#### `Navbar` (`navbar.js`)
**Purpose:** Fixed top navigation with logo, auth state, and dashboard link.

**Features:**
- Sticky positioning (`fixed top-0`)
- Auth-aware (shows user email + sign out or login button)
- Logo with hover scale animation
- Dashboard quick access link
- Gradient buttons for CTAs

**Auth Integration:**
```jsx
const { user, signOut } = useAuthContext();

{user ? (
  <div>
    <span>{user.email}</span>
    <button onClick={signOut}>Sign Out</button>
  </div>
) : (
  <Link href="/login">Login</Link>
)}
```

**Design System:**
- Background: `#faf8f3`
- Gradient buttons: `from-[#ff7a4a] to-[#ff6fb3]`
- Backdrop blur: `backdrop-blur-sm`
- Border: `border-gray-200/50`

**File:** `components/navbar.js:9-63`

---

#### `Footer` (`footer.js`)
**Purpose:** Global footer with links, legal info, and branding.

**Expected Sections:**
- Company info
- Quick links (Privacy, Terms, Contact)
- Social media icons
- Copyright notice

**Status:** (verify implementation)

---

### Form Components

#### `FormInput` (`FormInput.js`)
**Purpose:** Reusable form input with validation and error states.

**Expected Props:**
```jsx
<FormInput
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  placeholder="your@email.com"
  required
/>
```

**Features:**
- Label + input wrapper
- Error message display
- Focus states with gradient borders
- Accessibility (aria-labels, for/id linking)

**Status:** (verify — file exists but may be placeholder)

---

#### `AddressInput` (`AddressInput.js`)
**Purpose:** Google Places autocomplete for address entry.

**Expected Props:**
```jsx
<AddressInput
  value={address}
  onChange={handleAddressChange}
  onPlaceSelected={handlePlaceSelect}
/>
```

**Features:**
- Google Places API integration
- Auto-fill city, state, zip from selection
- Address validation via `/api/validate-address`

**Status:** (verify implementation)

---

### Dashboard Components

#### `DashboardCard` (`DashboardCard.js`)
**Purpose:** KPI display card for dashboard stats.

**Expected Structure:**
```jsx
<div className="bg-white rounded-3xl p-6 shadow-xl">
  <div className="text-4xl mb-2">{icon}</div>
  <div className="text-3xl font-bold">{value}</div>
  <div className="text-gray-600 text-sm">{label}</div>
</div>
```

**Common Use Cases:**
- Revenue display
- Scan counts
- Conversion rates
- Unpaid earnings

**Design:**
- Rounded corners: `rounded-3xl`
- Shadow: `shadow-xl`
- Gradient backgrounds (optional)

**File Reference:** Used in `pages/onboard/dashboard.js`, `pages/admin.js`

**Status:** (verify — file exists but may be placeholder)

---

#### `ProgressBar` (`ProgressBar.js`)
**Purpose:** Multi-step form progress indicator.

**Expected Props:**
```jsx
<ProgressBar
  currentStep={2}
  totalSteps={4}
  labels={['Details', 'Business', 'Contact', 'Review']}
/>
```

**Visual Pattern:**
```
[✓] Details  →  [●] Business  →  [ ] Contact  →  [ ] Review
```

**Styling:**
- Active step: Gradient circle
- Completed: Check icon
- Inactive: Gray circle
- Connecting lines between steps

**Usage:** `pages/onboard/register.js` (multi-step form)

**Status:** (verify — file exists but may be placeholder)

---

### UI Primitives

#### `Button` (`button.js`)
**Purpose:** Base button component with variant system.

**Props:**
```jsx
<Button
  variant="primary" // primary | secondary | outline | danger | success | ghost
  size="md"         // sm | md | lg | xl
  type="button"     // button | submit | reset
  disabled={false}
  onClick={handleClick}
  className="custom-class"
>
  Click Me
</Button>
```

**Variants:**
- `primary`: Blue gradient
- `secondary`: Gray
- `outline`: Transparent with border
- `danger`: Red
- `success`: Green
- `ghost`: Transparent

**Sizes:**
- `sm`: Small padding/text
- `md`: Default
- `lg`: Large
- `xl`: Extra large

**File:** `components/button.js:1-45`

---

### Modal Components

#### `AdminAddOwnerModal` (`AdminAddOwnerModal.js`)
**Purpose:** Admin modal for adding franchise owners.

**Expected Features:**
- Overlay backdrop (click to close)
- Form fields (name, email, phone, business_id)
- Submit → POSTs to `/api/admin/add-owner`
- Success toast notification

**Design:**
- Centered modal with backdrop blur
- Framer Motion slide-in animation
- Gradient submit button

**Status:** (verify implementation)

---

#### `AddProspectModal` (`AddProspectModal.js`)
**Purpose:** Admin modal for logging outreach prospects.

**Expected Features:**
- Store name, phone, business dropdown
- Notes field
- Submit → POSTs to `/api/admin/add-prospect`

**Status:** (verify implementation)

---

### Data Display Components

#### `StoresDataGrid` (`StoresDataGrid.js`)
**Purpose:** Paginated table/grid for store management.

**Expected Features:**
- Sortable columns (name, status, created_at)
- Filtering by business or status
- Bulk actions (select multiple → update)
- Pagination controls
- CSV export (verify)

**Usage:** `pages/admin/stores.js`

**Status:** (verify implementation)

---

#### `ImageModalGallery` (`ImageModalGallery.js`)
**Purpose:** Lightbox gallery for product photos.

**Expected Features:**
- Click thumbnail → open fullscreen
- Arrow navigation (prev/next)
- Close on backdrop click or ESC
- Image zoom controls

**Usage:** Vendor product display (verify)

**Status:** (verify implementation)

---

### Specialized Components

#### `StoreRegistrationForm` (`StoreRegistrationForm.js`)
**Purpose:** Multi-step retailer registration form.

**Expected Features:**
- Step 1: Store details
- Step 2: Business info
- Step 3: Contact preferences
- Step 4: Review & submit
- Progress tracking with `ProgressBar`
- Form validation
- POSTs to `/api/onboard/register`

**Status:** May be merged into `pages/onboard/register.js` directly

---

#### `ErrorBoundary` (`ErrorBoundary.js`)
**Purpose:** Catch React errors and show fallback UI.

**Pattern:**
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

**Usage:**
```jsx
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

**File:** `components/ErrorBoundary.js`

---

## 🎨 Design System Patterns

### Color Palette
**Primary Gradient:**
```css
.gradient-primary {
  background: linear-gradient(to right, #ff7a4a, #ff6fb3);
}
```

**Backgrounds:**
- Page: `#faf8f3`
- Cards: `white`
- Accent gradients: `from-pink-200 via-purple-200 to-indigo-200`

**Text:**
- Primary: `text-gray-900`
- Secondary: `text-gray-600`
- Muted: `text-gray-400`

---

### Border Radius
- Buttons: `rounded-2xl` (16px)
- Cards: `rounded-3xl` (24px)
- Inputs: `rounded-xl` (12px)

---

### Shadows
- Cards: `shadow-xl`
- Buttons (hover): `shadow-lg`
- Modals: `shadow-2xl`

---

### Animations (Framer Motion)

**Fade In Up:**
```jsx
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeInUp}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

**Button Hover:**
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

**Stagger Children:**
```jsx
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

<motion.div variants={staggerContainer}>
  {items.map(item => (
    <motion.div variants={fadeInUp} key={item.id}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## 🔄 Common Component Patterns

### Auth-Protected Component
```jsx
import { useAuthContext } from '../context/AuthContext';

function ProtectedPage() {
  const { user, loading } = useAuthContext();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return <div>Protected content</div>;
}
```

---

### Data Fetching Component
```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function DataList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: results } = await supabase
        .from('table')
        .select('*');
      setData(results);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

### Toast Notification
```jsx
const [toast, setToast] = useState(null);

const showToast = (message, type = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};

{toast && (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 right-4 p-4 rounded-xl shadow-xl ${
      toast.type === 'success'
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white'
    }`}
  >
    {toast.message}
  </motion.div>
)}
```

---

## 📦 Component Summary Table

| Component | Category | Status | Usage | File |
|-----------|----------|--------|-------|------|
| `Layout` | Layout | ✅ Implemented | All pages | `layout.js` |
| `Navbar` | Layout | ✅ Implemented | Global header | `navbar.js` |
| `Footer` | Layout | (verify) | Global footer | `footer.js` |
| `Button` | UI Primitive | ✅ Implemented | Forms, CTAs | `button.js` |
| `FormInput` | Form | (verify) | Input fields | `FormInput.js` |
| `AddressInput` | Form | (verify) | Address autocomplete | `AddressInput.js` |
| `DashboardCard` | Dashboard | (verify) | KPI display | `DashboardCard.js` |
| `ProgressBar` | UI | (verify) | Multi-step forms | `ProgressBar.js` |
| `AdminAddOwnerModal` | Modal | (verify) | Admin actions | `AdminAddOwnerModal.js` |
| `AddProspectModal` | Modal | (verify) | Admin outreach | `AddProspectModal.js` |
| `StoresDataGrid` | Data Display | (verify) | Store management | `StoresDataGrid.js` |
| `ImageModalGallery` | Media | (verify) | Product photos | `ImageModalGallery.js` |
| `StoreRegistrationForm` | Form | (verify) | Onboarding | `StoreRegistrationForm.js` |
| `ErrorBoundary` | Utility | ✅ Implemented | Error handling | `ErrorBoundary.js` |

**Legend:**
- ✅ = Fully implemented
- (verify) = Exists but needs verification

---

## 🔗 Relations
- See **@context/ui/ui_overview.md** for design system details
- See **@context/ui/design_system_tokens.md** for color/spacing tokens
- See **@context/nextjs/frontend_flow.md** for page-level component usage
- See **@context/nextjs/auth_flow.md** for auth component patterns
