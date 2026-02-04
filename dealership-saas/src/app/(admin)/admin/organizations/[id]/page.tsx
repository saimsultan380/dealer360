import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrganizationByIdAdmin } from "@/lib/actions/organizations";
import { OrganizationEditor } from "../../../../../components/admin/organization-editor";
import {
  getOrganizationPaymentsAdmin,
  getOrganizationPaymentsStatsAdmin,
} from "@/lib/actions/admin-payments";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  trial: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  suspended: "bg-red-500/10 text-red-700 dark:text-red-400",
  cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const planColors: Record<string, string> = {
  basic: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  professional: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  enterprise: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: org, error }, paymentsRes, statsRes] = await Promise.all([
    getOrganizationByIdAdmin(id),
    getOrganizationPaymentsAdmin({ organizationId: id }),
    getOrganizationPaymentsStatsAdmin({ organizationId: id }),
  ]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/organizations">
          <Button variant="outline">← Back</Button>
        </Link>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  const payments = paymentsRes.data;
  const stats = statsRes.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{org?.name}</h1>
          <p className="text-muted-foreground">
            Organization management and module configuration.
          </p>
          <div className="flex gap-2 pt-2">
            <Badge
              variant="secondary"
              className={statusColors[org.subscription_status] ?? ""}
            >
              {org.subscription_status}
            </Badge>
            <Badge
              variant="secondary"
              className={planColors[org.subscription_plan] ?? ""}
            >
              {org.subscription_plan}
            </Badge>
          </div>
        </div>

        <Link href="/admin/organizations">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Basic organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">City:</span>{" "}
              {org.city ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {org.phone ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              {org.email ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              {org.created_at ? new Date(org.created_at).toLocaleString() : "-"}
            </div>
            <div className="flex gap-4 pt-2">
              <div>
                <span className="text-muted-foreground">Users:</span>{" "}
                {org.profiles?.[0]?.count ?? 0}
              </div>
              <div>
                <span className="text-muted-foreground">Vehicles:</span>{" "}
                {org.vehicles?.[0]?.count ?? 0}
              </div>
            </div>
            {stats && (
              <div className="pt-4 space-y-1">
                <div>
                  <span className="text-muted-foreground">
                    Completed revenue:
                  </span>{" "}
                  PKR {stats.completed_amount.toLocaleString()} (
                  {stats.completed_payments} payments)
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Pending amount:
                  </span>{" "}
                  PKR {stats.pending_amount.toLocaleString()} (
                  {stats.pending_payments} pending)
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.first_payment_at
                    ? `History from ${new Date(
                        stats.first_payment_at
                      ).toLocaleDateString()} to ${new Date(
                        stats.last_payment_at ?? stats.first_payment_at
                      ).toLocaleDateString()}`
                    : "No payment history yet."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <OrganizationEditor organization={org} />

          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>
                All subscription payments for this organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments found for this organization.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2">Plan / Period</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Refs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">
                            {new Date(p.created_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 capitalize">
                            {p.status}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {p.currency ?? "PKR"}{" "}
                            {Number(p.amount ?? 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {p.subscription_plan ?? "—"}
                            {p.period_start && p.period_end && (
                              <>
                                <br />
                                {new Date(
                                  p.period_start
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(
                                  p.period_end
                                ).toLocaleDateString()}
                              </>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {p.payment_method ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {p.transaction_id && (
                              <div>txn: {p.transaction_id}</div>
                            )}
                            {p.external_reference && (
                              <div>ext: {p.external_reference}</div>
                            )}
                            {!p.transaction_id && !p.external_reference && (
                              <div>—</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
