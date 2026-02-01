'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Search, 
    DollarSign, 
    TrendingUp,
    TrendingDown,
    Receipt,
    Eye,
    Edit,
    Trash2,
    Settings
} from 'lucide-react';
import { 
    getCashFlowSummary, 
    getCashTransactions, 
    deleteCashTransaction,
    CashTransactionWithCategory,
    CashFlowSummary
} from '@/lib/actions/cash-flow';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExpenseCategoryDialog } from '@/components/cash-flow/expense-category-dialog';
import { CashFlowCharts } from '@/components/cash-flow/cash-flow-charts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CashFlowPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<CashFlowSummary | null>(null);
    const [transactions, setTransactions] = useState<CashTransactionWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'cash_in' | 'cash_out' | 'expense'>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filterType]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        const [summaryResult, transactionsResult] = await Promise.all([
            getCashFlowSummary(),
            getCashTransactions({
                transaction_type: filterType === 'all' ? undefined : filterType,
            }),
        ]);

        if (summaryResult.error) {
            setError(summaryResult.error);
        } else {
            setSummary(summaryResult.data);
        }

        if (transactionsResult.error) {
            setError(transactionsResult.error);
        } else {
            setTransactions(transactionsResult.data || []);
        }

        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const result = await deleteCashTransaction(id);
        if (result.error) {
            alert(result.error);
        } else {
            fetchData();
            setDeleteDialogOpen(false);
            setTransactionToDelete(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
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

    const filteredTransactions = transactions.filter((tx) => {
        const query = searchQuery.toLowerCase();
        return (
            tx.description.toLowerCase().includes(query) ||
            tx.reference_number?.toLowerCase().includes(query) ||
            tx.notes?.toLowerCase().includes(query) ||
            tx.expense_category?.name.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cash Flow</h1>
                    <p className="text-muted-foreground">
                        Manage cash in, cash out, and showroom expenses
                    </p>
                </div>
                <div className="flex flex-row gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setCategoryDialogOpen(true)}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Categories
                    </Button>
                    <Button onClick={() => router.push('/dashboard/cash-flow/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.current_balance)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Available cash
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.total_cash_in)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All-time income
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(summary.total_cash_out)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Cash withdrawals
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <Receipt className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.total_expenses)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Showroom expenses
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs for Charts and Transactions */}
            <Tabs defaultValue="charts" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="charts" className="space-y-4">
                    <CashFlowCharts />
                </TabsContent>
                
                <TabsContent value="transactions" className="space-y-4">
                    {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Transactions</CardTitle>
                            <CardDescription>
                                View and manage all cash transactions
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="cash_in">Cash In</SelectItem>
                                <SelectItem value="cash_out">Cash Out</SelectItem>
                                <SelectItem value="expense">Expenses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{formatDate(tx.transaction_date)}</TableCell>
                                            <TableCell>{getTransactionTypeBadge(tx.transaction_type)}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {tx.description}
                                            </TableCell>
                                            <TableCell>
                                                {tx.expense_category ? (
                                                    <Badge 
                                                        variant="outline"
                                                        style={{ 
                                                            borderColor: tx.expense_category.color,
                                                            color: tx.expense_category.color 
                                                        }}
                                                    >
                                                        {tx.expense_category.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={tx.transaction_type === 'cash_in' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                {tx.transaction_type === 'cash_in' ? '+' : '-'}
                                                {formatCurrency(tx.amount)}
                                            </TableCell>
                                            <TableCell>
                                                {tx.payment_method ? (
                                                    <Badge variant="outline">
                                                        {tx.payment_method.replace('_', ' ')}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={tx.status === 'completed' ? 'default' : 'secondary'}
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/dashboard/cash-flow/${tx.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/dashboard/cash-flow/${tx.id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setTransactionToDelete(tx.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
                </TabsContent>
            </Tabs>

            {/* Expense Category Dialog */}
            <ExpenseCategoryDialog 
                open={categoryDialogOpen} 
                onOpenChange={setCategoryDialogOpen} 
            />

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
                        <Button
                            variant="destructive"
                            onClick={() => transactionToDelete && handleDelete(transactionToDelete)}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
