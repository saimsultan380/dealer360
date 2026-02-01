'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { createInvestor, updateInvestor, InvestorFormData, getInvestorById } from '@/lib/actions/investors';
import { useFormattedInput } from '@/lib/hooks/use-formatted-input';

const investorSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    swdo_name: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(10, 'Valid phone number is required'),
    cnic: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    status: z.enum(['active', 'inactive', 'closed']).optional(),
    notes: z.string().optional().or(z.literal('')),
});

type InvestorFormValues = z.infer<typeof investorSchema>;

interface InvestorFormProps {
    investorId?: string;
}

export function InvestorForm({ investorId }: InvestorFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!!investorId);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<InvestorFormValues>({
        resolver: zodResolver(investorSchema),
        defaultValues: {
            status: 'active',
        },
    });

    const status = watch('status');
    const phoneValue = watch('phone') || '';
    const cnicValue = watch('cnic') || '';
    
    // Formatted input hooks
    const phoneInput = useFormattedInput({ 
        type: 'phone', 
        initialValue: phoneValue, 
        onChange: (value) => setValue('phone', value) 
    });
    const cnicInput = useFormattedInput({ 
        type: 'cnic', 
        initialValue: cnicValue, 
        onChange: (value) => setValue('cnic', value) 
    });

    useEffect(() => {
        if (investorId) {
            loadInvestor();
        }
    }, [investorId]);

    const loadInvestor = async () => {
        if (!investorId) return;

        setLoading(true);
        const result = await getInvestorById(investorId);
        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            setValue('name', result.data.name);
            setValue('swdo_name', result.data.swdo_name || '');
            setValue('email', result.data.email || '');
            phoneInput.setValue(result.data.phone || '');
            cnicInput.setValue(result.data.cnic || '');
            setValue('address', result.data.address || '');
            setValue('status', result.data.status);
            setValue('notes', result.data.notes || '');
        }
        setLoading(false);
    };

    const onSubmit = async (data: InvestorFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const formData: InvestorFormData = {
                name: data.name,
                email: data.email || undefined,
                phone: data.phone,
                cnic: data.cnic || undefined,
                address: data.address || undefined,
                status: data.status,
                notes: data.notes || undefined,
            };

            let result;
            if (investorId) {
                result = await updateInvestor(investorId, formData);
            } else {
                result = await createInvestor(formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard/investors');
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                        id="name"
                        placeholder="Ahmed Khan"
                        {...register('name')}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="swdo_name">S/W/D/O Name</Label>
                    <Input
                        id="swdo_name"
                        placeholder="e.g. Father/Husband/Guardian name"
                        {...register('swdo_name')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                        id="phone"
                        placeholder="03XX-XXXXXXX"
                        value={phoneInput.value}
                        onChange={phoneInput.onChange}
                        maxLength={12}
                    />
                    {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ahmed@example.com"
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                        id="cnic"
                        placeholder="XXXXX-XXXXXXX-X"
                        value={cnicInput.value}
                        onChange={cnicInput.onChange}
                        maxLength={15}
                    />
                    {errors.cnic && (
                        <p className="text-sm text-destructive">{errors.cnic.message}</p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                        id="address"
                        placeholder="Lahore, Pakistan"
                        {...register('address')}
                    />
                    {errors.address && (
                        <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={status}
                        onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'closed')}
                    >
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        placeholder="Additional notes about the investor..."
                        rows={4}
                        {...register('notes')}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {investorId ? 'Update Investor' : 'Create Investor'}
                </Button>
            </div>
        </form>
    );
}
