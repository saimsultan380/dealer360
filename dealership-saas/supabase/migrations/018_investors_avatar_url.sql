-- Add avatar_url to investors (profile image), same pattern as clients
ALTER TABLE public.investors
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
