-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================
-- Track clients/customers and their information

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Client Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cnic TEXT,
  address TEXT,
  avatar_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clients in their organization"
  ON public.clients FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert clients in their organization"
  ON public.clients FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update clients"
  ON public.clients FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND public.has_role('admin')
  );

-- =============================================================================
-- CLIENT TRANSACTIONS TABLE
-- =============================================================================
-- Track all client transactions (purchases and sales)

CREATE TABLE public.client_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'payment', 'refund')),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  
  -- Payment Details
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'financing')),
  transaction_reference TEXT,
  
  -- Vehicle Information (if applicable)
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  
  -- Dates
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  
  -- Dues Information
  total_amount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  remaining_due DECIMAL(12, 2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view client transactions in their organization"
  ON public.client_transactions FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert client transactions in their organization"
  ON public.client_transactions FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update client transactions"
  ON public.client_transactions FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

CREATE POLICY "Admins can delete client transactions"
  ON public.client_transactions FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND public.has_role('admin')
  );

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_clients_organization ON public.clients(organization_id);
CREATE INDEX idx_clients_status ON public.clients(organization_id, status);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_clients_email ON public.clients(email);

CREATE INDEX idx_client_transactions_organization ON public.client_transactions(organization_id);
CREATE INDEX idx_client_transactions_client ON public.client_transactions(client_id);
CREATE INDEX idx_client_transactions_deal ON public.client_transactions(deal_id);
CREATE INDEX idx_client_transactions_type ON public.client_transactions(organization_id, transaction_type);
CREATE INDEX idx_client_transactions_date ON public.client_transactions(organization_id, transaction_date);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_client_transactions
  BEFORE UPDATE ON public.client_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FUNCTION TO CALCULATE CLIENT TOTAL DUES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_client_total_dues(p_client_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_total_dues DECIMAL(12, 2);
BEGIN
  SELECT 
    COALESCE(SUM(remaining_due), 0)
  INTO v_total_dues
  FROM public.client_transactions
  WHERE client_id = p_client_id
    AND status = 'completed'
    AND remaining_due > 0;
  
  RETURN v_total_dues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION TO CALCULATE CLIENT TOTAL SPENT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_client_total_spent(p_client_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_total_spent DECIMAL(12, 2);
BEGIN
  SELECT 
    COALESCE(SUM(amount), 0)
  INTO v_total_spent
  FROM public.client_transactions
  WHERE client_id = p_client_id
    AND status = 'completed'
    AND transaction_type IN ('purchase', 'payment');
  
  RETURN v_total_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
