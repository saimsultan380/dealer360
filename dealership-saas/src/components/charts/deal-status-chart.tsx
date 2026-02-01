'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const demoData = [
    { name: 'Completed', value: 45, color: '#10b981' }, // emerald
    { name: 'Cancelled', value: 15, color: '#ef4444' }, // red
    { name: 'Pending', value: 30, color: '#f59e0b' }, // amber
];

const chartConfig = {
    completed: {
        label: 'Completed',
        color: '#10b981',
    },
    cancelled: {
        label: 'Cancelled',
        color: '#ef4444',
    },
    pending: {
        label: 'Pending',
        color: '#f59e0b',
    },
};

export function DealStatusChart(props?: { data?: { name: string; value: number; color: string }[] }) {
    const data = props?.data !== undefined ? props.data : demoData;
    return (
        <Card>
            <CardHeader>
                <CardTitle>Deal Status</CardTitle>
                <CardDescription>Distribution of completed vs pending deals</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
                        No deals yet
                    </div>
                ) : (
                <div className="h-[260px] sm:h-[300px] w-full">
                    {/* Override ChartContainer's default aspect-video to prevent overflow on mobile */}
                    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto min-w-0">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="45%"
                                innerRadius="55%"
                                outerRadius="75%"
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: 12 }}
                            />
                        </PieChart>
                    </ChartContainer>
                </div>
                )}
            </CardContent>
        </Card>
    );
}
