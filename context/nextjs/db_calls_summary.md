# =� Supabase Database Calls Summary

Documents all database queries used across the Next.js application, organized by table and operation type (SELECT, INSERT, UPDATE, DELETE).

---

## =� Purpose
This file catalogs every Supabase call in client components, API routes, and server-side functions  ensuring visibility into data access patterns and query optimization opportunities.

---

## =
 Query Patterns by Table

### =� `retailers` Table

#### SELECT Queries
**Find retailer by email:**
```js
// pages/onboard/dashboard.js:68-72
const { data } = await supabase
  .from('retailers')
  .select('*')
  .eq('name', user.email) // or .eq('email', user.email)
  .maybeSingle();
```

**List all retailers (admin):**
```js
// pages/admin.js
const { data } = await supabaseAdmin
  .from('retailers')
  .select('*')
  .order('created_at', { ascending: false });
```

**Search retailers:**
```js
// pages/api/retailers/search.js
const { data } = await supabase
  .from('retailers')
  .select('*')
  .or(`name.ilike.%${query}%, address.ilike.%${query}%`)
  .limit(20);
```

#### INSERT Queries
**Register new retailer:**
```js
// pages/api/register-store.js
const { data, error } = await supabase
  .from('retailers')
  .insert([{
    name,
    address,
    phone,
    business_id,
    created_at: new Date().toISOString()
  }]);
```

#### UPDATE Queries
**Bulk update retailers:**
```js
// pages/api/stores/bulk-update.js
const { data } = await supabase
  .from('retailers')
  .update({ status: 'active' })
  .in('id', retailerIds);
```

---

### <� `businesses` Table

#### SELECT Queries
**Get business details:**
```js
// Inferred usage
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('id', business_id)
  .single();
```

**List all businesses:**
```js
// pages/admin.js (Stores tab)
const { data } = await supabaseAdmin
  .from('businesses')
  .select('*')
  .order('name');
```

---

### = `uids` Table

#### SELECT Queries
**Check UID claim status:**
```js
// pages/api/uid-redirect.js:18-22
const { data: uidRow } = await supabase
  .from('uids')
  .select('affiliate_url, is_claimed')
  .eq('uid', uid)
  .single();
```

**Get all UIDs for retailer:**
```js
// pages/onboard/dashboard.js
const { data: uids } = await supabase
  .from('uids')
  .select('*')
  .eq('business_id', retailer.business_id);
```

**List all UIDs (admin):**
```js
// pages/admin.js (UIDs tab)
const { data } = await supabaseAdmin
  .from('uids')
  .select('*, businesses(name)')
  .order('created_at', { ascending: false });
```

#### UPDATE Queries
**Claim UID:**
```js
// pages/claim.js (inferred)
const { data } = await supabase
  .from('uids')
  .update({
    is_claimed: true,
    business_id: retailer.business_id,
    affiliate_url: `https://pawpayaco.com/collections/friendship?ref=${uid}`
  })
  .eq('uid', uid);
```

---

### =� `vendors` Table

#### SELECT Queries
**List all vendors:**
```js
// pages/admin.js (Vendors tab)
const { data } = await supabaseAdmin
  .from('vendors')
  .select('*')
  .order('created_at', { ascending: false });
```

**Get vendor by ID:**
```js
// Inferred usage
const { data } = await supabase
  .from('vendors')
  .select('*')
  .eq('id', vendor_id)
  .single();
```

#### INSERT Queries
**Submit vendor application:**
```js
// pages/api/submit-vendor.js:32-45
const { data } = await supabase
  .from('vendors')
  .insert([{
    name,
    email,
    store_type: storeType,
    website_url: websiteUrl,
    platform_url: platformUrl,
    fulfillment_speed: fulfillmentSpeed,
    inventory_cap: inventoryCap,
    product_photo_url: productPhotoUrl,
    collection_name: collectionName,
    onboarded_by: sourcedBy || null
  }]);
```

#### UPDATE Queries
**Update Shopify credentials:**
```js
// pages/onboard/shopify-connect.js (inferred)
const { data } = await supabase
  .from('vendors')
  .update({
    shopify_access_token: token,
    shopify_shop_url: shopUrl
  })
  .eq('id', vendor_id);
```

---

### =� `scans` Table

#### SELECT Queries
**Get scans for retailer:**
```js
// pages/onboard/dashboard.js
const { data: scans } = await supabase
  .from('scans')
  .select('*')
  .eq('retailer_id', retailer.id)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Aggregate scan stats:**
```js
// pages/onboard/dashboard.js (inferred)
const { data } = await supabase
  .from('scans')
  .select('clicked, converted, revenue')
  .eq('retailer_id', retailer.id);

// Calculate stats client-side:
const weeklyScans = data.length;
const conversionRate = data.filter(s => s.converted).length / weeklyScans;
const revenue = data.reduce((sum, s) => sum + (s.revenue || 0), 0);
```

#### INSERT Queries
**Log scan event:**
```js
// pages/api/uid-redirect.js (verify)
const { data } = await supabase
  .from('scans')
  .insert([{
    uid,
    retailer_id: uidRow.retailer_id,
    created_at: new Date().toISOString(),
    clicked: false,
    converted: false
  }]);
```

---

### =� `payout_jobs` Table

#### SELECT Queries
**Get payout job by ID:**
```js
// pages/api/payout.js:66-70
const { data: job } = await supabase
  .from('payout_jobs')
  .select('*')
  .eq('id', payoutJobId)
  .single();
```

**Get payouts for retailer:**
```js
// pages/onboard/dashboard.js
const { data: payoutJobs } = await supabase
  .from('payout_jobs')
  .select('*')
  .eq('retailer_id', retailer.id)
  .order('created_at', { ascending: false });
```

**List all pending payouts (admin):**
```js
// pages/admin.js (Payouts tab)
const { data } = await supabaseAdmin
  .from('payout_jobs')
  .select('*, vendors(name), retailers(name)')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

#### UPDATE Queries
**Mark payout as paid:**
```js
// pages/api/payout.js:145-151
await supabase
  .from('payout_jobs')
  .update({
    status: 'paid',
    date_paid: new Date().toISOString()
  })
  .eq('id', payoutJobId);
```

---

### =� Account Tables (`vendor_accounts`, `retailer_accounts`, `sourcer_accounts`)

#### SELECT Queries
**Get Dwolla funding source:**
```js
// pages/api/payout.js:80-98
const { data: vendor } = await supabase
  .from('vendor_accounts')
  .select('dwolla_funding_source_id')
  .eq('vendor_id', job.vendor_id)
  .single();

const { data: retailer } = await supabase
  .from('retailer_accounts')
  .select('dwolla_funding_source_id')
  .eq('retailer_id', job.retailer_id)
  .single();
```

**Get account for dashboard:**
```js
// pages/onboard/dashboard.js
const { data: account } = await supabase
  .from('retailer_accounts')
  .select('*')
  .eq('retailer_id', retailer.id)
  .single();
```

#### UPDATE Queries
**Save Plaid/Dwolla credentials:**
```js
// pages/api/plaid-exchange.js (inferred)
const { data } = await supabase
  .from('retailer_accounts')
  .update({
    plaid_access_token: accessToken,
    dwolla_funding_source_id: fundingSourceId,
    bank_name: accountName
  })
  .eq('retailer_id', retailer_id);
```

---

### =d `admins` Table

#### SELECT Queries
**Check admin status:**
```js
// pages/admin.js:107-111
const { data: adminRecord } = await supabaseAdmin
  .from('admins')
  .select('id')
  .eq('id', user.id)
  .single();
```

**Check admin (helper function):**
```js
// lib/auth.js:97-114
const { data } = await supabase
  .from('admins')
  .select('id')
  .eq('id', userId)
  .single();

return !!data;
```

---

### =� `orders` Table

#### SELECT Queries
**Get orders for vendor:**
```js
// Inferred usage
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('vendor_id', vendor_id)
  .order('created_at', { ascending: false });
```

**Get orders for retailer:**
```js
// Inferred usage
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('retailer_id', retailer_id)
  .order('created_at', { ascending: false });
```

#### INSERT Queries
**Sync Shopify order:**
```js
// pages/api/shopify-webhook.js (verify)
const { data } = await supabase
  .from('orders')
  .insert([{
    shopify_order_id: order.id,
    customer_email: order.email,
    total: order.total_price,
    vendor_id,
    retailer_id,
    created_at: order.created_at
  }]);
```

---

### =� `retailer_outreach` Table

#### INSERT Queries
**Log outreach attempt:**
```js
// pages/api/admin/add-prospect.js
const { data } = await supabase
  .from('retailer_outreach')
  .insert([{
    store_name,
    phone,
    business_id,
    status: 'contacted',
    notes
  }]);
```

---

### =e `retailer_owners` Table

#### INSERT Queries
**Add franchise owner:**
```js
// pages/api/admin/add-owner.js
const { data } = await supabase
  .from('retailer_owners')
  .insert([{
    name,
    email,
    phone,
    business_id
  }]);
```

---

## = Query Optimization Patterns

### Use `.maybeSingle()` for Optional Lookups
**Prevents error on no results:**
```js
const { data } = await supabase
  .from('retailers')
  .select('*')
  .eq('email', user.email)
  .maybeSingle(); // Returns null if no match (no error thrown)
```

### Use `.single()` for Required Lookups
**Throws error if 0 or >1 results:**
```js
const { data, error } = await supabase
  .from('payout_jobs')
  .select('*')
  .eq('id', payoutJobId)
  .single(); // Error if not exactly 1 row
```

### Join with Related Tables
**Reduce N+1 queries:**
```js
const { data } = await supabase
  .from('payout_jobs')
  .select(`
    *,
    vendors(name, email),
    retailers(name, address)
  `)
  .eq('status', 'pending');
```

### Pagination for Large Lists
**Limit + offset pattern:**
```js
const { data } = await supabase
  .from('scans')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 49); // First 50 rows
```

---

## = Client Selection Rules

### Use `supabase` (Browser Client) When:
-  User-scoped queries (retailer's own data)
-  Public reads (no sensitive data)
-  Client-side components
-  RLS policies enforced

### Use `supabaseAdmin` (Service Role) When:
-  Admin dashboard queries (bypass RLS)
-  Cross-user data access
-  API routes (server-side only)
-  System operations (payouts, webhooks)

**Security Rule:** Never expose `supabaseAdmin` to browser!

---

## >� Common Query Patterns

### Auth-Based Data Fetching
```js
const { user } = useAuthContext();

// Find user's entity (retailer/vendor)
const { data: retailer } = await supabase
  .from('retailers')
  .select('*')
  .eq('name', user.email)
  .maybeSingle();

// Fetch related data
const { data: scans } = await supabase
  .from('scans')
  .select('*')
  .eq('retailer_id', retailer.id);
```

### Real-Time Subscriptions
**Listen for new scans:**
```js
// Inferred usage
const subscription = supabase
  .channel('scans')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'scans',
    filter: `retailer_id=eq.${retailer.id}`
  }, (payload) => {
    console.log('New scan:', payload.new);
  })
  .subscribe();
```

---

## =� Query Summary Table

| Table | SELECT | INSERT | UPDATE | DELETE | Total |
|-------|--------|--------|--------|--------|-------|
| `retailers` |  |  |  | L | 3 |
| `businesses` |  | L | L | L | 1 |
| `uids` |  | L |  | L | 2 |
| `vendors` |  |  |  | L | 3 |
| `scans` |  |  | L | L | 2 |
| `payout_jobs` |  | (verify) |  | L | 2 |
| `*_accounts` |  | L |  | L | 2 |
| `admins` |  | L | L | L | 1 |
| `orders` |  |  | L | L | 2 |
| `retailer_outreach` | L |  | L | L | 1 |
| `retailer_owners` | L |  | L | L | 1 |

**Note:** (verify) indicates inferred usage that should be confirmed in code.

---

## = Relations
- See **@context/supabase/overview.md** for table schema
- See **@context/supabase/foreign_keys.md** for relationships
- See **@context/nextjs/auth_flow.md** for auth-based queries
- See **@context/nextjs/pages_api_summary.md** for API route queries

// pages/api/retailers/ready-for-claim.js
// SELECT displays.status, retailers.* FROM displays JOIN retailers ON displays.retailer_id = retailers.id
