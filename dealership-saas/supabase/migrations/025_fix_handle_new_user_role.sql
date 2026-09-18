-- Fix: handle_new_user defaulted role to 'owner', which violates profiles_role_check
-- Allowed roles: super_admin, admin, manager, salesperson, accountant

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
  );
  RETURN NEW;
END;
$$;
