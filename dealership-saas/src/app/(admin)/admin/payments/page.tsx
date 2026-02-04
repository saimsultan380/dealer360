import { AdminPaymentsClient } from "@/components/admin/admin-payments-client";
import { listPaymentsAdmin } from "@/lib/actions/admin-payments";

export default async function AdminPaymentsPage() {
  const res = await listPaymentsAdmin({ status: "all", limit: 80 });
  if (res.error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        {res.error}
      </div>
    );
  }

  return <AdminPaymentsClient initial={res.data} />;
}
