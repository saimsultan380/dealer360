'use client';

import { Area, AreaChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const demoData = [
    { month: 'Jan', revenue: 4500000 },
    { month: 'Feb', revenue: 5200000 },
    { month: 'Mar', revenue: 4800000 },
    { month: 'Apr', revenue: 6100000 },
    { month: 'May', revenue: 5900000 },
    { month: 'Jun', revenue: 7500000 },
];

const chartConfig = {
    revenue: {
        label: 'Revenue',
        color: '#10b981',
    },
};

export function RevenueChart(props?: { data?: { month: string; revenue: number }[] }) {
    const data = props?.data !== undefined ? props.data : demoData;
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance (PKR)</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
                        No revenue data yet
                    </div>
                ) : (
                <div className="h-[260px] sm:h-[300px] w-full">
                    {/* Override ChartContainer's default aspect-video to prevent overflow on mobile */}
                    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto min-w-0">
                        <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                            <XAxis
                                dataKey="month"
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
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-revenue)"
                                fill="url(#revFill)"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5 }}
                                stroke="var(--color-revenue)"
                                isAnimationActive={false}
                            />
                        </ComposedChart>
                    </ChartContainer>
                </div>
                )}
            </CardContent>
        </Card>
    );
}
