-- =============================================================================
-- MIGRATION 015: Fix Registration - Allow Service Role to Create Organizations
-- =============================================================================
-- This migration adds an RLS policy to allow the service role to create
-- organizations during the registration process.
-- =============================================================================

-- Update RLS policies for organizations table
-- Allow service role (no auth required) to insert during signup
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Service role can create organizations" ON public.organizations;

-- New policies:
-- 1. Service role can create organizations (for signup)
CREATE POLICY "Service role can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (true); -- Service role bypass

-- 2. Users can view their organization
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 3. Admins can update their organization
-- Note: "role" is reserved in PostgreSQL; use alias p.role.
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

-- =============================================================================
-- Enable profiles insert for auth.users
-- =============================================================================
-- Allow service role to create profiles during auth user creation
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true); -- Service role bypass
