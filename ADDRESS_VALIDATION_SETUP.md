# 📍 Google Maps + USPS Address Validation System

## ✅ **Complete Implementation**

A production-ready address input system that combines Google Maps autocomplete with USPS validation to ensure deliverable addresses.

---

## 🎯 **Features**

### **Google Maps Autocomplete:**
- ✅ Real-time address suggestions as user types
- ✅ US-only address filtering
- ✅ Beautiful dropdown UI matching your existing components
- ✅ Debounced API calls (300ms)
- ✅ Automatic parsing of address components

### **USPS Validation:**
- ✅ Validates address deliverability
- ✅ Standardizes addresses to USPS format
- ✅ Detects missing apartment/unit numbers
- ✅ Returns ZIP+4 codes
- ✅ Clear error messages for invalid addresses

### **UI/UX:**
- ✅ Styled consistently with your existing dropdowns
- ✅ Loading states during validation
- ✅ Success/error visual feedback
- ✅ Inline error messages
- ✅ Smooth animations with Framer Motion

---

## 📁 **Files Created**

### **1. Frontend Component:**
```
components/AddressInput.js
```
Reusable React component with Google Maps autocomplete + USPS validation

### **2. Backend API:**
```
pages/api/validate-address.js
```
Next.js API route that handles USPS XML requests

---

## 🔧 **Setup Instructions**

### **Step 1: Environment Variables**

Add these to your `.env.local` file:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# USPS Web Tools User ID
USPS_USERID=your_usps_userid_here
```

**Getting API Keys:**

**Google Maps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable "Places API" and "Maps JavaScript API"
4. Create credentials → API Key
5. Restrict key to your domain (optional but recommended)

**USPS Web Tools:**
1. Register at [USPS Web Tools](https://www.usps.com/business/web-tools-apis/)
2. You'll receive a USERID via email
3. Test in their staging environment first
4. Request production access when ready

---

### **Step 2: Install Dependencies**

```bash
npm install xml2js
```

Already done! ✅

---

### **Step 3: Usage Example**

Here's how to use the `AddressInput` component in your forms:

```jsx
import AddressInput from '../components/AddressInput';
import { useState } from 'react';

export default function MyForm() {
  const [address, setAddress] = useState('');
  const [validatedAddress, setValidatedAddress] = useState(null);

  const handleAddressChange = (value) => {
    setAddress(value);
  };

  const handleAddressValidated = (uspsAddress) => {
    console.log('USPS Validated Address:', uspsAddress);
    // uspsAddress contains:
    // {
    //   address1: "123 MAIN ST",
    //   address2: "APT 4B",
    //   city: "SAN FRANCISCO",
    //   state: "CA",
    //   zip5: "94102",
    //   zip4: "1234"
    // }
    setValidatedAddress(uspsAddress);
  };

  return (
    <form>
      <AddressInput
        value={address}
        onChange={handleAddressChange}
        onValidated={handleAddressValidated}
        googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        required={true}
      />
      
      {/* Other form fields */}
    </form>
  );
}
```

---

## 🎨 **Component Props**

### **AddressInput Component:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | No | Current address value |
| `onChange` | function | No | Called when address changes: `(address) => {}` |
| `onValidated` | function | No | Called when USPS validates: `(uspsAddress) => {}` |
| `error` | string | No | External error message to display |
| `required` | boolean | No | Whether field is required (default: true) |
| `className` | string | No | Additional CSS classes |
| `googleApiKey` | string | **Yes** | Your Google Maps API key |

---

## 🔄 **How It Works**

### **User Flow:**

```
1. User types "123 main st san f..."
   ↓
2. Google Maps shows suggestions
   ↓
3. User selects "123 Main St, San Francisco, CA"
   ↓
4. Component parses address components
   ↓
5. Sends to /api/validate-address
   ↓
6. USPS validates and standardizes
   ↓
7. Returns: "123 MAIN ST, SAN FRANCISCO, CA 94102"
   ↓
8. Component shows success ✓
   ↓
9. onValidated callback fires with full address object
```

### **Error Handling:**

**Missing Apartment:**
```
User selects: "123 Main St, San Francisco, CA"
USPS Response: "This address requires an apartment number"
Component shows: Red border + error message
```

**Invalid Address:**
```
User selects: "123 Fake St, Nowhere, XX"
USPS Response: "Address not found"
Component shows: Error with helpful message
```

---

## 🧪 **Testing**

### **Test Valid Address:**
```
123 Main St
San Francisco, CA 94102
```

### **Test Address Requiring Apt:**
```
555 California St
San Francisco, CA 94104
```
(Many multi-unit buildings will require apt/unit)

### **Test Invalid Address:**
```
123 Fake Street
Nowhere, XX 00000
```

---

## 🎯 **API Endpoint Details**

### **POST /api/validate-address**

**Request Body:**
```json
{
  "address1": "123 MAIN ST",
  "address2": "APT 4B",
  "city": "SAN FRANCISCO",
  "state": "CA",
  "zip5": "94102"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "address": {
    "address1": "123 MAIN ST",
    "address2": "APT 4B",
    "city": "SAN FRANCISCO",
    "state": "CA",
    "zip5": "94102",
    "zip4": "1234"
  },
  "message": "Address validated successfully"
}
```

**Error Response (400):**
```json
{
  "ok": false,
  "error": "This address requires an apartment, suite, or unit number. Please add it and try again.",
  "rawError": "Address not found. Apartment/Unit required."
}
```

---

## 🎨 **Styling**

The component matches your existing dropdown styles:

- **Container**: Rounded 2xl, border transitions
- **Dropdown**: Same hover effects as store search
- **Success**: Green border + checkmark
- **Error**: Red border + error icon
- **Loading**: Blue spinner with text

All animations use Framer Motion for consistency.

---

## 🚀 **Integration Example: Registration Form**

Replace your current address field in `pages/onboard/register.js`:

```jsx
// Before:
<input
  type="text"
  name="storeAddress"
  value={formData.storeAddress}
  onChange={handleChange}
  className="..."
  placeholder="123 Main Street, City, State, ZIP"
/>

// After:
<AddressInput
  value={formData.storeAddress}
  onChange={(address) => {
    setFormData(prev => ({ ...prev, storeAddress: address }));
  }}
  onValidated={(validated) => {
    // Store validated address details if needed
    setFormData(prev => ({
      ...prev,
      storeAddress: `${validated.address1}, ${validated.city}, ${validated.state} ${validated.zip5}`,
      validatedAddress: validated
    }));
  }}
  googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
  required={true}
/>
```

---

## 🔐 **Security Best Practices**

### **API Key Protection:**

✅ **Google Maps API Key:**
- Stored in `NEXT_PUBLIC_*` (client-side, expected)
- Restrict to your domain in Google Cloud Console
- Set usage quotas to prevent abuse

✅ **USPS USERID:**
- Stored server-side only (not `NEXT_PUBLIC_*`)
- Never exposed to client
- Used only in API route

### **Rate Limiting:**

Consider adding rate limiting to `/api/validate-address`:

```bash
npm install express-rate-limit
```

Then in your API route:
```javascript
// Example rate limit middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## 📊 **Error Messages Reference**

| USPS Error | User-Friendly Message |
|------------|----------------------|
| Address not found | "Address not found. Please verify the street, city, and state." |
| Apartment required | "This address requires an apartment, suite, or unit number." |
| Invalid city/state | "Address not deliverable. Please verify the address details." |
| No response | "Address validation service error. Please try again." |

---

## 🎉 **Benefits**

### **For Users:**
- ✅ Fast, accurate address entry
- ✅ No manual typing of city/state/zip
- ✅ Immediate feedback on address validity
- ✅ Prevents shipping errors

### **For You:**
- ✅ Reduces failed deliveries
- ✅ Clean, standardized address data
- ✅ Professional user experience
- ✅ Matches your existing UI perfectly

---

## 🔧 **Troubleshooting**

### **Google Maps not loading:**
```
Error: Cannot read property 'places' of undefined
```
**Solution:** Check that Google Maps script is loaded. Add to `_app.js`:
```jsx
<Script
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
  strategy="beforeInteractive"
/>
```

### **USPS returns errors:**
```
Error: Invalid USERID
```
**Solution:** 
1. Verify `USPS_USERID` in `.env.local`
2. Check you've activated your USPS Web Tools account
3. Confirm you're not in production without approval

### **Addresses always fail validation:**
**Solution:** USPS has different servers for test/production:
- **Test:** `http://testing.shippingapis.com/ShippingAPITest.dll`
- **Production:** `https://secure.shippingapis.com/ShippingAPI.dll`

Currently using production URL. Switch to test if needed during development.

---

## 📝 **Next Steps**

1. ✅ **Add API keys** to `.env.local`
2. ✅ **Test the component** in your registration form
3. ✅ **Verify USPS validation** with real addresses
4. ✅ **Add to other forms** where addresses are needed
5. ✅ **Set up error monitoring** (Sentry, etc.)

---

## 🎊 **Complete!**

You now have a production-ready address validation system that:
- Looks beautiful and matches your design
- Validates addresses with USPS
- Provides great UX
- Prevents shipping errors

**Ready to integrate into your registration form!** 🚀
