-- =============================================================================
-- ORGANIZATIONS OWNER CNIC
-- =============================================================================
-- Adds an optional CNIC field for the primary owner/contact of an organization.
-- =============================================================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS owner_cnic TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_owner_cnic
  ON public.organizations(owner_cnic);

