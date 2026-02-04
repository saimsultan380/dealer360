"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
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

export interface FormSectionConfig {
  id: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_SECTIONS: FormSectionConfig[] = [
  { id: "basic", label: "Basic Information", enabled: true },
  { id: "specifications", label: "Specifications", enabled: true },
  { id: "pricing", label: "Pricing", enabled: true },
  { id: "images", label: "Vehicle Images", enabled: true },
  { id: "buyerSeller", label: "Buyer & Seller Images", enabled: true },
  { id: "accessories", label: "Extra Accessories", enabled: true },
  { id: "vehicleAccessories", label: "Vehicle Accessories", enabled: true },
  {
    id: "vehicleDocumentDetails",
    label: "Vehicle Document Details",
    enabled: true,
  },
  { id: "vehicleDocuments", label: "Vehicle Documents", enabled: true },
  { id: "payment", label: "Payment Details", enabled: true },
  { id: "sellerDetails", label: "Seller Details", enabled: true },
  { id: "buyerDetails", label: "Buyer Details", enabled: true },
  { id: "witnessDetails", label: "Witness Details", enabled: true },
  { id: "commission", label: "Commission Details", enabled: true },
  { id: "insurance", label: "Insurance Details", enabled: true },
  { id: "taxRegistration", label: "Tax & Registration", enabled: true },
  { id: "ownership", label: "Ownership & Transfer", enabled: true },
  { id: "warranty", label: "Warranty & Service", enabled: true },
  { id: "additionalNotes", label: "Additional Notes", enabled: true },
  { id: "description", label: "Description", enabled: true },
];

const STORAGE_KEY = "vehicle-form-sections-config";

/** Section id -> enabled. Single source of truth so each section updates independently. */
function getDefaultEnabledById(): Record<string, boolean> {
  return Object.fromEntries(DEFAULT_SECTIONS.map((s) => [s.id, s.enabled]));
}

function loadStoredEnabledById(): Record<string, boolean> {
  if (typeof window === "undefined") return getDefaultEnabledById();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as FormSectionConfig[];
      const defaultById = getDefaultEnabledById();
      const fromStored: Record<string, boolean> = {};
      for (const s of parsed) {
        if (s.id in defaultById) fromStored[s.id] = Boolean(s.enabled);
      }
      const merged = { ...defaultById, ...fromStored };
      const oldCombined = parsed.find((s) => s.id === "documentsAccessories");
      if (oldCombined) {
        const legacyEnabled = Boolean(oldCombined.enabled);
        if (!("vehicleAccessories" in fromStored))
          merged.vehicleAccessories = legacyEnabled;
        if (!("vehicleDocumentDetails" in fromStored))
          merged.vehicleDocumentDetails = legacyEnabled;
      }
      return merged;
    }
  } catch (e) {
    console.error("Error loading form config:", e);
  }
  return getDefaultEnabledById();
}

function saveEnabledById(enabledById: Record<string, boolean>) {
  const sections: FormSectionConfig[] = DEFAULT_SECTIONS.map((s) => ({
    ...s,
    enabled: enabledById[s.id] ?? s.enabled,
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch (e) {
    console.error("Error saving form config:", e);
  }
}

interface FormConfigContextType {
  sections: FormSectionConfig[];
  setSectionEnabled: (id: string, enabled: boolean) => void;
  isSectionEnabled: (id: string) => boolean;
  resetToDefaults: () => void;
  configLoaded: boolean;
}

const FormConfigContext = createContext<FormConfigContextType | undefined>(
  undefined
);

export function FormConfigProvider({ children }: { children: ReactNode }) {
  const defaultById = getDefaultEnabledById();
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(
    () => defaultById
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabledById(loadStoredEnabledById());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveEnabledById(enabledById);
  }, [mounted, enabledById]);

  const setSectionEnabled = (id: string, enabled: boolean) => {
    setEnabledById((prev) => {
      if (prev[id] === enabled) return prev;
      return { ...prev, [id]: enabled };
    });
  };

  const isSectionEnabled = (id: string) => {
    if (!mounted) return Boolean(defaultById[id] ?? true);
    return Boolean(enabledById[id] ?? defaultById[id] ?? true);
  };

  const resetToDefaults = () => {
    setEnabledById(getDefaultEnabledById());
  };

  const sections: FormSectionConfig[] = DEFAULT_SECTIONS.map((s) => ({
    ...s,
    enabled: enabledById[s.id] ?? s.enabled,
  }));

  return (
    <FormConfigContext.Provider
      value={{
        sections,
        setSectionEnabled,
        isSectionEnabled,
        resetToDefaults,
        configLoaded: mounted,
      }}
    >
      {children}
    </FormConfigContext.Provider>
  );
}

export function useFormConfig() {
  const context = useContext(FormConfigContext);
  if (context === undefined) {
    throw new Error("useFormConfig must be used within a FormConfigProvider");
  }
  return context;
}

export function FormConfigDialog() {
  const { sections, setSectionEnabled, resetToDefaults } = useFormConfig();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Configure Form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Vehicle Form Sections</DialogTitle>
          <DialogDescription>
            Toggle sections to show or hide in the Add New Vehicle form. Changes
            are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <Label className="text-base font-semibold">Form Sections</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </Button>
          </div>

          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Label
                  htmlFor={`section-${section.id}`}
                  className="cursor-pointer flex-1"
                >
                  {section.label}
                </Label>
                <Switch
                  id={`section-${section.id}`}
                  checked={section.enabled}
                  onCheckedChange={(checked) =>
                    setSectionEnabled(section.id, checked)
                  }
                />
              </div>
            ))}
          </div>
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
