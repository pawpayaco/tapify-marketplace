# <¨ Tapify Design System Tokens

## =¡ Purpose
This document defines Tapify's visual design language, including color palette, typography, spacing, borders, shadows, and component styling conventions. It serves as the single source of truth for maintaining consistent UI/UX across the platform.

---

## <¨ Color Palette

### Brand Colors (Pawpaya Pastel Palette)

| Token | Hex Code | Usage | CSS Class |
|-------|----------|-------|-----------|
| **Primary Orange** | `#ff7a4a` | Gradient start, accent highlights | `from-[#ff7a4a]` |
| **Primary Pink** | `#ff6fb3` | Gradient end, focus rings, hover states | `to-[#ff6fb3]`, `focus:ring-[#ff6fb3]` |
| **Background Cream** | `#faf8f3` | Navbar, page backgrounds | `bg-[#faf8f3]` |

**Primary Gradient** (Most Common):
```css
background: linear-gradient(to right, #ff7a4a, #ff6fb3);
```
**Tailwind Class**: `bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]`

**Used for**:
- Primary action buttons
- Active tab states
- Brand headings
- Login/CTA buttons
- Success confirmations

---

### Semantic Colors

#### Success / Positive
| Token | Tailwind Range | Usage |
|-------|----------------|-------|
| **Green 400** | `bg-green-400` | Success toast start |
| **Emerald 500** | `bg-emerald-500` | Success toast end, active states |
| **Emerald 600** | `bg-emerald-600` | Buttons, primary actions |
| **Green 50** | `bg-green-50` | Selected item background |
| **Green 200** | `border-green-200` | Selected item border |
| **Green 300** | `border-green-300` | Success toast border |

**Success Gradient**:
```css
background: linear-gradient(to right, #4ade80, #10b981);
```
**Tailwind**: `bg-gradient-to-r from-green-400 to-emerald-500`

#### Error / Danger
| Token | Tailwind Range | Usage |
|-------|----------------|-------|
| **Red 400** | `bg-red-400` | Error toast start |
| **Rose 500** | `bg-rose-500` | Error toast end |
| **Red 50** | `bg-red-50` | Error message background |
| **Red 200** | `border-red-200` | Error message border |
| **Red 600** | `text-red-600`, `bg-red-600` | Error text, danger buttons |
| **Red 700** | `text-red-700` | Error heading text |
| **Red 800** | `text-red-800` | Critical error text |

**Error Gradient**:
```css
background: linear-gradient(to right, #f87171, #f43f5e);
```
**Tailwind**: `bg-gradient-to-r from-red-400 to-rose-500`

#### Info / Secondary
| Token | Tailwind Range | Usage |
|-------|----------------|-------|
| **Blue 600** | `bg-blue-600` | Primary variant buttons |
| **Blue 700** | `bg-blue-700` | Button hover states |
| **Blue 50** | `bg-blue-50`, `hover:bg-blue-50` | Outline button hover |
| **Purple 50** | `via-purple-50` | Footer gradient middle |

---

### Neutral Colors

| Token | Tailwind | Usage |
|-------|----------|-------|
| **White** | `bg-white` | Cards, inputs, buttons |
| **Gray 50** | `bg-gray-50` | Hover states, disabled backgrounds |
| **Gray 100** | `border-gray-100`, `bg-gray-100` | Card borders, subtle hover states |
| **Gray 200** | `border-gray-200` | Input borders, default borders |
| **Gray 300** | `border-gray-300` | Secondary button borders |
| **Gray 400** | `text-gray-400`, `placeholder-gray-400` | Placeholder text, disabled icons |
| **Gray 500** | `text-gray-500` | Helper text, descriptions |
| **Gray 600** | `text-gray-600`, `bg-gray-600` | Body text, secondary buttons |
| **Gray 700** | `text-gray-700` | Primary text, labels |
| **Gray 900** | `text-gray-900` | Headings, emphasis text |

**Background Gradients** (Footer, Hero sections):
```css
background: linear-gradient(to bottom right, #fef1f7, #faf5ff, #eff6ff);
```
**Tailwind**: `bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50`

---

### Alpha/Transparency Variations

| Token | Usage | Example Class |
|-------|-------|---------------|
| **White 80%** | Navbar, buttons with backdrop blur | `bg-white/80` |
| **White 90%** | Hover states on backdrop blur elements | `hover:bg-white/90` |
| **White 20%** | Button borders on gradients | `border-white/20` |
| **Gray 200 50%** | Subtle borders on fixed elements | `border-gray-200/50` |
| **Black 50%** | Modal backdrop overlay | `bg-black/50` |

---

## =$ Typography

### Font Family
**Primary**: System font stack (default Tailwind)
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

*Note: No custom fonts defined (verify if brand fonts needed)*

---

### Font Sizes

| Token | Tailwind Class | Size | Usage |
|-------|----------------|------|-------|
| **Extra Small** | `text-xs` | 0.75rem (12px) | Helper text, disclaimers |
| **Small** | `text-sm` | 0.875rem (14px) | Body text, descriptions, tab labels |
| **Base** | `text-base` | 1rem (16px) | Default text, form inputs |
| **Large** | `text-lg` | 1.125rem (18px) | Section subheadings |
| **Extra Large** | `text-xl` | 1.25rem (20px) | Large buttons |
| **2XL** | `text-2xl` | 1.5rem (24px) | Card headings, modal titles |

**Headings** (not extensively used in current components; verify on landing pages):
- `text-3xl`, `text-4xl`, `text-5xl` for hero/landing sections

---

### Font Weights

| Token | Tailwind Class | Weight | Usage |
|-------|----------------|--------|-------|
| **Medium** | `font-medium` | 500 | Subtle emphasis, links |
| **Semibold** | `font-semibold` | 600 | User email display |
| **Bold** | `font-bold` | 700 | Buttons, labels, headings, CTAs |

**Primary Pattern**: Most interactive elements (buttons, labels, tabs) use `font-bold`

---

## =Ð Spacing & Layout

### Padding

| Token | Tailwind Class | Size | Usage |
|-------|----------------|------|-------|
| **XS** | `p-2` | 0.5rem (8px) | Icon buttons, small elements |
| **SM** | `p-3` | 0.75rem (12px) | Social icons, compact buttons |
| **MD** | `p-4` | 1rem (16px) | Standard card padding (mobile), tab containers |
| **LG** | `p-6` | 1.5rem (24px) | Card padding (desktop), form containers |
| **XL** | `p-8` | 2rem (32px) | Large card padding (desktop) |

**Responsive Pattern**:
```css
p-6 md:p-8  /* 1.5rem mobile ’ 2rem desktop */
```

**Specific Padding** (Inputs):
- **Horizontal**: `px-4` (1rem) for inputs, `px-5` (1.25rem) for buttons, `px-6` (1.5rem) for large buttons
- **Vertical**: `py-2` (0.5rem) for inputs, `py-2.5` (0.625rem) for buttons, `py-3` (0.75rem) for large buttons

---

### Margin

| Token | Tailwind Class | Size | Usage |
|-------|----------------|------|-------|
| **MB-2** | `mb-2` | 0.5rem (8px) | Label to input spacing |
| **MB-4** | `mb-4` | 1rem (16px) | Form field spacing |
| **MB-6** | `mb-6` | 1.5rem (24px) | Section spacing, card groups |
| **MB-12** | `mb-12` | 3rem (48px) | Major section dividers |

---

### Gap (Flexbox/Grid)

| Token | Tailwind Class | Size | Usage |
|-------|----------------|------|-------|
| **Gap-2** | `gap-2` | 0.5rem (8px) | Icon + text in buttons |
| **Gap-3** | `gap-3` | 0.75rem (12px) | Tab buttons, form rows, action buttons |
| **Gap-4** | `gap-4` | 1rem (16px) | Form field groups, card grids |
| **Gap-6** | `gap-6` | 1.5rem (24px) | Footer links |
| **Gap-12** | `gap-12` | 3rem (48px) | Footer column spacing |

---

## =2 Borders

### Border Radius

| Token | Tailwind Class | Size | Usage |
|-------|----------------|------|-------|
| **Standard** | `rounded-xl` | 0.75rem (12px) | Buttons, small cards, inputs (secondary) |
| **Large** | `rounded-2xl` | 1rem (16px) | Buttons, inputs, modals (primary) |
| **Extra Large** | `rounded-3xl` | 1.5rem (24px) | Card containers, major sections |
| **Full** | `rounded-full` | 9999px | Spinners, circular elements |

**Primary Pattern**:
- **Cards/Containers**: `rounded-3xl`
- **Buttons/Inputs**: `rounded-2xl`
- **Icons/Badges**: `rounded-xl`

---

### Border Width

| Token | Tailwind Class | Size | Usage |
|-------|----------------|------|-------|
| **Standard** | `border` | 1px | Rare usage (verify) |
| **2x** | `border-2` | 2px | Card borders, input borders, button outlines |

**Primary Pattern**: `border-2` is standard across all bordered elements

---

### Border Colors

| Usage | Class | Color |
|-------|-------|-------|
| **Card Borders** | `border-gray-100` | Very light gray |
| **Input Borders** | `border-gray-200` | Light gray |
| **Button Outlines** | `border-gray-300` | Medium-light gray |
| **Active Input** | `focus:border-transparent` | Removed on focus (replaced by ring) |
| **Success State** | `border-green-200` | Light green |
| **Error State** | `border-red-200` | Light red |

---

## < Shadows

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| **Small** | `shadow-sm` | Navbar, subtle cards, inputs |
| **Medium** | `shadow-md` | Button hover states, dropdowns |
| **Large** | `shadow-lg` | Active buttons, navbar, modal hover |
| **Extra Large** | `shadow-xl` | Card containers, major UI sections |
| **2XL** | `shadow-2xl` | Modals, overlays, toast notifications |

**Drop Shadow** (Image-specific):
- `drop-shadow-md` ’ `drop-shadow-lg` (on hover, logo)

---

## <¯ Focus States

### Focus Rings

**Standard Pattern**:
```css
focus:outline-none focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent
```

**Button Focus**:
```css
focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
```

| Element | Ring Color | Ring Width | Offset |
|---------|------------|------------|--------|
| **Inputs** | `#ff6fb3` (pink) | `ring-2` | None |
| **Buttons (primary)** | `blue-500` | `ring-2` | `ring-offset-2` |
| **Buttons (secondary)** | `gray-500` | `ring-2` | `ring-offset-2` |
| **Buttons (danger)** | `red-500` | `ring-2` | `ring-offset-2` |
| **Buttons (success)** | `green-500` | `ring-2` | `ring-offset-2` |

---

## ( Effects

### Backdrop Blur
```css
backdrop-blur-sm  /* Navbar, buttons with transparency */
```

### Hover Transforms
| Element | Transform | Class |
|---------|-----------|-------|
| **Buttons** | Scale 1.05 | `whileHover={{ scale: 1.05 }}` (Framer Motion) |
| **Buttons (tap)** | Scale 0.95 | `whileTap={{ scale: 0.95 }}` |
| **Logo** | Scale 1.05 | `hover:scale-105` (Tailwind) |
| **Social Icons** | Scale 1.1, Y -2px | `whileHover={{ scale: 1.1, y: -2 }}` |

### Transitions
```css
transition-all duration-200  /* Buttons */
transition-all duration-300  /* Logo, navbar links */
transition-colors            /* Text links */
```

**Framer Motion Transitions**:
```javascript
transition={{ duration: 0.5 }}           // Page sections
transition={{ duration: 0.5, delay: 0.1 }} // Staggered animations
transition={{ type: "spring", stiffness: 200 }} // Checkmark animations
```

---

## >é Component-Specific Tokens

### Buttons

#### Primary Button (Gradient CTA)
```css
bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]
text-white
font-bold
rounded-2xl
px-6 py-3
shadow-lg
hover:shadow-xl
transition-all
```

#### Secondary Button (Outlined)
```css
border-2 border-gray-300
text-gray-700
font-bold
rounded-2xl
px-6 py-3
hover:bg-gray-50
transition-all
```

#### Danger Button
```css
bg-red-600
text-white
font-bold
rounded-xl
px-4 py-2
hover:bg-red-700
```

#### Ghost Button
```css
bg-transparent
text-gray-700
font-medium
rounded-lg
px-4 py-2
hover:bg-gray-100
```

---

### Form Inputs

#### Text Input (Standard)
```css
w-full
h-12
px-4 py-3
border-2 border-gray-200
rounded-2xl
outline-none
focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent
text-gray-900
placeholder-gray-400
transition-all
```

#### Textarea
```css
w-full
px-4 py-3
border-2 border-gray-200
rounded-2xl
outline-none
focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent
text-gray-900
placeholder-gray-400
resize-none
```

#### Select/Dropdown
```css
w-full
px-4 py-3
border-2 border-gray-200
rounded-2xl
outline-none
focus:ring-2 focus:ring-green-500 focus:border-transparent
```

---

### Cards

#### Standard Card
```css
bg-white
rounded-3xl
shadow-xl
border-2 border-gray-100
p-6 md:p-8
```

#### Modal Card
```css
bg-white
rounded-3xl
shadow-2xl
border-2 border-gray-100
p-6 md:p-8
max-w-2xl
max-h-[90vh]
overflow-y-auto
```

#### Selected State Card
```css
border-2 border-green-200
bg-green-50
rounded-2xl
p-4
```

---

### Navigation

#### Tab (Active)
```css
bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3]
text-white
shadow-lg
rounded-2xl
px-6 py-3
text-sm
font-bold
```

#### Tab (Inactive)
```css
text-gray-700
hover:bg-gray-100
border-2 border-gray-200
rounded-2xl
px-6 py-3
text-sm
font-bold
transition-all
```

---

### Toasts / Notifications

#### Success Toast
```css
bg-gradient-to-r from-green-400 to-emerald-500
border-2 border-green-300
text-white
rounded-2xl
px-6 py-4
shadow-2xl
font-bold
```

#### Error Toast
```css
bg-gradient-to-r from-red-400 to-rose-500
border-2 border-red-300
text-white
rounded-2xl
px-6 py-4
shadow-2xl
font-bold
```

---

### Loading States

#### Spinner
```css
animate-spin
rounded-full
h-5 w-5
border-2 border-white border-t-transparent
```

#### Loading Button
```css
disabled:opacity-50
disabled:cursor-not-allowed
```

---

## =Ï Responsive Breakpoints

| Breakpoint | Min-Width | Usage |
|------------|-----------|-------|
| **sm** | 640px | Tablets (show dashboard button) |
| **md** | 768px | Small laptops (2-column grids, show user email) |
| **lg** | 1024px | Desktops (3-column grids) |
| **xl** | 1280px | Large screens |

**Common Patterns**:
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Flex Direction**: `flex-col md:flex-row`
- **Text Size**: `text-sm md:text-base`
- **Padding**: `p-4 md:p-6 lg:p-8`
- **Hidden Elements**: `hidden sm:flex`, `hidden md:block`

---

## <¨ Animation Tokens

### Framer Motion Variants

**Fade In Up** (Page sections):
```javascript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

**Scale Up** (Modals):
```javascript
initial={{ opacity: 0, scale: 0.9, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.9, y: 20 }}
```

**Toast Slide Up**:
```javascript
initial={{ opacity: 0, y: 50, scale: 0.9 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 50, scale: 0.9 }}
```

**Success Checkmark**:
```javascript
initial={{ scale: 0 }}
animate={{ scale: 1 }}
transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
```

---

## = Tailwind Configuration

**Current Config** (`styles/tailwind.config.js`):
- **Status**: Empty/default configuration *(verify)*
- **Custom Colors**: Defined inline via arbitrary values (`from-[#ff7a4a]`)
- **Custom Spacing**: Uses default Tailwind scale
- **Custom Breakpoints**: Uses default Tailwind breakpoints

**Recommendation**: Formalize custom brand colors in `tailwind.config.js`:
```javascript
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

---

## =Ý Design Conventions Summary

###  Consistent Patterns
1. **Rounded corners**: `rounded-3xl` for cards, `rounded-2xl` for buttons/inputs
2. **Borders**: Always `border-2`, never `border` (1px)
3. **Gradients**: Primary gradient for CTAs, success/error gradients for toasts
4. **Shadows**: `shadow-xl` for cards, `shadow-2xl` for modals
5. **Font weight**: `font-bold` for all interactive elements and labels
6. **Focus rings**: Pink (`#ff6fb3`) for inputs, color-matched for buttons
7. **Backdrop blur**: Used on navbar and semi-transparent elements
8. **Animation**: Framer Motion for all interactive components

### <¨ Brand Identity
- **Primary**: Orange-to-pink gradient (`#ff7a4a` ’ `#ff6fb3`)
- **Background**: Warm cream (`#faf8f3`)
- **Vibe**: Playful, friendly, pastel-driven (pet-focused brand)
- **Typography**: Bold, clear, simple (system fonts only)

### =€ Performance Considerations
- Inline color values (`from-[#ff7a4a]`) may increase CSS bundle size
- Consider consolidating into Tailwind config for better caching
- GSAP is installed but not heavily used (verify if needed)

---

## = Verification Needed

The following items are noted but need verification:

1. **Tailwind Config** *(verify)*: Config file is empty  custom colors should be added
2. **Custom Fonts** *(verify)*: No custom fonts detected  confirm if brand fonts exist
3. **GSAP Usage** *(verify)*: Library is installed but usage not evident in reviewed components
4. **Icon System** *(verify)*: Icons are inline SVGs  consider icon library if scaling
5. **Dark Mode** *(verify)*: No dark mode tokens defined  confirm if needed

---

## <¯ Usage Guidelines

### For Developers
- Always use `rounded-2xl` or `rounded-3xl` (never `rounded-lg` or smaller)
- Buttons always have `font-bold`, shadows, and hover animations
- Use `border-2` for consistency (never `border` alone)
- Focus states are mandatory on all interactive elements
- Loading states should use the spinner pattern with `animate-spin`

### For Designers
- Stick to the Pawpaya gradient for primary actions
- Use gray scale for neutral UI (don't introduce new colors)
- Maintain 2x border width standard
- Ensure 12px minimum touch target padding
- Test responsiveness at all breakpoints

### For Content Creators
- Button text should be bold, concise, action-oriented
- Error messages should be user-friendly (no technical jargon)
- Placeholder text should provide examples, not instructions
- Helper text uses `text-xs text-gray-500`

---

## =Ú Related Documentation

- **`ui_overview.md`**: Component architecture and UI patterns
- **`/context/nextjs/components_overview.md`**: Detailed component APIs
- **`/context/GAME_PLAN_2.0.md`**: Brand strategy and design intent
- **`styles/globals.css`**: Global CSS file (Tailwind directives only)
- **`styles/tailwind.config.js`**: Tailwind configuration *(needs expansion)*
