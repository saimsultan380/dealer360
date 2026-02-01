'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Car, FileText, Globe, Ship, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { getOrganizationModuleConfig, updateOrganizationModuleConfig, type OrgModulesConfig } from '@/lib/actions/org-modules';
import type { DealershipType } from '@/lib/types/database';

function ToggleRow(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
          {props.icon}
        </div>
        <div className="min-w-0">
          <div className="font-medium">{props.title}</div>
          <div className="text-sm text-muted-foreground">{props.description}</div>
        </div>
      </div>
      <Switch checked={props.checked} onCheckedChange={props.onCheckedChange} disabled={props.disabled} />
    </div>
  );
}

const DEFAULT_MODULES: OrgModulesConfig = {
  inventory: true,
  sales: true,
  exchange_deals: true,
  financing: true,
  leads: true,
  deals: true,
  documents: true,
  cash_flow: true,
  ledger: true,
  clients: true,
  investors: true,
  japan_import: false,
  import_documents: false,
  import_shipments: false,
  import_customs: false,
  import_inspections: false,
};

export function DealershipModulesSettings() {
  const { profile, setOrganization } = useAuthStore();
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dealershipType, setDealershipType] = useState<DealershipType>('local');
  const [modules, setModules] = useState<OrgModulesConfig>(DEFAULT_MODULES);

  const japanSectionDisabled = useMemo(() => dealershipType === 'local', [dealershipType]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await getOrganizationModuleConfig();
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setDealershipType(res.data.dealership_type);
        setModules({ ...DEFAULT_MODULES, ...res.data.modules });
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    // If the dealership is local-only, force-disable japan import modules in UI (still saved on submit).
    if (dealershipType === 'local') {
      setModules((m) => ({
        ...m,
        japan_import: false,
        import_documents: false,
        import_shipments: false,
        import_customs: false,
        import_inspections: false,
      }));
    }
  }, [dealershipType]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await updateOrganizationModuleConfig({
      dealership_type: dealershipType,
      modules,
    });

    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }

    // Keep client store in sync so sidebar reacts immediately.
    if (res.data) setOrganization(res.data);
    setSuccess('Configuration saved');
    setTimeout(() => setSuccess(null), 2500);
    setSaving(false);
  };

  if (!canEdit) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        You don&apos;t have permission to edit module configuration. Ask your admin/manager.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">{success}</div>}

      <div className="space-y-2">
        <div className="text-sm font-medium">Dealership type</div>
        <div className="text-sm text-muted-foreground">
          Choose how this dealership operates. This controls which module groups are available.
        </div>
        <div className="max-w-md">
          <Select value={dealershipType} onValueChange={(v) => setDealershipType(v as DealershipType)} disabled={loading || saving}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select dealership type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (Pakistan)</SelectItem>
              <SelectItem value="japan_import">Japan Import</SelectItem>
              <SelectItem value="hybrid">Hybrid (Local + Import)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <div className="font-medium">Core modules</div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            icon={<Car className="h-4 w-4 text-primary" />}
            title="Inventory"
            description="Vehicles stock management"
            checked={modules.inventory}
            onCheckedChange={(v) => setModules((m) => ({ ...m, inventory: v }))}
            disabled={loading || saving}
          />
          <ToggleRow
            icon={<Car className="h-4 w-4 text-primary" />}
            title="Sales"
            description="Sales pipeline and invoices"
            checked={modules.sales}
            onCheckedChange={(v) => setModules((m) => ({ ...m, sales: v }))}
            disabled={loading || saving}
          />
          <ToggleRow
            icon={<Car className="h-4 w-4 text-primary" />}
            title="Exchange Deals"
            description="Trade-in / exchange workflows"
            checked={modules.exchange_deals}
            onCheckedChange={(v) => setModules((m) => ({ ...m, exchange_deals: v }))}
            disabled={loading || saving}
          />
          <ToggleRow
            icon={<Car className="h-4 w-4 text-primary" />}
            title="Financing"
            description="Loans, EMI schedules, and tracking"
            checked={modules.financing}
            onCheckedChange={(v) => setModules((m) => ({ ...m, financing: v }))}
            disabled={loading || saving}
          />
          <ToggleRow
            icon={<FileText className="h-4 w-4 text-primary" />}
            title="Documents"
            description="Upload and manage documents"
            checked={modules.documents}
            onCheckedChange={(v) => setModules((m) => ({ ...m, documents: v }))}
            disabled={loading || saving}
          />
          <ToggleRow
            icon={<FileText className="h-4 w-4 text-primary" />}
            title="Leads"
            description="Lead capture and follow-ups"
            checked={modules.leads}
            onCheckedChange={(v) => setModules((m) => ({ ...m, leads: v }))}
            disabled={loading || saving}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <div className="font-medium">Japan import modules</div>
        </div>
        <div className="text-sm text-muted-foreground">
          Track the full import process: auction → shipment → port arrival → customs → inspection → ready for sale.
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            icon={<Globe className="h-4 w-4 text-primary" />}
            title="Japan Import"
            description="Enable the Japan import workflow module"
            checked={modules.japan_import}
            onCheckedChange={(v) => setModules((m) => ({ ...m, japan_import: v }))}
            disabled={loading || saving || japanSectionDisabled}
          />
          <ToggleRow
            icon={<FileText className="h-4 w-4 text-primary" />}
            title="Import Documents"
            description="Auction sheets, BL, export cert, customs docs"
            checked={modules.import_documents}
            onCheckedChange={(v) => setModules((m) => ({ ...m, import_documents: v }))}
            disabled={loading || saving || japanSectionDisabled}
          />
          <ToggleRow
            icon={<Ship className="h-4 w-4 text-primary" />}
            title="Shipments"
            description="Vessel/BL tracking and ETA timeline"
            checked={modules.import_shipments}
            onCheckedChange={(v) => setModules((m) => ({ ...m, import_shipments: v }))}
            disabled={loading || saving || japanSectionDisabled}
          />
          <ToggleRow
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            title="Customs & Clearance"
            description="Duty/tax, clearance dates, status"
            checked={modules.import_customs}
            onCheckedChange={(v) => setModules((m) => ({ ...m, import_customs: v }))}
            disabled={loading || saving || japanSectionDisabled}
          />
          <ToggleRow
            icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
            title="Inspection"
            description="Condition checks before listing for sale"
            checked={modules.import_inspections}
            onCheckedChange={(v) => setModules((m) => ({ ...m, import_inspections: v }))}
            disabled={loading || saving || japanSectionDisabled}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button onClick={save} disabled={loading || saving} className="w-full sm:w-auto">
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}

