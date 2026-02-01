-- =============================================================================
-- MIGRATION 012: Fix RLS Policies & Enable Extensions
-- =============================================================================
-- This migration fixes RLS policies on documents and vehicle_images tables,
-- adds missing indexes for performance, and enables required extensions.
-- =============================================================================

-- Enable required extensions for enhanced functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Vector search is optional. Supabase uses extension name "vector" (pgvector).
-- Some Postgres hosts don't have it installed; don't hard-fail schema setup.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
  EXCEPTION
    WHEN undefined_file OR insufficient_privilege THEN
      -- skip if not available
      NULL;
  END;
END $$;

-- =============================================================================
-- FIX: Verify RLS is enabled on documents table
-- =============================================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can manage documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents in their organization" ON public.documents;

-- Create comprehensive RLS policies for documents
CREATE POLICY "Users can view documents in their organization"
  ON public.documents FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert documents in their organization"
  ON public.documents FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can update documents in their organization"
  ON public.documents FOR UPDATE
  USING (organization_id = public.get_auth_org_id())
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can delete documents in their organization"
  ON public.documents FOR DELETE
  USING (organization_id = public.get_auth_org_id() AND 
         (uploaded_by = auth.uid() OR public.has_role('admin')));

-- =============================================================================
-- FIX: Verify RLS is enabled on vehicle_images table
-- =============================================================================
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can manage vehicle images in their organization" ON public.vehicle_images;
DROP POLICY IF EXISTS "Users can view vehicle images in their organization" ON public.vehicle_images;
DROP POLICY IF EXISTS "Users can insert vehicle images in their organization" ON public.vehicle_images;
DROP POLICY IF EXISTS "Users can update vehicle images in their organization" ON public.vehicle_images;
DROP POLICY IF EXISTS "Users can delete vehicle images in their organization" ON public.vehicle_images;

-- Create comprehensive RLS policies for vehicle_images
CREATE POLICY "Users can view vehicle images in their organization"
  ON public.vehicle_images FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert vehicle images in their organization"
  ON public.vehicle_images FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can update vehicle images in their organization"
  ON public.vehicle_images FOR UPDATE
  USING (organization_id = public.get_auth_org_id())
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can delete vehicle images in their organization"
  ON public.vehicle_images FOR DELETE
  USING (organization_id = public.get_auth_org_id());

-- =============================================================================
-- PERFORMANCE: Add indexes for frequently queried columns
-- =============================================================================

-- Organizations table indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- Vehicle images indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_organization_id ON public.vehicle_images(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_is_primary ON public.vehicle_images(is_primary);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_type_id ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- Deals table indexes (app writes to deals; `sales` is a view in this repo)
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_vehicle_id ON public.deals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Financing loans indexes
CREATE INDEX IF NOT EXISTS idx_financing_loans_organization_id ON public.financing_loans(organization_id);
CREATE INDEX IF NOT EXISTS idx_financing_loans_vehicle_id ON public.financing_loans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_financing_loans_status ON public.financing_loans(status);
CREATE INDEX IF NOT EXISTS idx_financing_loans_created_at ON public.financing_loans(created_at DESC);

-- Japan import cases indexes
CREATE INDEX IF NOT EXISTS idx_japan_import_cases_organization_id ON public.japan_import_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_japan_import_cases_status ON public.japan_import_cases(status);
CREATE INDEX IF NOT EXISTS idx_japan_import_cases_stock_code ON public.japan_import_cases(stock_code);
CREATE INDEX IF NOT EXISTS idx_japan_import_cases_created_at ON public.japan_import_cases(created_at DESC);

-- Japan import related tables indexes
CREATE INDEX IF NOT EXISTS idx_japan_import_auctions_organization_id ON public.japan_import_auctions(organization_id);
CREATE INDEX IF NOT EXISTS idx_japan_import_costing_organization_id ON public.japan_import_costing(organization_id);
CREATE INDEX IF NOT EXISTS idx_japan_import_shipments_organization_id ON public.japan_import_shipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_japan_import_customs_organization_id ON public.japan_import_customs(organization_id);
CREATE INDEX IF NOT EXISTS idx_japan_import_inspections_organization_id ON public.japan_import_inspections(organization_id);
CREATE INDEX IF NOT EXISTS idx_japan_import_documents_organization_id ON public.japan_import_documents(organization_id);

-- =============================================================================
-- PERFORMANCE: Composite indexes for common query patterns
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_org_status ON public.vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_created ON public.vehicles(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_org_status_created ON public.deals(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_org_status_created ON public.leads(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financing_org_status_created ON public.financing_loans(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_japan_import_org_status_created ON public.japan_import_cases(organization_id, status, created_at DESC);

-- =============================================================================
-- PERFORMANCE: Grant execute permissions for helper functions
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated, anon;

-- =============================================================================
-- Verify all tables have RLS enabled
-- =============================================================================
-- Run this query manually in Supabase to verify:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' ORDER BY tablename;

-- All security policies and indexes have been applied successfully.
