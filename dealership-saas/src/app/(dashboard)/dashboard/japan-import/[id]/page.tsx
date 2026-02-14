import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getJapanImportCaseById } from '@/lib/actions/japan-import';
import { JapanImportCaseTabs } from '@/components/japan-import/import-case-tabs';
import { JapanImportStatusUpdater } from '@/components/japan-import/status-updater';
import { PrintInvoiceButton } from '@/components/invoice/print-invoice-button';

export default async function JapanImportCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getJapanImportCaseById(id);

  if (res.error || !res.data) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/japan-import">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {res.error || 'Import case not found'}
        </div>
      </div>
    );
  }

  const c = res.data.importCase;
  const docs = res.data.documents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/japan-import">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">
                {(c.year ?? '—')} {c.make} {c.model}
              </h1>
              <Badge variant="outline" className="capitalize">
                {c.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {c.stock_code ? `Stock: ${c.stock_code}` : 'Stock: —'} • {c.chassis_number ? `Chassis: ${c.chassis_number}` : 'Chassis: —'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2 w-full sm:w-auto">
            <PrintInvoiceButton
              entityId={c.id}
              type="japan_import"
              variant="outline"
              label="Print Invoice"
              className="flex-1 sm:flex-none"
            />
            <Link href={`/dashboard/japan-import/${c.id}/edit`} className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto">
                Edit Case
              </Button>
            </Link>
          </div>
          <JapanImportStatusUpdater caseId={c.id} status={c.status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ETA</CardTitle>
            <CardDescription>Estimated arrival date</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {c.eta_date ? new Date(c.eta_date).toLocaleDateString('en-PK') : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Auction Grade</CardTitle>
            <CardDescription>Japan auction condition</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{c.auction_grade || '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Odometer</CardTitle>
            <CardDescription>Recorded mileage</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{c.odometer_km ? `${Number(c.odometer_km).toLocaleString()} km` : '—'}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Details</CardTitle>
            <CardDescription>Key fields for the import workflow</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Ports</div>
              <div className="font-medium">
                {c.shipment_port_from || '—'} → {c.shipment_port_to || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Color</div>
              <div className="font-medium">{c.color || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Purchase (JPY)</div>
              <div className="font-medium">{c.purchase_price_jpy ? Number(c.purchase_price_jpy).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Est. Total Cost (PKR)</div>
              <div className="font-medium">{c.estimated_total_cost_pkr ? `PKR ${Number(c.estimated_total_cost_pkr).toLocaleString()}` : '—'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-muted-foreground">Notes</div>
              <div className="text-sm whitespace-pre-wrap">{c.notes || '—'}</div>
            </div>
          </CardContent>
        </Card>

        <JapanImportCaseTabs
          importCaseId={c.id}
          importStatus={c.status}
          linkedVehicleId={c.vehicle_id ?? null}
          documents={docs}
          shipment={res.data.shipment}
          customs={res.data.customs}
          inspection={res.data.inspection}
          auction={res.data.auction}
          costing={res.data.costing}
        />
      </div>
    </div>
  );
}

