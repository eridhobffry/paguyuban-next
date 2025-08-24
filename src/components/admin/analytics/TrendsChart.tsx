"use client";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

type RangeType = "7d" | "30d" | "90d";

interface TrendsChartProps {
  timeSeries: Array<{ date: string; sessions: number; events: number }>;
  range: RangeType;
  onRangeChange: (range: RangeType) => void;
  onSessionize: () => Promise<void>;
  isLoading?: boolean;
}

export default function TrendsChart({
  timeSeries,
  range,
  onRangeChange,
  onSessionize,
  isLoading = false,
}: TrendsChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Sessions and Events (daily)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && onRangeChange(v as RangeType)}
            variant="outline"
          >
            <ToggleGroupItem value="7d">7d</ToggleGroupItem>
            <ToggleGroupItem value="30d">30d</ToggleGroupItem>
            <ToggleGroupItem value="90d">90d</ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={onSessionize}
            disabled={isLoading}
          >
            Run Sessionizer
          </Button>
        </div>
        <ChartContainer
          config={{
            sessions: { label: "Sessions", color: "#10b981" },
            events: { label: "Events", color: "#3b82f6" },
          }}
          className="aspect-auto h-[280px] w-full"
        >
          <ResponsiveContainer>
            <AreaChart data={timeSeries}>
              <defs>
                <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <ChartLegend content={<ChartLegendContent />} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString();
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#fillSessions)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#fillEvents)"
                stackId="2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
