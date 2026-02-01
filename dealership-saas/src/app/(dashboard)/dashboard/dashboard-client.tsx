'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  Car,
  Users,
  HandshakeIcon,
  TrendingUp,
  DollarSign,
  CircleUser,
  LayoutGrid,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  FileText,
  ShieldAlert,
  X,
} from 'lucide-react';
import { RevenueChart, DealStatusChart } from '@/components/charts';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslations } from '@/lib/hooks/use-translations';
import { getDashboardMetrics } from '@/lib/actions/dashboard';
import { subscribeToDeals, subscribeToLeads, subscribeToVehicles } from '@/lib/supabase/realtime';

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const chartData = useMemo(() => data.map((v, i) => ({ i, v })), [data]);

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color.replace('#', '')})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization, profile } = useAuthStore();
  const { t } = useTranslations();
  // Charts should be visible by default; user preference persisted.
  const [showCharts, setShowCharts] = useState(true);
  const adminRequired = searchParams.get('error') === 'admin_required';
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getDashboardMetrics>>['data']>(null);

  const DEFAULT_VISIBLE_STAT_IDS = useMemo(
    () => [
      'totalVehicles',
      'activeLeads',
      'dealsThisMonth',
      'pendingDeals',
      'totalInvestors',
      'totalClients',
      'revenueThisMonth',
    ],
    []
  );

  const [visibleStatIds, setVisibleStatIds] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE_STAT_IDS)
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dashboard.visibleStatIds');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
        setVisibleStatIds(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dashboard.showCharts');
      if (raw === null) return;
      if (raw === '0' || raw === 'false') setShowCharts(false);
      if (raw === '1' || raw === 'true') setShowCharts(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dashboard.showCharts', showCharts ? '1' : '0');
    } catch {
      // ignore
    }
  }, [showCharts]);

  const setAndPersistVisibleStatIds = (next: Set<string>) => {
    setVisibleStatIds(next);
    try {
      localStorage.setItem('dashboard.visibleStatIds', JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  const toggleStatVisibility = (id: string) => {
    setVisibleStatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('dashboard.visibleStatIds', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const dismissAdminRequired = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    router.replace(url.pathname + (url.search || ''));
  };

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      const result = await getDashboardMetrics();
      if (result.error) {
        setMetricsError(result.error);
        setMetrics(result.data);
      } else {
        setMetricsError(null);
        setMetrics(result.data);
      }
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const orgId = organization?.id;
    if (!orgId) return;

    // Refresh KPIs/charts when underlying tables change.
    const unsubVehicles = subscribeToVehicles({ onInsert: loadMetrics, onUpdate: loadMetrics, onDelete: loadMetrics }, orgId);
    const unsubLeads = subscribeToLeads({ onInsert: loadMetrics, onUpdate: loadMetrics, onDelete: loadMetrics }, orgId);
    const unsubDeals = subscribeToDeals({ onInsert: loadMetrics, onUpdate: loadMetrics, onDelete: loadMetrics }, orgId);

    return () => {
      unsubVehicles?.();
      unsubLeads?.();
      unsubDeals?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  const stats = useMemo(
    () => [
      {
        id: 'totalVehicles',
        title: t('dashboard.totalVehicles'),
        value: metricsLoading ? '—' : String(metrics?.totalVehicles ?? 0),
        description: 'Total in inventory',
        icon: Car,
        accent: '#8b5cf6', // purple (vehicles)
        trend: 'up' as const,
        spark: [],
      },
      {
        id: 'activeLeads',
        title: t('dashboard.activeLeads'),
        value: metricsLoading ? '—' : String(metrics?.activeLeads ?? 0),
        description: 'Open leads',
        icon: Users,
        accent: '#f97316', // orange (leads)
        trend: 'up' as const,
        spark: [],
      },
      {
        id: 'dealsThisMonth',
        title: t('dashboard.dealsThisMonth'),
        value: metricsLoading ? '—' : String(metrics?.dealsThisMonth ?? 0),
        description: 'Deals in current month',
        icon: HandshakeIcon,
        accent: '#3b82f6', // blue (deals)
        trend: 'up' as const,
        spark: [],
      },
      {
        id: 'pendingDeals',
        title: 'Pending Deals',
        value: metricsLoading ? '—' : String(metrics?.pendingDeals ?? 0),
        description: 'Awaiting completion',
        icon: HandshakeIcon,
        accent: '#a855f7', // purple/fuchsia
        trend: 'up' as const,
        spark: [],
      },
      {
        id: 'totalInvestors',
        title: 'Investors',
        value: metricsLoading ? '—' : String(metrics?.totalInvestors ?? 0),
        description: 'Total investors',
        icon: TrendingUp,
        accent: '#14b8a6', // teal
        trend: 'up' as const,
        spark: [],
      },
      {
        id: 'totalClients',
        title: 'Clients',
        value: metricsLoading ? '—' : String(metrics?.totalClients ?? 0),
        description: 'Total clients',
        icon: CircleUser,
        accent: '#06b6d4', // cyan
        trend: 'up' as const,
        spark: [],
      },
      {
        id: 'revenueThisMonth',
        title: t('dashboard.revenue'),
        value: metricsLoading ? '—' : `PKR ${(metrics?.revenueThisMonth ?? 0).toLocaleString()}`,
        description: 'Revenue (this month)',
        icon: DollarSign,
        accent: '#10b981', // emerald (revenue)
        trend: 'up' as const,
        spark: [],
        badgeBelow: true,
      },
    ],
    [t, metrics, metricsLoading]
  );

  const visibleStats = useMemo(
    () => stats.filter((s: any) => visibleStatIds.has(s.id)),
    [stats, visibleStatIds]
  );

  return (
    <div className="space-y-8 pb-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {adminRequired && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 relative">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">Admin access required</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            You were redirected from /admin because your account does not have the{' '}
            <code className="rounded bg-amber-200/50 dark:bg-amber-900/30 px-1">super_admin</code> role. To access the
            admin dashboard, your profile role must be set to{' '}
            <code className="rounded bg-amber-200/50 dark:bg-amber-900/30 px-1">super_admin</code> in the database. See{' '}
            <code className="rounded bg-amber-200/50 dark:bg-amber-900/30 px-1">ADMIN_ACCESS_FIX.md</code> for step-by-step
            instructions.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-amber-600 hover:bg-amber-200/50 dark:text-amber-400 dark:hover:bg-amber-800/50"
            onClick={dismissAdminRequired}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {metricsError && metricsError !== 'Unauthorized' && metricsError !== 'No organization found' && (
        <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <AlertTitle className="text-red-900 dark:text-red-100">Dashboard data error</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-200">{metricsError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('common.welcome')}, {profile?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle', { name: organization?.name || 'your dealership' })}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Cards
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show cards</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stats.map((s: any) => (
                <DropdownMenuCheckboxItem
                  key={s.id}
                  checked={visibleStatIds.has(s.id)}
                  onCheckedChange={() => toggleStatVisibility(s.id)}
                >
                  {s.title}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAndPersistVisibleStatIds(new Set(DEFAULT_VISIBLE_STAT_IDS))}>
                Reset (all)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAndPersistVisibleStatIds(new Set())}>
                Hide all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setShowCharts((v) => !v)} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {showCharts ? t('dashboard.hideCharts') : t('dashboard.showCharts')}
            {showCharts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/dashboard/inventory/new')}>
                <Car className="mr-2 h-4 w-4" />
                {t('dashboard.addVehicle')}
                <span className="ml-auto text-xs text-muted-foreground">{t('common.inventory')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/leads/new')}>
                <Users className="mr-2 h-4 w-4" />
                {t('dashboard.createLead')}
                <span className="ml-auto text-xs text-muted-foreground">{t('common.leads')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/deals/new')}>
                <HandshakeIcon className="mr-2 h-4 w-4" />
                {t('dashboard.recordDeal')}
                <span className="ml-auto text-xs text-muted-foreground">{t('common.pendingDeals')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/documents')}>
                <FileText className="mr-2 h-4 w-4" />
                {t('dashboard.uploadDocuments')}
                <span className="ml-auto text-xs text-muted-foreground">{t('common.documents')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStats.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm">No cards selected</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">Use the “Cards” menu to choose what you want to see.</div>
              <Button variant="outline" onClick={() => setAndPersistVisibleStatIds(new Set(DEFAULT_VISIBLE_STAT_IDS))}>
                Reset cards
              </Button>
            </CardContent>
          </Card>
        ) : (
          visibleStats.map((stat: any) => {
            const Pill = (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
                  stat.trend === 'up'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{stat.description}</span>
              </span>
            );

            return (
              <Card
                key={stat.title}
                className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>

                    {stat.badgeBelow ? (
                      <div className="space-y-2">
                        <div className="text-xl sm:text-2xl font-bold tabular-nums leading-tight break-words">
                          {stat.value}
                        </div>
                        <div className="w-fit">{Pill}</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="min-w-0 truncate text-xl sm:text-2xl font-bold tabular-nums leading-none">
                          {stat.value}
                        </span>
                        <span className="shrink-0">{Pill}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ml-2"
                    style={{ backgroundColor: `${stat.accent}15` }}
                  >
                    <stat.icon className="h-5 w-5" style={{ color: stat.accent }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <MiniSparkline data={stat.spark} color={stat.accent} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Charts (hidden by default) */}
      {showCharts && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="lg:col-span-4">
            <RevenueChart data={metrics?.revenueByMonth || []} />
          </div>
          <div className="lg:col-span-3">
            <DealStatusChart data={metrics?.dealStatus || []} />
          </div>
        </div>
      )}

      {/* Recent Activity - Full Width */}
      <RecentActivities limit={20} />
    </div>
  );
}

