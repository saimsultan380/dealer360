-- =============================================================================
-- DEALERSHIP SAAS - DATABASE SCHEMA
-- =============================================================================
-- This schema implements a multi-tenant architecture for a car dealership
-- management platform. All tables include organization_id for data isolation.
-- Row Level Security (RLS) is enforced on every table.
-- =============================================================================
-- WHEN TO USE: Run on a FRESH database only (no existing tables).
-- If you have existing tables, use RUN_THIS_IN_SQL_EDITOR.sql instead.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Function to get the current user's organization_id from their profile
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
  SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if the current user has a specific role.
-- IMPORTANT: "role" is reserved in PostgreSQL. Always use alias (e.g. p.role).
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = required_role
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================================
-- ORGANIZATIONS TABLE
-- =============================================================================
-- Represents a dealership/tenant in the system

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own organization
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (id = public.get_auth_org_id());

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (id = public.get_auth_org_id() AND public.has_role('admin'));

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- Extends auth.users with application-specific data

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'salesperson' CHECK (role IN ('super_admin', 'admin', 'manager', 'salesperson', 'accountant')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
-- CRITICAL: Users must be able to view their own profile for auth/middleware to work
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their organization"
  ON public.profiles FOR ALL
  USING (organization_id = public.get_auth_org_id() AND public.has_role('admin'));

-- Service role can insert profiles during auth user creation
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- VEHICLES TABLE
-- =============================================================================
-- Core inventory management table

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER NOT NULL,
  color TEXT,
  
  -- Registration & Documents
  registration_number TEXT,
  engine_number TEXT,
  chassis_number TEXT,
  
  -- Pricing
  purchase_price DECIMAL(12, 2),
  selling_price DECIMAL(12, 2),
  minimum_price DECIMAL(12, 2),
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'in_service')),
  condition TEXT DEFAULT 'used' CHECK (condition IN ('new', 'used', 'certified')),
  
  -- Details
  mileage INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'cng')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  description TEXT,
  
  -- Metadata
  added_by UUID REFERENCES public.profiles(id),
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view vehicles in their organization"
  ON public.vehicles FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert vehicles in their organization"
  ON public.vehicles FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can update vehicles in their organization"
  ON public.vehicles FOR UPDATE
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Admins/Managers can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

-- =============================================================================
-- VEHICLE IMAGES TABLE
-- =============================================================================

CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vehicle images in their organization"
  ON public.vehicle_images FOR ALL
  USING (organization_id = public.get_auth_org_id());

-- =============================================================================
-- LEADS TABLE
-- =============================================================================
-- Track customer inquiries and potential buyers

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_cnic TEXT,
  customer_address TEXT,
  
  -- Lead Details
  source TEXT CHECK (source IN ('walk_in', 'phone', 'whatsapp', 'website', 'referral', 'facebook', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Interest
  interested_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  preferred_makes TEXT[],
  notes TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES public.profiles(id),
  
  -- Follow-up
  next_follow_up TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads in their organization"
  ON public.leads FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert leads in their organization"
  ON public.leads FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can update leads in their organization"
  ON public.leads FOR UPDATE
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Admins/Managers can delete leads"
  ON public.leads FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

-- =============================================================================
-- DEALS TABLE
-- =============================================================================
-- Track sales transactions

CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- References
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Customer Info (denormalized for record keeping)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cnic TEXT,
  customer_address TEXT,
  
  -- Deal Details
  sale_price DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'financing')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Commission
  salesperson_id UUID REFERENCES public.profiles(id),
  commission_amount DECIMAL(12, 2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT FALSE,
  
  -- Dates
  deal_date TIMESTAMPTZ DEFAULT NOW(),
  delivery_date TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals in their organization"
  ON public.deals FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert deals in their organization"
  ON public.deals FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update deals"
  ON public.deals FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================
-- Store references to uploaded documents (CNIC, invoices, RC, etc.)

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic reference
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle', 'deal', 'lead')),
  entity_id UUID NOT NULL,
  
  -- Document Info
  document_type TEXT NOT NULL CHECK (document_type IN ('cnic_front', 'cnic_back', 'registration', 'invoice', 'receipt', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Metadata
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents in their organization"
  ON public.documents FOR ALL
  USING (organization_id = public.get_auth_org_id());

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
-- Track payment transactions for subscriptions

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('easypaisa', 'jazzcash', 'bank_transfer', 'stripe')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Reference
  transaction_id TEXT,
  external_reference TEXT,
  
  -- For subscription
  subscription_plan TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Verification (for manual methods)
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payments in their organization"
  ON public.payments FOR SELECT
  USING (organization_id = public.get_auth_org_id() AND public.has_role('admin'));

-- =============================================================================
-- ACTIVITY LOG TABLE
-- =============================================================================
-- Audit trail for important actions

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  
  -- Action Details
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs in their organization"
  ON public.activity_logs FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_organization ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(organization_id, make, model);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_organization ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_organization ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_vehicle ON public.deals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deals_salesperson ON public.deals(salesperson_id);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_vehicles ON public.vehicles;
CREATE TRIGGER set_updated_at_vehicles
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_leads ON public.leads;
CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_deals ON public.deals;
CREATE TRIGGER set_updated_at_deals
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- HANDLE NEW USER SIGNUP (TRIGGER)
-- =============================================================================
-- When a new user signs up, create their profile.
-- organization_id from metadata (optional); empty/null kept as NULL.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  org_id := CASE
    WHEN NEW.raw_user_meta_data->>'organization_id' IS NULL THEN NULL
    WHEN TRIM(NEW.raw_user_meta_data->>'organization_id') = '' THEN NULL
    ELSE (NEW.raw_user_meta_data->>'organization_id')::UUID
  END;
  INSERT INTO public.profiles (id, organization_id, full_name, role, email)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'salesperson'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- MARK VEHICLE AS SOLD WHEN DEAL COMPLETED (TRIGGER)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_deal_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.vehicles
    SET status = 'sold', sold_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_completed ON public.deals;
CREATE TRIGGER on_deal_completed
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_deal_completed();
