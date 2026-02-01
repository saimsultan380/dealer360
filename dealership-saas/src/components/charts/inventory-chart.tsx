'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const data = [
    { type: 'Sedan', count: 120 },
    { type: 'SUV', count: 85 },
    { type: 'Hatchback', count: 65 },
    { type: 'Truck', count: 20 },
    { type: 'Van', count: 15 },
];

const chartConfig = {
    count: {
        label: 'Vehicles',
        color: 'hsl(var(--primary))',
    },
};

export function InventoryChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory by Type</CardTitle>
                <CardDescription>Current vehicle stock distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="type"
                                type="category"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={80}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="count"
                                fill="var(--color-count)"
                                radius={[0, 4, 4, 0]}
                                barSize={30}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
