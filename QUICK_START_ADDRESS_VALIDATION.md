# 🚀 Quick Start: Address Validation

## ✅ Integration Complete!

Google Maps autocomplete + USPS validation is now live on **all address fields** in your registration form.

---

## 🎯 **What You Need to Do**

### **1. Add API Keys to `.env.local`**

Create or update `.env.local` in your project root:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here

# USPS User ID  
USPS_USERID=123ABC...your_userid_here
```

### **2. Get Your API Keys**

**Google Maps (5 minutes):**
1. Go to https://console.cloud.google.com/
2. Enable "Places API" and "Maps JavaScript API"
3. Create API key
4. Copy to `.env.local`

**USPS (1-2 days):**
1. Register at https://www.usps.com/business/web-tools-apis/
2. Wait for email with USERID (usually 24 hours)
3. Copy to `.env.local`

### **3. Restart Dev Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

### **4. Test It!**

```
Go to: http://localhost:3000/onboard/register

Type an address:
- "123 main st san francisco"
- See Google suggestions appear
- Select one
- Watch it validate with USPS ✅
```

---

## 📍 **Where It's Integrated**

✅ **Main store address** - Primary shipping address  
✅ **Additional store addresses** - Multi-location support  

Both now have:
- Google Maps autocomplete dropdown
- USPS validation with ✓ badge
- Error handling for invalid addresses
- Matching your orange gradient theme

---

## 🎨 **What Users Will See**

```
┌────────────────────────────────────┐
│ Store Address *        (Validating…)│
├────────────────────────────────────┤
│ 123 mai                            │
│ ──────────────────────────────────│
│ 📍 123 Main St                     │
│    San Francisco, CA 94102    →   │
│ ──────────────────────────────────│
│ 📍 123 Main Street                 │
│    San Jose, CA 95113         →   │
└────────────────────────────────────┘
  ✓ Address verified by USPS
```

---

## 🧪 **Test Addresses**

**Valid:**
```
1600 Pennsylvania Avenue NW
Washington, DC 20500
```

**Requires Apt:**
```
555 California St
San Francisco, CA
```

**Invalid:**
```
123 Fake Street
Nowhere, XX
```

---

## 🎊 **That's It!**

Just add your API keys and you're done. All address fields now:
- Autocomplete with Google Maps
- Validate with USPS
- Look beautiful
- Ensure deliverability

**No other changes needed!** 🚀
