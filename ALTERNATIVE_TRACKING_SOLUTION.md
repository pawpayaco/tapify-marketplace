# Alternative Tracking Solution - No Theme Editing Required

## The Problem
Shopify isn't preserving the `ref` parameter through checkout because the JavaScript hasn't been added to the theme yet.

## Solution: Use Shopify Script Tags API

Instead of manually editing `theme.liquid`, we can **inject the tracking script programmatically** using Shopify's Script Tags API. This way, the script automatically loads on every page without touching the theme.

---

## Option 1: Install Script Tag via Shopify API (Recommended)

### Step 1: Get Shopify Access Token

1. Go to **Shopify Admin → Apps → Develop apps** (or Settings → Apps and sales channels → Develop apps)
2. Click **Create an app**
3. Name it: "Tapify Tracking"
4. Click **Configure Admin API scopes**
5. Enable: `write_script_tags` and `read_script_tags`
6. Click **Save**
7. Click **Install app**
8. Copy the **Admin API access token** (save it securely!)

### Step 2: Host the Tracking Script

We need to host the JavaScript on a public URL. I'll create an API endpoint that serves it.

**Create**: `/pages/api/tracking-script.js`

```javascript
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const script = `
(function() {
  console.log('[Tapify] Tracking script loaded');

  function captureRefParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');

    if (ref) {
      console.log('[Tapify] Captured ref:', ref);
      sessionStorage.setItem('tapify_ref', ref);
      localStorage.setItem('tapify_ref', ref);
    }
  }

  function getStoredRef() {
    return sessionStorage.getItem('tapify_ref') || localStorage.getItem('tapify_ref');
  }

  function addRefToCart() {
    const ref = getStoredRef();
    if (!ref) return;

    console.log('[Tapify] Adding ref to cart:', ref);

    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: { ref: ref, tapify_source: 'nfc_display' }
      })
    })
    .then(response => response.json())
    .then(() => console.log('[Tapify] Ref added to cart'))
    .catch(err => console.error('[Tapify] Error:', err));
  }

  captureRefParameter();

  if (getStoredRef()) {
    addRefToCart();
  }

  document.addEventListener('DOMContentLoaded', function() {
    const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');
    addToCartForms.forEach(form => {
      form.addEventListener('submit', () => {
        setTimeout(addRefToCart, 500);
      });
    });

    if (window.location.pathname.includes('/cart') ||
        window.location.pathname.includes('/checkout')) {
      if (getStoredRef()) addRefToCart();
    }
  });
})();
`;

  res.status(200).send(script);
}
```

### Step 3: Install Script Tag via API

Run this script to inject the tracking code:

```javascript
// install-script-tag.js
const SHOPIFY_DOMAIN = 'pawpayaco.myshopify.com'; // Your shop domain
const ACCESS_TOKEN = 'YOUR_ADMIN_API_ACCESS_TOKEN'; // From Step 1
const SCRIPT_URL = 'https://tapify-marketplace.vercel.app/api/tracking-script.js';

fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-01/script_tags.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': ACCESS_TOKEN
  },
  body: JSON.stringify({
    script_tag: {
      event: 'onload',
      src: SCRIPT_URL,
      display_scope: 'online_store'
    }
  })
})
.then(res => res.json())
.then(data => console.log('✅ Script tag installed:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## Option 2: Simpler Approach - Use Shopify's Customer Note

If you can't use Script Tags, we can pass the UID through the **customer note** field during checkout.

### Update redirect to include customer note:

```javascript
// In uid-redirect.js
const finalUrl = new URL(affiliate_url);
finalUrl.searchParams.set('ref', uid);
finalUrl.searchParams.set('checkout[note]', `Display: ${uid}`); // Add to checkout note
```

Then update the webhook to check `order.note`:

```javascript
// In shopify-webhook.js
if (!uid && order.note) {
  const match = order.note.match(/Display:\s*(\w+)/);
  if (match) {
    uid = match[1];
    console.log('[shopify-webhook] UID extracted from order note:', uid);
  }
}
```

---

## Option 3: Quick Fix - Manual Script Tag in Shopify

If the above is too complex, you can manually add a Script Tag in Shopify:

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Actions → Edit code**
3. Open **Layout → theme.liquid**
4. Find `</head>` (NOT `</body>`)
5. Add this ONE LINE right before `</head>`:

```html
<script src="https://tapify-marketplace.vercel.app/api/tracking-script.js" async></script>
```

6. Save

This loads the script without having to paste all the JavaScript manually.

---

## Why Your Current Tests Are Failing

Looking at your logs:

```
✅ Redirect working: ref=0428C3D4 in URL
❌ Webhook receiving: note_attributes: [] (empty!)
❌ Result: Scans not marked as converted
```

**Without the JavaScript**:
- Customer lands on Shopify with `?ref=0428C3D4`
- Adds to cart, checks out
- ref parameter is lost
- Order webhook has no note_attributes
- Webhook can't find UID
- Scan stays unconverted ⭕

**With the JavaScript**:
- Customer lands on Shopify with `?ref=0428C3D4`
- JavaScript captures it, adds to cart attributes
- Customer checks out
- Order webhook receives `note_attributes: [{name: "ref", value: "0428C3D4"}]`
- Webhook finds UID, looks up retailer
- Scan marked as converted ✅
- Revenue shows in dashboard ✅

---

## Recommendation

**Use Option 3** (manual script tag) - It's the quickest:

1. Takes 30 seconds to implement
2. No API tokens needed
3. No complex setup
4. Works immediately

Just add this ONE line to `theme.liquid` before `</head>`:
```html
<script src="https://tapify-marketplace.vercel.app/api/tracking-script.js" async></script>
```

Then test again - your scans WILL convert and show revenue!

---

## Next Steps After Installing

1. Add the script (any of the 3 options above)
2. Visit: `https://pawpayaco.com/products/YOUR-PRODUCT?ref=TEST123`
3. Open console - should see: `[Tapify] Captured ref: TEST123`
4. Add to cart
5. Complete checkout
6. Check webhook logs - should see ref in note_attributes
7. Check dashboard - scan should show as converted with revenue! ✅
