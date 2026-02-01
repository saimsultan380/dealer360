'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search, Car, ShoppingCart, User, CreditCard, CalendarDays, FileText, ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createSale, getAvailableVehicles, SaleFormData } from '@/lib/actions/sales';
import { VehicleSelectCard } from './vehicle-select-card';
import { BuyerImageUpload } from './buyer-image-upload';
import { SellerInfoCard } from './seller-info-card';
import { SellerSelect } from './seller-select';
import { AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { InvestorSelect } from '@/components/investors/investor-select';
import { useFormattedInput } from '@/lib/hooks/use-formatted-input';

const saleSchema = z.object({
    vehicle_id: z.string().min(1, 'Please select a vehicle'),
    buyer_party_type: z.enum(['client', 'investor']).optional(),
    buyer_investor_id: z.string().optional(),
    customer_name: z.string().min(1, 'Customer name is required'),
    customer_swdo_name: z.string().optional(),
    customer_phone: z.string().min(1, 'Customer phone is required'),
    customer_cnic: z.string().optional(),
    customer_address: z.string().optional(),
    sale_price: z.number().min(1, 'Sale price must be greater than 0'),
    down_payment: z.number().min(0, 'Down payment cannot be negative'),
    commission_amount: z.number().min(0, 'Commission cannot be negative').optional(),
    payment_method: z.enum(['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'financing']),
    deal_date: z.string().min(1, 'Deal date is required'),
    delivery_date: z.string().optional(),
    notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

interface BuyerImages {
    photo?: File;
    cnicFront?: File;
    cnicBack?: File;
}

export function SaleForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [buyerImages, setBuyerImages] = useState<BuyerImages>({});
    const [sellerDetails, setSellerDetails] = useState<{
        name: string;
        phone: string;
        cnic?: string;
        address?: string;
    }>({
        name: '',
        phone: '',
        cnic: '',
        address: '',
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            deal_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            down_payment: 0,
            commission_amount: 0,
            buyer_party_type: 'client',
        },
    });

    const salePrice = watch('sale_price');
    const downPayment = watch('down_payment');
    const buyerPartyType = watch('buyer_party_type') || 'client';
    const customerPhone = watch('customer_phone') || '';
    const customerCNIC = watch('customer_cnic') || '';
    
    // Formatted input hooks
    const phoneInput = useFormattedInput({ 
        type: 'phone', 
        initialValue: customerPhone, 
        onChange: (value) => setValue('customer_phone', value) 
    });
    const cnicInput = useFormattedInput({ 
        type: 'cnic', 
        initialValue: customerCNIC, 
        onChange: (value) => setValue('customer_cnic', value) 
    });

    useEffect(() => {
        async function fetchVehicles() {
            setLoadingVehicles(true);
            const result = await getAvailableVehicles();
            if (result.error) {
                console.error('Error fetching vehicles:', result.error);
            } else {
                setVehicles(result.data || []);
            }
            setLoadingVehicles(false);
        }
        fetchVehicles();
    }, []);

    const handleVehicleSelect = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        setSelectedVehicle(vehicle);
        setValue('vehicle_id', vehicleId);
        if (vehicle?.selling_price) {
            setValue('sale_price', parseFloat(vehicle.selling_price));
        }
    };

    const filteredVehicles = vehicles.filter((vehicle) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            vehicle.make?.toLowerCase().includes(query) ||
            vehicle.model?.toLowerCase().includes(query) ||
            vehicle.registration_number?.toLowerCase().includes(query) ||
            vehicle.variant?.toLowerCase().includes(query)
        );
    });

    const onSubmit = async (data: SaleFormValues) => {
        try {
            setIsSubmitting(true);
            const saleData: SaleFormData = {
                ...(data as any),
                remaining_amount: data.sale_price - data.down_payment,
            };
            // TODO: Handle buyer image uploads
            await createSale(saleData);
            // Redirect handled by server action
        } catch (error) {
            console.error('Error creating sale:', error);
            setIsSubmitting(false);
        }
    };

    const remainingAmount = downPayment !== undefined ? Math.max(0, (salePrice || 0) - (downPayment || 0)) : 0;
    const profit = selectedVehicle
        ? (salePrice || selectedVehicle.selling_price || 0) - (selectedVehicle.purchase_price || 0)
        : 0;

    const steps = [
        { id: 1, name: 'Select Vehicle', icon: Car },
        { id: 2, name: 'Buyer & Docs', icon: User },
        { id: 3, name: 'Seller', icon: User },
        { id: 4, name: 'Sale Details', icon: ShoppingCart },
        { id: 5, name: 'Review', icon: CheckCircle2 },
    ] as const;

    const nextStep = async () => {
        let ok = true;
        if (currentStep === 1) {
            ok = await trigger(['vehicle_id']);
            if (!selectedVehicle) ok = false;
        } else if (currentStep === 2) {
            ok = await trigger(['customer_name', 'customer_phone']);
        } else if (currentStep === 4) {
            ok = await trigger(['sale_price', 'down_payment', 'payment_method', 'deal_date', 'commission_amount']);
        }
        if (!ok) return;
        setCurrentStep((p) => Math.min(p + 1, steps.length));
    };

    const prevStep = () => setCurrentStep((p) => Math.max(1, p - 1));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('vehicle_id')} />

            {/* Wizard Header */}
            <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold truncate">Create Sale</h1>
                    <p className="text-muted-foreground text-sm">
                        Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={[
                                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                                    currentStep >= step.id
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground/40 text-muted-foreground',
                                ].join(' ')}
                            >
                                <step.icon className="h-5 w-5" />
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={['w-10 h-0.5 mx-2', currentStep > step.id ? 'bg-primary' : 'bg-muted'].join(' ')} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Vehicle Selection */}
            {currentStep === 1 && (
            <Card className="overflow-hidden gap-0">
                <CardHeader className="-mt-4 sm:-mt-6 pt-4 sm:pt-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Select Vehicle</CardTitle>
                            <CardDescription>Choose a vehicle from your available inventory</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loadingVehicles ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                <p className="text-sm text-muted-foreground">Loading available vehicles...</p>
                            </div>
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Car className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-medium mb-1">No available vehicles</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add vehicles to your inventory first
                            </p>
                            <Button variant="outline" onClick={() => router.push('/dashboard/inventory/new')}>
                                Add Vehicle
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by make, model, or registration..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Vehicle Grid */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredVehicles.map((vehicle) => (
                                    <VehicleSelectCard
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        isSelected={selectedVehicle?.id === vehicle.id}
                                        onSelect={handleVehicleSelect}
                                    />
                                ))}
                            </div>

                            {filteredVehicles.length === 0 && searchQuery && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No vehicles match your search
                                </div>
                            )}

                            {errors.vehicle_id && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.vehicle_id.message}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            {/* Step 2: Buyer Details + Documents */}
            {currentStep === 2 && (
            <Card className="overflow-hidden gap-0">
                <CardHeader className="-mt-4 sm:-mt-6 pt-4 sm:pt-6 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle>Buyer Details</CardTitle>
                            <CardDescription>Enter the buyer&apos;s information</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Buyer Type */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Buyer Type</Label>
                            <Select
                                value={buyerPartyType}
                                onValueChange={(val: any) => {
                                    setValue('buyer_party_type', val);
                                    // reset investor selection when switching back to client
                                    if (val !== 'investor') {
                                        setValue('buyer_investor_id', '');
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select buyer type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Client / Customer</SelectItem>
                                    <SelectItem value="investor">Investor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {buyerPartyType === 'investor' ? (
                            <InvestorSelect
                                label="Select Investor Buyer"
                                value={watch('buyer_investor_id') || ''}
                                onValueChange={(id, inv) => {
                                    setValue('buyer_investor_id', id);
                                    // Fill buyer fields from investor
                                    if (inv) {
                                        setValue('customer_name', inv.name);
                                        phoneInput.setValue(inv.phone || '');
                                        cnicInput.setValue(inv.cnic || '');
                                        setValue('customer_address', inv.address || '');
                                    }
                                }}
                                disabled={isSubmitting}
                            />
                        ) : null}
                    </div>

                    {/* Basic Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer Name *
                            </Label>
                            <Input
                                placeholder="Full name"
                                {...register('customer_name')}
                                className={errors.customer_name ? 'border-destructive' : ''}
                                disabled={buyerPartyType === 'investor'}
                            />
                            {errors.customer_name && (
                                <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>S/W/D/O Name (Optional)</Label>
                            <Input
                                placeholder="e.g. Father/Husband/Guardian name"
                                {...register('customer_swdo_name')}
                                disabled={buyerPartyType === 'investor'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Phone Number *
                            </Label>
                            <Input
                                placeholder="03XX-XXXXXXX"
                                value={phoneInput.value}
                                onChange={phoneInput.onChange}
                                className={errors.customer_phone ? 'border-destructive' : ''}
                                disabled={buyerPartyType === 'investor'}
                                maxLength={12}
                            />
                            {errors.customer_phone && (
                                <p className="text-sm text-destructive">{errors.customer_phone.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>CNIC (Optional)</Label>
                            <Input
                                placeholder="XXXXX-XXXXXXX-X"
                                value={cnicInput.value}
                                onChange={cnicInput.onChange}
                                disabled={buyerPartyType === 'investor'}
                                maxLength={15}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Address (Optional)</Label>
                            <Textarea
                                placeholder="Complete address"
                                {...register('customer_address')}
                                rows={2}
                                disabled={buyerPartyType === 'investor'}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Buyer Images */}
                    <BuyerImageUpload
                        onImagesChange={setBuyerImages}
                        disabled={isSubmitting}
                    />
                </CardContent>
            </Card>
            )}

            {/* Step 3: Seller */}
            {currentStep === 3 && selectedVehicle && (
                <>
                <SellerInfoCard
                    seller={{
                        name: selectedVehicle.seller_name,
                        phone: selectedVehicle.seller_phone,
                        cnic: selectedVehicle.seller_cnic,
                        address: selectedVehicle.seller_address,
                    }}
                    purchaseDate={selectedVehicle.created_at}
                    purchasePrice={selectedVehicle.purchase_price}
                />
                <Card className="overflow-hidden gap-0">
                    <CardHeader className="-mt-4 sm:-mt-6 pt-4 sm:pt-6 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-b">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle>Seller Details</CardTitle>
                                <CardDescription>
                                    Select an existing client or add a new seller who originally sold this vehicle
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <SellerSelect
                            defaultSeller={{
                                name: selectedVehicle.seller_name,
                                phone: selectedVehicle.seller_phone,
                                cnic: selectedVehicle.seller_cnic,
                                address: selectedVehicle.seller_address,
                            }}
                            onSellerChange={setSellerDetails}
                            disabled={isSubmitting}
                        />
                    </CardContent>
                </Card>
                </>
            )}

            {/* Step 4: Sale Details */}
            {currentStep === 4 && (
            <Card className="overflow-hidden gap-0">
                <CardHeader className="-mt-4 sm:-mt-6 pt-4 sm:pt-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <CardTitle>Sale Details</CardTitle>
                            <CardDescription>Transaction and payment information</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Sale Price (PKR) *
                            </Label>
                            <Input
                                type="number"
                                placeholder="0"
                                {...register('sale_price', { valueAsNumber: true })}
                                className={errors.sale_price ? 'border-destructive' : ''}
                            />
                            {errors.sale_price && (
                                <p className="text-sm text-destructive">{errors.sale_price.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Down Payment (PKR) *</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                {...register('down_payment', { valueAsNumber: true })}
                                className={errors.down_payment ? 'border-destructive' : ''}
                            />
                            {errors.down_payment && (
                                <p className="text-sm text-destructive">{errors.down_payment.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Commission (PKR)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                {...register('commission_amount', {
                                    setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
                                })}
                                className={errors.commission_amount ? 'border-destructive' : ''}
                            />
                            {errors.commission_amount && (
                                <p className="text-sm text-destructive">
                                    {(errors.commission_amount as any)?.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Remaining Amount</Label>
                            <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-sm font-medium">
                                PKR {remainingAmount.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {remainingAmount > 0
                                    ? 'Sale will be marked as pending'
                                    : 'Sale will be marked as completed'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method *</Label>
                            <Select
                                value={watch('payment_method')}
                                onValueChange={(val: any) => setValue('payment_method', val)}
                            >
                                <SelectTrigger className={errors.payment_method ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                                    <SelectItem value="financing">Financing</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.payment_method && (
                                <p className="text-sm text-destructive">{errors.payment_method.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Deal Date *
                            </Label>
                            <Input
                                type="date"
                                {...register('deal_date')}
                                className={errors.deal_date ? 'border-destructive' : ''}
                            />
                            {errors.deal_date && (
                                <p className="text-sm text-destructive">{errors.deal_date.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Delivery Date (Optional)</Label>
                            <Input type="date" {...register('delivery_date')} />
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                            <Label className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Notes (Optional)
                            </Label>
                            <Textarea
                                placeholder="Additional notes about this sale..."
                                {...register('notes')}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Profit Summary */}
                    {selectedVehicle && profit !== 0 && (
                        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="font-medium">Estimated Profit</span>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {profit >= 0 ? '+' : ''}PKR {profit.toLocaleString()}
                                    </p>
                                    {selectedVehicle.purchase_price > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {((profit / selectedVehicle.purchase_price) * 100).toFixed(1)}% margin
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/60 to-transparent border-b">
                        <CardTitle>Review & Submit</CardTitle>
                        <CardDescription>Confirm details before saving</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Vehicle</div>
                                <div className="font-medium">
                                    {selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : '-'}
                                </div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Buyer</div>
                                <div className="font-medium">{watch('customer_name') || '-'}</div>
                                <div className="text-sm text-muted-foreground">{watch('customer_phone') || '-'}</div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Sale Price</div>
                                <div className="font-semibold">PKR {(watch('sale_price') || 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Down Payment</div>
                                <div className="font-semibold">PKR {(watch('down_payment') || 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Commission</div>
                                <div className="font-semibold">PKR {Number(watch('commission_amount') || 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Remaining</div>
                                <div className="font-semibold">PKR {remainingAmount.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Buyer documents selected: {buyerImages.photo ? 'Photo ' : ''}{buyerImages.cnicFront ? 'CNIC Front ' : ''}{buyerImages.cnicBack ? 'CNIC Back' : ''}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Wizard Actions */}
            <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isSubmitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                {currentStep < steps.length ? (
                    <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit" disabled={isSubmitting || !selectedVehicle} size="lg" className="min-w-[160px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Sale...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Create Sale
                            </>
                        )}
                    </Button>
                )}
            </div>
        </form>
    );
}
