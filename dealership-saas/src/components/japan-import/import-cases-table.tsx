'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination-advanced';
import { cn } from '@/lib/utils';
import type { JapanImportCase, JapanImportStatus } from '@/lib/types/database';
import { PrintInvoiceButton } from '@/components/invoice/print-invoice-button';

const statusStyle: Record<JapanImportStatus, string> = {
  planned: 'bg-muted text-foreground',
  purchased: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  in_transit: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  arrived_port: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  customs: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  ready_for_sale: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  sold: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-300',
};

export function JapanImportCasesTable(props: {
  cases: JapanImportCase[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (next: { page?: number; limit?: number }) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (next.page !== undefined) params.set('page', String(next.page));
    if (next.limit !== undefined) params.set('limit', String(next.limit));
    router.push(`/dashboard/japan-import?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Stock / Chassis</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">ETA</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {props.cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No import cases found.
                  </td>
                </tr>
              ) : (
                props.cases.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.stock_code || '—'}</div>
                      <div className="text-xs text-muted-foreground">{c.chassis_number || 'Chassis: —'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {(c.year ?? '—')} {c.make} {c.model}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.variant || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('capitalize', statusStyle[c.status])}>
                        {c.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.eta_date ? new Date(c.eta_date).toLocaleDateString('en-PK') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PrintInvoiceButton
                          entityId={c.id}
                          type="japan_import"
                          variant="outline"
                          size="sm"
                        />
                        <Link href={`/dashboard/japan-import/${c.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y">
          {props.cases.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No import cases found.</div>
          ) : (
            props.cases.map((c) => (
              <div key={c.id} className="p-4 hover:bg-muted/40">
                <Link href={`/dashboard/japan-import/${c.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {(c.year ?? '—')} {c.make} {c.model}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.stock_code ? `Stock: ${c.stock_code}` : 'Stock: —'} • {c.chassis_number ? `Chassis: ${c.chassis_number}` : 'Chassis: —'}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('capitalize shrink-0', statusStyle[c.status])}>
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    ETA: {c.eta_date ? new Date(c.eta_date).toLocaleDateString('en-PK') : '—'}
                  </div>
                </Link>
                <div className="mt-2 flex justify-end">
                  <PrintInvoiceButton entityId={c.id} type="japan_import" variant="outline" size="sm" label="Invoice" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {props.pagination.totalPages > 1 && (
        <Pagination
          currentPage={props.pagination.page}
          totalPages={props.pagination.totalPages}
          totalItems={props.pagination.total}
          itemsPerPage={props.pagination.limit}
          onPageChange={(p) => updateQuery({ page: p })}
          onItemsPerPageChange={(l) => updateQuery({ page: 1, limit: l })}
        />
      )}
    </div>
  );
}

