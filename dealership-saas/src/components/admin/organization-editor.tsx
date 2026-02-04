"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateOrganizationAdmin } from "@/lib/actions/organizations";
import { useFormattedInput } from "@/lib/hooks/use-formatted-input";

type Org = any;

export function OrganizationEditor({ organization }: { organization: Org }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState(organization?.name ?? "");
  const [city, setCity] = useState(organization?.city ?? "");
  const [phoneDigits, setPhoneDigits] = useState<string>(
    organization?.phone ?? ""
  );
  const [email, setEmail] = useState(organization?.email ?? "");
  const [ownerCnicDigits, setOwnerCnicDigits] = useState<string>(
    organization?.owner_cnic ?? ""
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    organization?.subscription_status ?? "trial"
  );
  const [subscriptionPlan, setSubscriptionPlan] = useState(
    organization?.subscription_plan ?? "basic"
  );

  const flags = useMemo(
    () => (organization?.feature_flags ?? {}) as Record<string, any>,
    [organization]
  );
  const [maxVehicles, setMaxVehicles] = useState<string>(
    String(flags.max_vehicles ?? 100)
  );
  const [maxUsers, setMaxUsers] = useState<string>(
    String(flags.max_users ?? 10)
  );
  const [dealershipType, setDealershipType] = useState<string>(
    String(flags.dealership_type ?? "local")
  );

  // Backward compatibility: undefined means "enabled" for most modules.
  const fallbackTrue = (v: any) => (v === undefined ? true : !!v);

  const [enableInventory, setEnableInventory] = useState(
    fallbackTrue(flags.enable_inventory)
  );
  const [enableSales, setEnableSales] = useState(
    fallbackTrue(flags.enable_sales)
  );
  const [enableExchangeDeals, setEnableExchangeDeals] = useState(
    fallbackTrue(flags.enable_exchange_deals)
  );
  const [enableFinancing, setEnableFinancing] = useState(
    fallbackTrue(flags.enable_financing)
  );
  const [enableLeads, setEnableLeads] = useState(
    fallbackTrue(flags.enable_leads)
  );
  const [enableDeals, setEnableDeals] = useState(
    fallbackTrue(flags.enable_deals)
  );
  const [enableDocuments, setEnableDocuments] = useState(
    fallbackTrue(flags.enable_documents)
  );
  const [enableCashFlow, setEnableCashFlow] = useState(
    fallbackTrue(flags.enable_cash_flow)
  );
  const [enableLedger, setEnableLedger] = useState(
    fallbackTrue(flags.enable_ledger)
  );
  const [enableClients, setEnableClients] = useState(
    fallbackTrue(flags.enable_clients)
  );
  const [enableInvestors, setEnableInvestors] = useState(
    fallbackTrue(flags.enable_investors)
  );

  // Japan import is off unless explicitly enabled.
  const [enableJapanImport, setEnableJapanImport] = useState(
    !!flags.enable_japan_import
  );
  const [enableImportDocuments, setEnableImportDocuments] = useState(
    !!flags.enable_import_documents
  );
  const [enableImportShipments, setEnableImportShipments] = useState(
    !!flags.enable_import_shipments
  );
  const [enableImportCustoms, setEnableImportCustoms] = useState(
    !!flags.enable_import_customs
  );
  const [enableImportInspections, setEnableImportInspections] = useState(
    !!flags.enable_import_inspections
  );

  const phoneInput = useFormattedInput({
    type: "phone",
    initialValue: phoneDigits,
    onChange: (value) => setPhoneDigits(value),
  });
  const ownerCnicInput = useFormattedInput({
    type: "cnic",
    initialValue: ownerCnicDigits,
    onChange: (value) => setOwnerCnicDigits(value),
  });

  const handleDealershipTypeChange = (next: string) => {
    setDealershipType(next);

    // When switching to local-only, immediately turn off import modules in the UI
    // so what the user sees matches what will be saved.
    if (next === "local") {
      setEnableJapanImport(false);
      setEnableImportDocuments(false);
      setEnableImportShipments(false);
      setEnableImportCustoms(false);
      setEnableImportInspections(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);

    const maxVehiclesInt = Math.max(1, parseInt(maxVehicles || "0", 10) || 0);
    const maxUsersInt = Math.max(1, parseInt(maxUsers || "0", 10) || 0);

    const localOnly = dealershipType === "local";
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
      enable_cash_flow: enableCashFlow,
      enable_ledger: enableLedger,
      enable_clients: enableClients,
      enable_investors: enableInvestors,

      enable_japan_import: localOnly ? false : enableJapanImport,
      enable_import_documents: localOnly ? false : enableImportDocuments,
      enable_import_shipments: localOnly ? false : enableImportShipments,
      enable_import_customs: localOnly ? false : enableImportCustoms,
      enable_import_inspections: localOnly ? false : enableImportInspections,
    };

    const res = await updateOrganizationAdmin({
      id: organization.id,
      name,
      city,
      phone: phoneDigits,
      email,
      owner_cnic: ownerCnicDigits || null,
      subscription_status: subscriptionStatus,
      subscription_plan: subscriptionPlan,
      feature_flags: nextFlags,
    });

    if (res.error) {
      setErr(res.error);
    } else {
      setMsg("Saved successfully");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit</CardTitle>
        <CardDescription>
          Update subscription, limits, and enabled modules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {err && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {err}
          </div>
        )}
        {msg && (
          <div className="rounded-md border bg-muted p-2 text-sm">{msg}</div>
        )}

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
            <Input
              value={phoneInput.value}
              onChange={phoneInput.onChange}
              placeholder="03XX-XXXXXXX"
              maxLength={12}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Owner CNIC (optional)</Label>
          <Input
            value={ownerCnicInput.value}
            onChange={ownerCnicInput.onChange}
            placeholder="XXXXX-XXXXXXX-X"
            maxLength={15}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Max Vehicles</Label>
            <Input
              type="number"
              value={maxVehicles}
              onChange={(e) => setMaxVehicles(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Users</Label>
            <Input
              type="number"
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subscription Status</Label>
            <Select
              value={subscriptionStatus}
              onValueChange={setSubscriptionStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <Select
              value={subscriptionPlan}
              onValueChange={setSubscriptionPlan}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
          <Select
            value={dealershipType}
            onValueChange={handleDealershipTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
            <ToggleRow
              label="Inventory"
              checked={enableInventory}
              onCheckedChange={setEnableInventory}
            />
            <ToggleRow
              label="Sales"
              checked={enableSales}
              onCheckedChange={setEnableSales}
            />
            <ToggleRow
              label="Exchange Deals"
              checked={enableExchangeDeals}
              onCheckedChange={setEnableExchangeDeals}
            />
            <ToggleRow
              label="Financing"
              checked={enableFinancing}
              onCheckedChange={setEnableFinancing}
            />
            <ToggleRow
              label="Leads"
              checked={enableLeads}
              onCheckedChange={setEnableLeads}
            />
            <ToggleRow
              label="Deals"
              checked={enableDeals}
              onCheckedChange={setEnableDeals}
            />
            <ToggleRow
              label="Documents"
              checked={enableDocuments}
              onCheckedChange={setEnableDocuments}
            />
            <ToggleRow
              label="Clients"
              checked={enableClients}
              onCheckedChange={setEnableClients}
            />
            <ToggleRow
              label="Investors"
              checked={enableInvestors}
              onCheckedChange={setEnableInvestors}
            />
            <ToggleRow
              label="Cash Flow"
              checked={enableCashFlow}
              onCheckedChange={setEnableCashFlow}
            />
            <ToggleRow
              label="Ledger"
              checked={enableLedger}
              onCheckedChange={setEnableLedger}
            />
            <ToggleRow
              label="Japan Import"
              checked={enableJapanImport}
              onCheckedChange={setEnableJapanImport}
            />
            <ToggleRow
              label="Import Documents"
              checked={enableImportDocuments}
              onCheckedChange={setEnableImportDocuments}
              disabled={dealershipType === "local"}
            />
            <ToggleRow
              label="Import Shipments"
              checked={enableImportShipments}
              onCheckedChange={setEnableImportShipments}
              disabled={dealershipType === "local"}
            />
            <ToggleRow
              label="Import Customs"
              checked={enableImportCustoms}
              onCheckedChange={setEnableImportCustoms}
              disabled={dealershipType === "local"}
            />
            <ToggleRow
              label="Import Inspections"
              checked={enableImportInspections}
              onCheckedChange={setEnableImportInspections}
              disabled={dealershipType === "local"}
            />
          </div>
          {dealershipType === "local" && (
            <p className="text-xs text-muted-foreground">
              Import modules are disabled while dealership type is Local.
            </p>
          )}
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ToggleRow(props: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="text-sm font-medium">{props.label}</div>
      <Switch
        checked={props.checked}
        onCheckedChange={props.onCheckedChange}
        disabled={props.disabled}
      />
    </div>
  );
}
