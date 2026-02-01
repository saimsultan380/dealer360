# How to Access Admin Dashboard - Fix Guide

## Problem
When you try to access `http://localhost:3000/admin`, you get redirected to `/dashboard` or see an error.

## Root Cause
The middleware checks if your user has `role = 'super_admin'`. If not, you're redirected.

**If you already set your role to `super_admin` but still get redirected:** Row-level security (RLS) on `profiles` was preventing the middleware from reading your profile. Super admins have `organization_id = NULL`; the policy "Users can view profiles in their organization" uses `organization_id = get_auth_org_id()`, and `NULL = NULL` is not true in SQL, so your row was hidden. **Fix:** Run migration `016_profiles_view_own.sql` (see [Solution 0](#solution-0-run-migration-016-profiles-view-own) below).

---

## Solution 0: Run the fix script

If you hit **"column role does not exist"** when running schema/migrations, or you **already** set your profile to `super_admin` but still see "Admin access required", run the combined fix **once**:

1. Open **Supabase Dashboard → SQL Editor**
2. Open `supabase/RUN_THIS_IN_SQL_EDITOR.sql` in your project, **copy all of it**, paste into the editor, and **Run**.
3. Log out, log back in, then open `/admin` again.

That single file fixes:
- The `role` reserved-word issue (has_role, is_super_admin functions)
- Adds "Users can view own profile" policy (so middleware can read your profile)
- Updates role constraint to include `super_admin`
- Adds super admin RLS policies

**For a fresh database:** Use `supabase/FULL_SCHEMA.sql` instead (includes everything from scratch).

---

## Solution 1: Make Your User a Super Admin (Recommended)

### Step 1: Find Your User ID
1. Open Supabase Dashboard → **Authentication** → **Users**
2. Find your email address
3. Copy your **User ID** (UUID)

### Step 2: Update Your Role
1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL (replace `YOUR-USER-ID` with the UUID from Step 1):

```sql
-- Update your profile to super_admin
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE id = 'YOUR-USER-ID';
```

**OR** if you know your email:

```sql
-- Update by email
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

### Step 3: Verify
Run this to check:

```sql
SELECT id, email, role, organization_id 
FROM public.profiles 
WHERE email = 'your-email@example.com';
```

Should show `role = 'super_admin'`

### Step 4: Access Admin
1. **Log out** from your app
2. **Log back in**
3. Go to: `http://localhost:3000/admin`
4. ✅ Should work now!

---

## Solution 2: Check if Profile Exists

If you get "No organization found" or profile doesn't exist:

### Create Profile for Existing User

```sql
-- First, get your auth user ID from Supabase Dashboard → Authentication → Users
-- Then run:

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  organization_id
)
VALUES (
  'YOUR-AUTH-USER-ID',  -- From Supabase Auth → Users
  'your-email@example.com',
  'Your Name',
  'super_admin',
  true,
  NULL  -- Super admin has no organization
)
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin';
```

---

## Solution 3: Temporary Bypass (Development Only)

If you just want to test the admin page without authentication:

1. Open `.env.local`
2. Make sure this line exists:
   ```env
   NEXT_PUBLIC_DEV_BYPASS_AUTH=true
   ```
3. Restart dev server: `npm run dev`
4. Access `/admin` - should work without auth

**⚠️ WARNING:** Only use this in development! Never in production.

---

## Solution 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try accessing `/admin`
4. Look for error messages
5. Share the error if you see one

---

## Quick Test Query

Run this in Supabase SQL Editor to see all super admins:

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  organization_id
FROM public.profiles
WHERE role = 'super_admin';
```

If this returns 0 rows, you need to create/update a super admin.

---

## Common Issues

### Issue: "Redirected to /dashboard" or "Admin access required" (but my role is super_admin)
**Fix:** Run **Solution 0** (`RUN_THIS_IN_SQL_EDITOR.sql`) so the middleware can read your profile. If your role truly isn’t `super_admin`, use Solution 1. You’ll also see an “Admin access required” banner on the dashboard when redirected from `/admin`.

### Issue: "No organization found"
**Fix:** Your profile might be missing. Use Solution 2.

### Issue: "404 Not Found"
**Fix:** 
- Check if `src/app/(admin)/admin/page.tsx` exists
- Restart dev server: `npm run dev`

### Issue: "Unauthorized"
**Fix:** 
- Make sure you're logged in
- Check your profile exists in `profiles` table
- Verify role is `super_admin`

---

## Verify Everything Works

After updating your role:

1. ✅ Log out
2. ✅ Log back in
3. ✅ Check URL - should auto-redirect to `/admin` if you're super_admin
4. ✅ Or manually go to `http://localhost:3000/admin`
5. ✅ Should see "Platform Overview" dashboard

---

## Still Not Working?

1. **Run `supabase/RUN_THIS_IN_SQL_EDITOR.sql`** (Solution 0) in the Supabase SQL Editor if you haven’t — fixes the role error and super_admin access.
2. Check browser console for errors (F12)
3. Check terminal where `npm run dev` is running for errors
4. Verify your profile in Supabase:
   ```sql
   SELECT * FROM public.profiles WHERE email = 'your-email@example.com';
   ```
5. Ensure your user has `role = 'super_admin'` (Solution 1) and that the schema/migrations have been applied (or use the combined fix above)

---

**Quick Command to Check Your Role:**

```sql
-- Replace with your email
SELECT email, role, is_active 
FROM public.profiles 
WHERE email = 'your-email@example.com';
```

If `role` is not `'super_admin'`, update it using Solution 1.
