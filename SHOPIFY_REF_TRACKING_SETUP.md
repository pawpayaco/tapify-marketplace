# Shopify Ref Parameter Tracking Setup

## Problem
Shopify doesn't preserve URL parameters (like `?ref=ABC123`) through the checkout process. When customers click your NFC link with the ref parameter, it gets lost during checkout, preventing proper attribution.

## Solution
Add JavaScript to your Shopify theme that captures the `ref` parameter and adds it as a cart attribute, which Shopify DOES preserve through checkout.

---

## Step 1: Add JavaScript to Shopify Theme

### Option A: Add to `theme.liquid` (Recommended)

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Actions → Edit code** on your active theme
3. Open **Layout → theme.liquid**
4. Find the closing `</body>` tag (near the bottom)
5. **Paste this code RIGHT BEFORE the `</body>` tag**:

```html
<!-- NFC Display Referral Tracking -->
<script>
(function() {
  // Capture ref parameter from URL and store for cart attribution
  function captureRefParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');

    if (ref) {
      console.log('[Tapify] Captured ref parameter:', ref);
      // Store in sessionStorage (persists across pages in same session)
      sessionStorage.setItem('tapify_ref', ref);
      // Also store in localStorage as backup (persists across sessions)
      localStorage.setItem('tapify_ref', ref);
      // Store timestamp to track when it was captured
      sessionStorage.setItem('tapify_ref_timestamp', Date.now());
    }
  }

  // Get stored ref parameter
  function getStoredRef() {
    return sessionStorage.getItem('tapify_ref') || localStorage.getItem('tapify_ref');
  }

  // Add ref to cart as note attribute
  function addRefToCart() {
    const ref = getStoredRef();
    if (!ref) {
      console.log('[Tapify] No ref parameter to add to cart');
      return;
    }

    console.log('[Tapify] Adding ref to cart:', ref);

    // Method 1: Add as cart attribute (Shopify Ajax API)
    fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attributes: {
          ref: ref,
          tapify_source: 'nfc_display'
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('[Tapify] Successfully added ref to cart attributes');
    })
    .catch(error => {
      console.error('[Tapify] Failed to add ref to cart:', error);
    });
  }

  // Run on page load
  captureRefParameter();

  // Add ref to cart when page loads (in case cart already exists)
  if (getStoredRef()) {
    addRefToCart();
  }

  // Listen for add-to-cart events and attach ref
  document.addEventListener('DOMContentLoaded', function() {
    // Hook into add-to-cart forms
    const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');

    addToCartForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const ref = getStoredRef();
        if (ref) {
          console.log('[Tapify] Product added to cart, ensuring ref is attached:', ref);
          // Wait a moment for cart to update, then add ref
          setTimeout(addRefToCart, 500);
        }
      });
    });

    // Also add when cart page loads
    if (window.location.pathname.includes('/cart') ||
        window.location.pathname.includes('/checkout')) {
      const ref = getStoredRef();
      if (ref) {
        addRefToCart();
      }
    }
  });

  console.log('[Tapify] Referral tracking initialized');
})();
</script>
```

6. Click **Save**

### Option B: Create a Snippet (Alternative)

1. Go to **Shopify Admin → Online Store → Themes → Edit code**
2. In the **Snippets** folder, click **Add a new snippet**
3. Name it: `tapify-tracking`
4. Paste the JavaScript code above (without the `<script>` tags)
5. Open **Layout → theme.liquid**
6. Before `</body>`, add: `{% render 'tapify-tracking' %}`
7. Click **Save**

---

## Step 2: Update Webhook to Read Cart Attributes

The webhook needs to check `note_attributes` for the ref parameter that was added by the JavaScript.

I'll update the webhook handler now to check this field properly.

---

## Step 3: Testing

### Test the JavaScript is Working:

1. **Visit your product page with ref parameter**:
   ```
   https://pawpayaco.com/products/YOUR-PRODUCT?ref=TEST123
   ```

2. **Open browser console** (Right-click → Inspect → Console tab)

3. **You should see**:
   ```
   [Tapify] Captured ref parameter: TEST123
   [Tapify] Referral tracking initialized
   [Tapify] Adding ref to cart: TEST123
   [Tapify] Successfully added ref to cart attributes
   ```

4. **Check cart attributes**:
   ```javascript
   // In browser console, run:
   fetch('/cart.js').then(r => r.json()).then(console.log)
   ```

   Look for:
   ```json
   {
     "attributes": {
       "ref": "TEST123",
       "tapify_source": "nfc_display"
     }
   }
   ```

### Test Full Flow:

1. Tap NFC tag (or visit `/t?u=YOUR_UID`)
2. Add product to cart
3. Complete checkout
4. Wait 30 seconds
5. Check webhook logs - should see ref parameter
6. Check retailer dashboard - sale should appear!

---

## Troubleshooting

### Issue: Console shows errors
- **Check**: Is the script added BEFORE `</body>`?
- **Check**: Are there any JavaScript errors on the page?
- **Fix**: Open browser console and look for error messages

### Issue: ref not in cart attributes
- **Check**: Visit cart page and run `fetch('/cart.js').then(r=>r.json()).then(console.log)`
- **Check**: Do you see the ref in attributes?
- **Fix**: Make sure JavaScript is loading correctly

### Issue: Webhook still not getting ref
- **Check**: Webhook logs - look for note_attributes in logs
- **Check**: Is the webhook looking at the right field?
- **Next**: I'll update the webhook to properly handle cart attributes

---

## How This Works

```
1. Customer taps NFC
   ↓
2. Redirects to: pawpayaco.com/products/custom?ref=ABC123
   ↓
3. JavaScript captures ref=ABC123
   ↓
4. Stores in sessionStorage + localStorage
   ↓
5. Customer adds to cart
   ↓
6. JavaScript adds ref to cart.attributes
   ↓
7. Customer checks out
   ↓
8. Order created with ref in note_attributes
   ↓
9. Webhook receives order, extracts ref from note_attributes
   ↓
10. Links order to retailer ✅
   ↓
11. Dashboard shows sale ✅
```

---

## Next Steps

After adding this JavaScript to your theme:
1. I'll update the webhook to properly read the note_attributes field
2. We'll test with a real order
3. Verify attribution works end-to-end

---

## Alternative: Use Shopify Checkout Scripts (Shopify Plus Only)

If you have Shopify Plus, you can use checkout scripts to inject the ref parameter directly. Let me know if you have Shopify Plus and want this alternative.
