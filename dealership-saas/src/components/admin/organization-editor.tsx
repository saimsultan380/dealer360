'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updateOrganizationAdmin } from '@/lib/actions/organizations';

type Org = any;

export function OrganizationEditor({ organization }: { organization: Org }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState(organization?.name ?? '');
  const [city, setCity] = useState(organization?.city ?? '');
  const [phone, setPhone] = useState(organization?.phone ?? '');
  const [email, setEmail] = useState(organization?.email ?? '');
  const [subscriptionStatus, setSubscriptionStatus] = useState(organization?.subscription_status ?? 'trial');
  const [subscriptionPlan, setSubscriptionPlan] = useState(organization?.subscription_plan ?? 'basic');

  const flags = useMemo(() => (organization?.feature_flags ?? {}) as Record<string, any>, [organization]);
  const [maxVehicles, setMaxVehicles] = useState<string>(String(flags.max_vehicles ?? 100));
  const [maxUsers, setMaxUsers] = useState<string>(String(flags.max_users ?? 10));
  const [dealershipType, setDealershipType] = useState<string>(String(flags.dealership_type ?? 'local'));

  const [enableInventory, setEnableInventory] = useState(!!flags.enable_inventory);
  const [enableSales, setEnableSales] = useState(!!flags.enable_sales);
  const [enableExchangeDeals, setEnableExchangeDeals] = useState(!!flags.enable_exchange_deals);
  const [enableFinancing, setEnableFinancing] = useState(!!flags.enable_financing);
  const [enableLeads, setEnableLeads] = useState(!!flags.enable_leads);
  const [enableDeals, setEnableDeals] = useState(!!flags.enable_deals);
  const [enableDocuments, setEnableDocuments] = useState(!!flags.enable_documents);
  const [enableJapanImport, setEnableJapanImport] = useState(!!flags.enable_japan_import);
  const [enableImportDocuments, setEnableImportDocuments] = useState(!!flags.enable_import_documents);
  const [enableImportShipments, setEnableImportShipments] = useState(!!flags.enable_import_shipments);
  const [enableImportCustoms, setEnableImportCustoms] = useState(!!flags.enable_import_customs);
  const [enableImportInspections, setEnableImportInspections] = useState(!!flags.enable_import_inspections);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);

    const maxVehiclesInt = Math.max(1, parseInt(maxVehicles || '0', 10) || 0);
    const maxUsersInt = Math.max(1, parseInt(maxUsers || '0', 10) || 0);

    const nextFlags = {
      ...flags,
      max_vehicles: maxVehiclesInt,
      max_users: maxUsersInt,
      dealership_type: dealershipType,
      enable_inventory: enableInventory,
      enable_sales: enableSales,
      enable_exchange_deals: enableExchangeDeals,
      enable_financing: enableFinancing,
      enable_leads: enableLeads,
      enable_deals: enableDeals,
      enable_documents: enableDocuments,
      enable_japan_import: enableJapanImport,
      enable_import_documents: enableImportDocuments,
      enable_import_shipments: enableImportShipments,
      enable_import_customs: enableImportCustoms,
      enable_import_inspections: enableImportInspections,
    };

    const res = await updateOrganizationAdmin({
      id: organization.id,
      name,
      city,
      phone,
      email,
      subscription_status: subscriptionStatus,
      subscription_plan: subscriptionPlan,
      feature_flags: nextFlags,
    });

    if (res.error) {
      setErr(res.error);
    } else {
      setMsg('Saved successfully');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit</CardTitle>
        <CardDescription>Update subscription, limits, and enabled modules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {err && <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{err}</div>}
        {msg && <div className="rounded-md border bg-muted p-2 text-sm">{msg}</div>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Max Vehicles</Label>
            <Input type="number" value={maxVehicles} onChange={(e) => setMaxVehicles(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Max Users</Label>
            <Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subscription Status</Label>
            <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dealership Type</Label>
          <Select value={dealershipType} onValueChange={setDealershipType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (Pakistan)</SelectItem>
              <SelectItem value="japan_import">Japan Import</SelectItem>
              <SelectItem value="hybrid">Hybrid (Local + Import)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Modules</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow label="Inventory" checked={enableInventory} onCheckedChange={setEnableInventory} />
            <ToggleRow label="Sales" checked={enableSales} onCheckedChange={setEnableSales} />
            <ToggleRow label="Exchange Deals" checked={enableExchangeDeals} onCheckedChange={setEnableExchangeDeals} />
            <ToggleRow label="Financing" checked={enableFinancing} onCheckedChange={setEnableFinancing} />
            <ToggleRow label="Leads" checked={enableLeads} onCheckedChange={setEnableLeads} />
            <ToggleRow label="Deals" checked={enableDeals} onCheckedChange={setEnableDeals} />
            <ToggleRow label="Documents" checked={enableDocuments} onCheckedChange={setEnableDocuments} />
            <ToggleRow label="Japan Import" checked={enableJapanImport} onCheckedChange={setEnableJapanImport} />
            <ToggleRow
              label="Import Documents"
              checked={enableImportDocuments}
              onCheckedChange={setEnableImportDocuments}
              disabled={dealershipType === 'local'}
            />
            <ToggleRow
              label="Import Shipments"
              checked={enableImportShipments}
              onCheckedChange={setEnableImportShipments}
              disabled={dealershipType === 'local'}
            />
            <ToggleRow
              label="Import Customs"
              checked={enableImportCustoms}
              onCheckedChange={setEnableImportCustoms}
              disabled={dealershipType === 'local'}
            />
            <ToggleRow
              label="Import Inspections"
              checked={enableImportInspections}
              onCheckedChange={setEnableImportInspections}
              disabled={dealershipType === 'local'}
            />
          </div>
          {dealershipType === 'local' && (
            <p className="text-xs text-muted-foreground">
              Import modules are disabled while dealership type is Local.
            </p>
          )}
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ToggleRow(props: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="text-sm font-medium">{props.label}</div>
      <Switch checked={props.checked} onCheckedChange={props.onCheckedChange} disabled={props.disabled} />
    </div>
  );
}

