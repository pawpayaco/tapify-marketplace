# Shopify Priority Processing Setup Guide

This guide explains how to set up the Shopify integration for the Priority Processing upsell on the `/onboard/shopify-connect` page.

## Overview

The Shopify checkout page allows retailers to upgrade to Priority Processing for $50, which redirects them to your Shopify store to complete payment.

## Steps to Set Up

### 1. Create a Priority Processing Product in Shopify

1. Log in to your Shopify admin dashboard
2. Go to **Products** → **Add product**
3. Create a product:
   - **Title**: "Priority Processing - Pawpaya Display"
   - **Description**: "Upgrade to priority processing for your Pawpaya display. Get it delivered in 7-10 days instead of 21-28 days."
   - **Price**: $50.00
   - **SKU**: (note this down - you'll need it)
   - **Inventory**: Track quantity (set initial stock)
   - **Weight**: 0 lbs (it's a service, not a physical product)

4. Save the product

### 2. Get Your Shopify Variant ID

The variant ID is what allows direct "Add to Cart" links.

**Method 1: From URL**
1. Click "View" on your product
2. Look at the URL: `https://yourstore.myshopify.com/products/priority-processing`
3. Append `?variant=` and use the API to get it

**Method 2: Using Shopify API**
1. Go to **Apps** → **Develop apps** → Create app
2. Enable Admin API access
3. Use the API to get product variants
4. Note the `variant_id` number (usually a long number like `43210987654321`)

**Method 3: Use Browser Inspector**
1. View the product page
2. Open Developer Tools → Network tab
3. Try adding to cart
4. Look for the variant ID in the network requests

### 3. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_STORE_URL=https://yourstore.myshopify.com
NEXT_PUBLIC_PRIORITY_SKU=43210987654321  # Replace with your actual variant ID
```

**Important Notes:**
- Use your full Shopify store URL (e.g., `https://pawpaya-marketplace.myshopify.com`)
- The SKU should be the **variant ID**, not the product ID
- If you have a custom domain, you can use that instead

### 4. Test the Checkout Flow

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/onboard/shopify-connect`
3. Click "Upgrade to Priority Processing ($50)"
4. You should be redirected to Shopify with the item in cart

Expected URL format:
```
https://yourstore.myshopify.com/cart/43210987654321:1
```

### 5. Handling Post-Purchase

After a customer completes payment on Shopify, you'll want to:

1. **Set up Shopify Webhooks** (recommended):
   - Go to Shopify Admin → **Settings** → **Notifications**
   - Create webhook for `Order creation`
   - Webhook URL: `https://yourdomain.com/api/shopify-webhook`
   - This will notify your app when someone buys priority processing

2. **Update your database**:
   - When webhook fires, update the retailer's record in Supabase
   - Set `express_shipping: true` in the `retailers` table
   - Set `onboarding_step: 'payment_completed'`

3. **Send confirmation email**:
   - Notify the retailer their priority processing is confirmed
   - Provide tracking info when display ships

### 6. Alternative: Skip Shopify (For Testing)

If you don't want to set up Shopify yet, you can modify the button to:

```javascript
// In shopify-connect.js, replace handleUpgradeToPriority with:
const handleUpgradeToPriority = async () => {
  setLoading(true);
  
  // Mock payment - update database directly
  const retailerId = sessionStorage.getItem('onboarding_retailer_id');
  
  if (supabase && retailerId) {
    await supabase
      .from('retailers')
      .update({ express_shipping: true })
      .eq('id', retailerId);
  }
  
  // Go to dashboard
  router.push('/onboard/dashboard');
};
```

## Troubleshooting

### Issue: Cart link doesn't work
- Double-check your variant ID
- Make sure the product is active in Shopify
- Try the URL directly in your browser

### Issue: Wrong product added to cart
- Verify you're using the variant ID, not product ID
- Check if you have multiple variants (size, color, etc.)

### Issue: Redirect not working
- Check your Shopify store URL in `.env.local`
- Make sure there are no trailing slashes
- Verify the URL format: `store.myshopify.com` not `store.com`

## Production Deployment

When deploying to Vercel:

1. Add the environment variables in Vercel dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add `NEXT_PUBLIC_SHOPIFY_STORE_URL`
   - Add `NEXT_PUBLIC_PRIORITY_SKU`

2. Redeploy your application

3. Test the production flow end-to-end

## Optional Enhancements

### Use Shopify Buy Button SDK
For a more integrated experience, you can use Shopify's Buy Button SDK to embed checkout directly on your page without redirecting.

### Add Discount Codes
Create Shopify discount codes for special offers:
- Early bird discount
- Bulk order discount (multiple displays)
- Referral rewards

### Track Conversions
Use Shopify's analytics to track:
- How many people click through
- Conversion rate on the checkout page
- Revenue from priority processing

---

## Questions?

If you need help setting this up, contact your Shopify partner or refer to:
- [Shopify Cart Permalinks](https://shopify.dev/api/liquid/objects/cart)
- [Shopify Webhooks](https://shopify.dev/api/admin-rest/2024-01/resources/webhook)

