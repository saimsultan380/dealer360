-- =============================================================================
-- INVENTORY MODULE - RLS POLICIES
-- =============================================================================
-- Enables access for Dealership Admins/Staff to their own inventory
-- =============================================================================

-- Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- VEHICLES TABLE
-- =============================================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- VIEW: Users can see vehicles belonging to their organization
CREATE POLICY "Users can view own organization vehicles"
  ON public.vehicles FOR SELECT
  USING (
    organization_id = public.get_auth_org_id() 
    OR 
    public.is_super_admin()
  );

-- INSERT: Users can create vehicles for their organization
CREATE POLICY "Users can insert own organization vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    organization_id = public.get_auth_org_id()
    OR
    public.is_super_admin()
  );

-- UPDATE: Users can update their organization's vehicles
CREATE POLICY "Users can update own organization vehicles"
  ON public.vehicles FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id()
    OR
    public.is_super_admin()
  );

-- DELETE: Users can delete their organization's vehicles
CREATE POLICY "Users can delete own organization vehicles"
  ON public.vehicles FOR DELETE
  USING (
    organization_id = public.get_auth_org_id()
    OR
    public.is_super_admin()
  );

-- =============================================================================
-- VEHICLE IMAGES TABLE
-- =============================================================================
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Users can view images if they can view the vehicle
CREATE POLICY "Users can view vehicle images"
  ON public.vehicle_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE id = vehicle_images.vehicle_id
      AND (
        organization_id = public.get_auth_org_id()
        OR
        public.is_super_admin()
      )
    )
  );

-- Users can insert images (initially might not have vehicle_id if utilizing a temp staging, 
-- but normally linked. For now, allow if organization matches or if we trust the upload flow)
-- Adjusting to allow insert if organization_id matches profile
CREATE POLICY "Users can insert vehicle images"
  ON public.vehicle_images FOR INSERT
  WITH CHECK (
    organization_id = public.get_auth_org_id()
    OR
    public.is_super_admin()
  );

-- Users can delete their own vehicle images
CREATE POLICY "Users can delete vehicle images"
  ON public.vehicle_images FOR DELETE
  USING (
    organization_id = public.get_auth_org_id()
    OR
    public.is_super_admin()
  );
