'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface FormSectionConfig {
    id: string;
    label: string;
    enabled: boolean;
}

const DEFAULT_SECTIONS: FormSectionConfig[] = [
    { id: 'basic', label: 'Basic Information', enabled: true },
    { id: 'specifications', label: 'Specifications', enabled: true },
    { id: 'pricing', label: 'Pricing', enabled: true },
    { id: 'images', label: 'Vehicle Images', enabled: true },
    { id: 'buyerSeller', label: 'Buyer & Seller Images', enabled: true },
    { id: 'accessories', label: 'Vehicle Accessories', enabled: true },
    { id: 'vehicleDocuments', label: 'Vehicle Documents', enabled: true },
    { id: 'payment', label: 'Payment Details', enabled: true },
    { id: 'sellerDetails', label: 'Seller Details', enabled: true },
    { id: 'buyerDetails', label: 'Buyer Details', enabled: true },
    { id: 'commission', label: 'Commission Details', enabled: true },
    { id: 'insurance', label: 'Insurance Details', enabled: true },
    { id: 'taxRegistration', label: 'Tax & Registration', enabled: true },
    { id: 'ownership', label: 'Ownership & Transfer', enabled: true },
    { id: 'warranty', label: 'Warranty & Service', enabled: true },
    { id: 'additionalNotes', label: 'Additional Notes', enabled: true },
    { id: 'description', label: 'Description', enabled: true },
];

const STORAGE_KEY = 'vehicle-form-sections-config';

interface FormConfigContextType {
    sections: FormSectionConfig[];
    toggleSection: (id: string) => void;
    isSectionEnabled: (id: string) => boolean;
    resetToDefaults: () => void;
}

const FormConfigContext = createContext<FormConfigContextType | undefined>(undefined);

function loadStoredSections(): FormSectionConfig[] {
    if (typeof window === 'undefined') return DEFAULT_SECTIONS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as FormSectionConfig[];
            const defaultIds = new Set(DEFAULT_SECTIONS.map(s => s.id));
            const storedIds = new Set(parsed.map(s => s.id));
            return [
                ...parsed.filter(s => defaultIds.has(s.id)),
                ...DEFAULT_SECTIONS.filter(s => !storedIds.has(s.id)),
            ];
        }
    } catch (e) {
        console.error('Error loading form config:', e);
    }
    return DEFAULT_SECTIONS;
}

export function FormConfigProvider({ children }: { children: ReactNode }) {
    // Always start with defaults so server and client first paint match (avoids hydration error)
    const [sections, setSections] = useState<FormSectionConfig[]>(DEFAULT_SECTIONS);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setSections(loadStoredSections());
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
        } catch (e) {
            console.error('Error saving form config:', e);
        }
    }, [mounted, sections]);

    const toggleSection = (id: string) => {
        setSections(prev =>
            prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
        );
    };

    const isSectionEnabled = (id: string) => {
        return sections.find(s => s.id === id)?.enabled ?? true;
    };

    const resetToDefaults = () => {
        setSections(DEFAULT_SECTIONS);
    };

    return (
        <FormConfigContext.Provider value={{ sections, toggleSection, isSectionEnabled, resetToDefaults }}>
            {children}
        </FormConfigContext.Provider>
    );
}

export function useFormConfig() {
    const context = useContext(FormConfigContext);
    if (context === undefined) {
        throw new Error('useFormConfig must be used within a FormConfigProvider');
    }
    return context;
}

export function FormConfigDialog() {
    const { sections, toggleSection, resetToDefaults } = useFormConfig();
    const [open, setOpen] = useState(false);

    // Force re-render when sections change by using sections in the component
    // This ensures the dialog shows the current state

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
                        Toggle sections to show or hide in the Add New Vehicle form. Changes are saved automatically.
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
                                    onClick={() => toggleSection(section.id)}
                                >
                                    {section.label}
                                </Label>
                                <Switch
                                    id={`section-${section.id}`}
                                    checked={section.enabled}
                                    onCheckedChange={() => toggleSection(section.id)}
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
