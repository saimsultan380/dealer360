-- =============================================================================
-- FINANCING & LOAN MODULE - MIGRATION
-- =============================================================================

-- Financing Types (Lease/Finance)
CREATE TYPE financing_type AS ENUM ('finance', 'lease');

-- Payment Status
CREATE TYPE emi_payment_status AS ENUM ('pending', 'completed', 'late', 'overdue', 'waived');

-- =============================================================================
-- FINANCING/LOANS TABLE
-- =============================================================================
CREATE TABLE public.financing_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Link to the sale/deal record (optional)
  sale_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  -- Link to the vehicle record
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Loan Details
  financing_type financing_type NOT NULL DEFAULT 'finance',
  principal_amount DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) DEFAULT 0,
  loan_amount DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (principal_amount - down_payment) STORED,
  
  -- Interest & Terms
  annual_interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  loan_tenure_months INTEGER NOT NULL,
  emi_amount DECIMAL(12, 2) NOT NULL,
  
  -- Dates
  loan_start_date DATE NOT NULL,
  -- Generated columns must be IMMUTABLE in Postgres.
  -- Avoid text->interval casts; use interval multiplication instead.
  loan_end_date DATE NOT NULL GENERATED ALWAYS AS ((loan_start_date + (loan_tenure_months * INTERVAL '1 month'))::date) STORED,
  
  -- Bank/Lender Info
  bank_name TEXT,
  bank_reference_number TEXT,
  contact_person TEXT,
  contact_number TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  
  -- Additional Info
  terms_and_conditions TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EMI PAYMENTS TABLE (Payment Schedule)
-- =============================================================================
CREATE TABLE public.emi_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  financing_loan_id UUID NOT NULL REFERENCES public.financing_loans(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  emi_amount DECIMAL(12, 2) NOT NULL,
  
  -- Payment Status
  status emi_payment_status NOT NULL DEFAULT 'pending',
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  transaction_reference TEXT,
  
  -- Late Payment
  days_late INTEGER DEFAULT 0,
  late_fee DECIMAL(12, 2) DEFAULT 0,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LEASE DETAILS TABLE (Specific to Lease Financing)
-- =============================================================================
CREATE TABLE public.lease_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  financing_loan_id UUID NOT NULL REFERENCES public.financing_loans(id) ON DELETE CASCADE,
  
  -- Lease Specific
  lessor_name TEXT NOT NULL,
  lessor_contact TEXT,
  lease_agreement_number TEXT UNIQUE,
  mileage_limit INTEGER,
  mileage_overage_charge DECIMAL(8, 2),
  maintenance_included BOOLEAN DEFAULT false,
  insurance_included BOOLEAN DEFAULT false,
  residual_value DECIMAL(12, 2),
  buyout_option BOOLEAN DEFAULT false,
  buyout_price DECIMAL(12, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Financing Loans RLS
ALTER TABLE public.financing_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_financing_loans" ON public.financing_loans
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_insert_financing_loans" ON public.financing_loans
  FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_update_financing_loans" ON public.financing_loans
  FOR UPDATE USING (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_delete_financing_loans" ON public.financing_loans
  FOR DELETE USING (organization_id = public.get_auth_org_id());

-- EMI Payments RLS
ALTER TABLE public.emi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_emi_payments" ON public.emi_payments
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_insert_emi_payments" ON public.emi_payments
  FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_update_emi_payments" ON public.emi_payments
  FOR UPDATE USING (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_delete_emi_payments" ON public.emi_payments
  FOR DELETE USING (organization_id = public.get_auth_org_id());

-- Lease Details RLS
ALTER TABLE public.lease_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_lease_details" ON public.lease_details
  USING (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_insert_lease_details" ON public.lease_details
  FOR INSERT WITH CHECK (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_update_lease_details" ON public.lease_details
  FOR UPDATE USING (organization_id = public.get_auth_org_id());

CREATE POLICY "enable_delete_lease_details" ON public.lease_details
  FOR DELETE USING (organization_id = public.get_auth_org_id());

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_financing_loans_organization_id ON public.financing_loans(organization_id);
CREATE INDEX idx_financing_loans_customer_id ON public.financing_loans(customer_id);
CREATE INDEX idx_financing_loans_status ON public.financing_loans(status);

CREATE INDEX idx_emi_payments_organization_id ON public.emi_payments(organization_id);
CREATE INDEX idx_emi_payments_financing_loan_id ON public.emi_payments(financing_loan_id);
CREATE INDEX idx_emi_payments_status ON public.emi_payments(status);
CREATE INDEX idx_emi_payments_due_date ON public.emi_payments(due_date);

CREATE INDEX idx_lease_details_financing_loan_id ON public.lease_details(financing_loan_id);

-- =============================================================================
-- FUNCTIONS FOR EMI CALCULATION
-- =============================================================================

-- Function to calculate EMI (Equated Monthly Installment)
CREATE OR REPLACE FUNCTION public.calculate_emi(
  principal DECIMAL,
  annual_rate DECIMAL,
  months INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  monthly_rate DECIMAL;
  emi DECIMAL;
BEGIN
  IF months = 0 OR annual_rate = 0 THEN
    RETURN principal / NULLIF(months, 0);
  END IF;
  
  monthly_rate := annual_rate / 100 / 12;
  emi := (principal * monthly_rate * POWER(1 + monthly_rate, months)) / (POWER(1 + monthly_rate, months) - 1);
  
  RETURN ROUND(emi, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to generate EMI payment schedule
CREATE OR REPLACE FUNCTION public.generate_emi_schedule(
  p_financing_loan_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  payment_number INTEGER,
  due_date DATE,
  emi_amount DECIMAL
) AS $$
DECLARE
  v_loan RECORD;
  v_current_date DATE;
  v_count INTEGER := 1;
BEGIN
  SELECT * INTO v_loan FROM public.financing_loans WHERE id = p_financing_loan_id;
  
  v_current_date := v_loan.loan_start_date;
  
  WHILE v_count <= v_loan.loan_tenure_months LOOP
    RETURN QUERY SELECT
      v_count,
      v_current_date + INTERVAL '1 month',
      v_loan.emi_amount;
    
    v_current_date := v_current_date + INTERVAL '1 month';
    v_count := v_count + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
