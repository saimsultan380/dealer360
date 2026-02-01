import { getPendingDeals } from '@/lib/actions/deals';
import { PendingDealsTable } from '@/components/deals/pending-deals-table';
import { NotificationBanner } from '@/components/deals/notification-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default async function PendingDealsPage() {
    const { data: pendingDeals, error } = await getPendingDeals();

    // Only show non-unauthorized errors
    if (error && error !== 'Unauthorized' && error !== 'No organization found') {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Pending Deals</h1>
                    <p className="text-muted-foreground mt-2">
                        Track and manage pending payments from vehicle sales
                    </p>
                </div>
            </div>

            {/* Notification Banner */}
            <NotificationBanner pendingDeals={pendingDeals || []} />

            {/* Main Content */}
            <PendingDealsTable deals={pendingDeals || []} />
        </div>
    );
}
