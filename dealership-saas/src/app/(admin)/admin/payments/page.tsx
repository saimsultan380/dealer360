import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPaymentsPage() {
  // Minimal payments page: lists recent payment rows (if table exists)
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="text-sm text-muted-foreground">Unauthorized</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'super_admin') {
    return <div className="text-sm text-muted-foreground">Forbidden</div>;
  }

  const admin = (createAdminClient() as any);

  let payments: any[] = [];
  let error: string | null = null;
  try {
    const res = await admin
      .from('payments')
      .select('id, organization_id, amount, currency, payment_method, status, created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    if (res.error) error = res.error.message;
    payments = res.data ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load payments';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Review platform payments and subscription transactions.</p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Last 30 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No payments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 text-left">Date</th>
                      <th className="py-2 text-left">Org</th>
                      <th className="py-2 text-left">Method</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="py-2 font-mono text-xs">{String(p.organization_id).slice(0, 8)}…</td>
                        <td className="py-2">{p.payment_method}</td>
                        <td className="py-2 text-right">
                          {p.currency ?? 'PKR'} {Number(p.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

