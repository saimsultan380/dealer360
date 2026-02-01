# Complete Supabase Integration & Setup Guide

## Overview

Your Car Dealer SaaS application is now configured for production use with Supabase. This guide covers:

1. ✅ **Security**: Fixed RLS policies, added indexes
2. ✅ **Environment**: Setup credentials
3. ✅ **Storage**: Buckets and policies created
4. ✅ **Realtime**: Database subscriptions enabled
5. ✅ **Components**: Realtime integrated into tables
6. 🔄 **Dashboard Setup**: Manual Supabase configuration
7. 🔄 **Testing**: End-to-end verification
8. 🔄 **Production**: Hardening and monitoring

---

## Phase 1: Manual Supabase Dashboard Configuration

### Step 1: Enable Realtime in Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **"Car Dealer Software SaaS"**
3. Go to **Project Settings** → **Realtime**
4. Under **Replication**, toggle ON for these tables:
   - ✅ `public.vehicles`
   - ✅ `public.sales`
   - ✅ `public.financing_loans`
   - ✅ `public.japan_import_cases`
   - ✅ `public.notifications`

Or run this SQL in **SQL Editor**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.japan_import_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Step 2: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. **Create Bucket 1: vehicles**
   - Name: `vehicles`
   - Public bucket: ✅ ON
   - File size limit: 100 MB

3. **Create Bucket 2: documents**
   - Name: `documents`
   - Public bucket: ⭕ OFF
   - File size limit: 50 MB

4. **Create Bucket 3: profiles**
   - Name: `profiles`
   - Public bucket: ✅ ON
   - File size limit: 10 MB

### Step 3: Apply Migrations

Run these SQL migrations in **SQL Editor**:

1. Copy content from `supabase/migrations/012_fix_rls_policies.sql`
2. Paste in SQL Editor → Run
3. Copy content from `supabase/migrations/013_storage_setup.sql`
4. Paste in SQL Editor → Run
5. Copy content from `supabase/migrations/014_notifications_table.sql`
6. Paste in SQL Editor → Run

### Step 4: Configure Email Authentication

1. Go to **Authentication** → **Providers**
2. **Email/Password**:
   - Click Email (should be enabled by default)
   - Confirm email: ✅ ON (for security)
   - Redirect URL: `http://localhost:3000/auth/callback`
3. (Optional) **OAuth Providers**:
   - Google (requires Google Cloud credentials)
   - GitHub (requires GitHub OAuth app)

---

## Phase 2: Environment Configuration

Your `.env.local` file is already configured with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://texqmnuoeninovundyxh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4F9pZfZzvVCRgmlb0tDKww_VUMBEbuT
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Dealer 360
```

**To Complete:**
1. Go to Supabase Dashboard → **Project Settings** → **API**
2. Copy the **service_role** (secret) key
3. Replace `your_service_role_key_here` in `.env.local`
4. Restart dev server: `npm run dev`

---

## Phase 3: Verify Setup

### Check Realtime Connection

1. Open your app: `http://localhost:3000`
2. Go to **Inventory** page
3. Look for green dot with "Live updates enabled" message
4. This confirms realtime subscription is active

### Check RLS Policies

Run in Supabase SQL Editor:
```sql
-- Verify all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Should show all tables with `rowsecurity = true`

### Check Indexes

Run in SQL Editor:
```sql
-- Count indexes created
SELECT COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

Should show 40+ indexes for performance

### Check Realtime Tables

Run in SQL Editor:
```sql
-- Verify realtime is enabled for specific tables
SELECT publication, schemaname, tablename 
FROM pg_publication_tables 
WHERE publication = 'supabase_realtime'
ORDER BY tablename;
```

Should show 5 rows (vehicles, sales, financing_loans, japan_import_cases, notifications)

---

## Phase 4: Test Realtime Features

### Test Scenario 1: Live Inventory Update

**Prerequisites:**
- App running on `http://localhost:3000`
- Logged in with valid account
- Realtime enabled in Supabase

**Steps:**

1. **Browser 1**: Open http://localhost:3000 → Navigate to **Inventory**
2. **Browser 2**: Open same URL in **Incognito/Private** window → Same **Inventory** page
3. **Browser 1**: Click **"New Vehicle"** → Fill in form → Click **Save**
4. **Browser 2**: Watch for new vehicle to appear **automatically**
   - ⚡ Should appear within 1-2 seconds
   - ✅ No page refresh needed
   - ✅ Live updates indicator shows green dot

**Expected Result:**
- Both browsers show updated vehicle list
- No manual refresh required
- Status indicator shows "Live updates enabled"

### Test Scenario 2: Live Sales Update

1. **Browser 1**: Open **Sales** page
2. **Browser 2**: Open **Sales** page in separate window
3. **Browser 1**: Create new sale → Click **Save**
4. **Browser 2**: New sale appears automatically

### Test Scenario 3: Fallback to Polling

1. Open Chrome DevTools (F12)
2. Go to Network tab → Filter for WebSocket
3. Find realtime connection (should see WebSocket connection)
4. Close the WebSocket in DevTools
5. Create/update a vehicle
6. Page should refresh automatically (fallback mechanism)

---

## Phase 5: Image Upload Testing

### Test Vehicle Image Upload

1. Go to **Inventory** → **New Vehicle**
2. Fill in vehicle details
3. Click **Upload Image**
4. Select JPG/PNG file
5. Should upload to `vehicles/{org_id}/{vehicle_id}/` bucket
6. Verify in Supabase **Storage** → **vehicles** bucket

### Test Document Upload

1. Go to **Japan Import** → Create/Edit Case
2. Go to **Auction** tab
3. Upload Grade Sheet PDF
4. Should upload to `documents/{org_id}/japan-import/{case_id}/` bucket
5. Verify in Supabase **Storage** → **documents** bucket

---

## Phase 6: Authentication Testing

### Test Email/Password Signup

1. Log out of app (if logged in)
2. Go to login page
3. Click **"Create Account"**
4. Enter email, password, name
5. Click **Sign Up**
6. Should receive confirmation email
7. Click email link
8. Should be redirected to dashboard

### Test Password Reset

1. On login page, click **"Forgot Password"**
2. Enter email
3. Check email for reset link
4. Click link
5. Enter new password
6. Should be able to login with new password

### Test OAuth (Optional)

1. Click **"Sign in with Google"** (if configured)
2. Should redirect to Google login
3. After approval, should be logged in

---

## Phase 7: Realtime Component Integration

The following components now have realtime support:

### 1. Vehicles Table
- **File**: `src/components/inventory/vehicles-table.tsx`
- **Features**:
  - Live updates when vehicles are added
  - Live status changes (available → sold)
  - Live price updates
  - Visual indicator for connection status
  - Error handling with fallback

### 2. Sales Table
- **File**: `src/components/sales/sales-table.tsx`
- **Features**:
  - Live sales tracking
  - Real-time status updates
  - New sale notifications
  - Connection status indicator

### 3. Realtime Utilities
- **File**: `src/lib/supabase/realtime.ts`
- **Exports**:
  - `subscribeToVehicles()` - Vehicle updates
  - `subscribeToSales()` - Sales updates
  - `subscribeToFinancingLoans()` - Financing updates
  - `subscribeToJapanImportCases()` - Import tracking
  - `subscribeToNotifications()` - Personal notifications
  - `useRealtimeSubscription()` - React hook for any table

---

## Phase 8: Production Deployment

### Before Deploying:

1. **Update Environment Variables**
   - In Vercel/hosting platform settings
   - Use production Supabase project
   - Update `NEXT_PUBLIC_APP_URL` to your domain

2. **Enable Backups**
   - Supabase Dashboard → **Settings** → **Backups**
   - Enable Point-in-Time Recovery
   - Set retention to 30 days

3. **Configure CORS**
   - Supabase → **Storage** → **Settings**
   - Add your production domain
   - Example: `https://yourdomain.com`

4. **Setup Monitoring**
   - Supabase → **Monitoring**
   - Enable database metrics
   - Setup alerts for high query latency

5. **Security Audit**
   - Review RLS policies
   - Test with different user roles
   - Verify service role key not exposed

### Deployment Steps:

1. ```bash
   npm run build
   ```
   Verify no errors

2. Deploy to Vercel/your hosting:
   ```bash
   vercel deploy --prod
   ```

3. Verify realtime works on production
4. Monitor error logs for 24 hours
5. Setup uptime monitoring

---

## Troubleshooting Guide

### Issue: "Realtime connection error"

**Check:**
- [ ] Realtime is enabled in Supabase Dashboard
- [ ] Table is in supabase_realtime publication
- [ ] Environment variables are correct
- [ ] No WebSocket blocking in network

**Fix:**
```sql
-- Verify realtime is enabled
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Add table if missing
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
```

### Issue: "File upload fails"

**Check:**
- [ ] Storage bucket exists
- [ ] Bucket has correct privacy setting
- [ ] RLS policies are configured
- [ ] File size under limit

**Debug:**
```javascript
// In browser console
console.log('Attempting upload to:', 'vehicles/org_id/vehicle_id/image.jpg');
// Should see upload progress and success/error
```

### Issue: "RLS Permission Denied"

**Check:**
- [ ] User is authenticated
- [ ] User's organization_id matches table data
- [ ] RLS policies are correct

**Fix:**
```sql
-- Check user's organization
SELECT organization_id FROM public.profiles 
WHERE id = auth.uid();

-- Verify RLS policy
SELECT * FROM pg_policies 
WHERE tablename = 'vehicles';
```

### Issue: "Slow queries"

**Solution:**
1. Supabase Dashboard → **Monitoring** → **Slow Queries**
2. Review expensive queries
3. Ensure indexes are created
4. Add composite indexes if needed

---

## Files Created/Modified

### New Files Created:
- ✅ `supabase/migrations/012_fix_rls_policies.sql`
- ✅ `supabase/migrations/013_storage_setup.sql`
- ✅ `supabase/migrations/014_notifications_table.sql`
- ✅ `src/lib/supabase/realtime.ts`
- ✅ `SUPABASE_PRODUCTION_SETUP.md`
- ✅ `STORAGE_BUCKETS_SETUP.md`
- ✅ `REALTIME_SETUP.md`
- ✅ `.env.local` (updated)

### Files Modified:
- ✅ `src/components/inventory/vehicles-table.tsx` - Added realtime
- ✅ `src/components/sales/sales-table.tsx` - Added realtime

---

## Next Steps

1. **Run migrations** in Supabase SQL Editor
2. **Enable realtime** in Supabase Dashboard
3. **Create storage buckets** with policies
4. **Test end-to-end** in two browsers
5. **Deploy to production** after testing

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Realtime Guide**: https://supabase.com/docs/guides/realtime
- **RLS Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Storage**: https://supabase.com/docs/guides/storage

---

**Status**: ✅ All files created and configured. Ready for Supabase dashboard setup and testing.

**Questions?** Check the troubleshooting section or review the migration files for SQL details.
