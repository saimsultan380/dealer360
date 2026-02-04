import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CountTrendChart,
  RevenueChart,
  InventoryChart,
} from "@/components/charts";
import {
  getInventoryByTypeAdmin,
  getLeadsTrendAdmin,
  getOrganizationsTrendAdmin,
  getPlatformStatsAdmin,
  getRevenueTrendAdmin,
  getSubscriptionBreakdownAdmin,
} from "@/lib/actions/admin-platform";

export default async function AdminAnalyticsPage() {
  const [
    { data: stats, error },
    { data: revenueTrend },
    { data: inventoryByType },
    { data: orgTrend },
    { data: leadsTrend },
    { data: breakdown },
  ] = await Promise.all([
    getPlatformStatsAdmin(),
    getRevenueTrendAdmin({ months: 6 }),
    getInventoryByTypeAdmin(),
    getOrganizationsTrendAdmin({ months: 6 }),
    getLeadsTrendAdmin({ months: 6 }),
    getSubscriptionBreakdownAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide insights and trends.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Organizations
              </CardTitle>
              <CardDescription>Total</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold font-figures tabular-nums">
              {stats?.total_organizations ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <CardDescription>Total</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold font-figures tabular-nums">
              {stats?.total_users ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
              <CardDescription>Total</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold font-figures tabular-nums">
              {stats?.total_vehicles ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CardDescription>Completed deals</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold font-figures tabular-nums">
              PKR {Math.round((stats?.total_revenue ?? 0) / 1000000)}M
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <RevenueChart data={revenueTrend} />
        </div>
        <div className="min-w-0">
          <InventoryChart data={inventoryByType} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CountTrendChart
          title="Organizations Growth"
          description="New organizations created per month"
          data={orgTrend}
          color="#2563eb"
        />
        <CountTrendChart
          title="Leads Trend"
          description="Platform-wide leads created per month"
          data={leadsTrend}
          color="#a855f7"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Breakdown by status and plan</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2 text-sm items-start">
          <div className="space-y-3">
            <div className="font-medium">By status</div>
            <div className="space-y-1 text-muted-foreground">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Trial</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byStatus.trial}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Active</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byStatus.active}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Suspended</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byStatus.suspended}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Cancelled</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byStatus.cancelled}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3 md:pl-8">
            <div className="font-medium">By plan</div>
            <div className="space-y-1 text-muted-foreground">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Basic</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byPlan.basic}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Professional</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byPlan.professional}
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <span>Enterprise</span>
                <span className="font-semibold text-foreground tabular-nums text-right font-figures">
                  {breakdown.byPlan.enterprise}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
