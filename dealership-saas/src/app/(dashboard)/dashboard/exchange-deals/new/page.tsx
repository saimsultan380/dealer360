'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Loader2,
    Search,
    Car,
    User,
    ShoppingCart,
    DollarSign,
    FileText,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { createExchangeDeal } from '@/lib/actions/exchange-deals-complete';
import { getAvailableVehicles } from '@/lib/actions/sales';
import { ImageCapture } from '@/components/exchange-deals/image-capture';

const exchangeDealSchema = z.object({
    vehicle_id: z.string().min(1, 'Select a vehicle'),
    sale_price: z.number().min(1, 'Sale price must be greater than 0'),
    
    seller_name: z.string().min(1, 'Seller name is required'),
    seller_phone: z.string().min(1, 'Seller phone is required'),
    seller_email: z.string().email().optional().or(z.literal('')),
    seller_cnic: z.string().optional(),
    seller_address: z.string().optional(),
    seller_swdo_name: z.string().optional(),
    
    trade_in_make: z.string().min(1, 'Trade-in make is required'),
    trade_in_model: z.string().min(1, 'Trade-in model is required'),
    trade_in_year: z.number().min(1950, 'Valid year required'),
    trade_in_variant: z.string().optional(),
    trade_in_color: z.string().optional(),
    trade_in_registration: z.string().optional(),
    trade_in_agreed_value: z.number().min(0, 'Trade-in value must be >= 0'),
    trade_in_condition: z.enum(['new', 'used', 'certified']).optional(),
    trade_in_mileage: z.number().optional(),
    
    buyer_name: z.string().optional(),
    buyer_phone: z.string().optional(),
    buyer_email: z.string().email().optional().or(z.literal('')),
    buyer_cnic: z.string().optional(),
    buyer_address: z.string().optional(),
    buyer_swdo_name: z.string().optional(),
    
    down_payment: z.number().min(0),
    commission_amount: z.number().min(0, 'Commission must be >= 0').optional(),
    payment_method: z.enum(['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'financing']),
    deal_date: z.string().min(1),
    delivery_date: z.string().optional(),
    notes: z.string().optional(),
});

type ExchangeDealForm = z.infer<typeof exchangeDealSchema>;

const steps = [
    { id: 1, name: 'Select Vehicle', icon: Car },
    { id: 2, name: 'Seller Info', icon: User },
    { id: 3, name: 'Trade-in Details', icon: ShoppingCart },
    { id: 4, name: 'Buyer Info', icon: User },
    { id: 5, name: 'Deal Details', icon: DollarSign },
];

export default function NewExchangeDealPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Image states
    const [sellerPhotoUrl, setSellerPhotoUrl] = useState<string>('');
    const [buyerPhotoUrl, setBuyerPhotoUrl] = useState<string>('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ExchangeDealForm>({
        resolver: zodResolver(exchangeDealSchema),
        defaultValues: {
            deal_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            down_payment: 0,
            trade_in_condition: 'used',
            trade_in_year: new Date().getFullYear(),
        },
    });

    useEffect(() => {
        const fetchVehicles = async () => {
            setLoadingVehicles(true);
            const result = await getAvailableVehicles();
            setVehicles(result.data || []);
            setLoadingVehicles(false);
        };
        fetchVehicles();
    }, []);

    const salePrice = watch('sale_price');
    const tradeInValue = watch('trade_in_agreed_value');
    const downPayment = watch('down_payment');

    const netAmount = Math.max(0, (salePrice || 0) - (tradeInValue || 0));
    const remainingAmount = Math.max(0, netAmount - (downPayment || 0));

    const filteredVehicles = vehicles.filter((v) =>
        v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.registration_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleVehicleSelect = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        setSelectedVehicle(vehicle);
        setValue('vehicle_id', vehicleId);
        if (vehicle?.selling_price) {
            setValue('sale_price', parseFloat(vehicle.selling_price));
        }
    };

    const onSubmit = async (data: ExchangeDealForm) => {
        setIsSubmitting(true);
        try {
            const result = await createExchangeDeal(data as any);
            if (result.success) {
                router.push('/dashboard/exchange-deals');
                router.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Failed to create exchange deal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setCurrentStep((p) => Math.min(p + 1, 5));
    const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Exchange Deal</h1>
                    <p className="text-muted-foreground">
                        Record a vehicle exchange transaction with detailed buyer and seller information
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Progress Steps */}
            <div className="space-y-4">
                <div className="flex gap-2 items-center">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={cn(
                                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                                    currentStep >= step.id
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground text-muted-foreground'
                                )}
                            >
                                <step.icon className="h-5 w-5" />
                            </div>
                            {idx < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'w-8 h-0.5 mx-1',
                                        currentStep > step.id ? 'bg-primary' : 'bg-muted'
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                    Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
                </p>
            </div>

            {/* Step 1: Select Vehicle */}
            {currentStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Vehicle to Sell</CardTitle>
                        <CardDescription>Choose an available vehicle from your inventory</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingVehicles ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search vehicles..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <div className="grid gap-3">
                                    {filteredVehicles.map((vehicle) => (
                                        <div
                                            key={vehicle.id}
                                            onClick={() => handleVehicleSelect(vehicle.id)}
                                            className={cn(
                                                'p-4 border rounded-lg cursor-pointer transition-colors',
                                                selectedVehicle?.id === vehicle.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted hover:border-primary/50'
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {vehicle.registration_number}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-lg">
                                                    PKR {Number(vehicle.selling_price || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {errors.vehicle_id && (
                                    <div className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.vehicle_id.message}
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Seller Info */}
            {currentStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Seller Information</CardTitle>
                        <CardDescription>Customer trading in their vehicle</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Seller Name *</Label>
                                <Input placeholder="Full name" {...register('seller_name')} />
                                {errors.seller_name && (
                                    <p className="text-sm text-destructive">{errors.seller_name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>S/W/D/O Name (Optional)</Label>
                                <Input placeholder="e.g. Father/Husband/Guardian name" {...register('seller_swdo_name')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone *</Label>
                                <Input placeholder="0300-1234567" {...register('seller_phone')} />
                                {errors.seller_phone && (
                                    <p className="text-sm text-destructive">{errors.seller_phone.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Email (Optional)</Label>
                                <Input type="email" placeholder="seller@example.com" {...register('seller_email')} />
                            </div>
                            <div className="space-y-2">
                                <Label>CNIC (Optional)</Label>
                                <Input placeholder="XXXXX-XXXXXXX-X" {...register('seller_cnic')} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Address (Optional)</Label>
                                <Textarea rows={2} placeholder="Complete address" {...register('seller_address')} />
                            </div>
                        </div>

                        {/* Seller Photo Upload */}
                        <Separator />
                        <ImageCapture
                            label="Seller Photo"
                            description="Capture or upload photo of the seller"
                            image={sellerPhotoUrl}
                            onImageUploaded={(url) => {
                                setSellerPhotoUrl(url);
                            }}
                            onImageRemoved={() => {
                                setSellerPhotoUrl('');
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Trade-in Details */}
            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Trade-in Vehicle Details</CardTitle>
                        <CardDescription>Information about the vehicle being traded in</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Make *</Label>
                                <Input placeholder="e.g. Toyota" {...register('trade_in_make')} />
                                {errors.trade_in_make && (
                                    <p className="text-sm text-destructive">{errors.trade_in_make.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Model *</Label>
                                <Input placeholder="e.g. Corolla" {...register('trade_in_model')} />
                                {errors.trade_in_model && (
                                    <p className="text-sm text-destructive">{errors.trade_in_model.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Year *</Label>
                                <Input type="number" placeholder="2020" {...register('trade_in_year', { valueAsNumber: true })} />
                                {errors.trade_in_year && (
                                    <p className="text-sm text-destructive">{errors.trade_in_year.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Variant (Optional)</Label>
                                <Input placeholder="e.g. XLI" {...register('trade_in_variant')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Color (Optional)</Label>
                                <Input placeholder="e.g. White" {...register('trade_in_color')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Registration # (Optional)</Label>
                                <Input placeholder="e.g. LHR-1234" {...register('trade_in_registration')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mileage (Optional)</Label>
                                <Input type="number" placeholder="50000" {...register('trade_in_mileage', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Condition</Label>
                                <Select defaultValue="used" onValueChange={(v) => setValue('trade_in_condition', v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="used">Used</SelectItem>
                                        <SelectItem value="certified">Certified</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Agreed Value (PKR) *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...register('trade_in_agreed_value', { valueAsNumber: true })}
                                />
                                {errors.trade_in_agreed_value && (
                                    <p className="text-sm text-destructive">{errors.trade_in_agreed_value.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Trade-in Summary */}
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <p className="text-sm text-muted-foreground">Trade-in Summary</p>
                            <div className="flex justify-between font-semibold">
                                <span>Agreed Value:</span>
                                <span>PKR {Number(tradeInValue || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Buyer Info */}
            {currentStep === 4 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Buyer Information (Optional)</CardTitle>
                        <CardDescription>Customer buying the showroom vehicle</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Buyer Name</Label>
                                <Input placeholder="Full name" {...register('buyer_name')} />
                            </div>
                            <div className="space-y-2">
                                <Label>S/W/D/O Name (Optional)</Label>
                                <Input placeholder="e.g. Father/Husband/Guardian name" {...register('buyer_swdo_name')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input placeholder="0300-1234567" {...register('buyer_phone')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" placeholder="buyer@example.com" {...register('buyer_email')} />
                            </div>
                            <div className="space-y-2">
                                <Label>CNIC (Optional)</Label>
                                <Input placeholder="XXXXX-XXXXXXX-X" {...register('buyer_cnic')} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Address (Optional)</Label>
                                <Textarea rows={2} placeholder="Complete address" {...register('buyer_address')} />
                            </div>
                        </div>

                        {/* Buyer Photo Upload */}
                        <Separator />
                        <ImageCapture
                            label="Buyer Photo"
                            description="Capture or upload photo of the buyer"
                            image={buyerPhotoUrl}
                            onImageUploaded={(url) => {
                                setBuyerPhotoUrl(url);
                            }}
                            onImageRemoved={() => {
                                setBuyerPhotoUrl('');
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Deal Details */}
            {currentStep === 5 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Deal Details</CardTitle>
                        <CardDescription>Transaction and financial information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Sale Price (PKR) *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...register('sale_price', { valueAsNumber: true })}
                                />
                                {errors.sale_price && (
                                    <p className="text-sm text-destructive">{errors.sale_price.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Trade-in Value (PKR) *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...register('trade_in_agreed_value', { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Net Amount (PKR)</Label>
                                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-sm font-medium">
                                    PKR {netAmount.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Down Payment (PKR) *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...register('down_payment', { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Commission (PKR)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    {...register('commission_amount', {
                                        setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
                                    })}
                                />
                                {errors.commission_amount && (
                                    <p className="text-sm text-destructive">{(errors.commission_amount as any)?.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Remaining Amount (PKR)</Label>
                                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-sm font-bold text-primary">
                                    PKR {remainingAmount.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method *</Label>
                                <Select defaultValue="cash" onValueChange={(v) => setValue('payment_method', v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                        <SelectItem value="jazzcash">JazzCash</SelectItem>
                                        <SelectItem value="financing">Financing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Deal Date *</Label>
                                <Input type="date" {...register('deal_date')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Delivery Date</Label>
                                <Input type="date" {...register('delivery_date')} />
                            </div>
                            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                                <Label>Notes</Label>
                                <Textarea rows={3} placeholder="Additional notes..." {...register('notes')} />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-3">
                            <p className="font-semibold text-sm">Deal Summary</p>
                            <div className="grid gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Showroom Vehicle Sale Price:</span>
                                    <span className="font-medium">PKR {Number(salePrice || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Trade-in Value (Deduct):</span>
                                    <span className="font-medium text-orange-600">-PKR {Number(tradeInValue || 0).toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Customer Owes (Net):</span>
                                    <span className="text-lg">PKR {netAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Down Payment Received:</span>
                                    <span className="font-medium text-green-600">+PKR {Number(downPayment || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-primary">
                                    <span>Remaining Due:</span>
                                    <span className="text-lg">PKR {remainingAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard/exchange-deals')}
                    >
                        Cancel
                    </Button>
                    {currentStep < 5 ? (
                        <Button type="button" onClick={nextStep}>
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Exchange Deal'
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </form>
            </div>
        </div>
    );
}
