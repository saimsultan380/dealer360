import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Car, TrendingUp, CreditCard, UserCheck } from 'lucide-react';
import { RevenueChart, InventoryChart } from '@/components/charts';
import { getPlatformStatsAdmin, getRecentOrganizationsAdmin } from '@/lib/actions/admin-platform';

export default async function AdminDashboardPage() {
    const { data: statsData } = await getPlatformStatsAdmin();
    const { data: recentOrgs } = await getRecentOrganizationsAdmin();

    const statsSource = statsData ?? {
        total_organizations: 0,
        active_subscriptions: 0,
        total_users: 0,
        total_vehicles: 0,
        total_leads: 0,
        total_deals: 0,
        completed_deals: 0,
        total_revenue: 0,
    };

    const stats = [
        {
            title: 'Total Organizations',
            value: statsSource.total_organizations,
            description: 'Registered dealerships',
            icon: Building2,
        },
        {
            title: 'Active Subscriptions',
            value: statsSource.active_subscriptions,
            description:
                statsSource.total_organizations > 0
                    ? `${Math.round((statsSource.active_subscriptions / statsSource.total_organizations) * 100)}% conversion`
                    : 'No organizations yet',
            icon: CreditCard,
        },
        {
            title: 'Total Users',
            value: statsSource.total_users,
            description: 'Across all organizations',
            icon: Users,
        },
        {
            title: 'Total Vehicles',
            value: statsSource.total_vehicles,
            description: 'In all inventories',
            icon: Car,
        },
        {
            title: 'Active Leads',
            value: statsSource.total_leads,
            description: 'Platform-wide inquiries',
            icon: UserCheck,
        },
        {
            title: 'Total Revenue',
            value: `PKR ${(statsSource.total_revenue / 1000000).toFixed(1)}M`,
            description: `${statsSource.completed_deals} completed deals`,
            icon: TrendingUp,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-muted-foreground">
                    Manage all dealerships and monitor platform performance.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RevenueChart />
                <div className="col-span-3">
                    <InventoryChart />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Organizations</CardTitle>
                        <CardDescription>Latest dealerships added to the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentOrgs.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No organizations yet.</div>
                        ) : (
                            <div className="space-y-3 text-sm text-muted-foreground">
                                {recentOrgs.map((o) => (
                                    <p key={o.id}>
                                        • {o.name} {o.city ? `- ${o.city}` : ''} ({new Date(o.created_at).toLocaleDateString()})
                                    </p>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Actions</CardTitle>
                        <CardDescription>Items requiring your attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p>• 3 payment verifications pending</p>
                            <p>• 2 subscription renewals due</p>
                            <p>• 1 new support ticket</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
