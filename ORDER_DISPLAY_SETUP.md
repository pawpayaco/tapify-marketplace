# Order Another Display Feature - Setup Guide

This feature allows retailers to order additional displays from their dashboard, incrementing their `displays_ordered` counter and redirecting them to the Shopify Connect page as an upsell opportunity.

## Database Migration Required

Before this feature will work, you need to apply the SQL migration to add the `displays_ordered` column to the `retailers` table.

### How to Apply the Migration

1. **Via Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy the contents of `context/supabase/migrations/2025-10-add-displays-ordered.sql`
   - Paste and run the SQL

2. **Via Supabase CLI** (if you have it installed):
   ```bash
   supabase db push
   ```

3. **Manual SQL** (copy and run in Supabase SQL Editor):
   ```sql
   -- Add displays_ordered tracking to retailers table
   BEGIN;

   ALTER TABLE retailers
     ADD COLUMN IF NOT EXISTS displays_ordered integer DEFAULT 1;

   UPDATE retailers
   SET displays_ordered = 1
   WHERE displays_ordered IS NULL OR displays_ordered = 0;

   COMMIT;
   ```

## Feature Components

### 1. **Display Confirmation Card** (`pages/onboard/dashboard.js`)
   - Shows `displays_ordered` count (not UID count)
   - Has "Order Another Display" button
   - Opens modal when clicked

### 2. **Order Display Modal** (`components/OrderDisplayModal.js`)
   - Similar UI to registration form's "add another store"
   - Fields: Store Name (searchable), Manager Name (optional), Address (required with Google Maps)
   - Uses AddressInput component for validation

### 3. **API Endpoint** (`pages/api/order-display.js`)
   - POST endpoint
   - Requires authentication
   - Creates new retailer entry for additional store location
   - Increments `displays_ordered` counter
   - Returns new count

### 4. **User Flow**:
   1. User clicks "Order Another Display" button in Display Confirmation card
   2. Modal opens with form
   3. User searches for store or adds new one
   4. User fills in address
   5. User submits form
   6. API creates new store entry and increments counter
   7. Success toast shows new total
   8. User is redirected to `/onboard/shopify-connect` (upsell page)

## Testing

1. **Apply the migration** (see above)
2. **Start the dev server**: `npm run dev`
3. **Log into a retailer account**
4. **Navigate to dashboard**
5. **Check Display Confirmation card** - should show "1" for existing retailers
6. **Click "Order Another Display"** button
7. **Fill out the form** and submit
8. **Verify**:
   - Counter increments to "2"
   - Toast notification appears
   - Redirects to Shopify Connect page

## Notes

- The counter tracks displays ORDERED, not UIDs claimed
- When retailers register, they automatically get `displays_ordered = 1`
- Each time they order another display, the counter increments
- The modal uses the same store search functionality as registration
- Address validation uses Google Maps API + USPS validation via AddressInput component
