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
import { createLead, updateLead, getLeadById, LeadFormData } from '@/lib/actions/leads';
import { getAvailableVehicles } from '@/lib/actions/sales';
import { getUsers } from '@/lib/actions/users';
import { useFormattedInput } from '@/lib/hooks/use-formatted-input';
import type { Profile } from '@/lib/types/database';

const leadSchema = z.object({
    customer_name: z.string().min(2, 'Name is required'),
    customer_phone: z.string().min(10, 'Valid phone number is required'),
    customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
    customer_cnic: z.string().optional().or(z.literal('')),
    customer_address: z.string().optional().or(z.literal('')),
    source: z.enum(['walk_in', 'phone', 'whatsapp', 'website', 'referral', 'facebook', 'other']).optional(),
    status: z.enum(['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    interested_vehicle_id: z.string().optional().or(z.literal('')),
    budget_min: z.string().optional().or(z.literal('')),
    budget_max: z.string().optional().or(z.literal('')),
    preferred_makes: z.string().optional(),
    notes: z.string().optional().or(z.literal('')),
    assigned_to: z.string().optional().or(z.literal('')),
    next_follow_up: z.string().optional().or(z.literal('')),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
    leadId?: string;
}

export function LeadForm({ leadId }: LeadFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!!leadId);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [preferredMakes, setPreferredMakes] = useState<string[]>([]);
    const [newMake, setNewMake] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            status: 'new',
            priority: 'medium',
        },
    });

    const phoneValue = watch('customer_phone') || '';
    const cnicValue = watch('customer_cnic') || '';

    const phoneInput = useFormattedInput({
        type: 'phone',
        initialValue: phoneValue,
        onChange: (value) => setValue('customer_phone', value),
    });

    const cnicInput = useFormattedInput({
        type: 'cnic',
        initialValue: cnicValue,
        onChange: (value) => setValue('customer_cnic', value),
    });

    useEffect(() => {
        fetchVehicles();
        fetchUsers();
        if (leadId) {
            loadLead();
        }
    }, [leadId]);

    const fetchVehicles = async () => {
        const result = await getAvailableVehicles();
        if (result.data) {
            setVehicles(result.data);
        }
    };

    const fetchUsers = async () => {
        const result = await getUsers();
        if (result.data) {
            setUsers(result.data);
        }
    };

    const loadLead = async () => {
        if (!leadId) return;

        setLoading(true);
        const result = await getLeadById(leadId);
        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            setValue('customer_name', result.data.customer_name);
            setValue('customer_phone', result.data.customer_phone || '');
            setValue('customer_email', result.data.customer_email || '');
            setValue('customer_cnic', result.data.customer_cnic || '');
            setValue('customer_address', result.data.customer_address || '');
            setValue('source', result.data.source || undefined);
            setValue('status', result.data.status);
            setValue('priority', result.data.priority);
            setValue('interested_vehicle_id', result.data.interested_vehicle_id || '');
            setValue('budget_min', result.data.budget_min?.toString() || '');
            setValue('budget_max', result.data.budget_max?.toString() || '');
            setValue('preferred_makes', result.data.preferred_makes?.join(', ') || '');
            setValue('notes', result.data.notes || '');
            setValue('assigned_to', result.data.assigned_to || '');
            setValue('next_follow_up', result.data.next_follow_up ? result.data.next_follow_up.split('T')[0] : '');
            setPreferredMakes(result.data.preferred_makes || []);
        }
        setLoading(false);
    };

    const addPreferredMake = () => {
        if (newMake.trim() && !preferredMakes.includes(newMake.trim())) {
            const updated = [...preferredMakes, newMake.trim()];
            setPreferredMakes(updated);
            setValue('preferred_makes', updated.join(', '));
            setNewMake('');
        }
    };

    const removePreferredMake = (make: string) => {
        const updated = preferredMakes.filter((m) => m !== make);
        setPreferredMakes(updated);
        setValue('preferred_makes', updated.join(', '));
    };

    const onSubmit = async (data: LeadFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const formData: LeadFormData = {
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                customer_email: data.customer_email || undefined,
                customer_cnic: data.customer_cnic || undefined,
                customer_address: data.customer_address || undefined,
                source: data.source,
                status: data.status,
                priority: data.priority,
                interested_vehicle_id: data.interested_vehicle_id || undefined,
                budget_min: data.budget_min ? parseFloat(data.budget_min) : undefined,
                budget_max: data.budget_max ? parseFloat(data.budget_max) : undefined,
                preferred_makes: preferredMakes.length > 0 ? preferredMakes : undefined,
                notes: data.notes || undefined,
                assigned_to: data.assigned_to || undefined,
                next_follow_up: data.next_follow_up || undefined,
            };

            let result;
            if (leadId) {
                result = await updateLead(leadId, formData);
            } else {
                result = await createLead(formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard/leads');
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="space-y-4">Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="customer_name">Customer Name *</Label>
                        <Input
                            id="customer_name"
                            {...register('customer_name')}
                            placeholder="Enter customer name"
                            className="w-full"
                        />
                        {errors.customer_name && (
                            <p className="text-xs text-destructive">{errors.customer_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer_phone">Phone Number *</Label>
                        <Input
                            id="customer_phone"
                            {...register('customer_phone')}
                            value={phoneInput.value}
                            onChange={phoneInput.onChange}
                            placeholder="03XX-XXXXXXX"
                            className="w-full"
                            maxLength={12}
                        />
                        {errors.customer_phone && (
                            <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer_email">Email</Label>
                        <Input
                            id="customer_email"
                            type="email"
                            {...register('customer_email')}
                            placeholder="customer@example.com"
                            className="w-full"
                        />
                        {errors.customer_email && (
                            <p className="text-xs text-destructive">{errors.customer_email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer_cnic">CNIC</Label>
                        <Input
                            id="customer_cnic"
                            {...register('customer_cnic')}
                            value={cnicInput.value}
                            onChange={cnicInput.onChange}
                            placeholder="XXXXX-XXXXXXX-X"
                            className="w-full"
                            maxLength={15}
                        />
                        {errors.customer_cnic && (
                            <p className="text-xs text-destructive">{errors.customer_cnic.message}</p>
                        )}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="customer_address">Address</Label>
                        <Textarea
                            id="customer_address"
                            {...register('customer_address')}
                            placeholder="Enter customer address"
                            className="w-full"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            {/* Lead Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lead Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Select
                            value={watch('source') || ''}
                            onValueChange={(value) => setValue('source', value as any)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="walk_in">Walk In</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="referral">Referral</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={watch('status') || 'new'}
                            onValueChange={(value) => setValue('status', value as any)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="negotiating">Negotiating</SelectItem>
                                <SelectItem value="won">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={watch('priority') || 'medium'}
                            onValueChange={(value) => setValue('priority', value as any)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assigned_to">Assign To</Label>
                        <Select
                            value={watch('assigned_to') || 'unassigned'}
                            onValueChange={(value) => setValue('assigned_to', value === 'unassigned' ? '' : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select salesperson" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.full_name} ({user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Vehicle Interest */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vehicle Interest</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="interested_vehicle_id">Interested Vehicle</Label>
                        <Select
                            value={watch('interested_vehicle_id') || 'none'}
                            onValueChange={(value) => setValue('interested_vehicle_id', value === 'none' ? '' : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select vehicle (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {vehicles.map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={vehicle.id}>
                                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.variant || ''} - PKR{' '}
                                        {vehicle.selling_price?.toLocaleString() || 'N/A'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="budget_min">Budget Min (PKR)</Label>
                        <Input
                            id="budget_min"
                            type="number"
                            {...register('budget_min')}
                            placeholder="0"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="budget_max">Budget Max (PKR)</Label>
                        <Input
                            id="budget_max"
                            type="number"
                            {...register('budget_max')}
                            placeholder="0"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label>Preferred Makes</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newMake}
                                onChange={(e) => setNewMake(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addPreferredMake();
                                    }
                                }}
                                placeholder="Add make (e.g., Toyota)"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={addPreferredMake}>
                                Add
                            </Button>
                        </div>
                        {preferredMakes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {preferredMakes.map((make) => (
                                    <span
                                        key={make}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                                    >
                                        {make}
                                        <button
                                            type="button"
                                            onClick={() => removePreferredMake(make)}
                                            className="hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Follow-up */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Follow-up</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="next_follow_up">Next Follow-up Date</Label>
                        <Input
                            id="next_follow_up"
                            type="date"
                            {...register('next_follow_up')}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="space-y-2">
                    <Label htmlFor="notes">Internal Notes</Label>
                    <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Add any additional notes about this lead..."
                        className="w-full"
                        rows={4}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {leadId ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        leadId ? 'Update Lead' : 'Create Lead'
                    )}
                </Button>
            </div>
        </form>
    );
}
