-- =============================================================================
-- INVESTORS TABLE
-- =============================================================================
-- Track investors and their investment details

CREATE TABLE public.investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Investor Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cnic TEXT,
  address TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view investors in their organization"
  ON public.investors FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert investors in their organization"
  ON public.investors FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update investors"
  ON public.investors FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

CREATE POLICY "Admins can delete investors"
  ON public.investors FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND public.has_role('admin')
  );

-- =============================================================================
-- INVESTMENT TRANSACTIONS TABLE
-- =============================================================================
-- Track all investment and withdrawal transactions

CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('investment', 'withdrawal')),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  
  -- Payment Method
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque')),
  transaction_reference TEXT,
  
  -- Dates
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view investment transactions in their organization"
  ON public.investment_transactions FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert investment transactions in their organization"
  ON public.investment_transactions FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update investment transactions"
  ON public.investment_transactions FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

CREATE POLICY "Admins can delete investment transactions"
  ON public.investment_transactions FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND public.has_role('admin')
  );

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_investors_organization ON public.investors(organization_id);
CREATE INDEX idx_investors_status ON public.investors(organization_id, status);
CREATE INDEX idx_investors_phone ON public.investors(phone);

CREATE INDEX idx_investment_transactions_organization ON public.investment_transactions(organization_id);
CREATE INDEX idx_investment_transactions_investor ON public.investment_transactions(investor_id);
CREATE INDEX idx_investment_transactions_type ON public.investment_transactions(organization_id, transaction_type);
CREATE INDEX idx_investment_transactions_date ON public.investment_transactions(organization_id, transaction_date);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER set_updated_at_investors
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_investment_transactions
  BEFORE UPDATE ON public.investment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FUNCTION TO CALCULATE INVESTOR BALANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_investor_balance(p_investor_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_balance DECIMAL(12, 2);
BEGIN
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN transaction_type = 'investment' THEN amount
        WHEN transaction_type = 'withdrawal' THEN -amount
        ELSE 0
      END
    ), 0)
  INTO v_balance
  FROM public.investment_transactions
  WHERE investor_id = p_investor_id
    AND status = 'completed';
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
