import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  Car,
  TrendingUp,
  CreditCard,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { RevenueChart, InventoryChart } from "@/components/charts";
import {
  getInventoryByTypeAdmin,
  getPendingActionsAdmin,
  getPendingPaymentsAdmin,
  getPlatformPublicSettingsAdmin,
  getPlatformStatsAdmin,
  getRecentOrganizationsAdmin,
  getRevenueTrendAdmin,
} from "@/lib/actions/admin-platform";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const [
    { data: statsData },
    { data: recentOrgs },
    { data: revenueTrend },
    { data: inventoryByType },
    { data: pendingActions },
    { data: pendingPayments },
    { data: platformPublic },
  ] = await Promise.all([
    getPlatformStatsAdmin(),
    getRecentOrganizationsAdmin(),
    getRevenueTrendAdmin({ months: 6 }),
    getInventoryByTypeAdmin(),
    getPendingActionsAdmin(),
    getPendingPaymentsAdmin({ limit: 5 }),
    getPlatformPublicSettingsAdmin(),
  ]);

  const statsSource = statsData ?? {
    total_organizations: 0,
    active_subscriptions: 0,
    total_users: 0,
    total_vehicles: 0,
    total_leads: 0,
    active_leads: 0,
    total_deals: 0,
    completed_deals: 0,
    total_revenue: 0,
  };

  const stats = [
    {
      title: "Total Organizations",
      value: statsSource.total_organizations,
      description: "Registered dealerships",
      icon: Building2,
    },
    {
      title: "Active Subscriptions",
      value: statsSource.active_subscriptions,
      description:
        statsSource.total_organizations > 0
          ? `${Math.round((statsSource.active_subscriptions / statsSource.total_organizations) * 100)}% conversion`
          : "No organizations yet",
      icon: CreditCard,
    },
    {
      title: "Total Users",
      value: statsSource.total_users,
      description: "Across all organizations",
      icon: Users,
    },
    {
      title: "Total Vehicles",
      value: statsSource.total_vehicles,
      description: "In all inventories",
      icon: Car,
    },
    {
      title: "Active Leads",
      value: statsSource.active_leads ?? statsSource.total_leads,
      description: "Platform-wide inquiries",
      icon: UserCheck,
    },
    {
      title: "Total Revenue",
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

      {/* Platform Alerts */}
      {platformPublic?.maintenance_mode && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Maintenance mode is enabled
              </CardTitle>
              <CardDescription>
                Non-super-admin users will be redirected to the maintenance
                page.
              </CardDescription>
            </div>
            <Badge variant="secondary">Maintenance</Badge>
          </CardHeader>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-figures tabular-nums">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <RevenueChart data={revenueTrend} />
        </div>
        <div className="min-w-0">
          <InventoryChart data={inventoryByType} />
        </div>
      </div>

      {/* Management Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Organizations */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent Organizations</CardTitle>
            <CardDescription>
              Latest dealerships added to the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {recentOrgs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No organizations yet.
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                {recentOrgs.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{o.name}</p>
                      {o.city && (
                        <p className="text-xs text-muted-foreground truncate">
                          {o.city} •{" "}
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      )}
                      {!o.city && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">
                  Payment verifications pending
                </span>
                <span className="text-base font-semibold">
                  {pendingActions.pending_payment_verifications}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">
                  Subscription renewals due (7 days)
                </span>
                <span className="text-base font-semibold">
                  {pendingActions.renewals_due_7d}
                </span>
              </div>
              <div className="pt-1 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/payments">Review payments</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/organizations">View organizations</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Pending payments</CardTitle>
              <CardDescription>
                Latest subscription payments awaiting verification
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/payments">Open payments</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {pendingPayments.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No pending payments.
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {p.organization_name ?? p.organization_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.payment_method} •{" "}
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-semibold whitespace-nowrap">
                      {p.currency} {Number(p.amount ?? 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
