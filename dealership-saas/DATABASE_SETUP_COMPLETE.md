# Complete Database Setup Guide

## ⚠️ Important: Don't Use Minimal SQL

Your current SQL script is **too minimal** and will break the application. You need the **full schema** with all tables, RLS policies, and helper functions.

---

## ✅ Correct Setup Process

### Option 1: Run Full Schema (Recommended for New Database)

If this is a **fresh database**, run the complete schema:

1. **Open Supabase SQL Editor**
2. **Copy the entire content** from: `supabase/schema.sql`
3. **Paste and Run** in SQL Editor
4. This creates ALL tables with proper structure

### Option 2: Run Migrations in Order (If Database Already Exists)

If you already have some tables, run migrations in order:

1. **Migration 002**: `supabase/migrations/002_super_admin.sql`
   - Adds super_admin role support
   - Creates helper functions

2. **Migration 003**: `supabase/migrations/003_inventory_rls.sql`
   - Adds RLS policies for inventory

3. **Migration 004-011**: Run all other migrations in order
   - Each adds specific features

4. **Migration 012**: `supabase/migrations/012_fix_rls_policies.sql`
   - Fixes RLS on documents and vehicle_images
   - Adds performance indexes

5. **Migration 013**: `supabase/migrations/013_storage_setup.sql`
   - Documents storage setup (read-only guide)

6. **Migration 014**: `supabase/migrations/014_notifications_table.sql`
   - Creates notifications table

7. **Migration 015**: `supabase/migrations/015_registration_fix.sql`
   - Fixes registration RLS policies

---

## ❌ What's Wrong With Your Current SQL

### 1. Missing Organizations Table
```sql
-- Your code: MISSING
-- Required: organizations table must exist FIRST
-- profiles.organization_id references organizations(id)
```

### 2. Incomplete Profiles Table
```sql
-- Your code:
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  organization_id uuid not null,  -- ❌ No foreign key!
  created_at timestamptz default now()
);

-- Required (from schema.sql):
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,  -- ✅ Has FK
  email TEXT,
  full_name TEXT NOT NULL,  -- ❌ Missing in your code
  avatar_url TEXT,          -- ❌ Missing
  phone TEXT,               -- ❌ Missing
  role TEXT DEFAULT 'salesperson' CHECK (role IN (...)),  -- ❌ Missing
  is_active BOOLEAN DEFAULT TRUE,  -- ❌ Missing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- ❌ Missing
);
```

### 3. Missing RLS (Row Level Security)
```sql
-- Your code: ❌ No RLS policies
-- Required: Every table needs RLS enabled + policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view profiles in their organization" ...
```

### 4. Missing Helper Functions
```sql
-- Your code: ❌ No helper functions
-- Required:
CREATE OR REPLACE FUNCTION public.get_auth_org_id() ...
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT) ...
```

### 5. Missing Other Tables
Your code only has 4 tables. The app needs:
- ✅ organizations
- ✅ profiles
- ✅ vehicles
- ✅ vehicle_images
- ✅ documents
- ❌ **Missing**: sales, financing_loans, leads, deals, clients, investors, cash_flow, ledger, japan_import_cases, etc.

---

## 🚀 Quick Fix: Run Complete Schema

### Step 1: Clear Existing Tables (If Needed)

**⚠️ WARNING: This deletes all data!**

```sql
-- Only run if you want to start fresh
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.vehicle_images CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
```

### Step 2: Run Full Schema

1. Open `supabase/schema.sql` in your editor
2. Copy **ALL** content (530+ lines)
3. Paste in Supabase SQL Editor
4. Click **Run**

This creates:
- ✅ Organizations table
- ✅ Complete profiles table
- ✅ Complete vehicles table
- ✅ Complete vehicle_images table
- ✅ Complete documents table
- ✅ All other required tables
- ✅ RLS policies
- ✅ Helper functions
- ✅ Indexes

### Step 3: Run Migrations

After schema.sql, run migrations in order:
1. `002_super_admin.sql`
2. `003_inventory_rls.sql`
3. ... (all others)
4. `015_registration_fix.sql`

---

## ✅ Verify Setup

After running schema.sql, verify:

```sql
-- Check organizations table exists
SELECT COUNT(*) FROM public.organizations;

-- Check profiles has all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'vehicles', 'organizations');

-- Check helper functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_auth_org_id', 'has_role');
```

---

## 📋 Complete Table List

Your application needs these tables:

1. ✅ `organizations` - Multi-tenant organizations
2. ✅ `profiles` - User profiles
3. ✅ `vehicles` - Inventory
4. ✅ `vehicle_images` - Vehicle photos
5. ✅ `documents` - File storage
6. ✅ `sales` - Sales records
7. ✅ `financing_loans` - Financing
8. ✅ `leads` - Customer leads
9. ✅ `deals` - Deals tracking
10. ✅ `clients` - Customer database
11. ✅ `investors` - Investor management
12. ✅ `cash_flow` - Cash flow entries
13. ✅ `ledger` - Accounting ledger
14. ✅ `japan_import_cases` - Japan import tracking
15. ✅ `japan_import_documents` - Import documents
16. ✅ `japan_import_shipments` - Shipment tracking
17. ✅ `japan_import_customs` - Customs clearance
18. ✅ `japan_import_inspections` - Inspections
19. ✅ `japan_import_auctions` - Auction details
20. ✅ `japan_import_costing` - Costing calculator
21. ✅ `notifications` - Real-time notifications
22. ✅ `staff` - Staff management
23. ✅ `payments` - Payment records

**Your SQL only creates 4 tables - you're missing 19+ tables!**

---

## 🎯 Recommended Action

**DO THIS:**

1. ✅ Open `supabase/schema.sql`
2. ✅ Copy entire file (all 530+ lines)
3. ✅ Paste in Supabase SQL Editor
4. ✅ Click Run
5. ✅ Then run migrations 002-015 in order

**DON'T DO THIS:**

❌ Don't run your minimal SQL script
❌ Don't create tables manually
❌ Don't skip RLS policies

---

## 🔍 Check Your Current State

Run this to see what you have:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if organizations exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'organizations'
) as has_organizations;
```

If `has_organizations = false`, you **must** run the full schema!

---

## 📞 Need Help?

If you get errors:
1. Check Supabase SQL Editor error messages
2. Verify you're running schema.sql first
3. Then run migrations in order
4. Check that all tables exist using the verification queries above

---

**Bottom Line:** Your minimal SQL won't work. Use `supabase/schema.sql` + migrations instead!
