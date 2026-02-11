'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pagination } from '@/components/ui/pagination-advanced';
import {
    Car,
    ShoppingCart,
    TrendingUp,
    Wallet,
    Users,
    HandshakeIcon,
    UserPlus,
    Clock,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';
import { getRecentActivities, RecentActivity, DateFilter } from '@/lib/actions/recent-activities';
import { cn } from '@/lib/utils';

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
    const iconClass = 'h-4 w-4';
    switch (type) {
        case 'vehicle':
            return <Car className={iconClass} />;
        case 'sale':
            return <ShoppingCart className={iconClass} />;
        case 'investor':
            return <TrendingUp className={iconClass} />;
        case 'cash_flow':
            return <Wallet className={iconClass} />;
        case 'client':
            return <UserPlus className={iconClass} />;
        case 'deal':
            return <HandshakeIcon className={iconClass} />;
        case 'lead':
            return <Users className={iconClass} />;
        default:
            return <Clock className={iconClass} />;
    }
}

function ActivityBadge({ type, status }: { type: RecentActivity['type']; status?: string }) {
    const typeColors: Record<RecentActivity['type'], { bg: string; text: string }> = {
        vehicle: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
        sale: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        investor: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
        cash_flow: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
        client: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
        deal: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
        lead: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
    };

    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
        completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
        active: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        inactive: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400' },
    };

    if (status && statusColors[status]) {
        const colors = statusColors[status];
        return (
            <Badge className={cn('text-xs', colors.bg, colors.text)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    }

    const colors = typeColors[type] || typeColors.vehicle;
    return (
        <Badge className={cn('text-xs', colors.bg, colors.text)}>
            {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
    );
}

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    return time.toLocaleDateString('en-PK', {
        month: 'short',
        day: 'numeric',
        year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

interface RecentActivitiesProps {
    limit?: number;
}

export function RecentActivities({ limit: initialLimit = 20 }: RecentActivitiesProps) {
    const router = useRouter();
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialLimit);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchActivities = useCallback(async () => {
        try {
            setRefreshing(true);
            const result = await getRecentActivities(pageSize, page, dateFilter);
            if (result.error && result.error !== 'Unauthorized' && result.error !== 'No organization found') {
                setError(result.error);
            } else {
                setActivities(result.data || []);
                setTotal(result.total || 0);
                setTotalPages(result.totalPages || 0);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Failed to load activities');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pageSize, page, dateFilter]);

    useEffect(() => {
        setPage(1); // Reset to first page when filter changes
    }, [dateFilter]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from all modules</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error && activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from all modules</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchActivities}
                            className="mt-4"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates from all modules</CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchActivities}
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    </Button>
                </div>
                
                {/* Date Filter Tabs */}
                <Tabs value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="today" className="text-xs sm:text-sm">Today</TabsTrigger>
                        <TabsTrigger value="last_week" className="text-xs sm:text-sm">Last Week</TabsTrigger>
                        <TabsTrigger value="last_month" className="text-xs sm:text-sm">Last Month</TabsTrigger>
                        <TabsTrigger value="all" className="text-xs sm:text-sm">All Time</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm mt-2">
                            {dateFilter === 'all' 
                                ? 'Activities will appear here as you use the system'
                                : `No activities found for ${dateFilter === 'today' ? 'today' : dateFilter === 'last_week' ? 'the last week' : 'the last month'}`
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={cn(
                                        'flex items-start gap-4 p-3 rounded-lg border transition-colors',
                                        activity.link && 'hover:bg-accent cursor-pointer'
                                    )}
                                    onClick={() => activity.link && router.push(activity.link)}
                                >
                                    <div
                                        className={cn(
                                            'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                                            activity.type === 'vehicle' && 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                                            activity.type === 'sale' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                            activity.type === 'investor' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                                            activity.type === 'cash_flow' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                            activity.type === 'client' && 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
                                            activity.type === 'deal' && 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                                            activity.type === 'lead' && 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
                                        )}
                                    >
                                        <ActivityIcon type={activity.type} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{activity.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                    {activity.description}
                                                </p>
                                                {activity.amount && (
                                                    <p className="text-sm font-semibold text-primary mt-1">
                                                        PKR {activity.amount.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <ActivityBadge type={activity.type} status={activity.status} />
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatTimeAgo(activity.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {activity.link && (
                                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 pt-6 border-t">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    totalItems={total}
                                    itemsPerPage={pageSize}
                                    onPageChange={setPage}
                                    onItemsPerPageChange={(newSize) => {
                                        setPageSize(newSize);
                                        setPage(1);
                                    }}
                                    isLoading={refreshing}
                                />
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
