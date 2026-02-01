'use client';

import { useState } from 'react';
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
import { createInvestmentTransaction, InvestmentTransactionFormData } from '@/lib/actions/investors';

const transactionSchema = z.object({
    amount: z.string().min(1, 'Amount is required').refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        'Amount must be a positive number'
    ),
    currency: z.string().optional(),
    payment_method: z.enum(['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque']).optional(),
    transaction_reference: z.string().optional(),
    transaction_date: z.string().min(1, 'Date is required'),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
    notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
    investorId: string;
    transactionType: 'investment' | 'withdrawal';
    onSuccess: () => void;
    onCancel: () => void;
}

export function TransactionForm({ investorId, transactionType, onSuccess, onCancel }: TransactionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            currency: 'PKR',
            status: 'completed',
            transaction_date: new Date().toISOString().split('T')[0],
        },
    });

    const paymentMethod = watch('payment_method');
    const status = watch('status');

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Ensure date is properly formatted - set to start of day in local timezone
            const dateInput = data.transaction_date;
            const dateObj = new Date(dateInput);
            // Set to noon to avoid timezone issues
            dateObj.setHours(12, 0, 0, 0);
            const isoDate = dateObj.toISOString();

            const formData: InvestmentTransactionFormData = {
                investor_id: investorId,
                transaction_type: transactionType,
                amount: parseFloat(data.amount),
                currency: data.currency || 'PKR',
                payment_method: data.payment_method,
                transaction_reference: data.transaction_reference || undefined,
                transaction_date: isoDate,
                status: data.status || 'completed',
                notes: data.notes || undefined,
            };

            const result = await createInvestmentTransaction(formData);

            if (result.error) {
                setError(result.error);
            } else {
                onSuccess();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR) *</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="100000"
                        {...register('amount')}
                    />
                    {errors.amount && (
                        <p className="text-sm text-destructive">{errors.amount.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="transaction_date">Transaction Date *</Label>
                    <Input
                        id="transaction_date"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        {...register('transaction_date')}
                    />
                    <p className="text-xs text-muted-foreground">
                        Select the date when the {transactionType === 'investment' ? 'investment was made' : 'withdrawal was processed'}
                    </p>
                    {errors.transaction_date && (
                        <p className="text-sm text-destructive">{errors.transaction_date.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                        value={paymentMethod}
                        onValueChange={(value) => setValue('payment_method', value as any)}
                    >
                        <SelectTrigger id="payment_method">
                            <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="easypaisa">Easypaisa</SelectItem>
                            <SelectItem value="jazzcash">JazzCash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={status}
                        onValueChange={(value) => setValue('status', value as 'pending' | 'completed' | 'cancelled')}
                    >
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="transaction_reference">Transaction Reference</Label>
                    <Input
                        id="transaction_reference"
                        placeholder="Bank reference number, cheque number, etc."
                        {...register('transaction_reference')}
                    />
                    {errors.transaction_reference && (
                        <p className="text-sm text-destructive">{errors.transaction_reference.message}</p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        placeholder="Additional notes about this transaction..."
                        rows={3}
                        {...register('notes')}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {transactionType === 'investment' ? 'Record Investment' : 'Record Withdrawal'}
                </Button>
            </div>
        </form>
    );
}
