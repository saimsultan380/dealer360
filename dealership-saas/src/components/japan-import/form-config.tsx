"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type JapanImportSectionId =
  | "vehicleBasics"
  | "auctionPricing"
  | "shipment"
  | "compliance"
  | "notesReview";

type FormSectionConfig = {
  id: JapanImportSectionId;
  label: string;
  enabled: boolean;
};

const STORAGE_KEY = "japan-import-form-sections-config";

const DEFAULT_SECTIONS: FormSectionConfig[] = [
  { id: "vehicleBasics", label: "Vehicle Basics", enabled: true },
  { id: "auctionPricing", label: "Auction & Pricing", enabled: true },
  { id: "shipment", label: "Shipment Planning", enabled: true },
  { id: "compliance", label: "Pakistan Compliance Checklist", enabled: true },
  { id: "notesReview", label: "Notes & Review", enabled: true },
];

function getDefaultsMap(): Record<JapanImportSectionId, boolean> {
  return DEFAULT_SECTIONS.reduce(
    (acc, s) => {
      acc[s.id] = s.enabled;
      return acc;
    },
    {} as Record<JapanImportSectionId, boolean>
  );
}

function loadConfig(): Record<JapanImportSectionId, boolean> {
  const defaults = getDefaultsMap();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Array<{ id: string; enabled: boolean }>;
    const next = { ...defaults };
    for (const row of parsed) {
      if (row.id in defaults) {
        next[row.id as JapanImportSectionId] = Boolean(row.enabled);
      }
    }
    return next;
  } catch {
    return defaults;
  }
}

function persistConfig(config: Record<JapanImportSectionId, boolean>) {
  const payload = DEFAULT_SECTIONS.map((s) => ({
    id: s.id,
    enabled: config[s.id],
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // no-op
  }
}

type JapanImportFormConfigContextValue = {
  sections: FormSectionConfig[];
  isSectionEnabled: (id: JapanImportSectionId) => boolean;
  setSectionEnabled: (id: JapanImportSectionId, enabled: boolean) => void;
  resetToDefaults: () => void;
};

const JapanImportFormConfigContext =
  createContext<JapanImportFormConfigContextValue | null>(null);

export function JapanImportFormConfigProvider({
  children,
}: {
  children: ReactNode;
}) {
  const defaults = useMemo(() => getDefaultsMap(), []);
  const [enabledMap, setEnabledMap] =
    useState<Record<JapanImportSectionId, boolean>>(defaults);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabledMap(loadConfig());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    persistConfig(enabledMap);
  }, [mounted, enabledMap]);

  const sections = useMemo(
    () =>
      DEFAULT_SECTIONS.map((s) => ({
        ...s,
        enabled: enabledMap[s.id] ?? s.enabled,
      })),
    [enabledMap]
  );

  const value: JapanImportFormConfigContextValue = {
    sections,
    isSectionEnabled: (id) => enabledMap[id] ?? defaults[id] ?? true,
    setSectionEnabled: (id, enabled) =>
      setEnabledMap((prev) => ({ ...prev, [id]: enabled })),
    resetToDefaults: () => setEnabledMap(getDefaultsMap()),
  };

  return (
    <JapanImportFormConfigContext.Provider value={value}>
      {children}
    </JapanImportFormConfigContext.Provider>
  );
}

export function useJapanImportFormConfig() {
  const ctx = useContext(JapanImportFormConfigContext);
  if (!ctx) {
    throw new Error(
      "useJapanImportFormConfig must be used within JapanImportFormConfigProvider"
    );
  }
  return ctx;
}

export function JapanImportFormConfigDialog() {
  const { sections, setSectionEnabled, resetToDefaults } =
    useJapanImportFormConfig();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configure Form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Japan Import Form Configuration</DialogTitle>
          <DialogDescription>
            Choose which sections dealers see in the step-by-step form.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between border-b pb-2">
            <Label className="font-medium">Form Sections</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
            >
              Reset
            </Button>
          </div>
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <Label htmlFor={`japan-import-section-${section.id}`}>
                {section.label}
              </Label>
              <Switch
                id={`japan-import-section-${section.id}`}
                checked={section.enabled}
                onCheckedChange={(checked) =>
                  setSectionEnabled(section.id, checked)
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
