-- =============================================================================
-- EXPENSE CATEGORIES TABLE
-- =============================================================================
-- Manage expense categories/types for cash flow tracking

CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Category Information
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Default blue color for UI
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique category names per organization
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expense categories in their organization"
  ON public.expense_categories FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert expense categories in their organization"
  ON public.expense_categories FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update expense categories"
  ON public.expense_categories FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

CREATE POLICY "Admins can delete expense categories"
  ON public.expense_categories FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND public.has_role('admin')
  );

-- =============================================================================
-- CASH TRANSACTIONS TABLE
-- =============================================================================
-- Track all cash in/out and expenses

CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Transaction Information
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('cash_in', 'cash_out', 'expense')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'PKR',
  
  -- Expense Details (only for expenses)
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  
  -- Payment Method
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'card')),
  
  -- Transaction Details
  description TEXT NOT NULL,
  reference_number TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Related Entities (optional)
  related_entity_type TEXT CHECK (related_entity_type IN ('deal', 'vehicle', 'client', 'investor', 'other')),
  related_entity_id UUID,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cash transactions in their organization"
  ON public.cash_transactions FOR SELECT
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "Users can insert cash transactions in their organization"
  ON public.cash_transactions FOR INSERT
  WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "Managers/Admins can update cash transactions"
  ON public.cash_transactions FOR UPDATE
  USING (
    organization_id = public.get_auth_org_id() 
    AND (public.has_role('admin') OR public.has_role('manager'))
  );

CREATE POLICY "Admins can delete cash transactions"
  ON public.cash_transactions FOR DELETE
  USING (
    organization_id = public.get_auth_org_id() 
    AND public.has_role('admin')
  );

-- Indexes for better query performance
CREATE INDEX idx_cash_transactions_org_date ON public.cash_transactions(organization_id, transaction_date DESC);
CREATE INDEX idx_cash_transactions_type ON public.cash_transactions(organization_id, transaction_type);
CREATE INDEX idx_cash_transactions_category ON public.cash_transactions(expense_category_id) WHERE expense_category_id IS NOT NULL;
CREATE INDEX idx_expense_categories_org ON public.expense_categories(organization_id, is_active);

-- Function to get cash balance (total cash in - total cash out - total expenses)
CREATE OR REPLACE FUNCTION public.get_cash_balance(p_org_id UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_balance DECIMAL(15, 2);
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'cash_in' THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN transaction_type = 'cash_out' THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0)
  INTO v_balance
  FROM public.cash_transactions
  WHERE organization_id = p_org_id
    AND status = 'completed';
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total cash in for a date range
CREATE OR REPLACE FUNCTION public.get_total_cash_in(
  p_org_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_total DECIMAL(15, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM public.cash_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'cash_in'
    AND status = 'completed'
    AND (p_start_date IS NULL OR transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR transaction_date <= p_end_date);
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total cash out for a date range
CREATE OR REPLACE FUNCTION public.get_total_cash_out(
  p_org_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_total DECIMAL(15, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM public.cash_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'cash_out'
    AND status = 'completed'
    AND (p_start_date IS NULL OR transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR transaction_date <= p_end_date);
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total expenses for a date range
CREATE OR REPLACE FUNCTION public.get_total_expenses(
  p_org_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_total DECIMAL(15, 2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM public.cash_transactions
  WHERE organization_id = p_org_id
    AND transaction_type = 'expense'
    AND status = 'completed'
    AND (p_start_date IS NULL OR transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR transaction_date <= p_end_date);
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cash_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cash_transactions_updated_at();

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cash_transactions_updated_at();
