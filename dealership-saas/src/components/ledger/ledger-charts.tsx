'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  getLedgerTimeSeries,
  type LedgerPeriod,
  type LedgerSeriesPoint,
} from '@/lib/actions/ledger';

type Preset = LedgerPeriod | 'custom';

export interface LedgerChartsFilters {
  preset: Preset;
  start_date?: string;
  end_date?: string;
}

export function LedgerCharts({ filters }: { filters: LedgerChartsFilters }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<LedgerSeriesPoint[]>([]);

  const [hideCharts, setHideCharts] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ledger-hide-charts') : null;
    if (saved === '1') setHideCharts(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ledger-hide-charts', hideCharts ? '1' : '0');
    }
  }, [hideCharts]);

  const period: LedgerPeriod = useMemo(() => {
    return (filters.preset === 'custom' ? 'daily' : filters.preset) as LedgerPeriod;
  }, [filters.preset]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      const res = await getLedgerTimeSeries({
        period,
        start_date: filters.preset === 'custom' ? filters.start_date : filters.start_date,
        end_date: filters.preset === 'custom' ? filters.end_date : filters.end_date,
      });
      if (cancelled) return;
      if (res.error && res.error !== 'Unauthorized' && res.error !== 'No organization found') {
        setError(res.error);
        setSeries([]);
      } else {
        setError(null);
        setSeries(res.data || []);
      }
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [period, filters.start_date, filters.end_date, filters.preset]);

  const config = {
    cash_in: { label: 'Cash In', color: '#10b981' },
    cash_out: { label: 'Cash Out', color: '#3b82f6' },
    expenses: { label: 'Expenses', color: '#ef4444' },
    net_profit: { label: 'Net Profit', color: '#8b5cf6' },
  };

  const exportCsv = () => {
    const csv = [
      ['Period', 'Cash In', 'Cash Out', 'Expenses', 'Net Cashflow', 'Revenue', 'COGS', 'Gross Profit', 'Commissions', 'Net Profit'],
      ...series.map((s) => [
        s.date,
        String(s.cash_in),
        String(s.cash_out),
        String(s.expenses),
        String(s.net_cashflow),
        String(s.revenue),
        String(s.cogs),
        String(s.gross_profit),
        String(s.commissions),
        String(s.net_profit),
      ]),
    ]
      .map((r) => r.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-series-${filters.preset}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tickMoney = (v: number) => {
    if (!Number.isFinite(v)) return '';
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[56px] w-full" />
        <Skeleton className="h-[320px] w-full" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Charts & Graphs</CardTitle>
            <CardDescription>Cashflow + profit trend for the selected range</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Hide charts</Label>
              <Switch checked={hideCharts} onCheckedChange={setHideCharts} />
            </div>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Showing {series.length} points ({filters.preset === 'custom' ? 'custom' : period}).
            </div>
          )}
        </CardContent>
      </Card>

      {!hideCharts ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Cashflow Trend</CardTitle>
              <CardDescription>Cash in, cash out and expenses per period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ChartContainer config={config} className="h-full w-full aspect-auto min-w-0">
                  <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-cash_in)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-cash_in)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-cash_out)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-cash_out)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-expenses)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-expenses)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={tickMoney} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area type="monotone" dataKey="cash_in" name="Cash In" stroke="var(--color-cash_in)" fill="url(#fillIn)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cash_out" name="Cash Out" stroke="var(--color-cash_out)" fill="url(#fillOut)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-expenses)" fill="url(#fillExp)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profit / Loss Trend</CardTitle>
              <CardDescription>Net profit per period (gross - commissions - expenses)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ChartContainer config={config} className="h-full w-full aspect-auto min-w-0">
                  <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={tickMoney} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="net_profit" name="Net Profit" stroke="var(--color-net_profit)" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

