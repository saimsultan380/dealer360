-- =============================================================================
-- PLATFORM SETTINGS + EMAIL TEMPLATES + PLANS + AUDIT LOGS
-- =============================================================================
-- Adds platform-wide (super admin) configuration and auditability.
-- =============================================================================

-- =============================================================================
-- PLATFORM PUBLIC SETTINGS (safe to expose to everyone)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_public_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message TEXT,
  brand_name TEXT DEFAULT 'Dealer360',
  brand_primary_color TEXT DEFAULT '#0f172a',
  brand_secondary_color TEXT DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT platform_public_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.platform_public_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can read public platform flags (maintenance banner, branding).
DROP POLICY IF EXISTS "Anyone can read platform public settings" ON public.platform_public_settings;
CREATE POLICY "Anyone can read platform public settings"
  ON public.platform_public_settings FOR SELECT
  USING (true);

-- Only super admin can modify.
DROP POLICY IF EXISTS "Super admin can update platform public settings" ON public.platform_public_settings;
CREATE POLICY "Super admin can update platform public settings"
  ON public.platform_public_settings FOR UPDATE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can insert platform public settings" ON public.platform_public_settings;
CREATE POLICY "Super admin can insert platform public settings"
  ON public.platform_public_settings FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_platform_public_settings ON public.platform_public_settings;
CREATE TRIGGER set_updated_at_platform_public_settings
  BEFORE UPDATE ON public.platform_public_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.platform_public_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PLATFORM PRIVATE SETTINGS (super admin only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_currency TEXT NOT NULL DEFAULT 'PKR',
  default_country TEXT NOT NULL DEFAULT 'PK',
  default_timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
  session_timeout_minutes INTEGER NOT NULL DEFAULT 120,
  support_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT platform_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can read platform settings" ON public.platform_settings;
CREATE POLICY "Super admin can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can update platform settings" ON public.platform_settings;
CREATE POLICY "Super admin can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can insert platform settings" ON public.platform_settings;
CREATE POLICY "Super admin can insert platform settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP TRIGGER IF EXISTS set_updated_at_platform_settings ON public.platform_settings;
CREATE TRIGGER set_updated_at_platform_settings
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.platform_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PLATFORM EMAIL TEMPLATES (super admin only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can manage platform email templates" ON public.platform_email_templates;
CREATE POLICY "Super admin can manage platform email templates"
  ON public.platform_email_templates FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP TRIGGER IF EXISTS set_updated_at_platform_email_templates ON public.platform_email_templates;
CREATE TRIGGER set_updated_at_platform_email_templates
  BEFORE UPDATE ON public.platform_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.platform_email_templates (template_key, name, subject, body)
VALUES
  ('org_welcome', 'Organization Welcome', 'Welcome to {{platform_name}}', 'Hi {{org_name}},\n\nWelcome to {{platform_name}}.\n\nThanks,\n{{platform_name}} Team'),
  ('user_invite', 'User Invite', 'You have been invited to {{platform_name}}', 'Hi {{name}},\n\nYou have been invited to join {{org_name}} on {{platform_name}}.\n\nAccept invite: {{invite_link}}\n\nThanks,\n{{platform_name}} Team'),
  ('password_reset', 'Password Reset', 'Reset your {{platform_name}} password', 'Hi,\n\nReset your password using this link:\n{{reset_link}}\n\nIf you did not request this, ignore this email.\n\nThanks,\n{{platform_name}} Team'),
  ('payment_receipt', 'Payment Receipt', 'Payment received - {{platform_name}}', 'Hi {{org_name}},\n\nWe received your payment of {{amount}} {{currency}}.\n\nPeriod: {{period_start}} - {{period_end}}\n\nThanks,\n{{platform_name}} Team'),
  ('subscription_failed', 'Subscription Failed', 'Payment failed - action required', 'Hi {{org_name}},\n\nWe could not process your payment. Please update your billing method.\n\nThanks,\n{{platform_name}} Team')
ON CONFLICT (template_key) DO NOTHING;

-- =============================================================================
-- PLATFORM SUBSCRIPTION PLANS (super admin only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PKR',
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly','yearly')),
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can manage platform subscription plans" ON public.platform_subscription_plans;
CREATE POLICY "Super admin can manage platform subscription plans"
  ON public.platform_subscription_plans FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP TRIGGER IF EXISTS set_updated_at_platform_subscription_plans ON public.platform_subscription_plans;
CREATE TRIGGER set_updated_at_platform_subscription_plans
  BEFORE UPDATE ON public.platform_subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.platform_subscription_plans (code, name, price, currency, billing_period, limits, is_active)
VALUES
  ('basic', 'Basic', 0, 'PKR', 'monthly', '{"max_users": 5, "max_vehicles": 50}'::jsonb, true),
  ('professional', 'Professional', 0, 'PKR', 'monthly', '{"max_users": 15, "max_vehicles": 200}'::jsonb, true),
  ('enterprise', 'Enterprise', 0, 'PKR', 'monthly', '{"max_users": 50, "max_vehicles": 1000}'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- PLATFORM AUDIT LOGS (super admin only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can read platform audit logs" ON public.platform_audit_logs;
CREATE POLICY "Super admin can read platform audit logs"
  ON public.platform_audit_logs FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can insert platform audit logs" ON public.platform_audit_logs;
CREATE POLICY "Super admin can insert platform audit logs"
  ON public.platform_audit_logs FOR INSERT
  WITH CHECK (public.is_super_admin());

