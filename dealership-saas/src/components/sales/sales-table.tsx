'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    MoreHorizontal,
    Eye,
    X,
    CheckCircle2,
    Clock,
    Car,
    Phone,
    MessageCircle,
    Pencil,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination-advanced';
import { updateSaleStatus } from '@/lib/actions/sales';
import { subscribeToSales } from '@/lib/supabase/realtime';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SalesTableProps {
    sales: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function SalesTable({ sales: initialSales, pagination }: SalesTableProps) {
    const router = useRouter();
    const { organization } = useAuthStore();
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [displaySales, setDisplaySales] = useState(initialSales);
    const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Setup realtime subscriptions
    useEffect(() => {
        if (!organization?.id) return;

        let unsubscribe: (() => void) | null = null;

        const setupSubscription = () => {
            unsubscribe = subscribeToSales(
                {
                    onInsert: (payload) => {
                        console.log('Sale inserted in realtime:', payload.new);
                        setRealtimeStatus('connected');
                        router.refresh();
                    },
                    onUpdate: (payload) => {
                        console.log('Sale updated in realtime:', payload.new);
                        setRealtimeStatus('connected');
                        const updated = payload.new as any;
                        if (!updated?.id) return;
                        setDisplaySales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                    },
                    onDelete: (payload) => {
                        console.log('Sale deleted in realtime:', payload.old);
                        setRealtimeStatus('connected');
                        const oldRow = payload.old as any;
                        if (!oldRow?.id) return;
                        setDisplaySales((prev) => prev.filter((s) => s.id !== oldRow.id));
                    },
                    onError: (error) => {
                        console.error('Realtime subscription error:', error);
                        setRealtimeStatus('error');
                        setErrorMessage('Realtime connection error. Live updates disabled.');
                        setTimeout(() => setErrorMessage(null), 5000);
                    },
                },
                organization.id
            );
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [organization?.id, router]);

    const currentPage = pagination.page;
    const itemsPerPage = pagination.limit;
    const totalPages = pagination.totalPages;
    const totalItems = pagination.total;

    const handleStatusUpdate = async (saleId: string, status: 'completed' | 'cancelled') => {
        setUpdatingStatus(saleId);
        try {
            await updateSaleStatus(saleId, status);
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
        completed: {
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            icon: CheckCircle2,
            label: 'Completed'
        },
        pending: {
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            icon: Clock,
            label: 'Pending'
        },
        cancelled: {
            color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
            icon: X,
            label: 'Cancelled'
        },
    };

    // Empty state
    if (displaySales.length === 0) {
        return (
            <div className="rounded-xl border bg-card">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No sales found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start by creating your first sale
                    </p>
                    <Link href="/dashboard/sales/new">
                        <Button>Create Sale</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const updateQuery = (next: { page?: number; limit?: number }) => {
        const url = new URL(window.location.href);
        if (next.page !== undefined) url.searchParams.set('page', String(next.page));
        if (next.limit !== undefined) url.searchParams.set('limit', String(next.limit));
        router.push(url.pathname + '?' + url.searchParams.toString());
        router.refresh();
    };

    return (
        <div className="space-y-4">
            {/* Realtime Status Alert */}
            {errorMessage && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            {/* Realtime Connection Indicator */}
            <div className="flex items-center gap-2 text-sm">
                <div
                    className={`h-2 w-2 rounded-full ${
                        realtimeStatus === 'connected'
                            ? 'bg-green-500'
                            : realtimeStatus === 'error'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                    }`}
                    aria-label={`Realtime connection: ${realtimeStatus}`}
                />
                <span className="text-muted-foreground">
                    {realtimeStatus === 'connected'
                        ? 'Live updates enabled'
                        : realtimeStatus === 'error'
                          ? 'Connection error'
                          : 'Connecting...'}
                </span>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[280px]">Vehicle</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Sale Price</TableHead>
                            <TableHead className="text-right">Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displaySales.map((sale: any) => {
                            const vehicle = sale.vehicles;
                            const status = statusConfig[sale.status] || statusConfig.pending;
                            const StatusIcon = status.icon;
                            const remainingAmount = parseFloat(sale.sale_price) - parseFloat(sale.down_payment);
                            const primaryImage = vehicle?.vehicle_images?.find((img: any) => img.is_primary)
                                || vehicle?.vehicle_images?.[0];

                            return (
                                <TableRow
                                    key={sale.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-14 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                {primaryImage?.url ? (
                                                    <Image
                                                        src={primaryImage.url}
                                                        alt={`${vehicle?.make} ${vehicle?.model}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Car className="h-6 w-6 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {vehicle?.year} {vehicle?.make} {vehicle?.model}
                                                </p>
                                                {vehicle?.variant && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {vehicle.variant}
                                                    </p>
                                                )}
                                                {vehicle?.registration_number && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        {vehicle.registration_number}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                    {sale.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{sale.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {sale.customer_phone}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                            PKR {parseFloat(sale.sale_price).toLocaleString()}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div>
                                            <p className="font-medium">
                                                PKR {parseFloat(sale.down_payment).toLocaleString()}
                                            </p>
                                            {remainingAmount > 0 && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                                    Due: PKR {remainingAmount.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('gap-1', status.color)}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">
                                            {new Date(sale.deal_date).toLocaleDateString('en-PK', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/sales/${sale.id}`);
                                                    }}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/sales/${sale.id}/edit`);
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit Sale
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`tel:${sale.customer_phone}`);
                                                    }}
                                                >
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Call Customer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`https://wa.me/${sale.customer_phone?.replace(/[^0-9]/g, '')}`);
                                                    }}
                                                >
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    WhatsApp
                                                </DropdownMenuItem>
                                                {sale.status === 'pending' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusUpdate(sale.id, 'completed');
                                                            }}
                                                            disabled={updatingStatus === sale.id}
                                                            className="text-emerald-600 dark:text-emerald-400"
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Mark Completed
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusUpdate(sale.id, 'cancelled');
                                                            }}
                                                            disabled={updatingStatus === sale.id}
                                                            className="text-destructive"
                                                        >
                                                            <X className="mr-2 h-4 w-4" />
                                                            Cancel Sale
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y">
                {displaySales.map((sale: any) => {
                    const vehicle = sale.vehicles;
                    const status = statusConfig[sale.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const remainingAmount = parseFloat(sale.sale_price) - parseFloat(sale.down_payment);
                    const primaryImage = vehicle?.vehicle_images?.find((img: any) => img.is_primary)
                        || vehicle?.vehicle_images?.[0];

                    return (
                        <div
                            key={sale.id}
                            className="p-4 hover:bg-muted/50 transition-colors"
                            onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                        >
                            <div className="flex gap-3">
                                {/* Vehicle Image */}
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

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium truncate">
                                                {vehicle?.year} {vehicle?.make} {vehicle?.model}
                                            </p>
                                            {vehicle?.variant && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {vehicle.variant}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn('gap-1 flex-shrink-0', status.color)}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <Avatar className="h-5 w-5">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {sale.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-muted-foreground truncate">{sale.customer_name}</span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                            PKR {parseFloat(sale.sale_price).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(sale.deal_date).toLocaleDateString('en-PK', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </p>
                                    </div>

                                    {remainingAmount > 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            Due: PKR {remainingAmount.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Pagination */}
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => updateQuery({ page: p })}
            onItemsPerPageChange={(l) => updateQuery({ page: 1, limit: l })}
        />
        </div>
    );
}
