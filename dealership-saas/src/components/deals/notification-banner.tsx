'use client';

import { AlertTriangle, Clock, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NotificationBannerProps {
    pendingDeals: Array<{
        id: string;
        customer_name: string;
        vehicle_make?: string;
        vehicle_model?: string;
        days_until_payment: number | null;
        is_overdue: boolean;
        remaining_amount: number;
        payment_date: string | null;
    }>;
    onDismiss?: () => void;
}

export function NotificationBanner({ pendingDeals, onDismiss }: NotificationBannerProps) {
    const overdueDeals = pendingDeals.filter(d => d.is_overdue);
    const upcomingDeals = pendingDeals.filter(
        d => !d.is_overdue && d.days_until_payment !== null && d.days_until_payment <= 7 && d.days_until_payment >= 0
    );

    const totalOverdue = overdueDeals.reduce((sum, d) => sum + d.remaining_amount, 0);
    const totalUpcoming = upcomingDeals.reduce((sum, d) => sum + d.remaining_amount, 0);

    if (overdueDeals.length === 0 && upcomingDeals.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 mb-6">
            {overdueDeals.length > 0 && (
                <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20 relative">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <AlertTitle className="text-orange-900 dark:text-orange-100">
                        Overdue Payments ({overdueDeals.length})
                    </AlertTitle>
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                        <div className="space-y-2">
                            <p>
                                <strong>PKR {totalOverdue.toLocaleString()}</strong> in overdue payments from{' '}
                                <strong>{overdueDeals.length}</strong> deal{overdueDeals.length > 1 ? 's' : ''}.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {overdueDeals.slice(0, 3).map((deal) => (
                                    <li key={deal.id}>
                                        {deal.customer_name} - {deal.vehicle_make} {deal.vehicle_model} - PKR{' '}
                                        {deal.remaining_amount.toLocaleString()}
                                    </li>
                                ))}
                                {overdueDeals.length > 3 && (
                                    <li className="font-semibold">+{overdueDeals.length - 3} more</li>
                                )}
                            </ul>
                        </div>
                    </AlertDescription>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                            onClick={onDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </Alert>
            )}

            {upcomingDeals.length > 0 && (
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 relative">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-900 dark:text-amber-100">
                        Upcoming Payments ({upcomingDeals.length})
                    </AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <div className="space-y-2">
                            <p>
                                <strong>PKR {totalUpcoming.toLocaleString()}</strong> due within 7 days from{' '}
                                <strong>{upcomingDeals.length}</strong> deal{upcomingDeals.length > 1 ? 's' : ''}.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {upcomingDeals.slice(0, 3).map((deal) => (
                                    <li key={deal.id}>
                                        {deal.customer_name} - {deal.vehicle_make} {deal.vehicle_model} - PKR{' '}
                                        {deal.remaining_amount.toLocaleString()} (
                                        {deal.days_until_payment === 0
                                            ? 'Today'
                                            : deal.days_until_payment === 1
                                              ? 'Tomorrow'
                                              : `${deal.days_until_payment} days`}
                                        )
                                    </li>
                                ))}
                                {upcomingDeals.length > 3 && (
                                    <li className="font-semibold">+{upcomingDeals.length - 3} more</li>
                                )}
                            </ul>
                        </div>
                    </AlertDescription>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                            onClick={onDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </Alert>
            )}
        </div>
    );
}
