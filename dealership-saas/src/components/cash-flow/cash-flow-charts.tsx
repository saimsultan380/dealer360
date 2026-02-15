'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    getCashFlowTimeSeries, 
    getExpenseByCategory,
    type TimeSeriesDataPoint, 
    type CategoryExpenseData 
} from '@/lib/actions/cash-flow';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Period = 'daily' | 'weekly' | 'monthly';

interface CashFlowChartsProps {
    onExport?: () => void;
}

export function CashFlowCharts({ onExport }: CashFlowChartsProps) {
    const [period, setPeriod] = useState<Period>('monthly');
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryExpenseData[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [useCustomRange, setUseCustomRange] = useState(false);

    useEffect(() => {
        fetchData();
    }, [period, startDate, endDate, useCustomRange]);

    const fetchData = async () => {
        setLoading(true);
        const [timeSeriesResult, categoryResult] = await Promise.all([
            getCashFlowTimeSeries(
                period,
                useCustomRange && startDate ? startDate : undefined,
                useCustomRange && endDate ? endDate : undefined
            ),
            getExpenseByCategory(
                useCustomRange && startDate ? startDate : undefined,
                useCustomRange && endDate ? endDate : undefined
            ),
        ]);

        if (timeSeriesResult.data) {
            setTimeSeriesData(timeSeriesResult.data);
        }
        if (categoryResult.data) {
            setCategoryData(categoryResult.data);
        }
        setLoading(false);
    };

    const formatCurrency = (value: number) => {
        return `PKR ${(value / 1000).toFixed(0)}K`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (period === 'daily') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (period === 'weekly') {
            return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    };

    const timeSeriesChartConfig = {
        cash_in: {
            label: 'Cash In',
            color: '#10b981',
        },
        cash_out: {
            label: 'Cash Out',
            color: '#3b82f6',
        },
        expenses: {
            label: 'Expenses',
            color: '#ef4444',
        },
        balance: {
            label: 'Balance',
            color: '#8b5cf6',
        },
    };

    const categoryChartConfig = {
        amount: {
            label: 'Amount',
            color: '#ef4444',
        },
    };

    const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    const handleExport = () => {
        if (onExport) {
            onExport();
        } else {
            // Default CSV export
            const csv = [
                ['Date', 'Cash In', 'Cash Out', 'Expenses', 'Balance'],
                ...timeSeriesData.map(d => [
                    d.date,
                    d.cash_in.toString(),
                    d.cash_out.toString(),
                    d.expenses.toString(),
                    d.balance.toString(),
                ]),
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cash-flow-${period}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        }
    };

    return (
        <div className="space-y-6 w-full min-w-0">
            {/* Filters - responsive grid */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Chart Filters</CardTitle>
                    <CardDescription>Select time period and date range for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Time Period</Label>
                            <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Custom Range</Label>
                            <Select 
                                value={useCustomRange ? 'yes' : 'no'} 
                                onValueChange={(value) => setUseCustomRange(value === 'yes')}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no">Auto</SelectItem>
                                    <SelectItem value="yes">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {useCustomRange && (
                            <>
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Cash Flow Trend Chart - responsive height and overflow */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Cash Flow Trend</CardTitle>
                    <CardDescription>Cash in, cash out, and expenses over time</CardDescription>
                </CardHeader>
                <CardContent className="w-full min-w-0">
                    {loading ? (
                        <Skeleton className="h-[250px] sm:h-[320px] md:h-[400px] w-full" />
                    ) : timeSeriesData.length === 0 ? (
                        <div className="h-[250px] sm:h-[320px] md:h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                            No data available for the selected period
                        </div>
                    ) : (
                        <div className="w-full min-w-0 h-[250px] sm:h-[320px] md:h-[400px]">
                            <ChartContainer config={timeSeriesChartConfig} className="h-full w-full min-w-0">
                                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="cashInFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="cashOutFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={formatCurrency}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="cash_in"
                                        stroke="#10b981"
                                        fill="url(#cashInFill)"
                                        strokeWidth={2}
                                        name="Cash In"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cash_out"
                                        stroke="#3b82f6"
                                        fill="url(#cashOutFill)"
                                        strokeWidth={2}
                                        name="Cash Out"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#ef4444"
                                        fill="url(#expensesFill)"
                                        strokeWidth={2}
                                        name="Expenses"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Balance Trend Chart - responsive */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Balance Trend</CardTitle>
                    <CardDescription>Cash balance over time</CardDescription>
                </CardHeader>
                <CardContent className="w-full min-w-0">
                    {loading ? (
                        <Skeleton className="h-[220px] sm:h-[280px] md:h-[300px] w-full" />
                    ) : timeSeriesData.length === 0 ? (
                        <div className="h-[220px] sm:h-[280px] md:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    ) : (
                        <div className="w-full min-w-0 h-[220px] sm:h-[280px] md:h-[300px]">
                            <ChartContainer config={timeSeriesChartConfig} className="h-full w-full min-w-0">
                                <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={formatCurrency}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        name="Balance"
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expense by Category Charts - single column on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Expenses by Category</CardTitle>
                        <CardDescription>Breakdown of expenses by category</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full min-w-0">
                        {loading ? (
                            <Skeleton className="h-[240px] sm:h-[280px] md:h-[300px] w-full" />
                        ) : categoryData.length === 0 ? (
                            <div className="h-[240px] sm:h-[280px] md:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                                No expense data available
                            </div>
                        ) : (
                            <div className="w-full min-w-0 h-[240px] sm:h-[280px] md:h-[300px]">
                                <ChartContainer config={categoryChartConfig} className="h-full w-full min-w-0">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="total_amount"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.category_color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Top Expense Categories</CardTitle>
                        <CardDescription>Highest spending categories</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full min-w-0">
                        {loading ? (
                            <Skeleton className="h-[240px] sm:h-[280px] md:h-[300px] w-full" />
                        ) : categoryData.length === 0 ? (
                            <div className="h-[240px] sm:h-[280px] md:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                                No expense data available
                            </div>
                        ) : (
                            <div className="w-full min-w-0 h-[240px] sm:h-[280px] md:h-[300px]">
                                <ChartContainer config={categoryChartConfig} className="h-full w-full min-w-0">
                                    <BarChart
                                        data={categoryData.slice(0, 5)}
                                        layout="vertical"
                                        margin={{ top: 5, right: 10, left: 60, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="category_name"
                                            type="category"
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            width={56}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar
                                            dataKey="total_amount"
                                            fill="var(--color-amount)"
                                            radius={[0, 4, 4, 0]}
                                            barSize={30}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
