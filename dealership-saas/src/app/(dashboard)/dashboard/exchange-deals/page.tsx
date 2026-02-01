'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreHorizontal, Building2, Car, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getExchangeDeals } from '@/lib/actions/exchange-deals-complete';

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function ExchangeDealsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeals = async () => {
            setLoading(true);
            try {
                const result = await getExchangeDeals();
                if (result.error) {
                    setError(result.error);
                } else {
                    setDeals(result.data || []);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching deals:', err);
                setError(null); // Don't show error if it's just empty
            }
            setLoading(false);
        };

        fetchDeals();
    }, []);

    const filteredDeals = deals.filter((deal) =>
        deal.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.trade_in_make?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Exchange Deals</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Manage vehicle exchange transactions with customers
                    </p>
                </div>
                <Link href="/dashboard/exchange-deals/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto gap-2">
                        <Plus className="h-4 w-4" />
                        New Exchange Deal
                    </Button>
                </Link>
            </div>

            {/* Error Alert - only show actual errors, not empty state */}
            {error && error !== 'Unauthorized' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && (
                <>
                    {/* Search */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by seller name or vehicle make..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Deals Grid or Empty State */}
                    {filteredDeals.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-12 text-center">
                            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold">No exchange deals yet</h3>
                            <p className="text-muted-foreground text-sm mt-1 mb-6">
                                Create your first exchange deal to get started
                            </p>
                            <Link href="/dashboard/exchange-deals/new">
                                <Button variant="default">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Exchange Deal
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredDeals.map((deal) => (
                                <Card key={deal.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 flex-1">
                                                <CardTitle className="text-base">{deal.seller_name}</CardTitle>
                                                <CardDescription className="text-sm">
                                                    {deal.trade_in_year} {deal.trade_in_make} {deal.trade_in_model}
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/exchange-deals/${deal.id}`}>
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/exchange-deals/${deal.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className={statusColors[deal.status] || ''}>
                                                {deal.status || 'pending'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Sale Price:</span>
                                                <span className="font-medium">
                                                    PKR {Number(deal.sale_price || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Trade-in Value:</span>
                                                <span className="font-medium">
                                                    PKR {Number(deal.trade_in_agreed_value || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="text-muted-foreground font-medium">Net Amount:</span>
                                                <span className="font-bold text-primary">
                                                    PKR{' '}
                                                    {Math.max(
                                                        0,
                                                        Number(deal.sale_price || 0) -
                                                            Number(deal.trade_in_agreed_value || 0)
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <Link href={`/dashboard/exchange-deals/${deal.id}`} className="block">
                                            <Button variant="outline" className="w-full" size="sm">
                                                View Deal
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
