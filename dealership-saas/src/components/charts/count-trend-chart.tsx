"use client";

import {
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Datum = { month: string; count: number };

export function CountTrendChart(props: {
  title: string;
  description: string;
  data: Datum[];
  color?: string;
}) {
  const color = props.color ?? "hsl(var(--primary))";

  const chartConfig = {
    count: {
      label: "Count",
      color,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {props.data.length === 0 ? (
          <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
            No data yet
          </div>
        ) : (
          <div className="h-[260px] sm:h-[300px] w-full">
            <ChartContainer
              config={chartConfig}
              className="h-full w-full aspect-auto min-w-0"
            >
              <ComposedChart
                data={props.data}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="countFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-count)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted/40"
                />
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
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fill="url(#countFill)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  stroke="var(--color-count)"
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
