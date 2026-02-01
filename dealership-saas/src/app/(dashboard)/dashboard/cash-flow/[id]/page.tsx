'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { 
    getCashTransactionById, 
    deleteCashTransaction,
    CashTransactionWithCategory 
} from '@/lib/actions/cash-flow';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function CashTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [transaction, setTransaction] = useState<CashTransactionWithCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        params.then((p) => {
            setTransactionId(p.id);
            fetchData(p.id);
        });
    }, [params]);

    const fetchData = async (id: string) => {
        setLoading(true);
        setError(null);

        const result = await getCashTransactionById(id);

        if (result.error) {
            setError(result.error);
        } else {
            setTransaction(result.data);
        }

        setLoading(false);
    };

    const handleDelete = async () => {
        if (!transactionId) return;

        const result = await deleteCashTransaction(transactionId);
        if (result.error) {
            alert(result.error);
        } else {
            router.push('/dashboard/cash-flow');
        }
    };

    const formatCurrency = (amount: number) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getTransactionTypeBadge = (type: string) => {
        switch (type) {
            case 'cash_in':
                return <Badge className="bg-green-500">Cash In</Badge>;
            case 'cash_out':
                return <Badge className="bg-blue-500">Cash Out</Badge>;
            case 'expense':
                return <Badge className="bg-red-500">Expense</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    if (loading || !transactionId) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="space-y-8">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/dashboard/cash-flow')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Cash Flow
                    </Button>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Error: {error || 'Transaction not found'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/dashboard/cash-flow')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
                        <p className="text-muted-foreground">View transaction information</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/cash-flow/${transaction.id}/edit`)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Transaction Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Information</CardTitle>
                    <CardDescription>Details of this cash transaction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                            <div className="mt-1">{getTransactionTypeBadge(transaction.transaction_type)}</div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Amount</label>
                            <div className={`mt-1 text-2xl font-bold ${
                                transaction.transaction_type === 'cash_in' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                            }`}>
                                {transaction.transaction_type === 'cash_in' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <div className="mt-1">{formatDate(transaction.transaction_date)}</div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="mt-1">
                                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                    {transaction.status}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                            <div className="mt-1">
                                {transaction.payment_method ? (
                                    <Badge variant="outline">
                                        {transaction.payment_method.replace('_', ' ')}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </div>
                        </div>

                        {transaction.expense_category && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Expense Category</label>
                                <div className="mt-1">
                                    <Badge
                                        variant="outline"
                                        style={{
                                            borderColor: transaction.expense_category.color,
                                            color: transaction.expense_category.color,
                                        }}
                                    >
                                        {transaction.expense_category.name}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        {transaction.reference_number && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Reference Number</label>
                                <div className="mt-1 font-mono">{transaction.reference_number}</div>
                            </div>
                        )}

                        {transaction.related_entity_type && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Related To</label>
                                <div className="mt-1">
                                    <Badge variant="outline">
                                        {transaction.related_entity_type}
                                    </Badge>
                                    {transaction.related_entity_id && (
                                        <span className="ml-2 text-sm text-muted-foreground">
                                            ({transaction.related_entity_id})
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <div className="mt-1">{transaction.description}</div>
                        </div>

                        {transaction.notes && (
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                <div className="mt-1 p-3 bg-muted rounded-md">{transaction.notes}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this transaction? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
