# Storage Buckets Setup Instructions

## Overview

This document provides step-by-step instructions to set up and configure the three storage buckets required for the Car Dealer SaaS application.

## Buckets to Create

1. **vehicles** - Public vehicle images (100 MB limit)
2. **documents** - Private sensitive documents (50 MB limit)
3. **profiles** - Public user profile pictures (10 MB limit)

---

## Complete Setup Process

### Step 1: Access Supabase Storage

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **"Car Dealer Software SaaS"**
3. Click **Storage** in the left sidebar

### Step 2: Create `vehicles` Bucket

1. Click **Create a new bucket**
2. Enter these details:
   - **Bucket name**: `vehicles`
   - **Privacy**: Toggle **Public bucket** to ON (green)
   - **File size limit**: 100 MB
3. Click **Create bucket**

#### RLS Policies for `vehicles`:

Once created, click **vehicles** bucket → **Edit policies**

**Policy 1: SELECT (Anyone)**
```sql
true
```
- Select "No user required"

**Policy 2: INSERT (Authenticated)**
```sql
(bucket_id = 'vehicles')
```
- Select "User is required"

**Policy 3: UPDATE (Authenticated)**
```sql
(bucket_id = 'vehicles')
```
- Select "User is required"

**Policy 4: DELETE (Authenticated)**
```sql
(bucket_id = 'vehicles')
```
- Select "User is required"

### Step 3: Create `documents` Bucket

1. Click **Create a new bucket**
2. Enter these details:
   - **Bucket name**: `documents`
   - **Privacy**: Keep **Public bucket** OFF (toggle stays left/gray)
   - **File size limit**: 50 MB
3. Click **Create bucket**

#### RLS Policies for `documents`:

Once created, click **documents** bucket → **Edit policies**

**Policy 1: SELECT (Authenticated)**
```sql
(bucket_id = 'documents')
```
- Select "User is required"

**Policy 2: INSERT (Authenticated)**
```sql
(bucket_id = 'documents')
```
- Select "User is required"

**Policy 3: UPDATE (Authenticated)**
```sql
(bucket_id = 'documents')
```
- Select "User is required"

**Policy 4: DELETE (Authenticated)**
```sql
(bucket_id = 'documents')
```
- Select "User is required"

### Step 4: Create `profiles` Bucket

1. Click **Create a new bucket**
2. Enter these details:
   - **Bucket name**: `profiles`
   - **Privacy**: Toggle **Public bucket** to ON (green)
   - **File size limit**: 10 MB
3. Click **Create bucket**

#### RLS Policies for `profiles`:

Once created, click **profiles** bucket → **Edit policies**

**Policy 1: SELECT (Anyone)**
```sql
true
```
- Select "No user required"

**Policy 2: INSERT (Authenticated)**
```sql
(bucket_id = 'profiles')
```
- Select "User is required"

**Policy 3: UPDATE (Authenticated)**
```sql
(bucket_id = 'profiles')
```
- Select "User is required"

**Policy 4: DELETE (Authenticated)**
```sql
(bucket_id = 'profiles')
```
- Select "User is required"

---

## Verify Setup

After creating all buckets and policies:

1. Go to **Storage** page
2. You should see three buckets:
   - ✅ `vehicles` (Public)
   - ✅ `documents` (Private)
   - ✅ `profiles` (Public)

---

## File Organization

Your application uses this folder structure:

```
vehicles/
  └─ {organization_id}/
     └─ {vehicle_id}/
        ├─ image_1.jpg
        ├─ image_2.jpg
        └─ image_3.jpg

documents/
  └─ {organization_id}/
     ├─ japan-import/
     │  └─ {import_case_id}/
     │     ├─ grade_sheet.pdf
     │     └─ shipment_docs.pdf
     └─ {entity_type}/
        └─ {entity_id}/
           └─ document.pdf

profiles/
  └─ {user_id}/
     └─ avatar.jpg
```

---

## Testing Storage Upload/Download

### Test Upload (in your app):

1. Go to **Inventory** → **New Vehicle**
2. Upload a vehicle image
3. Check Supabase **Storage** → **vehicles** bucket to verify file appears

### Test Download:

1. View vehicle on Inventory page
2. Image should display (auto-served from CDN)
3. Check browser Network tab to verify CDN URL

### Test Document Upload:

1. Go to **Japan Import** → Create/Edit case
2. Upload a grade sheet PDF
3. Check Supabase **Storage** → **documents** bucket

---

## CORS Configuration (Optional)

If you encounter CORS errors with file downloads:

1. Go to **Storage** → **Settings**
2. Add your app URL to **Allowed origins**:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

---

## Troubleshooting

### Issue: "Access Denied" when uploading
- **Check**: RLS policies are correctly set
- **Check**: User is authenticated
- **Fix**: Verify bucket name matches exactly

### Issue: Can't view uploaded images
- **Check**: Bucket is set to Public
- **Check**: CORS is configured
- **Fix**: Try direct CDN URL: `https://texqmnuoeninovundyxh.supabase.co/storage/v1/object/public/vehicles/...`

### Issue: File size limit exceeded
- **Check**: File is under bucket limit (100MB for vehicles, 50MB for documents)
- **Fix**: Resize image or compress PDF

### Issue: Wrong file appears
- **Check**: Organization ID matches in file path
- **Fix**: Verify folder structure matches code

---

## Storage URL Format

Once files are uploaded, they can be accessed at:

```
https://texqmnuoeninovundyxh.supabase.co/storage/v1/object/public/vehicles/{path}
```

This URL format is used in:
- `src/lib/actions/inventory.ts` - Vehicle image uploads
- `src/lib/actions/japan-import.ts` - Document/grade sheet uploads
- Vehicle display components

---

## Next Steps

1. ✅ Create all three buckets
2. ✅ Configure RLS policies
3. ✅ Test upload/download
4. → Proceed to Phase 4: Realtime Configuration
5. → Test file uploads in the app

---

**Note**: For production, update CORS allowed origins with your actual domain URL.
