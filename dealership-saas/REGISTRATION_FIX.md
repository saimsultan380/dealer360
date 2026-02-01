# Registration Fix - Service Role Configuration

## Problem

When registering a new dealership, the error message appears:
```
Failed to create organization. Please try again.
```

This happens because:
1. The registration page was trying to insert directly into the `organizations` table from the client
2. RLS policies prevent unauthenticated users from inserting
3. The error wasn't properly displayed to the user

## Solution

### Part 1: Updated Registration Page ✅

The registration page now uses a **server action** instead of direct client calls:

**File**: `src/app/(auth)/register/page.tsx`

Changes:
- Import `registerAndCreateOrganization` server action
- Call the server action instead of direct Supabase calls
- Better error handling and display

### Part 2: New Server Action ✅

**File**: `src/lib/actions/auth.ts`

Creates a new server action that:
1. Uses admin client (service role) to bypass RLS
2. Creates organization with proper defaults
3. Creates auth user
4. Creates profile
5. Handles rollbacks on error
6. Returns clear success/error messages

### Part 3: Database RLS Policies ⏳ 

**File**: `supabase/migrations/015_registration_fix.sql`

This migration updates RLS policies to:
1. Allow service role to create organizations
2. Allow service role to create profiles
3. Maintain security by restricting regular users

## Required Steps

### Step 1: Copy Service Role Key

1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy the **service_role** key (labeled "Secret")
4. Update `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Step 2: Run Migration

1. Open Supabase SQL Editor
2. Copy content from `supabase/migrations/015_registration_fix.sql`
3. Paste in SQL Editor
4. Click Run

### Step 3: Restart Dev Server

```bash
npm run dev
```

### Step 4: Test Registration

1. Open http://localhost:3000
2. Click "Sign up" or go to `/register`
3. Fill in the form:
   - Dealership Name: `Taqwa Motors`
   - Full Name: `Muhammad Tariq`
   - City: `Islamabad`
   - Email: `test@example.com`
   - Phone: `03005560869`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Create Account"
5. Should be redirected to dashboard (or see auth verification message)

## Troubleshooting

### Still Getting Error After Migration

**Check 1: Service Role Key**
```bash
echo $SUPABASE_SERVICE_ROLE_KEY
# Should print the key, not empty
```

**Check 2: Restart Dev Server**
```bash
# Stop the server (Ctrl+C)
# Clear .next cache
rm -rf .next

# Restart
npm run dev
```

**Check 3: Verify RLS Policies**

Run in Supabase SQL Editor:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'organizations' 
AND policyname LIKE '%Service role%';
```

Should return 1 row.

### Email Already Exists Error

This is expected - you can't register twice with the same email. Try with a different email address.

### Organization Creation Still Fails

1. Check Supabase logs for detailed error:
   - Dashboard → Logs → Edge Functions or API
2. Verify `feature_flags` column is JSONB type:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'organizations' 
   AND column_name = 'feature_flags';
   ```

## Security Notes

- Service role key is never exposed to frontend (only in `.env` which is server-only)
- Once user is created, all subsequent operations use user's auth token
- RLS policies enforce organization isolation
- Admin role required for sensitive operations

## Files Updated

1. ✅ `src/app/(auth)/register/page.tsx` - Use server action
2. ✅ `src/lib/actions/auth.ts` - New server action
3. ⏳ `supabase/migrations/015_registration_fix.sql` - RLS policies

## Next Steps

1. Add service role key to `.env.local`
2. Run migration in Supabase
3. Restart dev server
4. Test registration with new account
5. Deploy to production

---

**Status**: Ready for implementation
**Estimated Time**: 5 minutes
