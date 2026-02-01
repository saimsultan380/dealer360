-- =============================================================================
-- DEALERSHIP SAAS - COMPLETE DATABASE SCHEMA
-- =============================================================================
-- Use on a FRESH database only. Run once. If tables already exist, use
-- RUN_THIS_IN_SQL_EDITOR.sql instead.
-- =============================================================================
-- Note: "role" is reserved in PostgreSQL — use alias (e.g. p.role) in queries.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- gen_random_uuid() is used by some migrations (Japan Import tables)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ORGANIZATIONS TABLE
-- =============================================================================

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
  feature_flags JSONB DEFAULT '{
    "max_vehicles": 100,
    "max_users": 10,
    "enable_documents": true,
    "enable_leads": true,
    "enable_deals": true,
    "enable_analytics": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS (must be defined AFTER profiles table exists)
-- =============================================================================

-- Function to get the current user's organization_id from their profile
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
  SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if the current user has a specific role
-- IMPORTANT: Use alias "p" to avoid conflict with reserved "role" keyword
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
-- VEHICLES TABLE
-- =============================================================================

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER NOT NULL,
  color TEXT,
  registration_number TEXT,
  engine_number TEXT,
  chassis_number TEXT,
  -- Seller / party details (used by sales flow UI)
  seller_name TEXT,
  seller_phone TEXT,
  seller_cnic TEXT,
  seller_address TEXT,
  purchase_price DECIMAL(12, 2),
  selling_price DECIMAL(12, 2),
  minimum_price DECIMAL(12, 2),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'in_service')),
  condition TEXT DEFAULT 'used' CHECK (condition IN ('new', 'used', 'certified')),
  mileage INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'cng')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  description TEXT,
  added_by UUID REFERENCES public.profiles(id),
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- LEADS TABLE
-- =============================================================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_cnic TEXT,
  customer_address TEXT,
  source TEXT CHECK (source IN ('walk_in', 'phone', 'whatsapp', 'website', 'referral', 'facebook', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  interested_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  preferred_makes TEXT[],
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  next_follow_up TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DEALS TABLE
-- =============================================================================

CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cnic TEXT,
  customer_address TEXT,
  sale_price DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'financing')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  salesperson_id UUID REFERENCES public.profiles(id),
  commission_amount DECIMAL(12, 2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT FALSE,
  deal_date TIMESTAMPTZ DEFAULT NOW(),
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SALES VIEW (compat): some UI/components query `sales`, but writes go to `deals`
-- =============================================================================
CREATE OR REPLACE VIEW public.sales AS
SELECT
  d.id,
  d.organization_id,
  d.vehicle_id,
  d.customer_name,
  d.customer_phone,
  d.customer_cnic,
  d.customer_address,
  d.sale_price,
  d.down_payment,
  d.payment_method,
  d.status,
  d.deal_date,
  d.delivery_date,
  d.notes,
  d.created_at,
  d.updated_at
FROM public.deals d;

GRANT SELECT ON public.sales TO authenticated;

-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle', 'deal', 'lead')),
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('cnic_front', 'cnic_back', 'registration', 'invoice', 'receipt', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('easypaisa', 'jazzcash', 'bank_transfer', 'stripe')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  external_reference TEXT,
  subscription_plan TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ACTIVITY LOG TABLE
-- =============================================================================

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES - PROFILES (CRITICAL: Users must view own profile for auth to work)
-- =============================================================================

-- Users can ALWAYS view their own profile (needed for middleware auth checks)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (organization_id = public.get_auth_org_id());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can manage profiles in their organization
CREATE POLICY "Admins can manage profiles in their organization"
  ON public.profiles FOR ALL
  USING (organization_id = public.get_auth_org_id() AND public.has_role('admin'));

-- Service role can insert profiles during auth user creation
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Super admin can view all profiles
CREATE POLICY "Super admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

-- Super admin can create profiles
CREATE POLICY "Super admin can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Super admin can update any profile
CREATE POLICY "Super admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin());

-- =============================================================================
-- RLS POLICIES - ORGANIZATIONS
-- =============================================================================

-- Service role can create organizations (for signup)
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

-- Super admin can view all organizations
CREATE POLICY "Super admin can view all organizations"
  ON public.organizations FOR SELECT
  USING (public.is_super_admin());

-- Super admin can create organizations
CREATE POLICY "Super admin can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Super admin can update any organization
CREATE POLICY "Super admin can update any organization"
  ON public.organizations FOR UPDATE
  USING (public.is_super_admin());

-- Super admin can delete organizations
CREATE POLICY "Super admin can delete organizations"
  ON public.organizations FOR DELETE
  USING (public.is_super_admin());

-- =============================================================================
-- RLS POLICIES - VEHICLES
-- =============================================================================

CREATE POLICY "Users can view vehicles in their organization"
  ON public.vehicles FOR SELECT
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Users can insert vehicles in their organization"
  ON public.vehicles FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Users can update vehicles in their organization"
  ON public.vehicles FOR UPDATE
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Admins/Managers can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (
    (organization_id = public.get_auth_org_id() AND (public.has_role('admin') OR public.has_role('manager')))
    OR public.is_super_admin()
  );

-- =============================================================================
-- RLS POLICIES - VEHICLE IMAGES
-- =============================================================================

CREATE POLICY "Users can manage vehicle images in their organization"
  ON public.vehicle_images FOR ALL
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

-- =============================================================================
-- RLS POLICIES - LEADS
-- =============================================================================

CREATE POLICY "Users can view leads in their organization"
  ON public.leads FOR SELECT
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Users can insert leads in their organization"
  ON public.leads FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Users can update leads in their organization"
  ON public.leads FOR UPDATE
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Admins/Managers can delete leads"
  ON public.leads FOR DELETE
  USING (
    (organization_id = public.get_auth_org_id() AND (public.has_role('admin') OR public.has_role('manager')))
    OR public.is_super_admin()
  );

-- =============================================================================
-- RLS POLICIES - DEALS
-- =============================================================================

CREATE POLICY "Users can view deals in their organization"
  ON public.deals FOR SELECT
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Users can insert deals in their organization"
  ON public.deals FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "Managers/Admins can update deals"
  ON public.deals FOR UPDATE
  USING (
    (organization_id = public.get_auth_org_id() AND (public.has_role('admin') OR public.has_role('manager')))
    OR public.is_super_admin()
  );

-- =============================================================================
-- RLS POLICIES - DOCUMENTS
-- =============================================================================

CREATE POLICY "Users can manage documents in their organization"
  ON public.documents FOR ALL
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

-- =============================================================================
-- RLS POLICIES - PAYMENTS
-- =============================================================================

CREATE POLICY "Admins can view payments in their organization"
  ON public.payments FOR SELECT
  USING ((organization_id = public.get_auth_org_id() AND public.has_role('admin')) OR public.is_super_admin());

-- =============================================================================
-- RLS POLICIES - ACTIVITY LOGS
-- =============================================================================

CREATE POLICY "Users can view activity logs in their organization"
  ON public.activity_logs FOR SELECT
  USING (organization_id = public.get_auth_org_id() OR public.is_super_admin());

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id() OR public.is_super_admin());

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_organization ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(organization_id, make, model);
CREATE INDEX IF NOT EXISTS idx_leads_organization ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_organization ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_vehicle ON public.deals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deals_salesperson ON public.deals(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
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

GRANT SELECT ON public.platform_stats TO authenticated;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO authenticated, anon;

-- =============================================================================
-- DONE! Your database is ready.
-- =============================================================================
-- Next: Run SET_SUPER_ADMIN.sql to set your user as super_admin (matches by
-- auth.users email). Then log out, log in, and open /admin.
-- =============================================================================
