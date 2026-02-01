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
import {
    createCashTransaction,
    updateCashTransaction,
    getExpenseCategories,
    getCashTransactionById,
    CashTransactionFormData,
} from '@/lib/actions/cash-flow';
import type { ExpenseCategory } from '@/lib/types/database';

const transactionSchema = z.object({
    transaction_type: z.enum(['cash_in', 'cash_out', 'expense']),
    amount: z.string().min(1, 'Amount is required').refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        'Amount must be a positive number'
    ),
    currency: z.string().optional(),
    expense_category_id: z.string().optional(),
    payment_method: z.enum(['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque']).optional(),
    description: z.string().min(1, 'Description is required'),
    reference_number: z.string().optional(),
    transaction_date: z.string().min(1, 'Date is required'),
    related_entity_type: z.enum(['deal', 'vehicle', 'client', 'investor', 'other']).optional(),
    related_entity_id: z.string().optional(),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
    notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface CashTransactionFormProps {
    transactionId?: string;
    onSuccess?: () => void;
}

export function CashTransactionForm({ transactionId, onSuccess }: CashTransactionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(!!transactionId);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            transaction_type: 'expense',
            currency: 'PKR',
            status: 'completed',
            transaction_date: new Date().toISOString().split('T')[0],
        },
    });

    const transactionType = watch('transaction_type');
    const status = watch('status');

    useEffect(() => {
        fetchCategories();
        if (transactionId) {
            fetchTransaction();
        }
    }, [transactionId]);

    const fetchCategories = async () => {
        const result = await getExpenseCategories();
        if (result.data) {
            setCategories(result.data);
        }
    };

    const fetchTransaction = async () => {
        if (!transactionId) return;

        setLoading(true);
        const result = await getCashTransactionById(transactionId);
        if (result.data) {
            const tx = result.data;
            setValue('transaction_type', tx.transaction_type);
            setValue('amount', tx.amount.toString());
            setValue('currency', tx.currency || 'PKR');
            setValue('expense_category_id', tx.expense_category_id || '');
            // Filter out incompatible payment methods (financing is not valid for cash transactions)
            const validPaymentMethods = ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque'] as const;
            type ValidCashPaymentMethod = typeof validPaymentMethods[number];
            const paymentMethod = tx.payment_method && validPaymentMethods.includes(tx.payment_method as ValidCashPaymentMethod)
                ? tx.payment_method as ValidCashPaymentMethod
                : undefined;
            setValue('payment_method', paymentMethod);
            setValue('description', tx.description);
            setValue('reference_number', tx.reference_number || '');
            setValue('transaction_date', tx.transaction_date);
            setValue('related_entity_type', tx.related_entity_type || undefined);
            setValue('related_entity_id', tx.related_entity_id || '');
            setValue('status', tx.status);
            setValue('notes', tx.notes || '');
        }
        setLoading(false);
    };

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Ensure date is properly formatted
            const dateInput = data.transaction_date;
            const dateObj = new Date(dateInput);
            dateObj.setHours(12, 0, 0, 0);
            const isoDate = dateObj.toISOString().split('T')[0];

            const formData: CashTransactionFormData = {
                transaction_type: data.transaction_type,
                amount: parseFloat(data.amount),
                currency: data.currency || 'PKR',
                expense_category_id: data.expense_category_id || undefined,
                payment_method: data.payment_method,
                description: data.description,
                reference_number: data.reference_number || undefined,
                transaction_date: isoDate,
                related_entity_type: data.related_entity_type,
                related_entity_id: data.related_entity_id || undefined,
                status: data.status || 'completed',
                notes: data.notes || undefined,
            };

            let result;
            if (transactionId) {
                result = await updateCashTransaction(transactionId, formData);
            } else {
                result = await createCashTransaction(formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push('/dashboard/cash-flow');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="transaction_type">Transaction Type *</Label>
                    <Select
                        value={transactionType}
                        onValueChange={(value) => setValue('transaction_type', value as any)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash_in">Cash In</SelectItem>
                            <SelectItem value="cash_out">Cash Out</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.transaction_type && (
                        <p className="text-sm text-destructive mt-1">{errors.transaction_type.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR) *</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...register('amount')}
                        placeholder="0.00"
                    />
                    {errors.amount && (
                        <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
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
                    {errors.transaction_date && (
                        <p className="text-sm text-destructive mt-1">{errors.transaction_date.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                        value={watch('payment_method') || ''}
                        onValueChange={(value) => setValue('payment_method', value as any)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select method" />
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

                {transactionType === 'expense' && (
                    <div className="space-y-2">
                        <Label htmlFor="expense_category_id">Expense Category</Label>
                        <Select
                            value={watch('expense_category_id') || ''}
                            onValueChange={(value) => setValue('expense_category_id', value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={status}
                        onValueChange={(value) => setValue('status', value as any)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                        id="reference_number"
                        {...register('reference_number')}
                        placeholder="e.g., TXN-001, Receipt #123"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="related_entity_type">Related To</Label>
                    <Select
                        value={watch('related_entity_type') || ''}
                        onValueChange={(value) => setValue('related_entity_type', value as any)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="deal">Deal</SelectItem>
                            <SelectItem value="vehicle">Vehicle</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {watch('related_entity_type') && (
                    <div className="space-y-2">
                        <Label htmlFor="related_entity_id">Entity ID</Label>
                        <Input
                            id="related_entity_id"
                            {...register('related_entity_id')}
                            placeholder="Enter related entity ID"
                        />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter transaction description"
                    rows={3}
                />
                {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Additional notes (optional)"
                    rows={2}
                />
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {transactionId ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        transactionId ? 'Update Transaction' : 'Create Transaction'
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            router.push('/dashboard/cash-flow');
                        }
                    }}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
