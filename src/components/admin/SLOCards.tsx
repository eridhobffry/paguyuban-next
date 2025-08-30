"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

interface SLOMetrics {
  window: {
    range: string;
    from: string;
    to: string;
  };
  totals: {
    observations: number;
    weighted: number;
    successWeighted: number;
    failureWeighted: number;
    successRateWeighted: number;
  };
  latencyMs: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    avg: number;
  };
  topIntents: Array<{
    intent: string;
    count: number;
  }>;
}

const SLO_TARGETS = {
  availability: 0.999, // 99.9% uptime
  p95Latency: 2000, // 2 seconds
  errorRate: 0.001, // 0.1% error rate
};

export function SLOCards() {
  const [metrics, setMetrics] = useState<SLOMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/metrics/summary");
      if (!response.ok) throw new Error("Failed to fetch metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load SLO metrics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availability = metrics.totals.successRateWeighted;
  const p95Latency = metrics.latencyMs.p95;
  const errorRate = 1 - availability;

  const getStatusIcon = (value: number, target: number, invert = false) => {
    const isGood = invert ? value <= target : value >= target;
    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Availability SLO */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(availability, SLO_TARGETS.availability)}
            System Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(availability * 100).toFixed(2)}%
          </div>
          <Progress value={availability * 100} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Target: {(SLO_TARGETS.availability * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* P95 Latency SLO */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(p95Latency, SLO_TARGETS.p95Latency, true)}
            P95 Latency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{p95Latency}ms</div>
          <Progress
            value={Math.min((p95Latency / SLO_TARGETS.p95Latency) * 100, 100)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Target: {SLO_TARGETS.p95Latency}ms
          </p>
        </CardContent>
      </Card>

      {/* Error Rate SLO */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(errorRate, SLO_TARGETS.errorRate, true)}
            Error Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(errorRate * 100).toFixed(3)}%
          </div>
          <Progress
            value={errorRate * 10000} // Scale for visibility
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Target: {(SLO_TARGETS.errorRate * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* Throughput */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Total Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totals.observations.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Badge variant="secondary" className="text-xs">
              {metrics.window.range}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totals.weighted.toLocaleString()} weighted
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
