-- =============================================================================
-- FIX SCRIPT - Run this on an EXISTING database
-- =============================================================================
-- Use when: You already have tables (e.g. profiles, organizations). Do NOT use
-- on a fresh DB — use FULL_SCHEMA.sql for that.
-- =============================================================================
-- Fixes: role column missing, "role" reserved word, super_admin access, policies.
-- Safe to run multiple times (uses IF NOT EXISTS, CREATE OR REPLACE, DROP IF EXISTS).
-- =============================================================================

-- Guard: require profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'Table public.profiles does not exist. Run FULL_SCHEMA.sql on a fresh database first.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- STEP 1: Ensure profiles core columns exist
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'salesperson';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- -----------------------------------------------------------------------------
-- STEP 2: Update role constraint to include super_admin
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'salesperson', 'accountant'));

-- -----------------------------------------------------------------------------
-- STEP 3: Fix has_role function (use alias to avoid reserved word conflict)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = required_role
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- STEP 4: Fix/Create is_super_admin function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- STEP 5: Fix get_auth_org_id function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
  SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- STEP 6: Critical - Users must be able to view their OWN profile
-- (Needed for middleware to check role, especially for super_admin)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- STEP 7: Service role can insert profiles (for registration)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- STEP 8: Super admin policies for profiles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can create profiles" ON public.profiles;
CREATE POLICY "Super admin can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
CREATE POLICY "Super admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- STEP 9: Organizations policies (only if table exists)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    -- Add feature_flags column if missing
    ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
      "max_vehicles": 100,
      "max_users": 10,
      "enable_documents": true,
      "enable_leads": true,
      "enable_deals": true,
      "enable_analytics": true
    }'::jsonb;

    -- Drop all org policies we manage, then recreate (safe to re-run)
    DROP POLICY IF EXISTS "Service role can create organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
    DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;

    -- Service role can create organizations
    CREATE POLICY "Service role can create organizations"
      ON public.organizations FOR INSERT
      WITH CHECK (true);

    -- Users can view their organization
    CREATE POLICY "Users can view their organization"
      ON public.organizations FOR SELECT
      USING (id IN (
        SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
      ));

    -- Admins can update their organization
    CREATE POLICY "Admins can update their organization"
      ON public.organizations FOR UPDATE
      USING (id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      ))
      WITH CHECK (id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      ));

    -- Super admin policies
    DROP POLICY IF EXISTS "Super admin can view all organizations" ON public.organizations;
    CREATE POLICY "Super admin can view all organizations"
      ON public.organizations FOR SELECT
      USING (public.is_super_admin());

    DROP POLICY IF EXISTS "Super admin can create organizations" ON public.organizations;
    CREATE POLICY "Super admin can create organizations"
      ON public.organizations FOR INSERT
      WITH CHECK (public.is_super_admin());

    DROP POLICY IF EXISTS "Super admin can update any organization" ON public.organizations;
    CREATE POLICY "Super admin can update any organization"
      ON public.organizations FOR UPDATE
      USING (public.is_super_admin());

    DROP POLICY IF EXISTS "Super admin can delete organizations" ON public.organizations;
    CREATE POLICY "Super admin can delete organizations"
      ON public.organizations FOR DELETE
      USING (public.is_super_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- STEP 10: Platform stats view (only if all required tables exist)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals')
  THEN
    EXECUTE 'DROP VIEW IF EXISTS public.platform_stats';
    EXECUTE $v$
      CREATE VIEW public.platform_stats AS
      SELECT
        (SELECT COUNT(*) FROM public.organizations) AS total_organizations,
        (SELECT COUNT(*) FROM public.organizations WHERE subscription_status = 'active') AS active_subscriptions,
        (SELECT COUNT(*) FROM public.profiles p WHERE p.role != 'super_admin') AS total_users,
        (SELECT COUNT(*) FROM public.vehicles) AS total_vehicles,
        (SELECT COUNT(*) FROM public.leads) AS total_leads,
        (SELECT COUNT(*) FROM public.deals) AS total_deals,
        (SELECT COUNT(*) FROM public.deals WHERE status = 'completed') AS completed_deals,
        (SELECT COALESCE(SUM(sale_price), 0) FROM public.deals WHERE status = 'completed') AS total_revenue
    $v$;
    GRANT SELECT ON public.platform_stats TO authenticated;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- STEP 11: Grant permissions on functions
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO authenticated, anon;

-- -----------------------------------------------------------------------------
-- STEP 12: Add useful indexes if missing
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- =============================================================================
-- DONE! All fixes applied.
-- =============================================================================
-- Next: Run SET_SUPER_ADMIN.sql to set your user as super_admin (uses auth.users
-- email, so works even if profiles.email is missing). Then log out, log in, /admin.
-- =============================================================================
