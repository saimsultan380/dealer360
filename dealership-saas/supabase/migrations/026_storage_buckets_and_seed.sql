-- Ensure required storage buckets + policies, and re-seed platform defaults.
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT / DROP POLICY IF EXISTS).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('vehicles', 'vehicles', true, 104857600, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/jpg']::text[]),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']::text[]),
  ('profiles', 'profiles', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view vehicle images" ON storage.objects;
CREATE POLICY "Public can view vehicle images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Authenticated can upload vehicle images" ON storage.objects;
CREATE POLICY "Authenticated can upload vehicle images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Authenticated can update vehicle images" ON storage.objects;
CREATE POLICY "Authenticated can update vehicle images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Authenticated can delete vehicle images" ON storage.objects;
CREATE POLICY "Authenticated can delete vehicle images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Authenticated can view documents" ON storage.objects;
CREATE POLICY "Authenticated can view documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated can upload documents" ON storage.objects;
CREATE POLICY "Authenticated can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated can update documents" ON storage.objects;
CREATE POLICY "Authenticated can update documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated can delete documents" ON storage.objects;
CREATE POLICY "Authenticated can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated can upload profile images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated can update profile images" ON storage.objects;
CREATE POLICY "Authenticated can update profile images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated can delete profile images" ON storage.objects;
CREATE POLICY "Authenticated can delete profile images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profiles');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_role text;
  v_org_id uuid;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  IF v_role NOT IN ('super_admin', 'admin', 'manager', 'salesperson', 'accountant') THEN
    v_role := 'admin';
  END IF;

  BEGIN
    v_org_id := NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_org_id := NULL;
  END;

  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    v_org_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    organization_id = COALESCE(public.profiles.organization_id, EXCLUDED.organization_id);
  RETURN NEW;
END;
$$;

INSERT INTO public.platform_public_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.platform_email_templates (template_key, name, subject, body)
VALUES
  ('org_welcome', 'Organization Welcome', 'Welcome to {{platform_name}}', 'Hi {{org_name}},\n\nWelcome to {{platform_name}}.\n\nThanks,\n{{platform_name}} Team'),
  ('user_invite', 'User Invite', 'You have been invited to {{platform_name}}', 'Hi {{name}},\n\nYou have been invited to join {{org_name}} on {{platform_name}}.\n\nAccept invite: {{invite_link}}\n\nThanks,\n{{platform_name}} Team'),
  ('password_reset', 'Password Reset', 'Reset your {{platform_name}} password', 'Hi,\n\nReset your password using this link:\n{{reset_link}}\n\nIf you did not request this, ignore this email.\n\nThanks,\n{{platform_name}} Team'),
  ('payment_receipt', 'Payment Receipt', 'Payment received - {{platform_name}}', 'Hi {{org_name}},\n\nWe received your payment of {{amount}} {{currency}}.\n\nPeriod: {{period_start}} - {{period_end}}\n\nThanks,\n{{platform_name}} Team'),
  ('subscription_failed', 'Subscription Failed', 'Payment failed - action required', 'Hi {{org_name}},\n\nWe could not process your payment. Please update your billing method.\n\nThanks,\n{{platform_name}} Team')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO public.platform_subscription_plans (code, name, price, currency, billing_period, limits, is_active)
VALUES
  ('basic', 'Basic', 0, 'PKR', 'monthly', '{"max_users": 5, "max_vehicles": 50}'::jsonb, true),
  ('professional', 'Professional', 0, 'PKR', 'monthly', '{"max_users": 15, "max_vehicles": 200}'::jsonb, true),
  ('enterprise', 'Enterprise', 0, 'PKR', 'monthly', '{"max_users": 50, "max_vehicles": 1000}'::jsonb, true)
ON CONFLICT (code) DO NOTHING;
