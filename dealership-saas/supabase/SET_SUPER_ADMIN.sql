-- =============================================================================
-- SET SUPER ADMIN: saimsultan380@gmail.com
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Uses auth.users (email lives there) to find your user, then updates profiles.
-- Then log out, log back in, and go to /admin
-- =============================================================================

-- Update profile by matching auth user email (works even if profiles.email missing)
UPDATE public.profiles p
SET role = 'super_admin', organization_id = NULL
FROM auth.users u
WHERE u.id = p.id AND u.email = 'saimsultan380@gmail.com';

-- Verify (run separately if needed):
-- SELECT p.id, u.email, p.full_name, p.role, p.organization_id
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE u.email = 'saimsultan380@gmail.com';
