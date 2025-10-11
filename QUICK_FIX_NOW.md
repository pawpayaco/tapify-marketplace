# ⚡ QUICK FIX - Get Sales Tracking Working NOW

## The Problem

Your webhook logs show:
```
❌ note_attributes: []          <- Empty! No ref parameter
❌ No retailer_id for order     <- Can't attribute sale
❌ Scans not converting         <- Dashboard shows $0 revenue
```

## The Fix (Takes 2 Minutes)

Add ONE line of code to your Shopify theme to load the tracking script.

---

## Step-by-Step

### 1. Open Shopify Theme Editor

1. Go to **Shopify Admin** (pawpayaco.myshopify.com/admin)
2. Click **Online Store** → **Themes**
3. On your active theme, click **Actions** → **Edit code**

### 2. Open theme.liquid

1. In the left sidebar, click **Layout**
2. Click **theme.liquid** to open it

### 3. Add the Tracking Script

1. Press `Cmd+F` (Mac) or `Ctrl+F` (Windows) to search
2. Search for: `</head>`
3. You'll find a closing `</head>` tag (usually around line 150-250)
4. **PASTE THIS LINE RIGHT BEFORE `</head>`:**

```html
<script src="https://tapify-marketplace.vercel.app/api/tracking-script.js" async></script>
```

### Example:

**Before:**
```html
  {{ content_for_header }}
</head>
<body>
```

**After:**
```html
  {{ content_for_header }}
  <script src="https://tapify-marketplace.vercel.app/api/tracking-script.js" async></script>
</head>
<body>
```

### 4. Save

Click the green **Save** button in the top right.

---

## Test It's Working

### 1. Visit Product with ref Parameter

Visit any product on your store with a ref parameter:
```
https://pawpayaco.com/products/YOUR-PRODUCT?ref=TEST123
```

### 2. Open Browser Console

- Right-click anywhere → **Inspect**
- Click the **Console** tab
- You should see:

```
[Tapify] Tracking script loaded v1.0
[Tapify] Captured ref parameter: TEST123
[Tapify] Ref stored successfully
[Tapify] Found stored ref: TEST123
[Tapify] Referral tracking initialized successfully
```

### 3. Add Product to Cart

Click "Add to Cart" - you should see:
```
[Tapify] Product being added to cart, will attach ref: TEST123
[Tapify] Adding ref to cart attributes: TEST123
[Tapify] ✅ Successfully added ref to cart attributes
```

### 4. Verify Cart Has ref

In the console, run:
```javascript
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

✅ **If you see this, it's working!**

---

## Full Flow Test

Now test the complete flow:

1. **Tap your NFC tag** (or visit `/t?u=0428C3D4`)
2. Should redirect to Shopify with `?ref=0428C3D4`
3. Console shows ref captured
4. **Add product to cart**
5. Console shows ref added to cart
6. **Complete checkout** (use test mode)
7. Wait 30 seconds
8. **Check Vercel logs** - should see:
   ```
   [shopify-webhook] UID extracted from note_attributes: 0428C3D4
   [shopify-webhook] ✅ Retailer attribution via UID
   [shopify-webhook] ✅ Payout job created
   ```
9. **Check your dashboard**:
   - Scan should show converted ✅
   - Revenue should show > $0
   - Order should appear in Orders & Analytics tab

---

## What This Script Does

```
1. Customer taps NFC → /t?u=ABC123
   ↓
2. Redirects to: pawpayaco.com/products/custom?ref=ABC123
   ↓
3. Script captures ref=ABC123 from URL ✅
   ↓
4. Stores in sessionStorage + localStorage ✅
   ↓
5. Customer adds to cart
   ↓
6. Script adds ref to cart.attributes ✅
   ↓
7. Customer checks out
   ↓
8. Shopify creates order with note_attributes:
   [{name: "ref", value: "ABC123"}] ✅
   ↓
9. Webhook extracts ref from note_attributes ✅
   ↓
10. Looks up UID in database → finds retailer ✅
    ↓
11. Creates payout_job with retailer_id ✅
    ↓
12. Marks scan as converted with revenue ✅
    ↓
13. Dashboard shows sale! 🎉
```

---

## Troubleshooting

### Script Not Loading

**Check 1**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
**Check 2**: Clear browser cache
**Check 3**: Check console for error messages
**Check 4**: Verify script tag is before `</head>` not `</body>`

### ref Not Captured

**Check 1**: Are you visiting with `?ref=` in the URL?
**Check 2**: Check console - do you see `[Tapify]` messages?
**Check 3**: Try manually: `sessionStorage.setItem('tapify_ref', 'TEST123')`

### ref Not in Cart

**Check 1**: Run `fetch('/cart.js').then(r=>r.json()).then(console.log)` in console
**Check 2**: Check `attributes` field for `ref`
**Check 3**: Make sure you added item to cart AFTER capturing ref

### Webhook Not Receiving ref

**Check 1**: Check Vercel logs for the webhook call
**Check 2**: Look for `note_attributes` in logs - should have ref
**Check 3**: If still empty, check Shopify webhook delivery logs

### Sales Still Not Showing

**Check 1**: Is the scan's UID claimed? Check `uids` table
**Check 2**: Is there a retailer linked to that UID?
**Check 3**: Check `orders` table - is order created?
**Check 4**: Check `payout_jobs` table - is job created with retailer_id?

---

## Summary

**What you need to do:**
1. Add ONE line to your Shopify theme (before `</head>`)
2. Save and test

**What will happen:**
- ✅ Scans will convert
- ✅ Revenue will show in dashboard
- ✅ Payout jobs will be created
- ✅ Orders will be attributed to retailers

**Current status:**
- ✅ Backend ready (uid-redirect working, webhook enhanced)
- ✅ Tracking script created and hosted
- ⏳ Just needs to be added to Shopify theme

**Time to fix:** ~2 minutes
**Difficulty:** Copy/paste one line

---

## Alternative: Can't Access Theme?

If you can't edit the theme for some reason, see `ALTERNATIVE_TRACKING_SOLUTION.md` for other options like:
- Shopify Script Tags API
- App integration
- Checkout note fallback

But the theme edit is by far the simplest and most reliable solution!
