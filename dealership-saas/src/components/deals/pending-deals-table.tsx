'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PendingDeal, markDealAsPaid, updateDealPaymentDate } from '@/lib/actions/deals';
import { 
    AlertTriangle, 
    Calendar, 
    CheckCircle2, 
    Phone, 
    Search, 
    Filter, 
    Download, 
    ArrowUpDown, 
    ArrowUp, 
    ArrowDown, 
    Edit2, 
    X, 
    Check,
    DollarSign,
    TrendingUp,
    Clock,
    FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface PendingDealsTableProps {
    deals: PendingDeal[];
}

type SortField = 'deal_date' | 'customer_name' | 'sale_price' | 'remaining_amount' | 'payment_date' | 'days_until_payment';
type SortDirection = 'asc' | 'desc';

export function PendingDealsTable({ deals: initialDeals }: PendingDealsTableProps) {
    const [deals, setDeals] = useState(initialDeals);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'upcoming' | 'no_date'>('all');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
    const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [sortField, setSortField] = useState<SortField>('deal_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
    const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null);
    const [isBulkMarking, setIsBulkMarking] = useState(false);
    const [editingPaymentDate, setEditingPaymentDate] = useState<string | null>(null);
    const [newPaymentDate, setNewPaymentDate] = useState('');
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);
    const router = useRouter();

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getDateRangeFilter = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterDateRange === 'today') {
            const todayStr = today.toISOString().split('T')[0];
            return { start: todayStr, end: todayStr };
        }
        if (filterDateRange === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return { start: weekAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
        }
        if (filterDateRange === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return { start: monthAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
        }
        if (filterDateRange === 'custom') {
            return { start: customStartDate, end: customEndDate };
        }
        return { start: '', end: '' };
    };

    const filteredDeals = useMemo(() => {
        let filtered = [...deals];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((deal) =>
                deal.customer_name.toLowerCase().includes(query) ||
                deal.customer_phone.includes(query) ||
                `${deal.vehicle_make} ${deal.vehicle_model}`.toLowerCase().includes(query)
            );
        }

        // Status filter
        switch (filterStatus) {
            case 'overdue':
                filtered = filtered.filter((d) => d.is_overdue);
                break;
            case 'upcoming':
                filtered = filtered.filter(
                    (d) => !d.is_overdue && d.days_until_payment !== null && d.days_until_payment <= 7 && d.days_until_payment >= 0
                );
                break;
            case 'no_date':
                filtered = filtered.filter((d) => d.payment_date === null);
                break;
        }

        // Payment method filter
        if (filterPaymentMethod !== 'all') {
            filtered = filtered.filter((d) => d.payment_method === filterPaymentMethod);
        }

        // Date range filter
        if (filterDateRange !== 'all') {
            const range = getDateRangeFilter();
            if (range.start && range.end) {
                filtered = filtered.filter((d) => {
                    if (!d.deal_date) return false;
                    return d.deal_date >= range.start && d.deal_date <= range.end;
                });
            }
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal: any, bVal: any;
            
            switch (sortField) {
                case 'deal_date':
                    aVal = a.deal_date;
                    bVal = b.deal_date;
                    break;
                case 'customer_name':
                    aVal = a.customer_name.toLowerCase();
                    bVal = b.customer_name.toLowerCase();
                    break;
                case 'sale_price':
                    aVal = a.sale_price;
                    bVal = b.sale_price;
                    break;
                case 'remaining_amount':
                    aVal = a.remaining_amount;
                    bVal = b.remaining_amount;
                    break;
                case 'payment_date':
                    aVal = a.payment_date || '';
                    bVal = b.payment_date || '';
                    break;
                case 'days_until_payment':
                    aVal = a.days_until_payment ?? Infinity;
                    bVal = b.days_until_payment ?? Infinity;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [deals, searchQuery, filterStatus, filterPaymentMethod, filterDateRange, customStartDate, customEndDate, sortField, sortDirection]);

    const handleMarkAsPaid = async (dealId: string) => {
        setIsMarkingPaid(dealId);
        try {
            const result = await markDealAsPaid(dealId);
            if (result.success) {
                setDeals(deals.filter((d) => d.id !== dealId));
                setSelectedDeals((prev) => {
                    const next = new Set(prev);
                    next.delete(dealId);
                    return next;
                });
                router.refresh();
            } else {
                alert(result.error || 'Failed to mark deal as paid');
            }
        } catch (error) {
            console.error('Error marking deal as paid:', error);
            alert('An error occurred while marking the deal as paid');
        } finally {
            setIsMarkingPaid(null);
        }
    };

    const handleBulkMarkAsPaid = async () => {
        if (selectedDeals.size === 0) return;
        
        setIsBulkMarking(true);
        try {
            const results = await Promise.all(
                Array.from(selectedDeals).map((id) => markDealAsPaid(id))
            );
            
            const successCount = results.filter((r) => r.success).length;
            if (successCount > 0) {
                setDeals(deals.filter((d) => !selectedDeals.has(d.id)));
                setSelectedDeals(new Set());
                router.refresh();
                alert(`Successfully marked ${successCount} deal${successCount > 1 ? 's' : ''} as paid`);
            } else {
                alert('Failed to mark deals as paid');
            }
        } catch (error) {
            console.error('Error bulk marking deals:', error);
            alert('An error occurred while marking deals as paid');
        } finally {
            setIsBulkMarking(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedDeals.size === filteredDeals.length) {
            setSelectedDeals(new Set());
        } else {
            setSelectedDeals(new Set(filteredDeals.map((d) => d.id)));
        }
    };

    const handleToggleSelect = (dealId: string) => {
        setSelectedDeals((prev) => {
            const next = new Set(prev);
            if (next.has(dealId)) {
                next.delete(dealId);
            } else {
                next.add(dealId);
            }
            return next;
        });
    };

    const handleEditPaymentDate = (deal: PendingDeal) => {
        setEditingPaymentDate(deal.id);
        setNewPaymentDate(deal.payment_date || '');
    };

    const handleSavePaymentDate = async () => {
        if (!editingPaymentDate || !newPaymentDate) return;
        
        setIsUpdatingDate(true);
        try {
            const result = await updateDealPaymentDate(editingPaymentDate, newPaymentDate);
            if (result.success) {
                setDeals(deals.map((d) => 
                    d.id === editingPaymentDate 
                        ? { ...d, payment_date: newPaymentDate }
                        : d
                ));
                setEditingPaymentDate(null);
                setNewPaymentDate('');
                router.refresh();
            } else {
                alert(result.error || 'Failed to update payment date');
            }
        } catch (error) {
            console.error('Error updating payment date:', error);
            alert('An error occurred while updating payment date');
        } finally {
            setIsUpdatingDate(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getPaymentStatusBadge = (deal: PendingDeal) => {
        if (deal.is_overdue) {
            return (
                <Badge className="gap-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:border-orange-700">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                </Badge>
            );
        }
        if (deal.days_until_payment !== null) {
            if (deal.days_until_payment === 0) {
                return (
                    <Badge className="gap-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:border-orange-700">
                        <Calendar className="h-3 w-3" />
                        Due Today
                    </Badge>
                );
            }
            if (deal.days_until_payment <= 7) {
                return (
                    <Badge className="gap-1 bg-amber-500 hover:bg-amber-600 text-white border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 dark:border-amber-700">
                        <Calendar className="h-3 w-3" />
                        {deal.days_until_payment} day{deal.days_until_payment > 1 ? 's' : ''}
                    </Badge>
                );
            }
            return (
                <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {deal.days_until_payment} days
                </Badge>
            );
        }
        return (
            <Badge variant="outline">
                No date set
            </Badge>
        );
    };

    // Statistics
    const stats = useMemo(() => {
        const overdue = filteredDeals.filter((d) => d.is_overdue);
        const upcoming = filteredDeals.filter(
            (d) => !d.is_overdue && d.days_until_payment !== null && d.days_until_payment <= 7 && d.days_until_payment >= 0
        );
        const totalPending = filteredDeals.reduce((sum, d) => sum + d.remaining_amount, 0);
        const totalOverdue = overdue.reduce((sum, d) => sum + d.remaining_amount, 0);
        const totalUpcoming = upcoming.reduce((sum, d) => sum + d.remaining_amount, 0);
        
        return {
            total: filteredDeals.length,
            overdue: overdue.length,
            upcoming: upcoming.length,
            totalPending,
            totalOverdue,
            totalUpcoming,
        };
    }, [filteredDeals]);

    const exportToCSV = () => {
        const csv = [
            ['Customer Name', 'Phone', 'Vehicle', 'Sale Price', 'Down Payment', 'Remaining', 'Payment Date', 'Status', 'Payment Method'],
            ...filteredDeals.map((deal) => [
                deal.customer_name,
                deal.customer_phone,
                `${deal.vehicle_make} ${deal.vehicle_model} ${deal.vehicle_year || ''}`.trim(),
                String(deal.sale_price),
                String(deal.down_payment),
                String(deal.remaining_amount),
                deal.payment_date || 'Not set',
                deal.is_overdue ? 'Overdue' : deal.days_until_payment !== null ? `${deal.days_until_payment} days` : 'No date',
                deal.payment_method || 'N/A',
            ]),
        ]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pending-deals-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 -ml-2"
            onClick={() => handleSort(field)}
        >
            {children}
            {sortField === field ? (
                sortDirection === 'asc' ? (
                    <ArrowUp className="ml-1 h-3 w-3" />
                ) : (
                    <ArrowDown className="ml-1 h-3 w-3" />
                )
            ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
            )}
        </Button>
    );

    return (
        <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {stats.totalPending.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{stats.total} active deals</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
                        <p className="text-xs text-muted-foreground">PKR {stats.totalOverdue.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming (≤7 days)</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.upcoming}</div>
                        <p className="text-xs text-muted-foreground">PKR {stats.totalUpcoming.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Deal</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            PKR {stats.total > 0 ? Math.round(stats.totalPending / stats.total).toLocaleString() : '0'}
                        </div>
                        <p className="text-xs text-muted-foreground">Per deal average</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pending Payments</CardTitle>
                            <CardDescription>
                                Manage deals with outstanding payments. Mark as paid when payment is received.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {selectedDeals.size > 0 && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleBulkMarkAsPaid}
                                    disabled={isBulkMarking}
                                >
                                    {isBulkMarking ? (
                                        'Marking...'
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Mark {selectedDeals.size} as Paid
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={exportToCSV}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="space-y-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by customer name, phone, or vehicle..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Deals</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="upcoming">Upcoming (≤7 days)</SelectItem>
                                    <SelectItem value="no_date">No Date Set</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                                    <SelectItem value="financing">Financing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Select value={filterDateRange} onValueChange={(val: any) => setFilterDateRange(val)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Dates</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                            {filterDateRange === 'custom' && (
                                <>
                                    <Input
                                        type="date"
                                        placeholder="Start Date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full sm:w-[180px]"
                                    />
                                    <Input
                                        type="date"
                                        placeholder="End Date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full sm:w-[180px]"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedDeals.size === filteredDeals.length && filteredDeals.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="customer_name">Customer</SortButton>
                                    </TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>
                                        <SortButton field="sale_price">Sale Price</SortButton>
                                    </TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>
                                        <SortButton field="remaining_amount">Remaining</SortButton>
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="payment_date">Payment Date</SortButton>
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDeals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No pending deals found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDeals.map((deal) => (
                                        <TableRow
                                            key={deal.id}
                                            className={cn(
                                                deal.is_overdue && 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30',
                                                deal.days_until_payment !== null &&
                                                    deal.days_until_payment <= 7 &&
                                                    !deal.is_overdue &&
                                                    'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
                                                selectedDeals.has(deal.id) && 'bg-primary/5'
                                            )}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedDeals.has(deal.id)}
                                                    onCheckedChange={() => handleToggleSelect(deal.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{deal.customer_name}</p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {deal.customer_phone}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {deal.vehicle_make} {deal.vehicle_model}
                                                    </p>
                                                    {deal.vehicle_year && (
                                                        <p className="text-sm text-muted-foreground">{deal.vehicle_year}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                PKR {deal.sale_price.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                PKR {deal.down_payment.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-semibold text-primary">
                                                PKR {deal.remaining_amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {editingPaymentDate === deal.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="date"
                                                            value={newPaymentDate}
                                                            onChange={(e) => setNewPaymentDate(e.target.value)}
                                                            className="h-8 w-[140px]"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleSavePaymentDate}
                                                            disabled={isUpdatingDate}
                                                        >
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingPaymentDate(null);
                                                                setNewPaymentDate('');
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {deal.payment_date ? (
                                                            <div>
                                                                <p>{formatDate(deal.payment_date)}</p>
                                                                {deal.days_until_payment !== null && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {deal.days_until_payment === 0
                                                                            ? 'Today'
                                                                            : deal.days_until_payment < 0
                                                                              ? `${Math.abs(deal.days_until_payment)} days ago`
                                                                              : `In ${deal.days_until_payment} days`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Not set</span>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditPaymentDate(deal)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{getPaymentStatusBadge(deal)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/dashboard/deals/${deal.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleMarkAsPaid(deal.id)}
                                                        disabled={isMarkingPaid === deal.id}
                                                    >
                                                        {isMarkingPaid === deal.id ? (
                                                            'Marking...'
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Mark Paid
                                                            </>
                                                        )}
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
        </div>
    );
}
