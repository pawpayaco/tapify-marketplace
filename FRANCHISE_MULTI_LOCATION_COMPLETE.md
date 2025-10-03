# 🏢 Franchise Multi-Location Complete Implementation

## ✅ **What Was Built**

### **Frontend: Searchable Autocomplete for All Store Locations**
Each additional store location now has the EXACT SAME functionality as the main store field:
- ✅ **Search existing stores** in your database
- ✅ **Select from dropdown** with beautiful UI
- ✅ **Add new stores** if not found
- ✅ **Unified search container** with smooth transitions
- ✅ **Same look and feel** as main store field

---

## 🎯 **How It Works**

### **User Flow:**
1. **Main Store:** Search/select primary location
2. **Click ➕ "Add Another Store Location"**
3. **Store #2:** Search/select second location (same UI)
4. **Store #3:** Search/select third location (same UI)
5. **Manager Names:** Optional for each location
6. **Submit:** All stores connect to same owner account

### **What Happens in Backend:**

#### **For EXISTING Retailers (Selected from Search):**
```javascript
// Updates the existing retailer record
UPDATE retailers SET
  converted = true,
  email = 'franchise@owner.com',
  owner_name = 'John Doe',
  manager_name = 'Store Manager',
  onboarding_completed = true
WHERE id = [retailer_id]
```

#### **For NEW Retailers (Added via "Add new store"):**
```javascript
// Creates new retailer record
INSERT INTO retailers (
  name, email, owner_name, manager_name, 
  source = 'onboard-additional',
  converted = true, onboarding_completed = true
)
```

#### **For ALL Additional Stores:**
1. **Links to Owner:**
```sql
INSERT INTO retailer_owners (
  retailer_id, owner_email, owner_name, owner_phone
) 
ON CONFLICT (retailer_id, owner_email) DO UPDATE
```

2. **Creates Display Request:**
```sql
INSERT INTO displays (
  retailer_id, uid, location, status = 'requested'
)
```

3. **Tracks Outreach:**
```sql
INSERT INTO retailer_outreach (
  retailer_id, registered = true, 
  notes = 'Additional location for [owner]'
)
```

---

## 💰 **Payout System Integration**

### **How Payouts Work with Multiple Locations:**

#### **Key Database Links:**
```sql
-- All retailers link to same owner
retailer_owners:
  - retailer_id: store_1_id, owner_email: 'john@franchiseowner.com'
  - retailer_id: store_2_id, owner_email: 'john@franchiseowner.com'
  - retailer_id: store_3_id, owner_email: 'john@franchiseowner.com'

-- Each retailer has its own displays
displays:
  - id: 1, retailer_id: store_1_id, uid: 'disp-123...'
  - id: 2, retailer_id: store_2_id, uid: 'disp-456...'
  - id: 3, retailer_id: store_3_id, uid: 'disp-789...'

-- Orders track by retailer_id
orders:
  - retailer_id: store_1_id, amount: $100, commission: $10
  - retailer_id: store_2_id, amount: $200, commission: $20
  - retailer_id: store_3_id, amount: $150, commission: $15
```

#### **Aggregating Payouts:**
```sql
-- Get ALL earnings for a franchise owner
SELECT 
  SUM(o.commission) as total_earnings,
  ro.owner_email,
  ro.owner_name
FROM orders o
JOIN retailers r ON o.retailer_id = r.id
JOIN retailer_owners ro ON r.id = ro.retailer_id
WHERE ro.owner_email = 'john@franchiseowner.com'
GROUP BY ro.owner_email, ro.owner_name;

-- Result: $45 total from 3 locations
```

#### **Bank Account Setup:**
```sql
-- Option 1: Link bank account to primary retailer
bank_accounts:
  - retailer_id: main_store_id  -- Primary location
  - plaid_account_id: '...'
  - status: 'connected'

-- Payout query aggregates all retailers with same owner_email
-- Pays to primary retailer's bank account
```

#### **Payout Job Creation:**
```javascript
// When creating payout for franchise owner:
const allRetailers = await db.query(`
  SELECT DISTINCT r.id, r.name
  FROM retailers r
  JOIN retailer_owners ro ON r.id = ro.retailer_id
  WHERE ro.owner_email = $1
`, [owner_email]);

// Aggregate earnings across ALL their locations
const totalEarnings = await db.query(`
  SELECT SUM(commission) as total
  FROM orders
  WHERE retailer_id = ANY($1)
`, [allRetailers.map(r => r.id)]);

// Create single payout job for franchise owner
INSERT INTO payout_jobs (
  retailer_id,  -- Primary retailer (first one)
  total_amount,
  retailer_cut,
  status: 'pending'
)
```

---

## 📊 **Admin Dashboard Tracking**

### **View All Locations for a Franchise Owner:**
```sql
SELECT 
  r.id,
  r.name as store_name,
  r.address,
  r.manager_name,
  d.uid as display_uid,
  d.status as display_status,
  COUNT(o.id) as total_orders,
  SUM(o.commission) as location_earnings
FROM retailers r
JOIN retailer_owners ro ON r.id = ro.retailer_id
LEFT JOIN displays d ON r.id = d.retailer_id
LEFT JOIN orders o ON r.id = o.retailer_id
WHERE ro.owner_email = 'john@franchiseowner.com'
GROUP BY r.id, r.name, r.address, r.manager_name, d.uid, d.status;
```

### **Example Result:**
```
| Store Name          | Address       | Manager | Display UID | Status    | Orders | Earnings |
|---------------------|---------------|---------|-------------|-----------|--------|----------|
| Pizza Palace Main   | 123 Main St   | NULL    | disp-123... | requested | 10     | $100     |
| Pizza Palace Downtown| 456 Downtown | Jane    | disp-456... | active    | 15     | $150     |
| Pizza Palace Mall   | 789 Mall Blvd | Bob     | disp-789... | active    | 12     | $120     |
```

---

## 🔐 **Security & Data Integrity**

### **Ensures:**
1. ✅ **All stores link to same owner** via `retailer_owners.owner_email`
2. ✅ **Each store gets unique display** via `displays.uid`
3. ✅ **Orders track correctly** via `orders.retailer_id`
4. ✅ **Payouts aggregate properly** via `owner_email` joins
5. ✅ **Bank account shared** - one account receives all location earnings

### **Database Constraints:**
```sql
-- Ensures each retailer-owner combo is unique
CREATE UNIQUE INDEX retailer_owners_retailer_email_uniq 
ON retailer_owners (retailer_id, owner_email);

-- Ensures each display has unique UID
CREATE UNIQUE CONSTRAINT displays_uid_key 
ON displays (uid);

-- Foreign keys maintain referential integrity
ALTER TABLE displays 
ADD FOREIGN KEY (retailer_id) REFERENCES retailers(id);

ALTER TABLE orders 
ADD FOREIGN KEY (retailer_id) REFERENCES retailers(id);

ALTER TABLE bank_accounts 
ADD FOREIGN KEY (retailer_id) REFERENCES retailers(id);
```

---

## 🧪 **Testing the Complete Flow**

### **Test Case 1: Franchise Owner with 3 Existing Stores**
1. **Main Store:** Search "Pizza Palace" → Select from dropdown
2. **Add Location:** Click ➕
3. **Store #2:** Search "Pizza Palace Downtown" → Select existing
4. **Store #3:** Search "Pizza Palace Mall" → Select existing
5. **Submit**

**Result:**
- ✅ 3 existing retailers updated with owner info
- ✅ 3 new `retailer_owners` records (all with same owner_email)
- ✅ 3 new `displays` created (status: 'requested')
- ✅ 3 new `retailer_outreach` records
- ✅ 1 auth user created
- ✅ All payouts aggregate to same owner

### **Test Case 2: Mix of Existing & New Stores**
1. **Main Store:** Search "Bob's Burgers" → Add new (not found)
2. **Add Location:** Click ➕
3. **Store #2:** Search "Bob's Burgers West" → Select existing
4. **Store #3:** Search "Bob's Burgers East" → Add new (not found)
5. **Submit**

**Result:**
- ✅ 2 new retailers created (Main + Store #3)
- ✅ 1 existing retailer updated (Store #2)
- ✅ All 3 linked to same owner_email
- ✅ 3 displays created
- ✅ Payouts aggregate across all 3

---

## 📈 **Benefits**

### **For Franchise Owners:**
- ✅ **One account** manages all locations
- ✅ **One bank connection** receives all earnings
- ✅ **Individual tracking** per store
- ✅ **Flexible setup** - can add stores over time

### **For You (Admin):**
- ✅ **Track each location separately** in admin dashboard
- ✅ **Aggregate payouts easily** via owner_email
- ✅ **Monitor performance** per store
- ✅ **Manage displays individually** for each location
- ✅ **Clean data structure** with proper foreign keys

### **For Payouts:**
- ✅ **Single payout per owner** not per store
- ✅ **Aggregate ALL location earnings**
- ✅ **One bank account** connection needed
- ✅ **Proper attribution** per store maintained

---

## 💳 **Bank Account & Payout Flow**

### **Recommended Setup:**

#### **1. During Onboarding:**
```javascript
// After registration, user connects Plaid bank account
// Link to PRIMARY retailer (first one)
INSERT INTO bank_accounts (
  retailer_id,        -- Main store ID
  plaid_account_id,
  bank_name,
  account_last4,
  status: 'connected'
)
```

#### **2. When Creating Payouts:**
```javascript
// Get primary retailer for owner
const primaryRetailer = await db.query(`
  SELECT r.id
  FROM retailers r
  JOIN retailer_owners ro ON r.id = ro.retailer_id
  WHERE ro.owner_email = $1
  ORDER BY r.created_at ASC
  LIMIT 1
`, [owner_email]);

// Get their bank account
const bankAccount = await db.query(`
  SELECT * FROM bank_accounts
  WHERE retailer_id = $1 AND status = 'connected'
`, [primaryRetailer.id]);

// Aggregate earnings from ALL locations
const earnings = await db.query(`
  SELECT SUM(commission) as total
  FROM orders o
  JOIN retailers r ON o.retailer_id = r.id
  JOIN retailer_owners ro ON r.id = ro.retailer_id
  WHERE ro.owner_email = $1
  AND o.status = 'completed'
`, [owner_email]);

// Create single payout
INSERT INTO payouts (
  retailer_id,        -- Primary retailer
  amount: earnings.total,
  status: 'pending'
)
```

---

## ✅ **Summary**

### **What You Can Do Now:**
1. ✅ **Franchise owners can add multiple store locations**
2. ✅ **Each location has searchable autocomplete**
3. ✅ **Can select existing stores OR add new ones**
4. ✅ **All stores link to same owner account**
5. ✅ **Each store gets its own display**
6. ✅ **Payouts aggregate across all locations**
7. ✅ **One bank account receives all earnings**
8. ✅ **Admin can track each location separately**

### **Database Structure is Perfect:**
- `retailers` - Individual store locations
- `retailer_owners` - Links stores to owners (via owner_email)
- `displays` - One per store location
- `orders` - Tracked by retailer_id
- `bank_accounts` - Linked to primary retailer
- `payouts` - Aggregated by owner_email

**The system is now fully wired for multi-location franchise owners!** 🎉
