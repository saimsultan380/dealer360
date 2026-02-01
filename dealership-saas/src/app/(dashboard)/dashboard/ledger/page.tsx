'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LedgerCharts } from '@/components/ledger/ledger-charts';
import {
  getDealProfitRows,
  getLedgerEntries,
  getLedgerSummary,
  type DealProfitRow,
  type LedgerEntry,
  type LedgerFilters,
  type LedgerPeriod,
} from '@/lib/actions/ledger';
import { Download, Plus, Search, TrendingDown, TrendingUp } from 'lucide-react';

type Preset = LedgerPeriod | 'custom';

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function computeRange(preset: Preset, customStart?: string, customEnd?: string) {
  const end = new Date();
  end.setHours(12, 0, 0, 0);

  const start = new Date(end);
  if (preset === 'daily') start.setDate(start.getDate() - 30);
  if (preset === 'weekly') start.setDate(start.getDate() - 7 * 12);
  if (preset === 'monthly') start.setMonth(start.getMonth() - 12);
  if (preset === 'yearly') start.setFullYear(start.getFullYear() - 5);

  if (preset === 'custom') {
    return {
      start_date: customStart || '',
      end_date: customEnd || '',
    };
  }

  return {
    start_date: toISODate(start),
    end_date: toISODate(end),
  };
}

export default function LedgerPage() {
  const router = useRouter();

  const [preset, setPreset] = useState<Preset>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [transactionType, setTransactionType] = useState<'all' | 'cash_in' | 'cash_out' | 'expense'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('completed');
  const [paymentMethod, setPaymentMethod] = useState<
    'all' | 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'cheque'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const range = useMemo(() => computeRange(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const filters: LedgerFilters = useMemo(
    () => ({
      start_date: range.start_date || undefined,
      end_date: range.end_date || undefined,
      transaction_type: transactionType === 'all' ? undefined : transactionType,
      status: status === 'all' ? undefined : status,
      payment_method: paymentMethod === 'all' ? undefined : (paymentMethod as any),
    }),
    [range.start_date, range.end_date, transactionType, status, paymentMethod]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [profitRows, setProfitRows] = useState<DealProfitRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);

      const [summaryRes, entriesRes, profitRes] = await Promise.all([
        getLedgerSummary(filters),
        getLedgerEntries(filters),
        getDealProfitRows(filters.start_date, filters.end_date),
      ]);

      if (cancelled) return;

      // Only show non-unauthorized errors
      if (summaryRes.error && summaryRes.error !== 'Unauthorized' && summaryRes.error !== 'No organization found') {
        setError(summaryRes.error);
      }
      setSummary(summaryRes.data);

      if (entriesRes.error && entriesRes.error !== 'Unauthorized' && entriesRes.error !== 'No organization found') {
        setError(entriesRes.error);
      }
      setEntries(entriesRes.data || []);

      if (profitRes.error && profitRes.error !== 'Unauthorized' && profitRes.error !== 'No organization found') {
        setError(profitRes.error);
      }
      setProfitRows(profitRes.data || []);

      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [filters.start_date, filters.end_date, filters.transaction_type, filters.status, filters.payment_method]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      return (
        e.description.toLowerCase().includes(q) ||
        (e.reference_number || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q) ||
        (e.expense_category?.name || '').toLowerCase().includes(q) ||
        (e.related_entity_type || '').toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery]);

  const formatCurrency = (amount: number) => `PKR ${Number(amount || 0).toLocaleString()}`;

  const exportEntries = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Status', 'Payment Method', 'Category', 'Description', 'Reference', 'Notes'],
      ...filteredEntries.map((e) => [
        e.transaction_date,
        e.transaction_type,
        String(e.amount),
        e.status,
        e.payment_method || '',
        e.expense_category?.name || '',
        e.description.replace(/\\s+/g, ' ').trim(),
        e.reference_number || '',
        (e.notes || '').replace(/\\s+/g, ' ').trim(),
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-entries-${preset}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportProfit = () => {
    const csv = [
      ['Deal Date', 'Vehicle', 'Sale Price', 'Purchase Price', 'Commission', 'Gross Profit', 'Net Profit'],
      ...profitRows.map((r) => [
        r.deal_date,
        `${r.vehicle_make || ''} ${r.vehicle_model || ''} ${r.vehicle_year || ''}`.trim(),
        String(r.sale_price),
        String(r.purchase_price),
        String(r.commission_amount),
        String(r.gross_profit),
        String(r.net_profit),
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-profit-${preset}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-96" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[110px]" />
          ))}
        </div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
          <p className="text-muted-foreground">Daily / weekly / monthly / yearly ledger with profit & loss</p>
        </div>
        <div className="flex flex-row gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/cash-flow/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <Button variant="outline" onClick={exportEntries}>
            <Download className="mr-2 h-4 w-4" />
            Export Ledger
          </Button>
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Choose period and filters (custom date range supported)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-1">
              <div className="text-sm font-medium">Range</div>
              <Select value={preset} onValueChange={(v: any) => setPreset(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preset === 'custom' ? (
              <>
                <div className="space-y-2 md:col-span-1">
                  <div className="text-sm font-medium">Start</div>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <div className="text-sm font-medium">End</div>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 text-sm text-muted-foreground flex items-end">
                {range.start_date} → {range.end_date}
              </div>
            )}

            <div className="space-y-2 md:col-span-1">
              <div className="text-sm font-medium">Type</div>
              <Select value={transactionType} onValueChange={(v: any) => setTransactionType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cash_in">Cash In</SelectItem>
                  <SelectItem value="cash_out">Cash Out</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <div className="text-sm font-medium">Status</div>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <div className="text-sm font-medium">Payment</div>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="easypaisa">Easypaisa</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
              {summary.net_cashflow >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.net_cashflow)}
              </div>
              <p className="text-xs text-muted-foreground">Cash in - cash out - expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {summary.net_profit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.net_profit)}
              </div>
              <p className="text-xs text-muted-foreground">Gross - commissions - expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash In / Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Cash In</div>
              <div className="text-xl font-semibold text-green-600">{formatCurrency(summary.cash_in)}</div>
              <div className="mt-2 text-sm text-muted-foreground">Cash Out + Expenses</div>
              <div className="text-xl font-semibold text-red-600">{formatCurrency(summary.cash_out + summary.expenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.deals_count}</div>
              <p className="text-xs text-muted-foreground">{summary.transactions_count} ledger entries</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="entries">Ledger Entries</TabsTrigger>
          <TabsTrigger value="profit">Profit / Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <LedgerCharts
            filters={{
              preset,
              start_date: range.start_date || undefined,
              end_date: range.end_date || undefined,
            }}
          />
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Ledger Entries</CardTitle>
                  <CardDescription>Cash transactions (filtered)</CardDescription>
                </div>
                <Button variant="outline" onClick={exportEntries}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search description, category, reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntries.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.transaction_date}</TableCell>
                          <TableCell>
                            {e.transaction_type === 'cash_in' ? (
                              <Badge className="bg-green-600">Cash In</Badge>
                            ) : e.transaction_type === 'cash_out' ? (
                              <Badge className="bg-blue-600">Cash Out</Badge>
                            ) : (
                              <Badge className="bg-red-600">Expense</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[320px] truncate">{e.description}</TableCell>
                          <TableCell>
                            {e.expense_category ? (
                              <Badge
                                variant="outline"
                                style={{ borderColor: e.expense_category.color, color: e.expense_category.color }}
                              >
                                {e.expense_category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={
                              e.transaction_type === 'cash_in'
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {e.transaction_type === 'cash_in' ? '+' : '-'}
                            {formatCurrency(e.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={e.status === 'completed' ? 'default' : 'secondary'}>{e.status}</Badge>
                          </TableCell>
                          <TableCell>{e.payment_method ? <Badge variant="outline">{e.payment_method}</Badge> : '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Profit / Loss</CardTitle>
                  <CardDescription>
                    Completed deals profit (sale - purchase - commission). Expenses are accounted in summary/net profit.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={exportProfit}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead>Purchase</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No completed deals found in this range
                        </TableCell>
                      </TableRow>
                    ) : (
                      profitRows.map((r) => (
                        <TableRow key={r.deal_id}>
                          <TableCell>{r.deal_date}</TableCell>
                          <TableCell className="max-w-[260px] truncate">
                            {r.vehicle_make} {r.vehicle_model} {r.vehicle_year ? `(${r.vehicle_year})` : ''}
                          </TableCell>
                          <TableCell className="text-green-600 font-semibold">{formatCurrency(r.sale_price)}</TableCell>
                          <TableCell className="text-red-600 font-semibold">{formatCurrency(r.purchase_price)}</TableCell>
                          <TableCell>{formatCurrency(r.commission_amount)}</TableCell>
                          <TableCell className={r.gross_profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {formatCurrency(r.gross_profit)}
                          </TableCell>
                          <TableCell className={r.net_profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {formatCurrency(r.net_profit)}
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
    </div>
  );
}

