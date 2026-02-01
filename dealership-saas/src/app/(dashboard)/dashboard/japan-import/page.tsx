import Link from 'next/link';
import { Plus, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getJapanImportCases } from '@/lib/actions/japan-import';
import { JapanImportCasesTable } from '@/components/japan-import/import-cases-table';

export default async function JapanImportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; limit?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? '';
  const status = (sp.status ?? 'all') as any;
  const page = Number(sp.page) || 1;
  const limit = Number(sp.limit) || 10;

  const { data, metadata, error } = await getJapanImportCases({
    search: q,
    status,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Japan Import
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track auction → shipment → port arrival → customs → inspection → ready for sale.
          </p>
        </div>
        <Link href="/dashboard/japan-import/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            New Import Case
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-card/60 backdrop-blur-sm">
        <div className="p-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={q} placeholder="Search stock, make, model, chassis..." className="pl-10 w-full" />
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="planned">Planned</option>
                <option value="purchased">Purchased</option>
                <option value="in_transit">In Transit</option>
                <option value="arrived_port">Arrived Port</option>
                <option value="customs">Customs</option>
                <option value="ready_for_sale">Ready for Sale</option>
                <option value="sold">Sold</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button type="submit" variant="outline" className="sm:w-auto">
                Filter
              </Button>
            </div>
          </form>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <JapanImportCasesTable cases={data} pagination={metadata} />
    </div>
  );
}

