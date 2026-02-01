'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    HandshakeIcon, 
    DollarSign, 
    Car, 
    Users, 
    Activity,
    Clock,
    TrendingUp,
    AlertCircle,
    BarChart3,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { getTodayActivities, TodayActivity, TodaySummary } from '@/lib/actions/today-book';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    ComposedChart, 
    Area, 
    AreaChart,
    PieChart, 
    Pie, 
    Cell,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { subscribeToActivityLogs, subscribeToCashTransactions, subscribeToDeals, subscribeToLeads, subscribeToVehicles } from '@/lib/supabase/realtime';

// Sparkline component for metric cards
function Sparkline({ data, color }: { data: { hour: number; value: number }[]; color: string }) {
    return (
        <div className="h-12 w-full opacity-60">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${color})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function ActivityIcon({ type }: { type: TodayActivity['type'] }) {
    switch (type) {
        case 'deal':
            return <HandshakeIcon className="h-4 w-4" />;
        case 'payment':
            return <DollarSign className="h-4 w-4" />;
        case 'vehicle':
            return <Car className="h-4 w-4" />;
        case 'lead':
            return <Users className="h-4 w-4" />;
        case 'activity_log':
            return <Activity className="h-4 w-4" />;
        default:
            return <Activity className="h-4 w-4" />;
    }
}

function StatusBadge({ status }: { status?: string }) {
    if (!status) return null;

    const statusConfig: Record<string, { bg: string; text: string; glow: string; label: string }> = {
        'pending': { 
            bg: 'bg-amber-50 dark:bg-amber-950/30', 
            text: 'text-amber-700 dark:text-amber-400',
            glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
            label: 'Pending' 
        },
        'completed': { 
            bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
            text: 'text-emerald-700 dark:text-emerald-500',
            glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
            label: 'Completed' 
        },
        'cancelled': { 
            bg: 'bg-red-50 dark:bg-red-950/30', 
            text: 'text-red-700 dark:text-red-400',
            glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
            label: 'Cancelled' 
        },
        'failed': { 
            bg: 'bg-red-50 dark:bg-red-950/30', 
            text: 'text-red-700 dark:text-red-400',
            glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
            label: 'Failed' 
        },
        'new': { 
            bg: 'bg-blue-50 dark:bg-blue-950/30', 
            text: 'text-blue-700 dark:text-blue-400',
            glow: 'shadow-[0_0_8px_rgba(59,130,246,0.3)]',
            label: 'New' 
        },
        'active': { 
            bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
            text: 'text-emerald-700 dark:text-emerald-500',
            glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
            label: 'Active' 
        },
    };

    const config = statusConfig[status.toLowerCase()] || { 
        bg: 'bg-gray-50 dark:bg-gray-950/30', 
        text: 'text-gray-700 dark:text-gray-400',
        glow: '',
        label: status 
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
            config.bg,
            config.text,
            config.glow
        )}>
            {config.label}
        </span>
    );
}

function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function TodayBookPage() {
    const { organization } = useAuthStore();
    // IMPORTANT: Keep a stable, always-present dependency for useEffect.
    // React (and/or compiler transforms) can error if the dependency array length changes
    // between renders (e.g. [] → [orgId]). This sentinel prevents that.
    const orgIdDep = organization?.id ?? '__no_org__';
    const [summary, setSummary] = useState<TodaySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCharts, setShowCharts] = useState(false);
    const refreshTimer = useRef<any>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData(opts?: { silent?: boolean }) {
            if (!opts?.silent) {
                setLoading(true);
            }
            setError(null);
            const result = await getTodayActivities();
            if (cancelled) return;
            if (result.error) {
                setError(result.error);
            } else {
                setSummary(result.data);
            }
            if (!opts?.silent) {
                setLoading(false);
            }
        }

        fetchData();

        // Keep a lightweight polling fallback (in case realtime disconnects)
        const interval = setInterval(() => fetchData({ silent: true }), 60_000);

        // Realtime: refresh when tables change (debounced)
        const orgId = organization?.id;
        let unsubDeals: (() => void) | null = null;
        let unsubCash: (() => void) | null = null;
        let unsubVehicles: (() => void) | null = null;
        let unsubLeads: (() => void) | null = null;
        let unsubLogs: (() => void) | null = null;

        const scheduleRefresh = () => {
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            refreshTimer.current = setTimeout(() => {
                fetchData({ silent: true });
            }, 500);
        };

        if (orgId) {
            const callbacks = { onInsert: scheduleRefresh, onUpdate: scheduleRefresh, onDelete: scheduleRefresh };
            unsubDeals = subscribeToDeals(callbacks as any, orgId);
            unsubCash = subscribeToCashTransactions(callbacks as any, orgId);
            unsubVehicles = subscribeToVehicles(callbacks as any, orgId);
            unsubLeads = subscribeToLeads(callbacks as any, orgId);
            unsubLogs = subscribeToActivityLogs(callbacks as any, orgId);
        }

        return () => {
            cancelled = true;
            clearInterval(interval);
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            unsubDeals?.();
            unsubCash?.();
            unsubVehicles?.();
            unsubLeads?.();
            unsubLogs?.();
        };
    }, [orgIdDep]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Today&apos;s Book</h1>
                    <p className="text-muted-foreground">Quick summary of all today&apos;s activities</p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <p>Error loading today&apos;s activities: {error}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Today&apos;s Book</h1>
                    <p className="text-muted-foreground">Quick summary of all today&apos;s activities</p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">No data available</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hourly = summary.series?.hourly ?? [];
    const revenueBySource = summary.series?.revenueByPaymentMethod ?? [];
    const weeklyData = summary.series?.dailyRevenue7d ?? [];

    const chartConfig = {
        revenue: {
            label: 'Revenue',
            color: 'hsl(142, 76%, 36%)',
        },
    };

    const spark = useMemo(() => {
        const points = hourly.length === 24 ? hourly : Array.from({ length: 24 }, (_, h) => ({ hour: h, deals: 0, payments: 0, vehicles: 0, leads: 0, revenue: 0 }));
        return {
            deals: points.map((p) => ({ hour: p.hour, value: p.deals })),
            payments: points.map((p) => ({ hour: p.hour, value: p.payments })),
            vehicles: points.map((p) => ({ hour: p.hour, value: p.vehicles })),
            leads: points.map((p) => ({ hour: p.hour, value: p.leads })),
        };
    }, [hourly]);

    const stats = [
        {
            title: 'Total Deals',
            value: summary.totalDeals.toString(),
            description: 'Deals created today',
            icon: HandshakeIcon,
            color: '#3b82f6',
            sparklineData: spark.deals,
        },
        {
            title: 'Payments',
            value: summary.totalPayments.toString(),
            description: 'Payments received today',
            icon: DollarSign,
            color: '#10b981',
            sparklineData: spark.payments,
        },
        {
            title: 'New Vehicles',
            value: summary.newVehicles.toString(),
            description: 'Added to inventory',
            icon: Car,
            color: '#8b5cf6',
            sparklineData: spark.vehicles,
        },
        {
            title: 'New Leads',
            value: summary.newLeads.toString(),
            description: 'Leads created today',
            icon: Users,
            color: '#f97316',
            sparklineData: spark.leads,
        },
    ];

    return (
        <div className="space-y-8 pb-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Today&apos;s Book</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Quick summary of all today&apos;s activities and transactions
                </p>
            </div>

            {/* Summary Cards with Glassmorphism */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card 
                        key={stat.title}
                        className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div 
                                className="h-10 w-10 rounded-lg flex items-center justify-center"
                                style={{ 
                                    backgroundColor: `${stat.color}15`,
                                }}
                            >
                                <stat.icon 
                                    className="h-5 w-5" 
                                    style={{ color: stat.color }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-2xl font-bold mb-2">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mb-3">{stat.description}</p>
                            <Sparkline data={stat.sparklineData} color={stat.color} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Toggle Button */}
            <div className="flex items-center justify-end">
                <Button
                    variant="outline"
                    onClick={() => setShowCharts(!showCharts)}
                    className="gap-2"
                >
                    <BarChart3 className="h-4 w-4" />
                    {showCharts ? 'Hide Charts' : 'Show Charts'}
                    {showCharts ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Charts Section */}
            {showCharts && (
                <div className="space-y-6">
                    {/* Hero Revenue Card with Doughnut Chart */}
                    <Card 
                        className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                            "bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20"
                        )}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        Total Revenue
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Revenue breakdown by payment source
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                        PKR {(summary.totalRevenue / 1000000).toFixed(1)}M
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">From all deals today</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="h-[200px]">
                                    {revenueBySource.length === 0 ? (
                                        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                                            No revenue breakdown yet
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={revenueBySource}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {revenueBySource.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: number) => `PKR ${(value / 1000000).toFixed(1)}M`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center gap-3">
                                    {revenueBySource.map((source, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: source.color }}
                                                />
                                                <span className="text-sm font-medium">{source.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                PKR {(source.value / 1000000).toFixed(1)}M
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue (Last 7 Days) */}
                    <Card 
                        className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:shadow-lg"
                        )}
                    >
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Revenue (Last 7 Days)</CardTitle>
                            <CardDescription>Completed deals revenue by day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <ComposedChart data={weeklyData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                        />
                                        <ChartTooltip 
                                            content={<ChartTooltipContent />}
                                            formatter={(value: number) => `PKR ${(value / 1000000).toFixed(1)}M`}
                                        />
                                        <Bar 
                                            dataKey="revenue" 
                                            fill="url(#revenueGradient)" 
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </ComposedChart>
                                </ChartContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Activities Timeline */}
            <Card 
                className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-lg"
                )}
            >
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Today&apos;s Activities</CardTitle>
                    <CardDescription>
                        All transactions and activities from today ({summary.activities.length} items)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium">No activities today</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Activities will appear here as they happen
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {summary.activities.map((activity, index) => {
                                const statusColor = activity.status === 'completed' 
                                    ? 'emerald' 
                                    : activity.status === 'pending'
                                    ? 'amber'
                                    : 'blue';

                                // Only keep a colored border per status; shadow is applied on hover only
                                const statusBorder = activity.status === 'completed'
                                    ? 'border-emerald-500/20'
                                    : activity.status === 'pending'
                                    ? 'border-amber-500/20'
                                    : 'border-blue-500/20';
                                
                                return (
                                    <div
                                        key={activity.id}
                                        className={cn(
                                            "group relative rounded-xl border transition-all duration-300",
                                            "bg-card hover:shadow-lg hover:-translate-y-0.5",
                                            statusBorder
                                        )}
                                    >
                                        <div className="p-4 sm:p-5">
                                            <div className="flex items-start justify-between gap-3 sm:gap-4">
                                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                                    {/* Icon with colored background */}
                                                    <div className={cn(
                                                        "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-all group-hover:scale-110 shrink-0",
                                                        activity.status === 'completed'
                                                            ? "bg-emerald-100 dark:bg-emerald-900/40"
                                                            : activity.status === 'pending'
                                                            ? "bg-amber-100 dark:bg-amber-900/40"
                                                            : "bg-blue-100 dark:bg-blue-900/40"
                                                    )}>
                                                        <div className={cn(
                                                            activity.status === 'completed'
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : activity.status === 'pending'
                                                                ? "text-amber-600 dark:text-amber-400"
                                                                : "text-blue-600 dark:text-blue-400"
                                                        )}>
                                                            <ActivityIcon type={activity.type} />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm sm:text-base font-semibold">{activity.title}</p>
                                                            {activity.status && (
                                                                <StatusBadge status={activity.status} />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {activity.description}
                                                        </p>
                                                        {activity.amount && (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                                    PKR {activity.amount.toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Timestamp */}
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="whitespace-nowrap">{formatTime(activity.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Subtle bottom border for separation (except last item) */}
                                        {index < summary.activities.length - 1 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-px bg-border/50" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
