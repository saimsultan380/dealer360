-- =============================================================================
-- MIGRATION 016: Allow users to always view their own profile
-- =============================================================================
-- The middleware fetches profiles by id = user.id to check role (e.g. super_admin).
-- Existing policies:
--   - "Users can view profiles in their organization": uses organization_id =
--     get_auth_org_id(). For super_admins, organization_id is NULL, and
--     NULL = NULL evaluates to NULL in SQL, so the row is not visible.
--   - "Super admin can view all profiles": uses is_super_admin(), which reads
--     the same profile we're trying to fetch (circular for first check).
-- Without being able to read our own row, the middleware gets no profile and
-- redirects /admin -> /dashboard even for super_admins.
--
-- Fix: Add a policy so every user can always SELECT their own profile.
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());
