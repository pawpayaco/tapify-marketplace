# 🔐 Update DATABASE_URL with New Password

## 🎯 Quick Steps

### **1. Get Your New Database Password**

In **Supabase Dashboard:**
- Go to **Settings** → **Database**
- Under "Connection string", click **"Show"** or copy the connection string
- Your password is between `postgres:` and `@db.`

### **2. URL-Encode Special Characters**

If your password has special characters, encode them:

| Character | Encoded |
|-----------|---------|
| `!`       | `%21`   |
| `@`       | `%40`   |
| `#`       | `%23`   |
| `$`       | `%24`   |
| `%`       | `%25`   |
| `^`       | `%5E`   |
| `&`       | `%26`   |
| `*`       | `%2A`   |
| `(`       | `%28`   |
| `)`       | `%29`   |
| `+`       | `%2B`   |
| `=`       | `%3D`   |
| `[`       | `%5B`   |
| `]`       | `%5D`   |
| `{`       | `%7B`   |
| `}`       | `%7D`   |
| `:`       | `%3A`   |
| `;`       | `%3B`   |
| `'`       | `%27`   |
| `"`       | `%22`   |
| `<`       | `%3C`   |
| `>`       | `%3E`   |
| `/`       | `%2F`   |
| `\`       | `%5C`   |
| `?`       | `%3F`   |

### **3. Update `.env.local`**

Open `.env.local` and update line 38:

```env
DATABASE_URL=postgresql://postgres:YOUR_ENCODED_PASSWORD@db.hoaixfylzqnpkojsfnvv.supabase.co:5432/postgres
```

Replace `YOUR_ENCODED_PASSWORD` with your URL-encoded password.

### **4. Restart Dev Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

### **5. Test**

```bash
curl "http://localhost:3000/api/retailers/search?query=pet"
```

Should return: `{"results":[...]}`

---

## 🚀 Alternative: Copy Full Connection String from Supabase

**Even easier:**

1. In **Supabase Dashboard** → **Settings** → **Database**
2. Find **"Connection string"** section
3. Select **"URI"** tab
4. Click **"Copy"** (this already has the password encoded!)
5. Paste into `.env.local`:
   ```env
   DATABASE_URL=<paste here>
   ```
6. Restart server

---

## ✅ After Success

Your autocomplete will show all 721 retailers! 🎉

Type "pet" and you should see pet stores appear in the dropdown.

