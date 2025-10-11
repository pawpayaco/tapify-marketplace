# Sales Tracking Fix - Complete Summary

## Problem Identified

Your affiliate link tracking system had a **two-part issue**:

### Issue 1: UID Not Passed to Shopify URL ✅ FIXED
- **What was wrong**: The redirect added the ref parameter internally but didn't append it to the Shopify URL
- **Impact**: When customers landed on Shopify, the URL didn't contain `?ref=ABC123`
- **Fix**: Updated `pages/api/uid-redirect.js` to always append the UID as a `ref` query parameter

### Issue 2: Shopify Not Preserving ref Parameter ⚠️ NEEDS SHOPIFY THEME UPDATE
- **What was wrong**: Shopify doesn't preserve URL query parameters through checkout by default
- **Impact**: Even with ref in the URL, it gets lost during checkout
- **Fix**: Created JavaScript snippet to capture ref and add it to cart attributes (which DO persist)

---

## What Was Fixed

### 1. UID Redirect Enhancement (`pages/api/uid-redirect.js`) ✅

**Before:**
```javascript
// Customer taps NFC → Redirects to:
https://pawpayaco.com/products/custom
// ❌ No UID! Can't track the sale
```

**After:**
```javascript
// Customer taps NFC → Redirects to:
https://pawpayaco.com/products/custom?ref=ABC123&utm_source=nfc&utm_medium=display
// ✅ UID included! Ready for tracking
```

**How it works:**
- Checks if affiliate_url already has a `ref` parameter
- If missing, adds `?ref={uid}` or `&ref={uid}` depending on existing parameters
- Logs the final URL for debugging
- Has fallback for invalid URLs

### 2. Webhook Enhancement (`pages/api/shopify-webhook.js`) ✅

**Added support for:**
- `order.attributes.ref` (alternative cart attributes format)
- Better debug logging to see all fields Shopify sends
- JSON stringified output for arrays/objects

**Extraction priority (in order):**
1. `note_attributes` (cart attributes added by theme JavaScript) ← **Primary method**
2. `order.attributes.ref` (alternative format)
3. `landing_site_ref` (Shopify's native field)
4. `landing_site` URL parsing for `?ref=` parameter
5. `referring_site` URL parsing for `?ref=` parameter
6. Email fallback (for Priority Display upgrades)

### 3. Shopify Theme JavaScript (NEEDS TO BE ADDED) ⚠️

Created comprehensive JavaScript snippet in `SHOPIFY_REF_TRACKING_SETUP.md` that:
- Captures `ref` parameter from URL when customer lands on site
- Stores it in sessionStorage + localStorage
- Automatically adds it to cart attributes via Shopify Ajax API
- Hooks into add-to-cart events to ensure ref persists
- Logs everything to console for easy debugging

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **UID Redirect** | ✅ Working | Confirmed in your logs - ref parameter added correctly |
| **Webhook Processing** | ✅ Enhanced | Now checks multiple fields for ref |
| **Shopify Theme** | ⚠️ Needs Setup | JavaScript must be added to theme.liquid |

---

## Next Steps

### REQUIRED: Add JavaScript to Shopify Theme

**This is the critical step that will make everything work end-to-end.**

1. **Read the setup guide**: `SHOPIFY_REF_TRACKING_SETUP.md`
2. **Go to Shopify Admin** → Online Store → Themes → Edit code
3. **Open** `Layout/theme.liquid`
4. **Find** the closing `</body>` tag (near bottom of file)
5. **Paste the JavaScript** from the setup guide RIGHT BEFORE `</body>`
6. **Save** and test

### Testing Process

After adding the JavaScript:

1. **Test JavaScript is working**:
   ```
   Visit: https://pawpayaco.com/products/YOUR-PRODUCT?ref=TEST123
   ```

   Open browser console (F12), you should see:
   ```
   [Tapify] Captured ref parameter: TEST123
   [Tapify] Adding ref to cart: TEST123
   [Tapify] Successfully added ref to cart attributes
   ```

2. **Verify cart attributes**:
   ```javascript
   // In console:
   fetch('/cart.js').then(r => r.json()).then(console.log)
   ```

   Look for:
   ```json
   {
     "attributes": {
       "ref": "TEST123"
     }
   }
   ```

3. **Test full flow**:
   - Tap your NFC tag (or visit `/t?u=YOUR_UID`)
   - Should redirect to Shopify with `?ref=YOUR_UID`
   - Add product to cart
   - Complete checkout
   - Wait 30 seconds
   - Check webhook logs - should see ref in note_attributes
   - Check dashboard - sale should appear!

---

## How the Fixed System Works

```
┌─────────────────────────────────────────────────────────────┐
│  COMPLETE SALES TRACKING FLOW                                │
└─────────────────────────────────────────────────────────────┘

1. Customer taps NFC tag
   ↓
2. Redirects to: /t?u=ABC123
   ↓
3. uid-redirect.js records scan in database ✅
   ↓
4. Redirects to Shopify with ref:
   pawpayaco.com/products/custom?ref=ABC123 ✅
   ↓
5. JavaScript captures ref=ABC123 ✅ (NEEDS THEME UPDATE)
   ↓
6. Stores in sessionStorage + localStorage ✅
   ↓
7. Customer adds to cart
   ↓
8. JavaScript adds ref to cart.attributes ✅
   ↓
9. Customer completes checkout
   ↓
10. Shopify creates order with note_attributes:
    [{name: "ref", value: "ABC123"}] ✅
    ↓
11. Webhook receives order, extracts ref ✅
    ↓
12. Looks up UID in database → finds retailer ✅
    ↓
13. Creates payout_job with retailer_id ✅
    ↓
14. Updates scan as converted ✅
    ↓
15. Dashboard shows sale ✅
```

---

## Why Your Test Order Didn't Work

Looking at your webhook logs:

```
[shopify-webhook] No UID found in order - checking all sources:
  - note_attributes: []          ← Empty! JavaScript not installed yet
  - landing_site_ref: null
  - landing_site: /              ← Just a slash, not full URL
  - referring_site: null
```

**The problem:**
- The redirect IS working (you can see `ref=0428C3D4` in earlier logs)
- But note_attributes is empty because the JavaScript isn't installed yet
- The landing_site comes through as just "/" instead of the full URL

**The solution:**
- Add the JavaScript to your Shopify theme
- It will capture the ref and add it to cart attributes
- Cart attributes become note_attributes in the order webhook
- Webhook will find the ref and attribute the sale ✅

---

## Files Changed

| File | Changes | Status |
|------|---------|--------|
| `pages/api/uid-redirect.js` | Added ref parameter to redirect URL | ✅ Deployed |
| `pages/api/shopify-webhook.js` | Enhanced UID extraction, better logging | ✅ Deployed |
| `SHOPIFY_REF_TRACKING_SETUP.md` | Complete setup guide with JavaScript | ✅ Created |
| `SALES_TRACKING_FIX_SUMMARY.md` | This document | ✅ Created |

---

## Verification Checklist

After adding JavaScript to Shopify theme:

- [ ] JavaScript appears in theme.liquid before `</body>`
- [ ] Console shows "[Tapify] Referral tracking initialized"
- [ ] Visit product with `?ref=TEST123` shows capture message
- [ ] Cart attributes contain ref when checked with `/cart.js`
- [ ] Test order shows ref in webhook logs
- [ ] Sale appears in retailer dashboard
- [ ] Payout job created with correct retailer_id

---

## Support & Debugging

### If sales still don't track after adding JavaScript:

1. **Check browser console for errors**:
   - F12 → Console tab
   - Look for [Tapify] messages
   - Any red errors?

2. **Verify cart attributes**:
   ```javascript
   fetch('/cart.js').then(r => r.json()).then(console.log)
   ```

3. **Check webhook logs** (Vercel dashboard):
   - Does note_attributes show the ref?
   - Is retailer_id found?
   - Is payout_job created?

4. **Manual verification**:
   - Check `scans` table - is scan recorded?
   - Check `orders` table - is order created?
   - Check `payout_jobs` table - is job created with retailer_id?

### Common Issues:

**JavaScript not loading**:
- Clear browser cache and hard refresh (Cmd+Shift+R)
- Check theme.liquid saved correctly
- Look for syntax errors in console

**ref not in cart**:
- Make sure you're visiting with `?ref=` in URL first
- Check sessionStorage: `sessionStorage.getItem('tapify_ref')`
- Try manually: `sessionStorage.setItem('tapify_ref', 'TEST123')`

**Webhook not receiving ref**:
- Check Shopify webhook delivery logs
- Look at the raw payload Shopify sends
- Verify note_attributes field exists

---

## Expected Results After Fix

✅ **NFC tap tracking**: Already working
✅ **UID in redirect URL**: Now working (see your logs)
⏳ **ref in cart attributes**: Will work after theme update
⏳ **Webhook receives ref**: Will work after theme update
⏳ **Sales in dashboard**: Will work after theme update
⏳ **Payout jobs created**: Will work after theme update

---

## Summary

The backend is now fully ready to track sales. The final step is adding the JavaScript to your Shopify theme to capture and persist the ref parameter through checkout.

**Once you add the JavaScript**, the entire flow will work end-to-end:
- Scans tracked ✅
- UID passed to Shopify ✅
- ref captured and persisted ✅
- Webhook receives ref ✅
- Sales attributed to retailers ✅
- Dashboard shows revenue ✅
- Payout jobs created ✅

See `SHOPIFY_REF_TRACKING_SETUP.md` for the complete setup guide.
