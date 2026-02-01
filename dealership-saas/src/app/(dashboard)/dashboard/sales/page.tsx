import Link from 'next/link';
import { Plus, DollarSign, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSales } from '@/lib/actions/sales';
import { SalesTable } from '@/components/sales/sales-table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SalesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string; limit?: string }>;
}) {
    const sp = await searchParams;
    const query = sp.q || '';
    const status = sp.status || 'all';
    const page = Number(sp.page) || 1;
    const limit = Number(sp.limit) || 20;

    const { data: sales, metadata, error } = await getSales({ search: query, status, page, limit });

    const allSales = (sales || []) as any[];
    const totalSales = allSales.length;
    const completedSales = allSales.filter((s) => s.status === 'completed').length;
    const pendingSales = allSales.filter((s) => s.status === 'pending').length;
    const totalRevenue = allSales
        .filter((s) => s.status === 'completed')
        .reduce((sum, s) => sum + parseFloat(s.sale_price || 0), 0);
    const pendingRevenue = allSales
        .filter((s) => s.status === 'pending')
        .reduce((sum, s) => sum + (parseFloat(s.sale_price || 0) - parseFloat(s.down_payment || 0)), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
                    <p className="text-muted-foreground">
                        Manage vehicle sales and track transactions
                    </p>
                </div>
                <Link href="/dashboard/sales/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        New Sale
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSales}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedSales}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingSales}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            PKR {totalRevenue.toLocaleString()}
                        </div>
                        {pendingRevenue > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                PKR {pendingRevenue.toLocaleString()} pending
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="rounded-lg border bg-card/60 backdrop-blur-sm">
                <div className="p-4">
                    <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <Input
                            name="q"
                            placeholder="Search by customer name, phone, or CNIC..."
                            defaultValue={query}
                            className="w-full sm:max-w-sm"
                        />
                        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                            <select
                                name="status"
                                defaultValue={status}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="all">All statuses</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <Button type="submit" variant="outline" className="sm:w-auto">
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <SalesTable
                sales={sales as any}
                pagination={{
                    page: metadata?.page ?? page,
                    limit: metadata?.limit ?? limit,
                    total: metadata?.total ?? (sales?.length ?? 0),
                    totalPages: metadata?.totalPages ?? 1,
                }}
            />
        </div>
    );
}
