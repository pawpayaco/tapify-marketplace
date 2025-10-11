# Shopify Product Description for Priority Display

Add this to your Shopify product description to remind customers to use their account email.

## Product Description Text

Copy and paste this into your Shopify product description:

```
🚀 Priority Display Upgrade - $50

Upgrade your display to premium marketplace placement with priority shipping!

✨ What You Get:
• Premium placement in our marketplace
• Priority shipping (faster delivery)
• Enhanced visibility for your store
• Automatic activation

⚠️ IMPORTANT: Use Your Account Email

When checking out, you MUST use the same email address that you registered with on our platform. This is how we automatically activate your priority display upgrade.

🔍 How to Find Your Account Email:
1. Log into your dashboard at tapify-marketplace.vercel.app
2. Your email is shown in the "Priority Display" section
3. Use that EXACT email when checking out here

📧 If you use a different email, the upgrade will NOT be automatically activated and you'll need to contact support.

---

Need help? Contact us at support@pawpaya.com
```

## Where to Add This

### Option 1: Shopify Admin (Recommended)

1. Go to **Shopify Admin → Products**
2. Find "Priority Display Upgrade" product
3. Scroll to **Description** field
4. Paste the text above
5. Click **Save**

### Option 2: Add a Banner to Product Page

If you have theme access:

1. Go to **Shopify Admin → Online Store → Themes**
2. Click **Customize** on your active theme
3. Navigate to the Priority Display product page
4. Add a **Custom HTML** or **Announcement Bar** section
5. Add this HTML:

```html
<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <div style="display: flex; align-items: start; gap: 12px;">
    <span style="font-size: 24px;">⚠️</span>
    <div>
      <p style="font-weight: bold; color: #92400e; margin: 0 0 8px 0;">
        Important: Use Your Account Email
      </p>
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        When checking out, use the same email you registered with on our platform.
        This is required for automatic activation of your Priority Display upgrade.
      </p>
    </div>
  </div>
</div>
```

### Option 3: Add Notice to Checkout Page

If you have Shopify Plus (required for checkout customization):

1. Go to **Shopify Admin → Settings → Checkout**
2. Scroll to **Order processing**
3. Add a **Script** or **Additional content and scripts**
4. Add reminder text

## Testing

After adding the description:

1. Go to the product page: https://pawpayaco.com/products/display-setup-for-affiliate
2. Verify the warning is visible
3. Test purchasing with correct email
4. Confirm Priority Display activates automatically

## Support

If customers still use the wrong email, they can contact you and you can manually activate:

```sql
UPDATE retailers
SET priority_display_active = true
WHERE email = 'customer@email.com';
```
