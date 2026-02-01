'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createJapanImportCase } from '@/lib/actions/japan-import';
import type { JapanImportStatus } from '@/lib/types/database';

const STATUSES: JapanImportStatus[] = [
  'planned',
  'purchased',
  'in_transit',
  'arrived_port',
  'customs',
  'ready_for_sale',
  'sold',
  'cancelled',
];

export default function NewJapanImportCasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    stock_code: '',
    make: '',
    model: '',
    year: '',
    variant: '',
    chassis_number: '',
    engine_number: '',
    auction_grade: '',
    odometer_km: '',
    color: '',
    purchase_price_jpy: '',
    purchase_price_pkr: '',
    estimated_total_cost_pkr: '',
    shipment_port_from: '',
    shipment_port_to: '',
    eta_date: '',
    status: 'planned' as JapanImportStatus,
    notes: '',
  });

  const submit = async () => {
    setSaving(true);
    setError(null);

    const res = await createJapanImportCase({
      stock_code: form.stock_code || null,
      make: form.make,
      model: form.model,
      year: form.year ? Number(form.year) : null,
      variant: form.variant || null,
      chassis_number: form.chassis_number || null,
      engine_number: form.engine_number || null,
      auction_grade: form.auction_grade || null,
      odometer_km: form.odometer_km ? Number(form.odometer_km) : null,
      color: form.color || null,
      purchase_price_jpy: form.purchase_price_jpy ? Number(form.purchase_price_jpy) : null,
      purchase_price_pkr: form.purchase_price_pkr ? Number(form.purchase_price_pkr) : null,
      estimated_total_cost_pkr: form.estimated_total_cost_pkr ? Number(form.estimated_total_cost_pkr) : null,
      shipment_port_from: form.shipment_port_from || null,
      shipment_port_to: form.shipment_port_to || null,
      eta_date: form.eta_date || null,
      status: form.status,
      notes: form.notes || null,
    });

    if (res.error || !res.data) {
      setError(res.error || 'Failed to create import case');
      setSaving(false);
      return;
    }

    router.push(`/dashboard/japan-import/${res.data.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Japan Import Case</h1>
          <p className="text-muted-foreground">Add an import record even before it becomes local stock.</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Stock Code</Label>
            <Input value={form.stock_code} onChange={(e) => setForm({ ...form, stock_code: e.target.value })} placeholder="JP-001" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as JapanImportStatus })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Make *</Label>
            <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Toyota" />
          </div>
          <div className="space-y-2">
            <Label>Model *</Label>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Prius" />
          </div>

          <div className="space-y-2">
            <Label>Year</Label>
            <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2019" />
          </div>
          <div className="space-y-2">
            <Label>Variant</Label>
            <Input value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })} placeholder="S Touring" />
          </div>

          <div className="space-y-2">
            <Label>Chassis Number</Label>
            <Input value={form.chassis_number} onChange={(e) => setForm({ ...form, chassis_number: e.target.value })} placeholder="ZVW50-xxxxxx" />
          </div>
          <div className="space-y-2">
            <Label>Engine Number</Label>
            <Input value={form.engine_number} onChange={(e) => setForm({ ...form, engine_number: e.target.value })} placeholder="2ZR-xxxxx" />
          </div>

          <div className="space-y-2">
            <Label>Auction Grade</Label>
            <Input value={form.auction_grade} onChange={(e) => setForm({ ...form, auction_grade: e.target.value })} placeholder="4.5 / 5" />
          </div>
          <div className="space-y-2">
            <Label>Odometer (km)</Label>
            <Input type="number" value={form.odometer_km} onChange={(e) => setForm({ ...form, odometer_km: e.target.value })} placeholder="68000" />
          </div>

          <div className="space-y-2">
            <Label>Port From</Label>
            <Input value={form.shipment_port_from} onChange={(e) => setForm({ ...form, shipment_port_from: e.target.value })} placeholder="Yokohama" />
          </div>
          <div className="space-y-2">
            <Label>Port To</Label>
            <Input value={form.shipment_port_to} onChange={(e) => setForm({ ...form, shipment_port_to: e.target.value })} placeholder="Karachi" />
          </div>

          <div className="space-y-2">
            <Label>ETA Date</Label>
            <Input type="date" value={form.eta_date} onChange={(e) => setForm({ ...form, eta_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Pearl White" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Purchase Price (JPY)</Label>
            <Input type="number" value={form.purchase_price_jpy} onChange={(e) => setForm({ ...form, purchase_price_jpy: e.target.value })} placeholder="950000" />
          </div>
          <div className="space-y-2">
            <Label>Purchase Price (PKR)</Label>
            <Input type="number" value={form.purchase_price_pkr} onChange={(e) => setForm({ ...form, purchase_price_pkr: e.target.value })} placeholder="1,850,000" />
          </div>
          <div className="space-y-2">
            <Label>Est. Total Cost (PKR)</Label>
            <Input type="number" value={form.estimated_total_cost_pkr} onChange={(e) => setForm({ ...form, estimated_total_cost_pkr: e.target.value })} placeholder="2,350,000" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Auction details, condition notes, etc." />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.make || !form.model} className="w-full sm:w-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Creating...' : 'Create Import Case'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

