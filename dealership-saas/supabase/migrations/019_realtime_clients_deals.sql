-- MIGRATION 019: Enable Realtime for Client Details Page
-- Required for live sync of client info, transactions, and deal-related updates.
-- If this migration fails (e.g. tables already in publication), add manually:
--   Supabase Dashboard → Database → Replication → supabase_realtime → Add tables

ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
