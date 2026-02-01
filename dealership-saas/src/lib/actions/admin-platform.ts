'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type PlatformStats = {
  total_organizations: number;
  active_subscriptions: number;
  total_users: number;
  total_vehicles: number;
  total_leads: number;
  total_deals: number;
  completed_deals: number;
  total_revenue: number;
};

async function requireSuperAdmin(): Promise<void> {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // If RLS blocks reading the profile row (common misconfiguration), fall back to
  // the SECURITY DEFINER function so real super admins aren't denied.
  if (error || profile?.role !== 'super_admin') {
    try {
      const { data, error: rpcError } = await supabase.rpc('is_super_admin');
      if (!rpcError && data === true) return;
    } catch {
      // ignore and throw below
    }

    if (error) throw new Error(error.message);
    throw new Error('Forbidden');
  }
}

export async function getPlatformStatsAdmin(): Promise<{
  data: PlatformStats | null;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = (createAdminClient() as any);

    // Prefer view if migration 002 is applied
    const { data: viewRow, error: viewError } = await admin
      .from('platform_stats')
      .select('*')
      .maybeSingle();

    if (!viewError && viewRow) {
      return { data: viewRow as PlatformStats, error: null };
    }

    // Fallback: compute counts with separate queries (works even if view isn't created yet)
    const countOnly = async (table: string, filter?: (q: any) => any) => {
      let q = admin.from(table).select('id', { count: 'exact', head: true });
      if (filter) q = filter(q);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    };

    const total_organizations = await countOnly('organizations');
    const active_subscriptions = await countOnly('organizations', (q) => q.eq('subscription_status', 'active'));
    const total_users = await countOnly('profiles', (q) => q.neq('role', 'super_admin'));
    const total_vehicles = await countOnly('vehicles');
    const total_leads = await countOnly('leads');
    const total_deals = await countOnly('deals');
    const completed_deals = await countOnly('deals', (q) => q.eq('status', 'completed'));

    // Revenue: try deals.sale_price, otherwise 0
    let total_revenue = 0;
    try {
      const { data: deals, error } = await admin
        .from('deals')
        .select('sale_price')
        .eq('status', 'completed');
      if (!error && Array.isArray(deals)) {
        total_revenue = deals.reduce((sum: number, d: any) => sum + Number(d.sale_price ?? 0), 0);
      }
    } catch {
      total_revenue = 0;
    }

    return {
      data: {
        total_organizations,
        active_subscriptions,
        total_users,
        total_vehicles,
        total_leads,
        total_deals,
        completed_deals,
        total_revenue,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to load platform stats' };
  }
}

export async function getRecentOrganizationsAdmin(): Promise<{
  data: Array<{ id: string; name: string; city: string | null; created_at: string }>;
  error: string | null;
}> {
  try {
    await requireSuperAdmin();
    const admin = (createAdminClient() as any);

    const { data, error } = await admin
      .from('organizations')
      .select('id, name, city, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as any, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to load recent organizations' };
  }
}

