'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { getRecentActivities, RecentActivity } from '@/lib/actions/recent-activities';
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

export function RecentActivities({ limit = 20 }: RecentActivitiesProps) {
    const router = useRouter();
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivities = async () => {
        try {
            setRefreshing(true);
            const result = await getRecentActivities(limit);
            if (result.error && result.error !== 'Unauthorized' && result.error !== 'No organization found') {
                setError(result.error);
            } else {
                setActivities(result.data || []);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError('Failed to load activities');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [limit]);

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
                <div className="flex items-center justify-between">
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
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm mt-2">Activities will appear here as you use the system</p>
                    </div>
                ) : (
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
                )}
            </CardContent>
        </Card>
    );
}
