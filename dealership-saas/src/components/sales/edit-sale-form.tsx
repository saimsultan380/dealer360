'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import {
    Loader2,
    Car,
    User,
    ShoppingCart,
    DollarSign,
    CalendarDays,
    FileText,
    CreditCard,
    Save
} from 'lucide-react';
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
import { updateSale } from '@/lib/actions/sales';

const editSaleSchema = z.object({
    customer_name: z.string().min(1, 'Customer name is required'),
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

type EditSaleFormValues = z.infer<typeof editSaleSchema>;

interface EditSaleFormProps {
    sale: any;
}

export function EditSaleForm({ sale }: EditSaleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const vehicle = sale.vehicles;
    const primaryImage = vehicle?.vehicle_images?.find((img: any) => img.is_primary)
        || vehicle?.vehicle_images?.[0];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditSaleFormValues>({
        resolver: zodResolver(editSaleSchema),
        defaultValues: {
            customer_name: sale.customer_name || '',
            customer_phone: sale.customer_phone || '',
            customer_cnic: sale.customer_cnic || '',
            customer_address: sale.customer_address || '',
            sale_price: parseFloat(sale.sale_price) || 0,
            down_payment: parseFloat(sale.down_payment) || 0,
            commission_amount: sale.commission_amount != null ? Number(sale.commission_amount) : 0,
            payment_method: sale.payment_method || 'cash',
            deal_date: sale.deal_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            delivery_date: sale.delivery_date?.split('T')[0] || '',
            notes: sale.notes || '',
        },
    });

    const salePrice = watch('sale_price');
    const downPayment = watch('down_payment');
    const remainingAmount = salePrice && downPayment !== undefined ? salePrice - downPayment : 0;

    const onSubmit = async (data: EditSaleFormValues) => {
        try {
            setIsSubmitting(true);
            await updateSale(sale.id, {
                ...data,
                remaining_amount: data.sale_price - data.down_payment,
            });
            router.push(`/dashboard/sales/${sale.id}`);
            router.refresh();
        } catch (error) {
            console.error('Error updating sale:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Info (Read-only) */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Vehicle</CardTitle>
                            <CardDescription>This vehicle cannot be changed after sale creation</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="relative h-20 w-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {primaryImage?.url ? (
                                <Image
                                    src={primaryImage.url}
                                    alt={`${vehicle?.make} ${vehicle?.model}`}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Car className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-lg">
                                {vehicle?.year} {vehicle?.make} {vehicle?.model}
                            </p>
                            {vehicle?.variant && (
                                <p className="text-sm text-muted-foreground">{vehicle.variant}</p>
                            )}
                            {vehicle?.registration_number && (
                                <Badge variant="outline" className="mt-1">
                                    {vehicle.registration_number}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Customer Details */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle>Buyer Details</CardTitle>
                            <CardDescription>Update customer information</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
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
                            />
                            {errors.customer_name && (
                                <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Phone Number *
                            </Label>
                            <Input
                                placeholder="03XX-XXXXXXX"
                                {...register('customer_phone')}
                                className={errors.customer_phone ? 'border-destructive' : ''}
                            />
                            {errors.customer_phone && (
                                <p className="text-sm text-destructive">{errors.customer_phone.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>CNIC (Optional)</Label>
                            <Input
                                placeholder="XXXXX-XXXXXXX-X"
                                {...register('customer_cnic')}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Address (Optional)</Label>
                            <Textarea
                                placeholder="Complete address"
                                {...register('customer_address')}
                                rows={2}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sale Details */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle>Sale Details</CardTitle>
                            <CardDescription>Update transaction information</CardDescription>
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
                </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="min-w-[160px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
