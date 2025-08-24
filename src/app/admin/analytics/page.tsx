"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeAnalyticsSection from "@/components/sections/KnowledgeAnalyticsSection";
import AnalyticsQuerySection from "@/components/sections/AnalyticsQuerySection";
import {
  AnalyticsHeader,
  KpiCards,
  TrendsChart,
  BreakdownTables,
  RecommendationsPanel,
  SummariesPanel,
} from "@/components/admin/analytics";

// Remove unused imports that are now handled by sub-components
// import { SummariesSection, RecommendationsDialog } from "@/components/admin";
// import { useChatSummaries } from "@/hooks/useChatSummaries";
// import { getRecommendationsWithCache } from "@/hooks/useAdminRecommendations";
// import { extractProspectFromSummary } from "@/lib/prospect";
// import type { ChatRecommendationsData } from "@/types/analytics";
// import { Button } from "@/components/ui/button";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
// import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
// import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

type DailyPoint = { date: string; count: number };
type TopItem = { name: string; count: number };

type ApiResponse = {
  range: string;
  rangeDays: number;
  sessionsDaily: DailyPoint[];
  eventsDaily: DailyPoint[];
  topRoutes: TopItem[];
  topSections: TopItem[];
  avgEngagement: number;
  bounceRate: number; // 0..1
  scrollDepthBuckets: { bucket: string; count: number }[];
  chatDaily: DailyPoint[];
  chatSentiment: TopItem[];
  chatTopTopics: TopItem[];
  chatRecentSummaries: {
    sessionId: string;
    summary: string;
    sentiment: string | null;
    createdAt: string;
  }[];
  funnelA: { name: string; count: number }[];
  topCtas?: { name: string; count: number }[];
  topDownloads?: { name: string; count: number }[];
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  // Remove state variables that are now handled by sub-components:
  // const [recOpen, setRecOpen] = useState(false);
  // const [recLoading, setRecLoading] = useState(false);
  // const [recData, setRecData] = useState<ChatRecommendationsData | null>(null);
  // const [currentRecItem, setCurrentRecItem] = useState<{...}>(null);
  // const [currentProspect, setCurrentProspect] = useState<ReturnType<typeof extractProspectFromSummary> | null>(null);

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

  // Sessionize handler for the TrendsChart component
  const handleSessionize = async () => {
    try {
      await fetch("/api/admin/analytics/sessionize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thresholdMinutes: 30 }),
      });
      // Refresh chart data after sessionizing
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${range}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse;
        setData(json);
      }
    } catch {
      // Ignore errors for now
    } finally {
      setLoading(false);
    }
  };

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
      <AnalyticsHeader
        title="Analytics Dashboard"
        description="Comprehensive insights across user behavior, knowledge systems, and business intelligence."
      />

      <Tabs defaultValue="behavior" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="behavior">User Behavior Analytics</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Insights</TabsTrigger>
          <TabsTrigger value="ai-analytics" className="flex items-center gap-2">
            <span className="text-sm">🤖</span>
            AI Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-6">
          <AnalyticsHeader
            title="User Behavior Analytics"
            description={`Last ${
              range === "7d"
                ? "7 days"
                : range === "30d"
                ? "30 days"
                : "90 days"
            }. No PII. Fast aggregates.`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <KpiCards
              avgEngagement={data?.avgEngagement ?? 0}
              bounceRate={data?.bounceRate ?? 0}
              range={data?.range ?? "30d"}
            />
            <TrendsChart
              timeSeries={timeSeries}
              range={range}
              onRangeChange={setRange}
              onSessionize={handleSessionize}
              isLoading={loading}
            />
          </div>

          <BreakdownTables
            topRoutes={data?.topRoutes || []}
            topSections={data?.topSections || []}
            scrollDepthBuckets={data?.scrollDepthBuckets || []}
            topCtas={data?.topCtas}
            topDownloads={data?.topDownloads}
          />
        </TabsContent>

        <TabsContent value="ai-analytics" className="space-y-6">
          <RecommendationsPanel
            chatTopTopics={data?.chatTopTopics || []}
            funnelA={data?.funnelA || []}
          />
          <SummariesPanel range={range} />
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <KnowledgeAnalyticsSection />
          <AnalyticsQuerySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
