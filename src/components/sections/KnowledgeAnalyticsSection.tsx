"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  Calendar,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

export interface Report {
  id: string;
  title: string;
  type: "financial" | "event" | "knowledge" | "chatbot";
  timestamp: string;
  summary: string;
  details: Record<string, unknown>;
  recommendations?: string[];
}

interface KnowledgeCompleteness {
  percentage: string;
  score: number;
  total: number;
}

interface FinancialTotals {
  totalRevenue?: number;
  totalCosts?: number;
  net?: number;
}

interface FinancialAnalytics {
  profitMargin?: string;
}

interface EventAttendance {
  total?: number;
  businessAttendees?: number;
}

interface ChatbotCapabilities {
  score: number;
  total: number;
}

interface ReportDetails {
  completeness?: KnowledgeCompleteness;
  dataTypes?: Record<string, boolean>;
  totals?: FinancialTotals;
  analytics?: FinancialAnalytics;
  attendance?: EventAttendance;
  capabilities?: ChatbotCapabilities;
  supportedTopics?: string[];
}

const COLORS = [
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

const RADIAL_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function KnowledgeAnalyticsSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reports", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Process data for visualizations
  const analytics = useMemo(() => {
    if (reports.length === 0) return null;

    const knowledgeReport = reports.find((r) => r.type === "knowledge");
    const financialReport = reports.find((r) => r.type === "financial");
    const eventReport = reports.find((r) => r.type === "event");
    const chatbotReport = reports.find((r) => r.type === "chatbot");

    // Knowledge completeness data
    const knowledgeDetails = knowledgeReport?.details as ReportDetails;
    const knowledgeCompleteness = knowledgeDetails?.completeness || {
      percentage: "0%",
      score: 0,
      total: 4,
    };

    // Data types availability
    const dataTypes = knowledgeDetails?.dataTypes || {};
    const dataTypesChart = Object.entries(dataTypes).map(
      ([key, value], index) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value ? 100 : 0,
        count: value ? 1 : 0,
        color: value ? COLORS[index] : "#e5e7eb",
      })
    );

    // Financial insights with knowledge context
    const financialDetails = financialReport?.details as ReportDetails;
    const financialTotals = financialDetails?.totals || {};
    const profitMargin = financialDetails?.analytics?.profitMargin || "0%";

    // Event metrics
    const eventDetails = eventReport?.details as ReportDetails;
    const eventAttendance = eventDetails?.attendance || {};
    const eventMetrics = [
      {
        name: "Total Expected",
        value: eventAttendance.total || 0,
        color: COLORS[0],
      },
      {
        name: "Business Attendees",
        value: eventAttendance.businessAttendees || 0,
        color: COLORS[1],
      },
    ];

    // Chatbot capabilities
    const chatbotDetails = chatbotReport?.details as ReportDetails;
    const chatbotCapabilities = chatbotDetails?.capabilities || {
      score: 0,
      total: 3,
    };
    const chatbotTopics = chatbotDetails?.supportedTopics || [];

    return {
      knowledgeCompleteness,
      dataTypesChart,
      financialTotals,
      profitMargin,
      eventMetrics,
      chatbotCapabilities,
      chatbotTopics,
    };
  }, [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Analyzing knowledge insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Error loading analytics: {error}</span>
        </div>
        <Button onClick={fetchReports} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center">
        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
        <p className="text-muted-foreground mb-4">
          Unable to generate knowledge insights. This might be due to missing
          data.
        </p>
        <Button onClick={fetchReports}>Try Again</Button>
      </Card>
    );
  }

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Knowledge Insights Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time analytics and insights based on your knowledge system
            data, providing actionable intelligence for decision-making.
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <Button onClick={fetchReports} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Analytics
          </Button>
        </div>

        {/* Knowledge Health Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Knowledge Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.knowledgeCompleteness.percentage}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.knowledgeCompleteness.score} of{" "}
                {analytics.knowledgeCompleteness.total} data types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.profitMargin}</div>
              <p className="text-xs text-muted-foreground">
                Based on financial data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Expected Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.eventMetrics[0]?.value?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total event capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.chatbotCapabilities.score}/
                {analytics.chatbotCapabilities.total}
              </div>
              <p className="text-xs text-muted-foreground">
                Knowledge areas available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Knowledge Completeness Radial Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Knowledge System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  completeness: {
                    label: "Completeness",
                    color: RADIAL_COLORS[0],
                  },
                }}
                className="aspect-square"
              >
                <ResponsiveContainer>
                  <RadialBarChart
                    data={[
                      {
                        name: "Completeness",
                        value: parseFloat(
                          analytics.knowledgeCompleteness.percentage
                        ),
                        fill: RADIAL_COLORS[0],
                      },
                    ]}
                    innerRadius="60%"
                    outerRadius="100%"
                  >
                    <RadialBar dataKey="value" cornerRadius={10} />
                    <Legend />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  System completeness based on available data types
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Types Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Data Types Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  analytics.dataTypesChart.map((d) => [
                    d.name,
                    { label: d.name, color: d.color },
                  ])
                )}
                className="aspect-square"
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={analytics.dataTypesChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {analytics.dataTypesChart.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Event Metrics */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Attendance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(
                  analytics.eventMetrics.map((d) => [
                    d.name,
                    { label: d.name, color: d.color },
                  ])
                )}
                className="aspect-auto h-[300px]"
              >
                <ResponsiveContainer>
                  <BarChart data={analytics.eventMetrics}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chatbot Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Knowledge Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(analytics.chatbotTopics) &&
                analytics.chatbotTopics.length > 0 ? (
                  analytics.chatbotTopics.map(
                    (topic: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <span className="text-sm font-medium">{topic}</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    )
                  )
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No AI knowledge topics available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Insights */}
        {analytics.financialTotals &&
          Object.keys(analytics.financialTotals).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      €
                      {analytics.financialTotals.totalRevenue?.toLocaleString() ||
                        0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      €
                      {analytics.financialTotals.totalCosts?.toLocaleString() ||
                        0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Costs</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      €{analytics.financialTotals.net?.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Recommendations Summary */}
        {reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Key Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {reports.map((report, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {report.type === "financial" && (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                      {report.type === "event" && (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      )}
                      {report.type === "knowledge" && (
                        <Brain className="h-4 w-4 text-purple-600" />
                      )}
                      {report.type === "chatbot" && (
                        <MessageSquare className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="font-medium capitalize">
                        {report.type}
                      </span>
                    </div>
                    {report.recommendations &&
                    report.recommendations.length > 0 ? (
                      <ul className="space-y-1">
                        {report.recommendations
                          .slice(0, 2)
                          .map((rec, recIndex) => (
                            <li
                              key={recIndex}
                              className="text-xs text-muted-foreground flex items-start space-x-2"
                            >
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No recommendations
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
