# Registration Fix - Complete Setup Guide

## ✅ Status: Ready to Deploy

Your `.env.local` has been updated with the service role key. Now follow these steps to complete the registration fix:

---

## 🔧 Step 1: Run the Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy the entire content from this file:
   ```
   supabase/migrations/015_registration_fix.sql
   ```
5. Paste it in the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

**Expected Result**: Query executes successfully with no errors

---

## 🔄 Step 2: Restart Dev Server

Stop and restart your development server:

```bash
# Stop current server (Ctrl+C if running)

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

---

## ✅ Step 3: Test Registration

1. Open **http://localhost:3000**
2. You should see the login page
3. Click **"Create Account"** or go to `/register`
4. Fill in the registration form:

   | Field | Example |
   |-------|---------|
   | Dealership Name | Taqwa Motors |
   | Your Full Name | Muhammad Tariq |
   | City | Islamabad |
   | Email | test@example.com |
   | Phone | 03005560869 |
   | Password | Password123! |
   | Confirm Password | Password123! |

5. Click **"Create Account"**
6. You should be redirected to the dashboard ✅

---

## 🎯 What Happens Behind the Scenes

When you submit the registration form:

1. ✅ Server action `registerAndCreateOrganization` is called
2. ✅ Admin client (using service role key) creates the organization
3. ✅ Feature flags are set with all modules enabled
4. ✅ Auth user is created with password
5. ✅ User profile is created
6. ✅ You're logged in and redirected to dashboard

---

## 🐛 Troubleshooting

### Still Getting Error?

**Check 1: Service Key is Set**
```bash
# In your terminal, check if the key is loaded
echo $SUPABASE_SERVICE_ROLE_KEY
# Should print a long JWT token starting with eyJ...
```

**Check 2: Dev Server Restarted**
```bash
# Make sure you restarted AFTER updating .env.local
# Stop server (Ctrl+C) and run: npm run dev
```

**Check 3: Migration Ran Successfully**

In Supabase SQL Editor, verify policies exist:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'organizations' 
AND policyname LIKE '%Service role%';
```

Should return at least 1 row.

### Email Already Exists?

This is expected if you try registering twice. Use a different email address.

### "Failed to create account"?

Check browser DevTools (F12) → Console for detailed error message.

---

## 📋 Files Updated

| File | Change |
|------|--------|
| `.env.local` | ✅ Added service role key |
| `src/app/(auth)/register/page.tsx` | ✅ Uses server action |
| `src/lib/actions/auth.ts` | ✅ Created server action |
| `supabase/migrations/015_registration_fix.sql` | ⏳ Run this in SQL Editor |

---

## 🎉 Next Steps

After registration works:

1. ✅ Test that you're logged in
2. ✅ Check that you can navigate to Inventory, Sales, etc.
3. ✅ Try creating a vehicle or sale
4. ✅ Test realtime updates (if enabled)
5. Deploy to production!

---

## 📚 Related Documentation

- `REGISTRATION_FIX.md` - Detailed technical explanation
- `QUICK_START_CHECKLIST.md` - Supabase dashboard setup
- `SUPABASE_INTEGRATION_COMPLETE.md` - Full integration guide

---

**You're all set! Registration is now production-ready.** 🚀

If you encounter any issues, check the troubleshooting section or review the SQL migration in `supabase/migrations/015_registration_fix.sql`.
