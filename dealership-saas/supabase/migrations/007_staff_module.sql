-- =============================================================================
-- STAFF MODULE - DATABASE MIGRATION
-- =============================================================================
-- Adds email to profiles (for staff management UI) and keeps handle_new_user
-- trigger in sync so new users get email populated automatically.
-- =============================================================================

-- Add email column to profiles (mirrors auth.users.email)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill email for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS NULL;

-- Update handle_new_user trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, organization_id, full_name, role, email)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'organization_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'salesperson'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

