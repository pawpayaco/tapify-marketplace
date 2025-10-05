# Shopify Metafields

## Purpose
Documents the custom metafields used in Tapify's Shopify integration for vendor attribution, commission tracking, display metadata, and Phase 2 marketplace functionality. Metafields extend Shopify's data model to support Tapify's multi-party payout system.

---

## >é What Are Metafields?

**Shopify Metafields** are custom fields that store additional information about products, collections, orders, customers, and other Shopify objects. They enable Tapify to:

- Link products to specific vendors
- Store commission percentages
- Track NFC display associations
- Maintain fulfillment metadata
- Enable advanced analytics

**Structure:**
```
namespace.key = value
Example: tapify.vendor_id = "vendor-abc123"
```

---

## =æ Product Metafields

### Namespace: `tapify`

Used for core Tapify functionality and vendor attribution.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `vendor_id` | `single_line_text_field` | UUID of vendor who owns this product | `"vendor-abc123"` |
| `vendor_name` | `single_line_text_field` | Display name of vendor | `"Handmade Collars Co."` |
| `commission_rate` | `number_decimal` | Vendor's commission % (0.00-1.00) | `0.60` (60%) |
| `display_count` | `number_integer` | How many displays feature this product | `12` |
| `fulfillment_time` | `single_line_text_field` | Expected shipping time | `"2-3 business days"` |
| `ships_from` | `single_line_text_field` | Vendor's fulfillment location | `"Austin, TX"` |
| `sourcer_id` | `single_line_text_field` | Sourcing agent who recruited vendor | `"sourcer-xyz"` |
| `custom_options` | `boolean` | Whether product supports personalization | `true` |
| `material_tags` | `list.single_line_text_field` | Materials used | `["leather", "brass"]` |
| `eco_friendly` | `boolean` | Sustainable/eco-conscious product | `true` |

### Namespace: `analytics`

Used for performance tracking and reporting.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `total_scans` | `number_integer` | Total NFC scans across all displays | `450` |
| `conversion_rate` | `number_decimal` | Scan-to-purchase rate | `0.15` (15%) |
| `avg_order_value` | `number_decimal` | Average cart value for this product | `59.99` |
| `last_sale_date` | `date` | Most recent purchase | `"2025-01-15"` |
| `retailer_performance` | `json` | Performance by retailer (verify) | `{"retailer-123": {...}}` |

### Namespace: `display`

Used for physical display management.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `active_displays` | `list.single_line_text_field` | UIDs of displays featuring this product | `["ABC123", "DEF456"]` |
| `display_image_url` | `url` | 3D render of retail display | `"https://cdn.tapify.co/..."` |
| `sample_shipped` | `boolean` | Whether sample sent to Tapify | `true` |
| `display_priority` | `number_integer` | Featured placement priority (1-10) | `8` |

---

## =Ò Order Metafields

### Namespace: `tapify`

Used for attribution and payout tracking.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `retailer_uid` | `single_line_text_field` | NFC UID that generated this sale | `"ABC123"` |
| `retailer_id` | `single_line_text_field` | Supabase retailer UUID | `"retailer-789"` |
| `display_id` | `single_line_text_field` | Specific display that was scanned | `"display-456"` |
| `scan_timestamp` | `date_time` | When NFC was tapped | `"2025-01-15T10:30:00Z"` |
| `payout_job_id` | `single_line_text_field` | Linked payout job in Supabase | `"payout-xyz"` |
| `commission_total` | `number_decimal` | Total commission across all parties | `15.00` |

### Namespace: `fulfillment`

Used for multi-vendor order routing.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `vendor_id` | `single_line_text_field` | Vendor responsible for fulfillment | `"vendor-abc123"` |
| `estimated_ship_date` | `date` | When vendor will ship | `"2025-01-17"` |
| `tracking_synced` | `boolean` | Whether tracking sent to customer | `true` |

---

## <ì Collection Metafields

### Namespace: `tapify`

Used for vendor storefronts and marketplace organization.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `vendor_id` | `single_line_text_field` | If vendor-specific collection | `"vendor-abc123"` |
| `collection_type` | `single_line_text_field` | Category: vendor, category, featured | `"vendor"` |
| `commission_override` | `number_decimal` | Custom commission for this collection | `0.65` |
| `featured_until` | `date` | Expiration date for featured status | `"2025-02-01"` |

---

## =d Customer Metafields (Future)

### Namespace: `tapify`

Used for loyalty and referral tracking.

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `referred_by_retailer` | `single_line_text_field` | First retailer who introduced customer | `"retailer-123"` |
| `total_scans` | `number_integer` | Total NFC taps by this customer | `5` |
| `favorite_vendors` | `list.single_line_text_field` | Vendors customer purchases from most | `["vendor-abc", "vendor-xyz"]` |
| `loyalty_tier` | `single_line_text_field` | Customer loyalty status | `"gold"` |

---

## <÷ Variant Metafields (Optional)

### Namespace: `tapify`

Used for variant-specific data (e.g., different SKUs from same vendor).

| Key | Type | Description | Example Value |
|-----|------|-------------|---------------|
| `vendor_sku` | `single_line_text_field` | Vendor's internal SKU | `"HC-COL-M-BLU"` |
| `cost_to_tapify` | `number_decimal` | Wholesale cost (admin only) | `15.00` |
| `low_stock_threshold` | `number_integer` | When to alert vendor | `5` |

---

## =' Implementation Methods

### 1. Via Shopify Admin UI

**Navigate:**
```
Settings ’ Metafields ’ Products ’ Add definition
```

**Example Definition:**
- **Namespace:** `tapify`
- **Key:** `vendor_id`
- **Name:** Tapify Vendor ID
- **Type:** Single line text
- **Validation:** None
- **Description:** UUID of the vendor who owns this product

### 2. Via Shopify Admin API (REST)

**Create Metafield Definition:**
```bash
POST https://{shop}.myshopify.com/admin/api/2024-01/metafield_definitions.json

{
  "metafield_definition": {
    "namespace": "tapify",
    "key": "vendor_id",
    "name": "Tapify Vendor ID",
    "description": "UUID of the vendor who owns this product",
    "type": "single_line_text_field",
    "owner_type": "PRODUCT"
  }
}
```

**Set Metafield Value on Product:**
```bash
POST https://{shop}.myshopify.com/admin/api/2024-01/products/{product_id}/metafields.json

{
  "metafield": {
    "namespace": "tapify",
    "key": "vendor_id",
    "value": "vendor-abc123",
    "type": "single_line_text_field"
  }
}
```

### 3. Via Shopify GraphQL API (Preferred for Bulk Operations)

**Set Product Metafield:**
```graphql
mutation {
  productUpdate(input: {
    id: "gid://shopify/Product/123456789"
    metafields: [
      {
        namespace: "tapify"
        key: "vendor_id"
        value: "vendor-abc123"
        type: "single_line_text_field"
      },
      {
        namespace: "tapify"
        key: "commission_rate"
        value: "0.60"
        type: "number_decimal"
      }
    ]
  }) {
    product {
      id
      metafields(first: 10) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
  }
}
```

### 4. Via Tapify Admin Dashboard (Phase 2)

**Vendor Product Sync Flow:**
```
1. Vendor connects Shopify via OAuth
2. Tapify fetches vendor's products
3. Admin reviews products in dashboard
4. On approval, Tapify sets metafields:
   - tapify.vendor_id = vendor's UUID
   - tapify.commission_rate = vendor's rate
   - tapify.vendor_name = vendor's display name
5. Product published to marketplace
```

---

## =Ö Accessing Metafields

### In Shopify Liquid Theme

**Display vendor name on product page:**
```liquid
{% if product.metafields.tapify.vendor_name %}
  <p class="vendor-badge">
    By {{ product.metafields.tapify.vendor_name }}
  </p>
{% endif %}
```

**Show fulfillment time:**
```liquid
<span class="shipping-estimate">
  Ships in {{ product.metafields.tapify.fulfillment_time | default: "3-5 days" }}
</span>
```

### In Webhook Payloads

**When order webhook fires, metafields are NOT included by default.**

**Workaround: Fetch product metafields in webhook handler:**
```js
// In /api/shopify-webhook
const lineItemProductIds = order.line_items.map(item => item.product_id);

for (const productId of lineItemProductIds) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/products/${productId}/metafields.json`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken }
    }
  );

  const { metafields } = await response.json();
  const vendorId = metafields.find(m =>
    m.namespace === 'tapify' && m.key === 'vendor_id'
  )?.value;

  // Use vendorId for payout attribution
}
```

### Via Storefront API (Frontend)

**GraphQL Query:**
```graphql
query {
  product(handle: "friendship-collar") {
    title
    metafield(namespace: "tapify", key: "vendor_name") {
      value
    }
    metafield(namespace: "tapify", key: "fulfillment_time") {
      value
    }
  }
}
```

---

## = Metafield Sync Strategy (Phase 2)

### When Vendor Connects Shopify Store

**Goal:** Automatically tag all their products with Tapify vendor metadata.

**Flow:**
```js
// After OAuth success in /onboard/shopify-connect
const products = await fetchVendorProducts(shopUrl, accessToken);

for (const product of products) {
  await setProductMetafields(product.id, {
    'tapify.vendor_id': vendorId,
    'tapify.vendor_name': vendorName,
    'tapify.commission_rate': vendorCommissionRate,
    'tapify.ships_from': vendorAddress.city + ', ' + vendorAddress.state
  });
}
```

### When Product Syncs to Marketplace

**Goal:** Keep Tapify metafields in sync with vendor's original store.

**Periodic Sync (Hourly):**
```js
// Cron job: /api/cron/sync-vendor-products
const vendors = await supabase.from('vendors').select('*');

for (const vendor of vendors) {
  const products = await fetchShopifyProducts(vendor.shopify_shop_url, vendor.shopify_access_token);

  for (const product of products) {
    // Update Tapify marketplace product
    await updateMarketplaceProduct(product, {
      price: product.variants[0].price,
      inventory: product.variants[0].inventory_quantity,
      // Preserve Tapify metafields (don't overwrite)
    });
  }
}
```

---

## >ê Testing Metafields

### Development Workflow

**1. Create Test Metafield:**
```bash
# Using Shopify CLI
shopify metafield create --namespace tapify --key test_field --value "test value" --resource-type product --resource-id 123456789
```

**2. Verify in Admin:**
```
Products ’ [Select Product] ’ Metafields ’ tapify.test_field
```

**3. Query via API:**
```bash
curl https://{shop}.myshopify.com/admin/api/2024-01/products/{id}/metafields.json \
  -H "X-Shopify-Access-Token: {token}"
```

---

## =¨ Important Considerations

### Performance
- **Metafields add API overhead:** Fetching metafields requires additional API calls
- **Cache aggressively:** Store metafield values in Supabase to avoid repeated Shopify API hits
- **Bulk operations:** Use GraphQL for setting metafields on many products at once

### Data Integrity
- **Validation:** Shopify doesn't enforce strict validation on metafield values (except type)
- **Consistency:** Ensure metafield values match Supabase records (e.g., `tapify.vendor_id` should exist in `vendors` table)
- **Migrations:** If changing metafield structure, update all existing products

### Security
- **Admin-only metafields:** Fields like `cost_to_tapify` should NOT be exposed in Storefront API
- **Use namespaces wisely:** Prefix all custom fields with `tapify` to avoid conflicts with apps/themes

---

##  Metafield Checklist for Phase 2 Launch

**Before going live with multi-vendor marketplace:**

- [ ] Create all `tapify.*` metafield definitions in Shopify admin
- [ ] Test metafield sync flow with 1-2 test vendors
- [ ] Verify metafields appear correctly in Shopify admin UI
- [ ] Confirm webhook handler correctly extracts metafield values
- [ ] Update Shopify theme to display vendor names and fulfillment times
- [ ] Document metafield schema in internal wiki
- [ ] Set up monitoring for metafield sync errors

---

## =Ö Related Documentation

- **@context/shopify/overview.md**  Integration architecture
- **@context/shopify/store_structure.md**  Collections and product organization
- **@context/shopify/integration_points.md**  API connection details
- **@context/data_model.md**  Database schema and relationships

---

## = External Resources

- [Shopify Metafields Documentation](https://shopify.dev/docs/apps/custom-data/metafields)
- [Shopify Admin API - Metafields](https://shopify.dev/api/admin-rest/2024-01/resources/metafield)
- [Shopify GraphQL - Metafields](https://shopify.dev/api/admin-graphql/2024-01/mutations/productUpdate)
