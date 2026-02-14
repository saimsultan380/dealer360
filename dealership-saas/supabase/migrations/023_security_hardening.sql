-- =============================================================================
-- MIGRATION 023: Security Hardening
-- =============================================================================
-- Fixes all Supabase Advisor security issues:
-- 1. SECURITY DEFINER views → SECURITY INVOKER (3 views) 
-- 2. Function search_path mutable → SET search_path = '' (20 functions)
-- 3. Overly permissive RLS policies → Restricted to service_role (3 policies)
-- 4. Extension in public → Moved to extensions schema
-- =============================================================================

-- =============================================================================
-- 1) FIX: Security Definer Views → Security Invoker
-- =============================================================================

DROP VIEW IF EXISTS public.sales;
CREATE VIEW public.sales
WITH (security_invoker = true)
AS
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

DROP VIEW IF EXISTS public.platform_stats;
CREATE VIEW public.platform_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.organizations) AS total_organizations,
  (SELECT COUNT(*) FROM public.organizations WHERE subscription_status = 'active') AS active_subscriptions,
  (SELECT COUNT(*) FROM public.profiles p WHERE p.role != 'super_admin') AS total_users,
  (SELECT COUNT(*) FROM public.vehicles) AS total_vehicles,
  (SELECT COUNT(*) FROM public.deals) AS total_deals,
  (SELECT COUNT(*) FROM public.deals WHERE status = 'completed') AS completed_deals,
  (SELECT COALESCE(SUM(sale_price), 0) FROM public.deals WHERE status = 'completed') AS total_revenue;

GRANT SELECT ON public.platform_stats TO authenticated;

DROP VIEW IF EXISTS public.platform_inventory_by_type;
CREATE VIEW public.platform_inventory_by_type
WITH (security_invoker = true)
AS
SELECT
  CASE
    WHEN body_type = 'sedan' THEN 'Sedan'
    WHEN body_type = 'suv' THEN 'SUV'
    WHEN body_type = 'hatchback' THEN 'Hatchback'
    WHEN body_type = 'truck' THEN 'Truck'
    WHEN body_type = 'van' THEN 'Van'
    WHEN body_type = 'other' THEN 'Other'
    ELSE 'Unknown'
  END AS type,
  COUNT(*)::INTEGER AS count
FROM public.vehicles
GROUP BY 1
ORDER BY count DESC;

GRANT SELECT ON public.platform_inventory_by_type TO authenticated;

-- =============================================================================
-- 2) FIX: Function Search Path Mutable → SET search_path = ''
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
  SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = required_role)
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_cash_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'role', 'owner'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_deal_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.vehicles SET status = 'sold' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_cash_balance(p_org_id UUID)
RETURNS NUMERIC AS $$
DECLARE v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN transaction_type = 'cash_in' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN transaction_type IN ('cash_out', 'expense') THEN amount ELSE 0 END), 0)
  INTO v_balance FROM public.cash_transactions WHERE organization_id = p_org_id AND status = 'completed';
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_total_cash_in(p_org_id UUID, p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total FROM public.cash_transactions
  WHERE organization_id = p_org_id AND transaction_type = 'cash_in' AND status = 'completed'
    AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date);
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_total_cash_out(p_org_id UUID, p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total FROM public.cash_transactions
  WHERE organization_id = p_org_id AND transaction_type = 'cash_out' AND status = 'completed'
    AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date);
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_total_expenses(p_org_id UUID, p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total FROM public.cash_transactions
  WHERE organization_id = p_org_id AND transaction_type = 'expense' AND status = 'completed'
    AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date);
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP FUNCTION IF EXISTS public.get_total_cash_in(UUID, DATE, DATE);
CREATE FUNCTION public.get_total_cash_in(p_org_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total FROM public.cash_transactions
  WHERE organization_id = p_org_id AND transaction_type = 'cash_in' AND status = 'completed'
    AND (p_start_date IS NULL OR created_at::date >= p_start_date) AND (p_end_date IS NULL OR created_at::date <= p_end_date);
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP FUNCTION IF EXISTS public.get_total_cash_out(UUID, DATE, DATE);
CREATE FUNCTION public.get_total_cash_out(p_org_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total FROM public.cash_transactions
  WHERE organization_id = p_org_id AND transaction_type = 'cash_out' AND status = 'completed'
    AND (p_start_date IS NULL OR created_at::date >= p_start_date) AND (p_end_date IS NULL OR created_at::date <= p_end_date);
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP FUNCTION IF EXISTS public.get_total_expenses(UUID, DATE, DATE);
CREATE FUNCTION public.get_total_expenses(p_org_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total FROM public.cash_transactions
  WHERE organization_id = p_org_id AND transaction_type = 'expense' AND status = 'completed'
    AND (p_start_date IS NULL OR created_at::date >= p_start_date) AND (p_end_date IS NULL OR created_at::date <= p_end_date);
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_client_total_dues(p_client_id UUID)
RETURNS NUMERIC AS $$
DECLARE v_total_dues NUMERIC;
BEGIN
  SELECT COALESCE(SUM(remaining_due), 0) INTO v_total_dues FROM public.client_transactions WHERE client_id = p_client_id;
  RETURN v_total_dues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_client_total_spent(p_client_id UUID)
RETURNS NUMERIC AS $$
DECLARE v_total_spent NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_spent FROM public.client_transactions WHERE client_id = p_client_id;
  RETURN v_total_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_investor_balance(p_investor_id UUID)
RETURNS NUMERIC AS $$
DECLARE v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN transaction_type = 'investment' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0)
  INTO v_balance FROM public.investment_transactions WHERE investor_id = p_investor_id AND status = 'completed';
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP FUNCTION IF EXISTS public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID);
CREATE FUNCTION public.create_notification(
  p_recipient_id UUID, p_organization_id UUID, p_title TEXT, p_message TEXT, p_notification_type TEXT, p_entity_type TEXT DEFAULT NULL, p_entity_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (recipient_id, organization_id, title, message, notification_type, entity_type, entity_id)
  VALUES (p_recipient_id, p_organization_id, p_title, p_message, p_notification_type, p_entity_type, p_entity_id)
  RETURNING id INTO v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.calculate_emi(NUMERIC, NUMERIC, INTEGER);
CREATE FUNCTION public.calculate_emi(principal NUMERIC, annual_rate NUMERIC, months INTEGER)
RETURNS NUMERIC AS $$
DECLARE monthly_rate DECIMAL; emi DECIMAL;
BEGIN
  IF months = 0 OR annual_rate = 0 THEN RETURN principal / NULLIF(months, 0); END IF;
  monthly_rate := annual_rate / 100 / 12;
  emi := (principal * monthly_rate * POWER(1 + monthly_rate, months)) / (POWER(1 + monthly_rate, months) - 1);
  RETURN ROUND(emi, 2);
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP FUNCTION IF EXISTS public.generate_emi_schedule(UUID, UUID);
CREATE FUNCTION public.generate_emi_schedule(p_financing_loan_id UUID, p_organization_id UUID)
RETURNS TABLE(payment_number INTEGER, due_date DATE, emi_amount NUMERIC) AS $$
DECLARE v_loan RECORD; v_current_date DATE; v_count INTEGER := 1;
BEGIN
  SELECT * INTO v_loan FROM public.financing_loans WHERE id = p_financing_loan_id;
  v_current_date := v_loan.loan_start_date;
  WHILE v_count <= v_loan.loan_tenure_months LOOP
    RETURN QUERY SELECT v_count, v_current_date + INTERVAL '1 month', v_loan.emi_amount;
    v_current_date := v_current_date + INTERVAL '1 month';
    v_count := v_count + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- =============================================================================
-- 3) FIX: Overly Permissive RLS Policies → Restricted to service_role
-- =============================================================================

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (recipient_id = auth.uid() OR organization_id = public.get_auth_org_id());

DROP POLICY IF EXISTS "Service role can create organizations" ON public.organizations;
CREATE POLICY "Service role can create organizations"
  ON public.organizations FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

-- =============================================================================
-- 4) FIX: Move vector extension from public to extensions schema
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
