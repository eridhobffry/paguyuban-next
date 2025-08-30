"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  lastOpenedAt: number | null;
  consecutiveFailures: number;
  windowSize: number;
  lastProbeAt: number | null;
  failureRate: number;
}

interface BreakerStates {
  [key: string]: CircuitBreakerState;
}

export function CircuitBreakerPanel() {
  const [breakerStates, setBreakerStates] = useState<BreakerStates | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreakerStates();
    // Poll every 30 seconds
    const interval = setInterval(fetchBreakerStates, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBreakerStates = async () => {
    try {
      // Get circuit breaker states from telemetry
      const response = await fetch("/api/admin/metrics/summary");
      if (response.ok) {
        const data = await response.json();
        // Extract breaker states from telemetry metadata
        setBreakerStates(data?.metadata?.breaker_snapshot || {});
      }
    } catch (error) {
      console.warn("Failed to fetch breaker states:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "closed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "open":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "half-open":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case "closed":
        return <Badge className="bg-green-100 text-green-800">Closed</Badge>;
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "half-open":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Half-Open</Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Circuit Breaker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakerStates || Object.keys(breakerStates).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Circuit Breaker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No circuit breaker data available</p>
            <p className="text-sm">
              Circuit breakers will appear here when activated
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Circuit Breaker Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(breakerStates).map(([key, state]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStateIcon(state.state)}
                  <span className="font-medium capitalize">
                    {key.replace("_", " ")}
                  </span>
                </div>
                {getStateBadge(state.state)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Consecutive Failures</p>
                  <p className="font-medium">{state.consecutiveFailures}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Window Size</p>
                  <p className="font-medium">{state.windowSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failure Rate</p>
                  <p className="font-medium">
                    {(state.failureRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Opened</p>
                  <p className="font-medium">
                    {state.lastOpenedAt
                      ? new Date(state.lastOpenedAt).toLocaleTimeString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Failure Rate Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Failure Rate</span>
                  <span>{(state.failureRate * 100).toFixed(1)}%</span>
                </div>
                <Progress
                  value={state.failureRate * 100}
                  className={`h-2 ${
                    state.failureRate > 0.2 ? "bg-red-100" : "bg-green-100"
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {state.failureRate > 0.5
                    ? "Critical: High failure rate detected"
                    : state.failureRate > 0.2
                    ? "Warning: Elevated failure rate"
                    : "Normal: Acceptable failure rate"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Circuit Breaker States
          </h4>
          <ul className="text-sm space-y-1">
            <li>
              <strong>Closed:</strong> Normal operation, requests flow through
            </li>
            <li>
              <strong>Open:</strong> Too many failures, requests are blocked
            </li>
            <li>
              <strong>Half-Open:</strong> Testing if service recovered, limited
              requests
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
