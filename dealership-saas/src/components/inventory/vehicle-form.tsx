'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Car,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    FileText,
    Image as ImageIcon,
    Loader2,
    Plus,
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    vehicleSchema,
    VehicleFormData,
    CAR_MAKES,
    FUEL_TYPES,
    TRANSMISSION_TYPES,
    VEHICLE_STATUS,
    VEHICLE_CONDITION,
} from '@/lib/types/vehicle';
import { initializeModelsForMake } from '@/lib/types/vehicle-models';
import { ImageUpload } from './image-upload';
import { PartyDocumentsUpload } from './party-documents-upload';
import { ChassisImageUpload } from './chassis-image-upload';
import { VehicleDocumentsUpload } from './vehicle-documents-upload';
import { EditableSelect } from './editable-select';
import { FormConfigDialog, useFormConfig } from './form-config';
import { createVehicle, updateVehicle } from '@/lib/actions/inventory';
import { InvestorSelect } from '@/components/investors/investor-select';
import { useFormattedInput } from '@/lib/hooks/use-formatted-input';
import { cn } from '@/lib/utils';

export function VehicleForm(props?: { mode?: 'create' | 'edit'; vehicleId?: string; initial?: any }) {
    const router = useRouter();
    const mode = props?.mode ?? 'create';
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [buyerDocumentIds, setBuyerDocumentIds] = useState<string[]>([]);
    const [sellerDocumentIds, setSellerDocumentIds] = useState<string[]>([]);
    const [chassisImageId, setChassisImageId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for makes and models with localStorage persistence
    const [makes, setMakes] = useState<string[]>(CAR_MAKES);
    const [models, setModels] = useState<string[]>([]);

    // New sections state
    const [accessories, setAccessories] = useState<string[]>([]);
    const [newAccessory, setNewAccessory] = useState('');
    const [vehicleDocumentIds, setVehicleDocumentIds] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'financing' | ''>('');
    const [downPayment, setDownPayment] = useState('');
    const [remainingAmount, setRemainingAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [sellerName, setSellerName] = useState('');
    const [sellerSwdoName, setSellerSwdoName] = useState('');
    const [sellerPhoneRaw, setSellerPhoneRaw] = useState('');
    const [sellerCNICRaw, setSellerCNICRaw] = useState('');
    const sellerPhoneInput = useFormattedInput({ type: 'phone', initialValue: sellerPhoneRaw, onChange: setSellerPhoneRaw });
    const sellerCNICInput = useFormattedInput({ type: 'cnic', initialValue: sellerCNICRaw, onChange: setSellerCNICRaw });
    const [sellerAddress, setSellerAddress] = useState('');
    const [sellerPartyType, setSellerPartyType] = useState<'client' | 'investor'>('client');
    const [sellerInvestorId, setSellerInvestorId] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [buyerSwdoName, setBuyerSwdoName] = useState('');
    const [buyerPhoneRaw, setBuyerPhoneRaw] = useState('');
    const [buyerCNICRaw, setBuyerCNICRaw] = useState('');
    const buyerPhoneInput = useFormattedInput({ type: 'phone', initialValue: buyerPhoneRaw, onChange: setBuyerPhoneRaw });
    const buyerCNICInput = useFormattedInput({ type: 'cnic', initialValue: buyerCNICRaw, onChange: setBuyerCNICRaw });
    const [buyerAddress, setBuyerAddress] = useState('');
    const [buyerPartyType, setBuyerPartyType] = useState<'client' | 'investor'>('client');
    const [buyerInvestorId, setBuyerInvestorId] = useState('');
    const [commissionAmount, setCommissionAmount] = useState('');
    const [commissionPercentage, setCommissionPercentage] = useState('');
    const [salespersonId, setSalespersonId] = useState('');

    // Pakistan-specific fields
    const [insuranceCompany, setInsuranceCompany] = useState('');
    const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
    const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
    const [insuranceAmount, setInsuranceAmount] = useState('');
    const [roadTaxStatus, setRoadTaxStatus] = useState<'paid' | 'unpaid' | 'exempt' | ''>('');
    const [roadTaxExpiryDate, setRoadTaxExpiryDate] = useState('');
    const [fitnessCertificateNumber, setFitnessCertificateNumber] = useState('');
    const [fitnessExpiryDate, setFitnessExpiryDate] = useState('');
    const [previousOwnerName, setPreviousOwnerName] = useState('');
    const [previousOwnerPhoneRaw, setPreviousOwnerPhoneRaw] = useState('');
    const previousOwnerPhoneInput = useFormattedInput({ type: 'phone', initialValue: previousOwnerPhoneRaw, onChange: setPreviousOwnerPhoneRaw });
    const [ownershipTransferDate, setOwnershipTransferDate] = useState('');
    const [warrantyType, setWarrantyType] = useState<'manufacturer' | 'dealer' | 'none' | ''>('');
    const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
    const [warrantyDetails, setWarrantyDetails] = useState('');
    const [serviceHistory, setServiceHistory] = useState('');
    const [lastServiceDate, setLastServiceDate] = useState('');
    const [lastServiceMileage, setLastServiceMileage] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Form configuration - this will re-render when sections change
    const { isSectionEnabled } = useFormConfig();

    const {
        register,
        handleSubmit,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useForm<VehicleFormData>({
        // zodResolver + z.coerce types can confuse react-hook-form generics; keep the form typed to VehicleFormData.
        resolver: zodResolver(vehicleSchema) as never,
        defaultValues: {
            make: '',
            model: '',
            variant: '',
            color: '',
            status: 'available',
            condition: 'used',
            transmission: 'automatic',
            fuel_type: 'petrol',
        },
    });

    const selectedMake = watch('make');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Prefill for edit mode
    useEffect(() => {
        if (mode !== 'edit') return;
        const init = props?.initial;
        if (!init?.vehicle) return;

        const v = init.vehicle as any;
        // base vehicle fields
        setValue('make', v.make ?? '');
        setValue('model', v.model ?? '');
        setValue('variant', v.variant ?? '');
        setValue('year', v.year ?? new Date().getFullYear());
        setValue('color', v.color ?? '');
        setValue('mileage', v.mileage ?? 0);
        setValue('fuel_type', v.fuel_type ?? 'petrol');
        setValue('transmission', v.transmission ?? 'automatic');
        setValue('engine_number', v.engine_number ?? '');
        setValue('chassis_number', v.chassis_number ?? '');
        setValue('registration_number', v.registration_number ?? '');
        setValue('purchase_price', v.purchase_price ?? undefined);
        setValue('selling_price', v.selling_price ?? 0);
        setValue('minimum_price', v.minimum_price ?? undefined);
        setValue('status', v.status ?? 'available');
        setValue('condition', v.condition ?? 'used');
        setValue('description', v.description ?? '');

        // images
        if (Array.isArray(init.imageUrls)) {
            setImageUrls(init.imageUrls.filter(Boolean));
        }

        // metadata-backed fields
        const meta = init.metadata ?? null;
        if (meta?.accessories) setAccessories(Array.isArray(meta.accessories) ? meta.accessories : []);

        if (meta?.paymentDetails) {
            setPaymentMethod(meta.paymentDetails.method || '');
            setDownPayment(meta.paymentDetails.downPayment != null ? String(meta.paymentDetails.downPayment) : '');
            setRemainingAmount(meta.paymentDetails.remainingAmount != null ? String(meta.paymentDetails.remainingAmount) : '');
            setPaymentDate(meta.paymentDetails.paymentDate || '');
        }

        if (meta?.sellerDetails) {
            setSellerPartyType(meta.sellerDetails.party_type || 'client');
            setSellerInvestorId(meta.sellerDetails.investor_id || '');
            setSellerName(meta.sellerDetails.name || '');
            sellerPhoneInput.setValue(meta.sellerDetails.phone || '');
            sellerCNICInput.setValue(meta.sellerDetails.cnic || '');
            setSellerAddress(meta.sellerDetails.address || '');
        }

        if (meta?.buyerDetails) {
            setBuyerPartyType(meta.buyerDetails.party_type || 'client');
            setBuyerInvestorId(meta.buyerDetails.investor_id || '');
            setBuyerName(meta.buyerDetails.name || '');
            buyerPhoneInput.setValue(meta.buyerDetails.phone || '');
            buyerCNICInput.setValue(meta.buyerDetails.cnic || '');
            setBuyerAddress(meta.buyerDetails.address || '');
        }

        if (meta?.commissionDetails) {
            setCommissionAmount(meta.commissionDetails.amount != null ? String(meta.commissionDetails.amount) : '');
            setCommissionPercentage(meta.commissionDetails.percentage != null ? String(meta.commissionDetails.percentage) : '');
            setSalespersonId(meta.commissionDetails.salespersonId || '');
        }

        if (meta?.insuranceDetails) {
            setInsuranceCompany(meta.insuranceDetails.company || '');
            setInsurancePolicyNumber(meta.insuranceDetails.policyNumber || '');
            setInsuranceExpiryDate(meta.insuranceDetails.expiryDate || '');
            setInsuranceAmount(meta.insuranceDetails.amount != null ? String(meta.insuranceDetails.amount) : '');
        }

        if (meta?.taxRegistrationDetails) {
            setRoadTaxStatus(meta.taxRegistrationDetails.roadTaxStatus || '');
            setRoadTaxExpiryDate(meta.taxRegistrationDetails.roadTaxExpiryDate || '');
            setFitnessCertificateNumber(meta.taxRegistrationDetails.fitnessCertificateNumber || '');
            setFitnessExpiryDate(meta.taxRegistrationDetails.fitnessExpiryDate || '');
        }

        if (meta?.ownershipDetails) {
            setPreviousOwnerName(meta.ownershipDetails.previousOwnerName || '');
            previousOwnerPhoneInput.setValue(meta.ownershipDetails.previousOwnerPhone || '');
            setOwnershipTransferDate(meta.ownershipDetails.transferDate || '');
        }

        if (meta?.warrantyServiceDetails) {
            setWarrantyType(meta.warrantyServiceDetails.warrantyType || '');
            setWarrantyExpiryDate(meta.warrantyServiceDetails.warrantyExpiryDate || '');
            setWarrantyDetails(meta.warrantyServiceDetails.warrantyDetails || '');
            setLastServiceDate(meta.warrantyServiceDetails.lastServiceDate || '');
            setLastServiceMileage(
                meta.warrantyServiceDetails.lastServiceMileage != null ? String(meta.warrantyServiceDetails.lastServiceMileage) : ''
            );
            setServiceHistory(meta.warrantyServiceDetails.serviceHistory || '');
        }

        if (meta?.additionalNotes) setAdditionalNotes(meta.additionalNotes || '');
    // We only want to run this when initial data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, props?.vehicleId, props?.initial, setValue]);

    // Clear model selection when make changes and load models for that make
    useEffect(() => {
        // Clear model selection when make changes
        setValue('model', '');
        
        if (selectedMake && typeof window !== 'undefined') {
            // Load (and auto-repair if needed) models for this make.
            // Source of truth: per-make localStorage key `vehicle-models-${make}`.
            setModels(initializeModelsForMake(selectedMake));
        } else {
            setModels([]);
        }
    }, [selectedMake, setValue]);

    const wizardSteps = [
        {
            key: 'vehicle',
            name: 'Vehicle Details',
            description: 'Basic information and specifications',
            icon: Car,
            sections: ['basic', 'specifications', 'accessories'] as const,
            rhfFields: [
                'make',
                'model',
                'year',
                'variant',
                'color',
                'condition',
                'mileage',
                'fuel_type',
                'transmission',
                'registration_number',
                'engine_number',
                'chassis_number',
            ] as const,
        },
        {
            key: 'pricing',
            name: 'Pricing',
            description: 'Selling/purchase price and status',
            icon: DollarSign,
            sections: ['pricing', 'payment', 'commission'] as const,
            rhfFields: ['selling_price', 'purchase_price', 'status'] as const,
        },
        {
            key: 'media',
            name: 'Media & Documents',
            description: 'Vehicle images and documents',
            icon: ImageIcon,
            sections: ['images', 'vehicleDocuments', 'buyerSeller'] as const,
            rhfFields: [] as const,
        },
        {
            key: 'parties',
            name: 'Parties',
            description: 'Buyer and seller details',
            icon: Users,
            sections: ['sellerDetails', 'buyerDetails'] as const,
            rhfFields: [] as const,
        },
        {
            key: 'compliance',
            name: 'Compliance',
            description: 'Insurance, tax, ownership and warranty',
            icon: ShieldCheck,
            sections: ['insurance', 'taxRegistration', 'ownership', 'warranty'] as const,
            rhfFields: [] as const,
        },
        {
            key: 'notes',
            name: 'Notes',
            description: 'Extra notes and description',
            icon: FileText,
            sections: ['additionalNotes', 'description'] as const,
            rhfFields: ['description'] as const,
        },
    ] as const;

    const activeSteps = wizardSteps.filter((step) =>
        step.sections.some((sectionId) => isSectionEnabled(sectionId))
    );

    // Keep current step valid if config changes
    useEffect(() => {
        if (activeSteps.length === 0) {
            setCurrentStepIndex(0);
            return;
        }
        setCurrentStepIndex((prev) => Math.min(prev, activeSteps.length - 1));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSteps.length]);

    // Scroll to top of form when switching steps
    useEffect(() => {
        const el = document.getElementById('vehicle-form-top');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [currentStepIndex]);

    const addAccessory = () => {
        if (newAccessory.trim() && !accessories.includes(newAccessory.trim())) {
            setAccessories([...accessories, newAccessory.trim()]);
            setNewAccessory('');
        }
    };

    const removeAccessory = (index: number) => {
        setAccessories(accessories.filter((_, i) => i !== index));
    };

    const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
        try {
            setIsSubmitting(true);
            const payload = {
                    buyerDocumentIds,
                    sellerDocumentIds,
                    chassisImageId,
                    accessories,
                    vehicleDocumentIds,
                    paymentDetails: {
                        method: paymentMethod,
                        downPayment: downPayment ? parseFloat(downPayment) : null,
                        remainingAmount: remainingAmount ? parseFloat(remainingAmount) : null,
                        paymentDate: paymentDate || null,
                    },
                    sellerDetails: {
                        name: sellerName,
                        phone: sellerPhoneRaw,
                        cnic: sellerCNICRaw,
                        address: sellerAddress,
                        party_type: sellerPartyType,
                        investor_id: sellerPartyType === 'investor' ? sellerInvestorId : undefined,
                    },
                    buyerDetails: {
                        name: buyerName,
                        phone: buyerPhoneRaw,
                        cnic: buyerCNICRaw,
                        address: buyerAddress,
                        party_type: buyerPartyType,
                        investor_id: buyerPartyType === 'investor' ? buyerInvestorId : undefined,
                    },
                    commissionDetails: {
                        amount: commissionAmount ? parseFloat(commissionAmount) : null,
                        percentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
                        salespersonId: salespersonId || null,
                    },
                    insuranceDetails: {
                        company: insuranceCompany || null,
                        policyNumber: insurancePolicyNumber || null,
                        expiryDate: insuranceExpiryDate || null,
                        amount: insuranceAmount ? parseFloat(insuranceAmount) : null,
                    },
                    taxRegistrationDetails: {
                        roadTaxStatus: roadTaxStatus || null,
                        roadTaxExpiryDate: roadTaxExpiryDate || null,
                        fitnessCertificateNumber: fitnessCertificateNumber || null,
                        fitnessExpiryDate: fitnessExpiryDate || null,
                    },
                    ownershipDetails: {
                        previousOwnerName: previousOwnerName || null,
                        previousOwnerPhone: previousOwnerPhoneRaw || null,
                        transferDate: ownershipTransferDate || null,
                    },
                    warrantyServiceDetails: {
                        warrantyType: warrantyType || null,
                        warrantyExpiryDate: warrantyExpiryDate || null,
                        warrantyDetails: warrantyDetails || null,
                        lastServiceDate: lastServiceDate || null,
                        lastServiceMileage: lastServiceMileage ? parseFloat(lastServiceMileage) : null,
                        serviceHistory: serviceHistory || null,
                    },
                    additionalNotes: additionalNotes || null,
                };

            if (mode === 'edit') {
                if (!props?.vehicleId) throw new Error('Missing vehicle id for edit.');
                await updateVehicle(props.vehicleId, data, imageUrls, payload);
            } else {
                await createVehicle(data, imageUrls, payload);
            }
            // Rerouting handled by server action
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
            // Show error toast (omitted for brevity)
        }
    };

    const isWizardEnabled = activeSteps.length > 0;
    const currentStep = isWizardEnabled ? activeSteps[currentStepIndex] : null;
    const stepNumber = isWizardEnabled ? currentStepIndex + 1 : 1;
    const totalSteps = isWizardEnabled ? activeSteps.length : 1;
    const isLastStep = !isWizardEnabled || currentStepIndex === activeSteps.length - 1;

    const submitLabel = mode === 'edit' ? 'Save Changes' : 'Add Vehicle';

    const goNext = async () => {
        if (!isWizardEnabled) return;
        if (currentStepIndex >= activeSteps.length - 1) return;

        const fields = currentStep?.rhfFields ?? [];
        const ok = fields.length === 0 ? true : await trigger(fields as any, { shouldFocus: true });
        if (!ok) return;

        setCurrentStepIndex((p) => Math.min(p + 1, activeSteps.length - 1));
    };

    const goBack = () => {
        if (!isWizardEnabled) return;
        setCurrentStepIndex((p) => Math.max(p - 1, 0));
    };

    return (
        <form id="vehicle-form-top" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Top Actions */}
            <div className="flex items-center justify-between gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                </Button>
                <FormConfigDialog />
            </div>

            {/* Progress Steps */}
            {isWizardEnabled ? (
                <div className="space-y-4">
                    <div className="flex gap-2 items-center overflow-x-auto pb-1">
                        {activeSteps.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = currentStepIndex >= idx;
                            const isCompleted = currentStepIndex > idx;
                            return (
                                <div key={step.key} className="flex items-center shrink-0">
                                    <div
                                        className={cn(
                                            'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                                            isActive
                                                ? 'bg-primary border-primary text-primary-foreground'
                                                : 'border-muted-foreground text-muted-foreground'
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    {idx < activeSteps.length - 1 && (
                                        <div
                                            className={cn(
                                                'w-8 h-0.5 mx-1',
                                                isCompleted ? 'bg-primary' : 'bg-muted'
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        Step {stepNumber} of {totalSteps}: {currentStep?.name}
                    </p>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Form</CardTitle>
                        <CardDescription>
                            All sections are currently hidden via “Configure Form”.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* Step Content */}
            {currentStep && (
                <Card>
                    <CardHeader>
                        <CardTitle>{currentStep.name}</CardTitle>
                        <CardDescription>{currentStep.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

            {/* 1. Basic Information */}
            {currentStep.key === 'vehicle' && isSectionEnabled('basic') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Make</Label>
                            <EditableSelect
                                value={watch('make')}
                                onValueChange={(val) => setValue('make', val)}
                                options={makes}
                                onOptionsChange={setMakes}
                                placeholder="Select make"
                                storageKey="vehicle-makes"
                            />
                            {errors.make && <p className="text-sm text-destructive">{errors.make.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Model</Label>
                            <EditableSelect
                                key={`model-select-${selectedMake || 'none'}`}
                                value={watch('model')}
                                onValueChange={(val) => setValue('model', val)}
                                options={models}
                                onOptionsChange={setModels}
                                placeholder={selectedMake ? "Select model" : "Select make first"}
                                storageKey={selectedMake ? `vehicle-models-${selectedMake}` : undefined}
                                disabled={!selectedMake}
                            />
                            {!selectedMake && (
                                <p className="text-xs text-muted-foreground">Please select a make first</p>
                            )}
                            {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input type="number" placeholder="2024" {...register('year')} className="w-full" />
                            {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Variant</Label>
                            <Input placeholder="Oriel, RS, GLi" {...register('variant')} className="w-full" />
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <Input placeholder="White, Black" {...register('color')} className="w-full" />
                            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <Select onValueChange={(val: any) => setValue('condition', val)} defaultValue="used">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VEHICLE_CONDITION.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Specifications */}
            {currentStep.key === 'vehicle' && isSectionEnabled('specifications') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Specifications</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Mileage (km)</Label>
                            <Input type="number" placeholder="0" {...register('mileage')} className="w-full" />
                            {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Fuel Type</Label>
                            <Select onValueChange={(val: any) => setValue('fuel_type', val)} defaultValue="petrol">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select fuel type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FUEL_TYPES.map((f) => (
                                        <SelectItem key={f.value} value={f.value}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Transmission</Label>
                            <Select onValueChange={(val: any) => setValue('transmission', val)} defaultValue="automatic">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select transmission" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRANSMISSION_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Registration No.</Label>
                            <Input placeholder="ABC-123" {...register('registration_number')} className="w-full" />
                        </div>
                        <div className="space-y-2">
                            <Label>Engine No.</Label>
                            <Input placeholder="Optional" {...register('engine_number')} className="w-full" />
                        </div>
                        <div className="space-y-2">
                            <Label>Chassis No.</Label>
                            <Input placeholder="Optional" {...register('chassis_number')} className="w-full" />
                        </div>
                    </div>

                    {/* Chassis Number Image */}
                    <div className="space-y-2">
                        <ChassisImageUpload onImageUploaded={setChassisImageId} />
                    </div>
                </div>
            )}

            {/* 3. Pricing */}
            {currentStep.key === 'pricing' && isSectionEnabled('pricing') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Pricing</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Selling Price (PKR)</Label>
                            <Input type="number" placeholder="0" {...register('selling_price')} className="w-full" />
                            {errors.selling_price && <p className="text-sm text-destructive">{errors.selling_price.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Price (PKR)</Label>
                            <Input type="number" placeholder="Optional" {...register('purchase_price')} className="w-full" />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select onValueChange={(val: any) => setValue('status', val)} defaultValue="available">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VEHICLE_STATUS.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Images */}
            {currentStep.key === 'media' && isSectionEnabled('images') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Images</h3>
                    <ImageUpload value={imageUrls} onChange={setImageUrls} />
                </div>
            )}

            {/* 4b. Buyer/Seller Images */}
            {currentStep.key === 'media' && isSectionEnabled('buyerSeller') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Buyer & Seller</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                        <PartyDocumentsUpload party="seller" onDocumentIdsChange={setSellerDocumentIds} />
                        <PartyDocumentsUpload party="buyer" onDocumentIdsChange={setBuyerDocumentIds} />
                    </div>
                </div>
            )}

            {/* 5. Vehicle Accessories */}
            {currentStep.key === 'vehicle' && isSectionEnabled('accessories') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vehicle Accessories</h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add accessory (e.g., GPS, Sound System, Alloy Wheels)"
                                value={newAccessory}
                                onChange={(e) => setNewAccessory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addAccessory();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button type="button" variant="secondary" onClick={addAccessory}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                            </Button>
                        </div>
                        {accessories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {accessories.map((accessory, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-sm"
                                    >
                                        <span>{accessory}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAccessory(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 6. Vehicle Documents */}
            {currentStep.key === 'media' && isSectionEnabled('vehicleDocuments') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vehicle Documents</h3>
                    <VehicleDocumentsUpload onDocumentIdsChange={setVehicleDocumentIds} />
                </div>
            )}

            {/* 7. Payment Details */}
            {currentStep.key === 'pricing' && isSectionEnabled('payment') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Payment Details</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="financing">Financing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentMethod === 'financing' ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Down Payment (PKR)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Remaining Amount (PKR)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={remainingAmount}
                                        onChange={(e) => setRemainingAmount(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Date</Label>
                                    <Input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        ) : paymentMethod ? (
                            <div className="space-y-2">
                                <Label>Amount Paid (PKR)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* 8. Seller Details */}
            {currentStep.key === 'parties' && isSectionEnabled('sellerDetails') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Seller Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Seller Type</Label>
                            <Select
                                value={sellerPartyType}
                                onValueChange={(v: any) => {
                                    setSellerPartyType(v);
                                    if (v !== 'investor') {
                                        setSellerInvestorId('');
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select seller type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Client / Person</SelectItem>
                                    <SelectItem value="investor">Investor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {sellerPartyType === 'investor' ? (
                            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                                <InvestorSelect
                                    label="Select Seller Investor"
                                    value={sellerInvestorId}
                                    onValueChange={(id, inv) => {
                                        setSellerInvestorId(id);
                                        if (inv) {
                                            setSellerName(inv.name);
                                            sellerPhoneInput.setValue(inv.phone || '');
                                            sellerCNICInput.setValue(inv.cnic || '');
                                            setSellerAddress(inv.address || '');
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                            </div>
                        ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Seller Name</Label>
                            <Input
                                placeholder="Full name"
                                value={sellerName}
                                onChange={(e) => setSellerName(e.target.value)}
                                className="w-full"
                                disabled={sellerPartyType === 'investor'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>S/W/D/O Name</Label>
                            <Input
                                placeholder="e.g. Father/Husband/Guardian name"
                                value={sellerSwdoName}
                                onChange={(e) => setSellerSwdoName(e.target.value)}
                                className="w-full"
                                disabled={sellerPartyType === 'investor'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Seller Phone</Label>
                            <Input
                                placeholder="03XX-XXXXXXX"
                                value={sellerPhoneInput.value}
                                onChange={sellerPhoneInput.onChange}
                                className="w-full"
                                disabled={sellerPartyType === 'investor'}
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Seller CNIC</Label>
                            <Input
                                placeholder="XXXXX-XXXXXXX-X"
                                value={sellerCNICInput.value}
                                onChange={sellerCNICInput.onChange}
                                className="w-full"
                                disabled={sellerPartyType === 'investor'}
                                maxLength={15}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                            <Label>Seller Address</Label>
                            <Textarea
                                placeholder="Complete address"
                                value={sellerAddress}
                                onChange={(e) => setSellerAddress(e.target.value)}
                                className="w-full"
                                disabled={sellerPartyType === 'investor'}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 9. Buyer Details */}
            {currentStep.key === 'parties' && isSectionEnabled('buyerDetails') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Buyer Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Buyer Type</Label>
                            <Select
                                value={buyerPartyType}
                                onValueChange={(v: any) => {
                                    setBuyerPartyType(v);
                                    if (v !== 'investor') {
                                        setBuyerInvestorId('');
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select buyer type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Client / Person</SelectItem>
                                    <SelectItem value="investor">Investor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {buyerPartyType === 'investor' ? (
                            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                                <InvestorSelect
                                    label="Select Buyer Investor"
                                    value={buyerInvestorId}
                                    onValueChange={(id, inv) => {
                                        setBuyerInvestorId(id);
                                        if (inv) {
                                            setBuyerName(inv.name);
                                            buyerPhoneInput.setValue(inv.phone || '');
                                            buyerCNICInput.setValue(inv.cnic || '');
                                            setBuyerAddress(inv.address || '');
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                            </div>
                        ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Buyer Name</Label>
                            <Input
                                placeholder="Full name"
                                value={buyerName}
                                onChange={(e) => setBuyerName(e.target.value)}
                                className="w-full"
                                disabled={buyerPartyType === 'investor'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>S/W/D/O Name</Label>
                            <Input
                                placeholder="e.g. Father/Husband/Guardian name"
                                value={buyerSwdoName}
                                onChange={(e) => setBuyerSwdoName(e.target.value)}
                                className="w-full"
                                disabled={buyerPartyType === 'investor'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Buyer Phone</Label>
                            <Input
                                placeholder="03XX-XXXXXXX"
                                value={buyerPhoneInput.value}
                                onChange={buyerPhoneInput.onChange}
                                className="w-full"
                                disabled={buyerPartyType === 'investor'}
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Buyer CNIC</Label>
                            <Input
                                placeholder="XXXXX-XXXXXXX-X"
                                value={buyerCNICInput.value}
                                onChange={buyerCNICInput.onChange}
                                className="w-full"
                                disabled={buyerPartyType === 'investor'}
                                maxLength={15}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                            <Label>Buyer Address</Label>
                            <Textarea
                                placeholder="Complete address"
                                value={buyerAddress}
                                onChange={(e) => setBuyerAddress(e.target.value)}
                                className="w-full"
                                disabled={buyerPartyType === 'investor'}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 10. Commission Details */}
            {currentStep.key === 'pricing' && isSectionEnabled('commission') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Commission Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Commission Amount (PKR)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={commissionAmount}
                                onChange={(e) => setCommissionAmount(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Commission Percentage (%)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Salesperson ID</Label>
                            <Input
                                placeholder="Optional"
                                value={salespersonId}
                                onChange={(e) => setSalespersonId(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 11. Insurance Details */}
            {currentStep.key === 'compliance' && isSectionEnabled('insurance') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Insurance Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Insurance Company</Label>
                            <Input
                                placeholder="e.g., EFU, Adamjee, TPL"
                                value={insuranceCompany}
                                onChange={(e) => setInsuranceCompany(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Policy Number</Label>
                            <Input
                                placeholder="Policy number"
                                value={insurancePolicyNumber}
                                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input
                                type="date"
                                value={insuranceExpiryDate}
                                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Insurance Amount (PKR)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={insuranceAmount}
                                onChange={(e) => setInsuranceAmount(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 12. Tax & Registration */}
            {currentStep.key === 'compliance' && isSectionEnabled('taxRegistration') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tax & Registration</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Road Tax Status</Label>
                            <Select value={roadTaxStatus} onValueChange={(val: any) => setRoadTaxStatus(val)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                    <SelectItem value="exempt">Exempt</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Road Tax Expiry Date</Label>
                            <Input
                                type="date"
                                value={roadTaxExpiryDate}
                                onChange={(e) => setRoadTaxExpiryDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fitness Certificate Number</Label>
                            <Input
                                placeholder="Fitness certificate number"
                                value={fitnessCertificateNumber}
                                onChange={(e) => setFitnessCertificateNumber(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fitness Expiry Date</Label>
                            <Input
                                type="date"
                                value={fitnessExpiryDate}
                                onChange={(e) => setFitnessExpiryDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 13. Ownership & Transfer */}
            {currentStep.key === 'compliance' && isSectionEnabled('ownership') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ownership & Transfer</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Previous Owner Name</Label>
                            <Input
                                placeholder="Previous owner name"
                                value={previousOwnerName}
                                onChange={(e) => setPreviousOwnerName(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Previous Owner Phone</Label>
                            <Input
                                placeholder="03XX-XXXXXXX"
                                value={previousOwnerPhoneInput.value}
                                onChange={previousOwnerPhoneInput.onChange}
                                className="w-full"
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ownership Transfer Date</Label>
                            <Input
                                type="date"
                                value={ownershipTransferDate}
                                onChange={(e) => setOwnershipTransferDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 14. Warranty & Service */}
            {currentStep.key === 'compliance' && isSectionEnabled('warranty') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Warranty & Service</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Warranty Type</Label>
                            <Select value={warrantyType} onValueChange={(val: any) => setWarrantyType(val)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select warranty type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                                    <SelectItem value="dealer">Dealer Warranty</SelectItem>
                                    <SelectItem value="none">No Warranty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Warranty Expiry Date</Label>
                            <Input
                                type="date"
                                value={warrantyExpiryDate}
                                onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                            <Label>Warranty Details</Label>
                            <Textarea
                                placeholder="Warranty terms and conditions..."
                                value={warrantyDetails}
                                onChange={(e) => setWarrantyDetails(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Service Date</Label>
                            <Input
                                type="date"
                                value={lastServiceDate}
                                onChange={(e) => setLastServiceDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Service Mileage (km)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={lastServiceMileage}
                                onChange={(e) => setLastServiceMileage(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                            <Label>Service History</Label>
                            <Textarea
                                placeholder="Service history and maintenance records..."
                                value={serviceHistory}
                                onChange={(e) => setServiceHistory(e.target.value)}
                                className="w-full min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 15. Additional Notes */}
            {currentStep.key === 'notes' && isSectionEnabled('additionalNotes') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Notes</h3>
                    <Textarea
                        placeholder="Any additional notes, remarks, or important information about this vehicle..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="min-h-[120px]"
                    />
                </div>
            )}

            {/* 16. Description */}
            {currentStep.key === 'notes' && isSectionEnabled('description') && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Description</h3>
                    <Textarea
                        placeholder="Additional details about the vehicle..."
                        className="min-h-[100px]"
                        {...register('description')}
                    />
                </div>
            )}

                    </CardContent>
                </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={!isWizardEnabled || currentStepIndex === 0 || isSubmitting}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    {!isLastStep ? (
                        <Button type="button" onClick={goNext} disabled={isSubmitting}>
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving Vehicle...
                                </>
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
}
