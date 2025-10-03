# 🚀 Quick Integration Example

## Replace Address Field in Registration Form

### **Current Code (pages/onboard/register.js):**

Find this section (around line 820-840):

```jsx
{/* Store Address */}
<motion.div variants={fadeInUp}>
  <label htmlFor="storeAddress" className="block text-sm font-bold text-gray-700 mb-2">
    Store Address <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    id="storeAddress"
    name="storeAddress"
    value={formData.storeAddress}
    onChange={handleChange}
    required
    autoComplete="street-address"
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff6fb3] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
    placeholder="123 Main Street, San Francisco, CA 94102, United States"
  />
</motion.div>
```

### **Replace With:**

```jsx
{/* Store Address - Google Maps + USPS Validation */}
<motion.div variants={fadeInUp}>
  <AddressInput
    value={formData.storeAddress}
    onChange={(address) => {
      setFormData(prev => ({ ...prev, storeAddress: address }));
    }}
    onValidated={(validated) => {
      // Store USPS-validated address
      console.log('USPS Validated:', validated);
      const fullAddress = `${validated.address1}${validated.address2 ? ', ' + validated.address2 : ''}, ${validated.city}, ${validated.state} ${validated.zip5}`;
      setFormData(prev => ({
        ...prev,
        storeAddress: fullAddress,
        validatedAddress: validated // Store full validated object
      }));
    }}
    googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    required={true}
  />
</motion.div>
```

### **Add Import at Top:**

```jsx
import AddressInput from '../components/AddressInput';
```

---

## Complete Step-by-Step:

### **1. Add to .env.local:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
USPS_USERID=your_userid_here
```

### **2. Test it:**
```bash
npm run dev
```

Go to: `http://localhost:3000/onboard/register`

Type an address and watch it autocomplete + validate!

---

## Example Addresses to Test:

### ✅ **Valid Address:**
```
1600 Pennsylvania Avenue NW
Washington, DC 20500
```

### ⚠️ **Requires Apartment:**
```
555 California St
San Francisco, CA
```

### ❌ **Invalid:**
```
123 Fake Street
Nowhere, XX
```

---

## That's It! 🎉

The address field will now:
- Show Google Maps suggestions
- Validate with USPS
- Display success/error states
- Look perfect with your design

**Pro tip:** The validated address object includes ZIP+4, which you can use for more accurate shipping rates!
