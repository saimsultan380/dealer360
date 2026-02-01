'use server';

import { createClient } from '@/lib/supabase/server';

export type DashboardMetrics = {
  totalVehicles: number;
  activeLeads: number;
  dealsThisMonth: number;
  pendingDeals: number;
  revenueThisMonth: number;
  totalInvestors: number;
  totalClients: number;
  revenueByMonth: { month: string; revenue: number }[];
  dealStatus: { name: string; value: number; color: string }[];
};

function monthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'short' });
}

function asDateFilterValue(d: Date) {
  // For Postgres DATE columns, prefer YYYY-MM-DD (avoids timezone surprises)
  return d.toISOString().slice(0, 10);
}

export async function getDashboardMetrics(): Promise<{ data: DashboardMetrics | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Unauthorized' };

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) return { data: null, error: profileErr.message };
    if (!profile?.organization_id) return { data: null, error: 'No organization found' };
    const orgId = profile.organization_id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Counts
    const [vehiclesCount, leadsActiveCount, investorsCount, clientsCount] = await Promise.all([
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      // Active leads = not won/lost
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .not('status', 'in', '("won","lost")'),
      supabase.from('investors').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    ]);

    const totalVehicles = vehiclesCount.count ?? 0;
    const activeLeads = leadsActiveCount.count ?? 0;
    const totalInvestors = investorsCount.count ?? 0;
    const totalClients = clientsCount.count ?? 0;

    // Deals this month + revenue this month
    const { data: dealsRows, error: dealsErr } = await supabase
      .from('deals')
      .select('status, sale_price, deal_date')
      .eq('organization_id', orgId)
      .gte('deal_date', asDateFilterValue(startOfMonth));
    if (dealsErr) return { data: null, error: dealsErr.message };

    const dealsThisMonth = (dealsRows ?? []).length;
    const revenueThisMonth = (dealsRows ?? [])
      .filter((d: any) => d.status === 'completed')
      .reduce((sum: number, d: any) => sum + (Number(d.sale_price) || 0), 0);

    // Deal status distribution (all time)
    const { data: allDealsRows, error: allDealsErr } = await supabase
      .from('deals')
      .select('status')
      .eq('organization_id', orgId);
    if (allDealsErr) return { data: null, error: allDealsErr.message };

    const statusCounts = (allDealsRows ?? []).reduce(
      (acc: Record<string, number>, row: any) => {
        const k = row.status || 'unknown';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      },
      {}
    );

    const dealStatus = [
      { name: 'Completed', value: statusCounts.completed || 0, color: '#10b981' },
      { name: 'Pending', value: statusCounts.pending || 0, color: '#f59e0b' },
      { name: 'Cancelled', value: statusCounts.cancelled || 0, color: '#ef4444' },
    ];
    const pendingDeals = statusCounts.pending || 0;

    // Revenue by last 6 months (completed deals)
    const start6 = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const { data: revenueRows, error: revErr } = await supabase
      .from('deals')
      .select('sale_price, deal_date, status')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .gte('deal_date', asDateFilterValue(start6));
    if (revErr) return { data: null, error: revErr.message };

    const buckets: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ month: monthLabel(d), revenue: 0 });
    }
    const monthIndex = (label: string) => buckets.findIndex((b) => b.month === label);
    for (const row of revenueRows ?? []) {
      const d = row.deal_date ? new Date(row.deal_date) : null;
      if (!d) continue;
      const label = monthLabel(d);
      const idx = monthIndex(label);
      if (idx >= 0) buckets[idx].revenue += Number(row.sale_price) || 0;
    }

    return {
      data: {
        totalVehicles,
        activeLeads,
        dealsThisMonth,
        pendingDeals,
        revenueThisMonth,
        totalInvestors,
        totalClients,
        revenueByMonth: buckets,
        dealStatus,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to load dashboard metrics' };
  }
}

