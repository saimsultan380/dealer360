# Supabase Production Setup Guide

## Step 1: Get Your Supabase Credentials

### From your Supabase Dashboard:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - `Project URL` (marked as NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (marked as NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role` key (marked as SUPABASE_SERVICE_ROLE_KEY)

### Screenshot References:
- **API Settings**: Look for "Project URL" and keys in Settings → API
- **Connection String**: PostgreSQL details are in Database section

---

## Step 2: Create `.env.local` File

Create a file named `.env.local` in the root of your project (`dealership-saas/.env.local`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Dealer 360

# Optional (development only)
NEXT_PUBLIC_DEV_BYPASS_AUTH=false
```

### Replace These Values:
- `YOUR_PROJECT_ID`: Found in your Supabase URL
- `YOUR_ANON_KEY_HERE`: Copy from "anon public" key
- `YOUR_SERVICE_ROLE_KEY_HERE`: Copy from "service_role" key

---

## Step 3: Verify Your Credentials

After creating `.env.local`, restart your development server:

```bash
npm run dev
```

You should see no errors related to Supabase connection.

---

## Step 4: Storage Buckets Setup

1. Go to Supabase Dashboard → **Storage**
2. Click **Create a new bucket** for each:

### Bucket 1: `vehicles`
- **Name**: `vehicles`
- **Public bucket**: Yes (toggle ON)
- **File size limit**: 100 MB
- Click **Create bucket**

### Bucket 2: `documents`
- **Name**: `documents`
- **Public bucket**: No (toggle OFF)
- **File size limit**: 50 MB
- Click **Create bucket**

### Bucket 3: `profiles`
- **Name**: `profiles`
- **Public bucket**: Yes (toggle ON)
- **File size limit**: 10 MB
- Click **Create bucket**

---

## Step 5: Configure Storage Policies

For each bucket, click **Edit Policies**:

### For `vehicles` Bucket (Public):

Add policies:
1. **SELECT** - Everyone can view:
   - Authentication: No user required
   - Policy: `true`

2. **INSERT** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'vehicles')`

3. **UPDATE** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'vehicles')`

4. **DELETE** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'vehicles')`

### For `documents` Bucket (Private):

Add policies:
1. **SELECT** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'documents')`

2. **INSERT** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'documents')`

3. **UPDATE** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'documents')`

4. **DELETE** - Authenticated users:
   - Authentication: User required
   - Policy: `(bucket_id = 'documents')`

### For `profiles` Bucket (Public):

Add policies:
1. **SELECT** - Everyone can view:
   - Authentication: No user required
   - Policy: `true`

2. **INSERT** - Users can upload their own:
   - Authentication: User required
   - Policy: `(bucket_id = 'profiles')`

3. **UPDATE** - Users can update their own:
   - Authentication: User required
   - Policy: `(bucket_id = 'profiles')`

4. **DELETE** - Users can delete their own:
   - Authentication: User required
   - Policy: `(bucket_id = 'profiles')`

---

## Step 6: Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email**:
   - Toggle ON
   - Confirm signup: **Require email confirmation** (optional)
   - Auto confirm: Toggle OFF for production

3. (Optional) Enable **Google OAuth**:
   - Click **Google**
   - Add your OAuth credentials from Google Cloud Console

4. (Optional) Enable **GitHub OAuth**:
   - Click **GitHub**
   - Add your OAuth credentials from GitHub

---

## Step 7: Enable Realtime

1. Go to **Realtime** in Project Settings
2. For each table, enable updates:
   - `public.vehicles`
   - `public.sales`
   - `public.financing_loans`
   - `public.japan_import_cases`
   - `public.notifications`

Or run this SQL in Supabase Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financing_loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.japan_import_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

---

## Step 8: Apply Migrations

Run migrations in Supabase SQL Editor:

1. Open **SQL Editor** in Supabase Dashboard
2. Copy-paste each migration file and run:
   - `supabase/migrations/012_fix_rls_policies.sql`
   - `supabase/migrations/013_storage_setup.sql`
   - `supabase/migrations/014_notifications_table.sql`

Or via Supabase CLI:
```bash
supabase db push
```

---

## Step 9: Configure Email Templates (Optional)

Go to **Authentication** → **Email Templates** to customize:
- Confirmation link email
- Password reset email
- Magic link email

---

## Step 10: Backup & Monitoring

1. **Backups**: Settings → **Backups** → Enable Point-in-Time Recovery
2. **Monitoring**: Go to **Monitoring** tab to track:
   - Database performance
   - Storage usage
   - API requests

---

## Troubleshooting

### Issue: "Row Level Security" errors
- **Fix**: Check that RLS is ENABLED on all tables
- Run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`

### Issue: File uploads not working
- **Fix**: Verify bucket is created and has correct policies
- Check file size is under bucket limit

### Issue: Realtime not updating
- **Fix**: Ensure table is enabled in Realtime settings
- Restart your application

### Issue: Authentication errors
- **Fix**: Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
- Check Email provider is enabled

---

## Environment Variables Checklist

- [ ] `.env.local` created in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set correctly
- [ ] Dev server restarted after changes
- [ ] No connection errors in console

---

## Next Steps

After setup is complete:
1. Proceed to Phase 3: Image Storage Setup
2. Test file uploads with sample vehicle images
3. Configure Realtime subscriptions
4. Run end-to-end tests

---

**Questions?** Check [Supabase Docs](https://supabase.com/docs) or review the code comments in migration files.
