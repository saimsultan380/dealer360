-- =============================================================================
-- MIGRATION 017: Fix "column role does not exist" - qualify profiles.role
-- =============================================================================
-- In PostgreSQL, "role" is a reserved identifier (database roles). Unqualified
-- "role" in has_role(), is_super_admin(), platform_stats, and some RLS policies
-- was interpreted as the current DB role, not the profiles.role column.
-- Fix: use table alias (e.g. p.role) so the column is unambiguous.
-- =============================================================================

-- has_role(required_role)
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = required_role
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- platform_stats view
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

GRANT SELECT ON public.platform_stats TO authenticated;

-- Admins can update their organization (015 subquery uses role)
DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
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
