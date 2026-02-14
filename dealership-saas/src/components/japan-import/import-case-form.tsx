"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  CircleCheckBig,
  FileCheck2,
  Loader2,
  Ship,
  WalletCards,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableSelect } from "@/components/inventory/editable-select";
import {
  createJapanImportCase,
  updateJapanImportCase,
} from "@/lib/actions/japan-import";
import type { JapanImportCase, JapanImportStatus } from "@/lib/types/database";
import {
  JapanImportFormConfigDialog,
  useJapanImportFormConfig,
} from "./form-config";

const STATUSES: JapanImportStatus[] = [
  "planned",
  "purchased",
  "in_transit",
  "arrived_port",
  "customs",
  "ready_for_sale",
  "sold",
  "cancelled",
];

const JAPAN_PORTS = [
  "Yokohama",
  "Kobe",
  "Nagoya",
  "Osaka",
  "Tokyo",
  "Hakata",
  "Nago",
];

const PAKISTAN_PORTS = ["Karachi", "Port Qasim", "Gwadar"];

const DEFAULT_RATE = 1.95;

const DEFAULT_MAKES: string[] = [
  "Toyota",
  "Honda",
  "Suzuki",
  "Daihatsu",
  "Nissan",
  "Mitsubishi",
  "Subaru",
  "Mazda",
  "Hyundai",
  "Kia",
  "BMW",
  "Mercedes-Benz",
  "Audi",
];

const DEFAULT_MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota: ["Aqua", "Vitz", "Corolla Axio", "Corolla Fielder", "Prius", "Land Cruiser", "Prado"],
  Honda: ["Fit", "Vezel", "Civic", "Grace"],
  Suzuki: ["Alto", "WagonR", "Every", "Swift"],
  Daihatsu: ["Mira", "Move", "Tanto", "Hijet"],
  Nissan: ["Dayz", "Note", "March", "Serena"],
  Mazda: ["CX-5", "Demio"],
  Subaru: ["Impreza", "Forester"],
};

const DEFAULT_VARIANTS: string[] = [
  "Base Grade",
  "G Package",
  "S Package",
  "X Package",
  "Hybrid G",
  "Hybrid S",
  "Full Option",
  "Low Mileage",
];

const DEFAULT_COLORS: string[] = [
  "White",
  "Pearl White",
  "Silver",
  "Black",
  "Grey",
  "Blue",
  "Red",
  "Wine Red",
  "Brown",
  "Beige",
  "Green",
];

type FormState = {
  stock_code: string;
  make: string;
  model: string;
  year: string;
  variant: string;
  chassis_number: string;
  engine_number: string;
  auction_grade: string;
  odometer_km: string;
  color: string;
  purchase_price_jpy: string;
  purchase_price_pkr: string;
  estimated_total_cost_pkr: string;
  shipment_port_from: string;
  shipment_port_to: string;
  eta_date: string;
  status: JapanImportStatus;
  notes: string;
  form_e_number: string;
  pbs_release_order: string;
  clearing_agent: string;
  duty_estimate_pkr: string;
  pkr_rate_hint: string;
};

function toFormState(initial?: Partial<JapanImportCase>): FormState {
  return {
    stock_code: initial?.stock_code ?? "",
    make: initial?.make ?? "",
    model: initial?.model ?? "",
    year: initial?.year ? String(initial.year) : "",
    variant: initial?.variant ?? "",
    chassis_number: initial?.chassis_number ?? "",
    engine_number: initial?.engine_number ?? "",
    auction_grade: initial?.auction_grade ?? "",
    odometer_km: initial?.odometer_km ? String(initial.odometer_km) : "",
    color: initial?.color ?? "",
    purchase_price_jpy: initial?.purchase_price_jpy
      ? String(initial.purchase_price_jpy)
      : "",
    purchase_price_pkr: initial?.purchase_price_pkr
      ? String(initial.purchase_price_pkr)
      : "",
    estimated_total_cost_pkr: initial?.estimated_total_cost_pkr
      ? String(initial.estimated_total_cost_pkr)
      : "",
    shipment_port_from: initial?.shipment_port_from ?? "",
    shipment_port_to: initial?.shipment_port_to ?? "",
    eta_date: initial?.eta_date ?? "",
    status: initial?.status ?? "planned",
    notes: initial?.notes ?? "",
    form_e_number: "",
    pbs_release_order: "",
    clearing_agent: "",
    duty_estimate_pkr: "",
    pkr_rate_hint: String(DEFAULT_RATE),
  };
}

export function JapanImportCaseForm({
  mode,
  caseId,
  initialCase,
}: {
  mode: "create" | "edit";
  caseId?: string;
  initialCase?: Partial<JapanImportCase>;
}) {
  const router = useRouter();
  const { organization } = useAuthStore();
  const { isSectionEnabled } = useJapanImportFormConfig();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => toFormState(initialCase));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [makeOptions, setMakeOptions] = useState<string[]>(DEFAULT_MAKES);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [variantOptions, setVariantOptions] =
    useState<string[]>(DEFAULT_VARIANTS);
  const [colorOptions, setColorOptions] = useState<string[]>(DEFAULT_COLORS);

  const flags = organization?.feature_flags;
  const importShipmentsEnabled = flags?.enable_import_shipments ?? true;
  const importCustomsEnabled = flags?.enable_import_customs ?? true;
  const importInspectionsEnabled = flags?.enable_import_inspections ?? true;

  const steps = useMemo(() => {
    const all = [
      {
        id: "vehicleBasics",
        name: "Vehicle Basics",
        icon: Car,
      },
      {
        id: "auctionPricing",
        name: "Auction & Pricing",
        icon: WalletCards,
      },
      {
        id: "shipment",
        name: "Shipment",
        icon: Ship,
      },
      {
        id: "compliance",
        name: "Pakistan Compliance",
        icon: FileCheck2,
      },
      {
        id: "notesReview",
        name: "Review",
        icon: CircleCheckBig,
      },
    ] as const;

    const filtered = all.filter((s) => {
      if (!isSectionEnabled(s.id)) return false;
      if (s.id === "shipment" && !importShipmentsEnabled) return false;
      if (
        s.id === "compliance" &&
        !importCustomsEnabled &&
        !importInspectionsEnabled
      ) {
        return false;
      }
      return true;
    });

    return filtered.length > 0 ? filtered : [all[0], all[1], all[4]];
  }, [
    importCustomsEnabled,
    importInspectionsEnabled,
    importShipmentsEnabled,
    isSectionEnabled,
  ]);

  const currentStep = steps[currentStepIndex];

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Load persisted options for makes / colors / variants on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedMakes = localStorage.getItem("japan-import-makes");
      if (storedMakes) {
        const parsed = JSON.parse(storedMakes);
        if (Array.isArray(parsed)) {
          setMakeOptions((prev) =>
            Array.from(new Set([...prev, ...parsed])).sort()
          );
        }
      }
    } catch {
      // ignore
    }
    try {
      const storedColors = localStorage.getItem("japan-import-colors");
      if (storedColors) {
        const parsed = JSON.parse(storedColors);
        if (Array.isArray(parsed)) {
          setColorOptions((prev) =>
            Array.from(new Set([...prev, ...parsed])).sort()
          );
        }
      }
    } catch {
      // ignore
    }
    try {
      const storedVariants = localStorage.getItem("japan-import-variants");
      if (storedVariants) {
        const parsed = JSON.parse(storedVariants);
        if (Array.isArray(parsed)) {
          setVariantOptions((prev) =>
            Array.from(new Set([...prev, ...parsed])).sort()
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Ensure initial make/model/color/variant are part of the option lists.
  useEffect(() => {
    if (form.make) {
      setMakeOptions((prev) =>
        prev.includes(form.make)
          ? prev
          : Array.from(new Set([...prev, form.make])).sort()
      );
    }
    if (form.color) {
      setColorOptions((prev) =>
        prev.includes(form.color)
          ? prev
          : Array.from(new Set([...prev, form.color])).sort()
      );
    }
    if (form.variant) {
      setVariantOptions((prev) =>
        prev.includes(form.variant)
          ? prev
          : Array.from(new Set([...prev, form.variant])).sort()
      );
    }
  }, [form.make, form.color, form.variant]);

  // Load models list whenever make changes (with per-make defaults + stored models)
  useEffect(() => {
    const makeKey = form.make || "generic";
    const baseModels = DEFAULT_MODELS_BY_MAKE[form.make ?? ""] ?? [];
    let merged = [...baseModels];

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(
          `japan-import-models-${makeKey.toLowerCase()}`
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            merged = Array.from(new Set([...merged, ...parsed]));
          }
        }
      } catch {
        // ignore
      }
    }

    if (form.model && !merged.includes(form.model)) {
      merged.push(form.model);
    }
    setModelOptions(merged.sort());
  }, [form.make, form.model]);

  const estimateFromRate = () => {
    const jpy = Number(form.purchase_price_jpy || 0);
    const rate = Number(form.pkr_rate_hint || 0);
    if (!jpy || !rate) return;
    const pkr = Math.round(jpy * rate);
    setField("purchase_price_pkr", String(pkr));
    if (!form.estimated_total_cost_pkr) {
      setField("estimated_total_cost_pkr", String(Math.round(pkr * 1.25)));
    }
  };

  const validateCurrentStep = () => {
    setError(null);
    if (currentStep.id === "vehicleBasics") {
      if (!form.make.trim() || !form.model.trim()) {
        setError("Make and Model are required.");
        return false;
      }
      if (form.year && (Number(form.year) < 1990 || Number(form.year) > 2035)) {
        setError("Year should be between 1990 and 2035.");
        return false;
      }
    }
    if (currentStep.id === "auctionPricing") {
      if (!form.purchase_price_jpy && !form.purchase_price_pkr) {
        setError("Enter at least purchase price in JPY or PKR.");
        return false;
      }
    }
    if (currentStep.id === "shipment" && importShipmentsEnabled) {
      if (!form.shipment_port_to.trim()) {
        setError("Arrival port is required for shipment tracking.");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const submit = async () => {
    setSaving(true);
    setError(null);

    const payload = {
      stock_code: form.stock_code || null,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : null,
      variant: form.variant || null,
      chassis_number: form.chassis_number || null,
      engine_number: form.engine_number || null,
      auction_grade: form.auction_grade || null,
      odometer_km: form.odometer_km ? Number(form.odometer_km) : null,
      color: form.color || null,
      purchase_price_jpy: form.purchase_price_jpy
        ? Number(form.purchase_price_jpy)
        : null,
      purchase_price_pkr: form.purchase_price_pkr
        ? Number(form.purchase_price_pkr)
        : null,
      estimated_total_cost_pkr: form.estimated_total_cost_pkr
        ? Number(form.estimated_total_cost_pkr)
        : null,
      shipment_port_from: form.shipment_port_from || null,
      shipment_port_to: form.shipment_port_to || null,
      eta_date: form.eta_date || null,
      status: form.status,
      notes:
        form.notes ||
        [form.form_e_number, form.pbs_release_order, form.clearing_agent]
          .filter(Boolean)
          .join(" | ") ||
        null,
    };

    const res =
      mode === "create"
        ? await createJapanImportCase(payload)
        : await updateJapanImportCase(caseId ?? "", payload);

    if (res.error || !res.data) {
      setError(res.error || "Failed to save import case");
      setSaving(false);
      return;
    }

    router.push(`/dashboard/japan-import/${res.data.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Japan Import Case" : "Edit Import Case"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Step-wise flow tailored for Japan-to-Pakistan import operations.
          </p>
        </div>
        <JapanImportFormConfigDialog />
      </div>

      <div className="rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  idx <= currentStepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-8",
                    idx < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}:{" "}
          <span className="font-medium text-foreground">{currentStep.name}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {currentStep.id === "vehicleBasics" && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Stock Code</Label>
              <Input
                value={form.stock_code}
                onChange={(e) => setField("stock_code", e.target.value)}
                placeholder="JP-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField("status", v as JapanImportStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="2019"
              />
            </div>
            <div className="space-y-2">
              <Label>Make *</Label>
              <EditableSelect
                value={form.make}
                onValueChange={(val) => {
                  setField("make", val);
                  // Reset model when make changes to avoid mismatches
                  setField("model", "");
                }}
                options={makeOptions}
                onOptionsChange={setMakeOptions}
                placeholder="Select or add make"
                storageKey="japan-import-makes"
              />
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <EditableSelect
                key={`japan-import-model-${form.make || "none"}`}
                value={form.model}
                onValueChange={(val) => setField("model", val)}
                options={modelOptions}
                onOptionsChange={setModelOptions}
                placeholder={
                  form.make ? "Select or add model" : "Select make first"
                }
                storageKey={
                  form.make
                    ? `japan-import-models-${form.make.toLowerCase()}`
                    : undefined
                }
                disabled={!form.make}
              />
              {!form.make && (
                <p className="text-xs text-muted-foreground">
                  Please select a make first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Variant</Label>
              <EditableSelect
                value={form.variant}
                onValueChange={(val) => setField("variant", val)}
                options={variantOptions}
                onOptionsChange={setVariantOptions}
                placeholder="Select or add variant"
                storageKey="japan-import-variants"
              />
            </div>
            <div className="space-y-2">
              <Label>Chassis Number</Label>
              <Input
                value={form.chassis_number}
                onChange={(e) => setField("chassis_number", e.target.value)}
                placeholder="NZE164-xxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Engine Number</Label>
              <Input
                value={form.engine_number}
                onChange={(e) => setField("engine_number", e.target.value)}
                placeholder="1NZ-xxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Auction Grade</Label>
              <EditableSelect
                value={form.auction_grade}
                onValueChange={(val) => setField("auction_grade", val)}
                options={[
                  "5",
                  "4.5",
                  "4",
                  "3.5",
                  "3",
                  "R",
                  "RA",
                  "Accident Repaired",
                ]}
                onOptionsChange={() => {
                  /* auction grade options are static; no external options list to mutate */
                }}
                placeholder="Select or add grade"
              />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km)</Label>
              <Input
                type="number"
                value={form.odometer_km}
                onChange={(e) => setField("odometer_km", e.target.value)}
                placeholder="64000"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <EditableSelect
                value={form.color}
                onValueChange={(val) => setField("color", val)}
                options={colorOptions}
                onOptionsChange={setColorOptions}
                placeholder="Select or add color"
                storageKey="japan-import-colors"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep.id === "auctionPricing" && (
        <Card>
          <CardHeader>
            <CardTitle>Auction & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Purchase Price (JPY)</Label>
                <Input
                  type="number"
                  value={form.purchase_price_jpy}
                  onChange={(e) => setField("purchase_price_jpy", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>JPY → PKR Rate</Label>
                <Input
                  type="number"
                  value={form.pkr_rate_hint}
                  onChange={(e) => setField("pkr_rate_hint", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price (PKR)</Label>
                <Input
                  type="number"
                  value={form.purchase_price_pkr}
                  onChange={(e) => setField("purchase_price_pkr", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Est. Total Cost (PKR)</Label>
                <Input
                  type="number"
                  value={form.estimated_total_cost_pkr}
                  onChange={(e) =>
                    setField("estimated_total_cost_pkr", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={estimateFromRate}
                className="w-full sm:w-auto"
              >
                Estimate PKR from JPY rate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep.id === "shipment" && (
        <Card>
          <CardHeader>
            <CardTitle>Shipment Planning</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Port From (Japan)</Label>
              <Select
                value={form.shipment_port_from || undefined}
                onValueChange={(v) => setField("shipment_port_from", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select departure port" />
                </SelectTrigger>
                <SelectContent>
                  {JAPAN_PORTS.map((port) => (
                    <SelectItem key={port} value={port}>
                      {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Port To (Pakistan)</Label>
              <Select
                value={form.shipment_port_to || undefined}
                onValueChange={(v) => setField("shipment_port_to", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select arrival port" />
                </SelectTrigger>
                <SelectContent>
                  {PAKISTAN_PORTS.map((port) => (
                    <SelectItem key={port} value={port}>
                      {port}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ETA Date</Label>
              <Input
                type="date"
                value={form.eta_date}
                onChange={(e) => setField("eta_date", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep.id === "compliance" && (
        <Card>
          <CardHeader>
            <CardTitle>Pakistan Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Form-E Number (optional)</Label>
              <Input
                value={form.form_e_number}
                onChange={(e) => setField("form_e_number", e.target.value)}
                placeholder="Form-E reference"
              />
            </div>
            <div className="space-y-2">
              <Label>PBS / BOE / Release Ref (optional)</Label>
              <Input
                value={form.pbs_release_order}
                onChange={(e) => setField("pbs_release_order", e.target.value)}
                placeholder="Release order / BOE no."
              />
            </div>
            <div className="space-y-2">
              <Label>Clearing Agent (optional)</Label>
              <Input
                value={form.clearing_agent}
                onChange={(e) => setField("clearing_agent", e.target.value)}
                placeholder="Agent or company name"
              />
            </div>
            <div className="space-y-2">
              <Label>Duty Estimate (PKR)</Label>
              <Input
                type="number"
                value={form.duty_estimate_pkr}
                onChange={(e) => setField("duty_estimate_pkr", e.target.value)}
                placeholder="Estimated duty/tax"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep.id === "notesReview" && (
        <Card>
          <CardHeader>
            <CardTitle>Notes & Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                rows={5}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Auction insights, condition remarks, customer target, delivery plans..."
              />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div>
                <span className="text-muted-foreground">Vehicle:</span>{" "}
                <span className="font-medium">
                  {form.year || "—"} {form.make || "—"} {form.model || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Route:</span>{" "}
                <span className="font-medium">
                  {form.shipment_port_from || "—"} → {form.shipment_port_to || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cost:</span>{" "}
                <span className="font-medium">
                  {form.purchase_price_jpy
                    ? `${Number(form.purchase_price_jpy).toLocaleString()} JPY`
                    : "—"}
                  {" / "}
                  {form.estimated_total_cost_pkr
                    ? `PKR ${Number(form.estimated_total_cost_pkr).toLocaleString()}`
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-0 z-20 rounded-lg border bg-background/95 p-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStepIndex === 0 ? () => router.back() : goBack}
            className="w-full sm:w-auto"
          >
            {currentStepIndex === 0 ? "Cancel" : "Back"}
          </Button>
          {currentStepIndex < steps.length - 1 ? (
            <Button type="button" onClick={goNext} className="w-full sm:w-auto">
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={saving || !form.make || !form.model}
              className="w-full sm:w-auto"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Import Case" : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
