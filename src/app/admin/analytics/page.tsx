"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type DailyPoint = { date: string; count: number };
type TopItem = { name: string; count: number };

type ApiResponse = {
  range: string;
  rangeDays: number;
  sessionsDaily: DailyPoint[];
  eventsDaily: DailyPoint[];
  topRoutes: TopItem[];
  topSections: TopItem[];
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const timeSeries = useMemo(() => {
    if (!data)
      return [] as Array<{ date: string; sessions: number; events: number }>;
    // Merge sessionsDaily and eventsDaily by date
    const map = new Map<
      string,
      { date: string; sessions: number; events: number }
    >();
    for (const d of data.sessionsDaily) {
      map.set(String(d.date), {
        date: String(d.date),
        sessions: d.count,
        events: 0,
      });
    }
    for (const d of data.eventsDaily) {
      const key = String(d.date);
      const prev = map.get(key) || { date: key, sessions: 0, events: 0 };
      prev.events = d.count;
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [data]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card variant="glass" className="p-7">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <Skeleton className="h-[280px] w-full" />
            </Card>
            <Card className="lg:col-span-1 p-6">
              <Skeleton className="h-[280px] w-full" />
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <Skeleton className="h-[280px] w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-[280px] w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card variant="glass" className="p-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Last 30 days. No PII. Fast aggregates.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sessions and Events (daily)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <ToggleGroup
                type="single"
                value={range}
                onValueChange={(v) => v && setRange(v as typeof range)}
                variant="outline"
              >
                <ToggleGroupItem value="7d">7d</ToggleGroupItem>
                <ToggleGroupItem value="30d">30d</ToggleGroupItem>
                <ToggleGroupItem value="90d">90d</ToggleGroupItem>
              </ToggleGroup>
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
                    <linearGradient
                      id="fillSessions"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="sessions"
                    type="natural"
                    fill="url(#fillSessions)"
                    stroke="#10b981"
                  />
                  <Area
                    dataKey="events"
                    type="natural"
                    fill="url(#fillEvents)"
                    stroke="#3b82f6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { label: "Events", color: "#6366f1" } }}
              className="aspect-auto h-[280px] w-full"
            >
              <ResponsiveContainer>
                <BarChart data={(data?.topRoutes || []).slice().reverse()}>
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#6366f1" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { label: "Events", color: "#f59e0b" } }}
              className="aspect-auto h-[280px] w-full"
            >
              <ResponsiveContainer>
                <BarChart data={(data?.topSections || []).slice().reverse()}>
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#f59e0b" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions vs Events Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sessions: { label: "Sessions", color: "#10b981" },
                events: { label: "Events", color: "#3b82f6" },
              }}
              className="aspect-auto h-[280px] w-full"
            >
              <ResponsiveContainer>
                <BarChart
                  data={[
                    {
                      name: "Total",
                      sessions: (data?.sessionsDaily || []).reduce(
                        (a, b) => a + b.count,
                        0
                      ),
                      events: (data?.eventsDaily || []).reduce(
                        (a, b) => a + b.count,
                        0
                      ),
                    },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                  <Bar dataKey="events" fill="#3b82f6" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
