-- =============================================================================
-- SUPER ADMIN MODULE - DATABASE MIGRATION
-- =============================================================================
-- Run this migration AFTER the initial schema.sql
-- =============================================================================

-- =============================================================================
-- UPDATE ROLE ENUM TO INCLUDE SUPER_ADMIN
-- =============================================================================

-- Drop and recreate the check constraint on profiles.role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'salesperson', 'accountant'));

-- =============================================================================
-- ADD FEATURE FLAGS TO ORGANIZATIONS
-- =============================================================================

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
  "max_vehicles": 100,
  "max_users": 10,
  "enable_documents": true,
  "enable_leads": true,
  "enable_deals": true,
  "enable_analytics": true
}'::jsonb;

-- =============================================================================
-- HELPER FUNCTION: CHECK IF USER IS SUPER ADMIN
-- =============================================================================
-- Note: "role" is reserved in PostgreSQL; use alias p.role.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================================
-- SUPER ADMIN RLS POLICIES
-- =============================================================================

-- Organizations: Super Admin can view ALL organizations
DROP POLICY IF EXISTS "Super admin can view all organizations" ON public.organizations;
CREATE POLICY "Super admin can view all organizations"
  ON public.organizations FOR SELECT
  USING (public.is_super_admin());

-- Organizations: Super Admin can create organizations
DROP POLICY IF EXISTS "Super admin can create organizations" ON public.organizations;
CREATE POLICY "Super admin can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Organizations: Super Admin can update any organization
DROP POLICY IF EXISTS "Super admin can update any organization" ON public.organizations;
CREATE POLICY "Super admin can update any organization"
  ON public.organizations FOR UPDATE
  USING (public.is_super_admin());

-- Organizations: Super Admin can delete organizations
DROP POLICY IF EXISTS "Super admin can delete organizations" ON public.organizations;
CREATE POLICY "Super admin can delete organizations"
  ON public.organizations FOR DELETE
  USING (public.is_super_admin());

-- Profiles: Super Admin can view all profiles
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

-- Profiles: Super Admin can create profiles (for onboarding)
DROP POLICY IF EXISTS "Super admin can create profiles" ON public.profiles;
CREATE POLICY "Super admin can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Profiles: Super Admin can update any profile
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
CREATE POLICY "Super admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin());

-- Vehicles: Super Admin can view all vehicles
DROP POLICY IF EXISTS "Super admin can view all vehicles" ON public.vehicles;
CREATE POLICY "Super admin can view all vehicles"
  ON public.vehicles FOR SELECT
  USING (public.is_super_admin());

-- Leads: Super Admin can view all leads
DROP POLICY IF EXISTS "Super admin can view all leads" ON public.leads;
CREATE POLICY "Super admin can view all leads"
  ON public.leads FOR SELECT
  USING (public.is_super_admin());

-- Deals: Super Admin can view all deals
DROP POLICY IF EXISTS "Super admin can view all deals" ON public.deals;
CREATE POLICY "Super admin can view all deals"
  ON public.deals FOR SELECT
  USING (public.is_super_admin());

-- Payments: Super Admin can view all payments
DROP POLICY IF EXISTS "Super admin can view all payments" ON public.payments;
CREATE POLICY "Super admin can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_super_admin());

-- =============================================================================
-- PLATFORM STATS VIEW (for Super Admin dashboard)
-- =============================================================================

CREATE OR REPLACE VIEW public.platform_stats AS
SELECT
  (SELECT COUNT(*) FROM public.organizations) as total_organizations,
  (SELECT COUNT(*) FROM public.organizations WHERE subscription_status = 'active') as active_subscriptions,
  (SELECT COUNT(*) FROM public.profiles p WHERE p.role != 'super_admin') as total_users,
  (SELECT COUNT(*) FROM public.vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM public.leads) as total_leads,
  (SELECT COUNT(*) FROM public.deals) as total_deals,
  (SELECT COUNT(*) FROM public.deals WHERE status = 'completed') as completed_deals,
  (SELECT COALESCE(SUM(sale_price), 0) FROM public.deals WHERE status = 'completed') as total_revenue;

-- Grant access to platform_stats view
GRANT SELECT ON public.platform_stats TO authenticated;

-- =============================================================================
-- CREATE INITIAL SUPER ADMIN (Optional - uncomment and modify)
-- =============================================================================
-- INSERT INTO public.profiles (id, organization_id, full_name, role)
-- VALUES (
--   'YOUR-AUTH-USER-UUID-HERE',  -- Replace with actual auth.users.id
--   NULL,                         -- Super admin has no organization
--   'Platform Admin',
--   'super_admin'
-- );
