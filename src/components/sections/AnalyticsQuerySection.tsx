"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Target,
  PieChart,
  Activity,
  Zap,
  Copy,
  Save,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  trend?: "up" | "down" | "stable";
  description?: string;
}

interface AnalyticsDimension {
  name: string;
  data: {
    date?: string;
    value: number;
    label?: string;
    metadata?: Record<string, string | number | boolean>;
  }[];
  topValues?: { name: string; count: number; percentage: number }[];
}

interface AnalyticsQueryResult {
  query: string;
  insights: string;
  metrics: AnalyticsMetric[];
  dimensions: AnalyticsDimension[];
  trends: {
    direction: "increasing" | "decreasing" | "stable";
    magnitude: "strong" | "moderate" | "weak";
    description: string;
  }[];
  recommendations: string[];
  dataQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  timestamp: string;
}

interface QueryHistory {
  id: string;
  query: string;
  result: AnalyticsQueryResult;
  timestamp: string;
}

interface QueryCapabilities {
  supportedQueryTypes: string[];
  availableMetrics: string[];
  availableDimensions: string[];
  features: string[];
  examples: string[];
  dataSources: { name: string; description: string; fields: string[] }[];
}

interface AnalyticsDimension {
  name: string;
  data: {
    date?: string;
    value: number;
    label?: string;
    metadata?: Record<string, string | number | boolean>;
  }[];
  topValues?: { name: string; count: number; percentage: number }[];
}

export default function AnalyticsQuerySection() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyticsQueryResult | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [capabilities, setCapabilities] = useState<QueryCapabilities | null>({
    supportedQueryTypes: [
      "user behavior analysis",
      "engagement metrics",
      "conversion tracking",
      "audience demographics",
      "content performance",
      "technical analytics",
      "business impact analysis",
      "trend identification",
      "anomaly detection",
      "predictive insights",
    ],
    availableMetrics: [
      "sessions",
      "users",
      "bounceRate",
      "sessionDuration",
      "events",
      "eventTypes",
      "eventsPerSession",
      "sectionDwellTime",
      "sectionViews",
      "chatMessages",
      "chatSessions",
      "tokensUsed",
      "downloads",
      "formSubmissions",
      "pageViews",
    ],
    availableDimensions: [
      "route",
      "section",
      "device",
      "country",
      "referrer",
      "eventType",
      "chatTopic",
      "sentiment",
      "timeOfDay",
      "dayOfWeek",
    ],
    features: [
      "AI-powered insights and recommendations",
      "Trend analysis and anomaly detection",
      "Custom time range filtering",
      "Multi-dimensional analysis",
      "Data quality assessment",
      "Actionable business recommendations",
    ],
    examples: [
      "What are the main user engagement trends over the past month?",
      "Which pages have the highest bounce rates and why?",
      "How do mobile users behave differently from desktop users?",
      "What content performs best and drives the most engagement?",
      "Are there any unusual patterns in user behavior that need attention?",
      "How can we improve user retention based on current analytics?",
      "What are the most effective entry points for new users?",
      "How does chatbot usage correlate with user engagement?",
    ],
    dataSources: [
      {
        name: "sessions",
        description: "User sessions and visit data",
        fields: [
          "routeFirst",
          "referrer",
          "utm",
          "device",
          "country",
          "userId",
          "startedAt",
          "endedAt",
        ],
      },
      {
        name: "events",
        description: "User interaction events",
        fields: [
          "type",
          "route",
          "section",
          "element",
          "metadata",
          "userId",
          "sessionId",
          "createdAt",
        ],
      },
      {
        name: "sectionDurations",
        description: "Time spent on different sections",
        fields: ["section", "dwellMs", "sessionId", "createdAt"],
      },
      {
        name: "chatLogs",
        description: "Chatbot interactions and conversations",
        fields: [
          "role",
          "message",
          "tokens",
          "sessionId",
          "userId",
          "createdAt",
        ],
      },
      {
        name: "chatSummaries",
        description: "Summarized chatbot conversations",
        fields: ["summary", "topics", "sentiment", "sessionId", "createdAt"],
      },
    ],
  });
  const [activeTab, setActiveTab] = useState("query");
  const [selectedExample, setSelectedExample] = useState("");
  const [timeRange, setTimeRange] = useState({ start: "", end: "" });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load capabilities on mount
  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    try {
      const response = await fetch("/api/analytics/query");
      if (response.ok) {
        const data = await response.json();
        setCapabilities(data);
      }
    } catch (error) {
      console.error("Failed to load capabilities:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const requestBody: {
        query: string;
        timeRange?: { start: Date; end: Date };
      } = {
        query: query.trim(),
      };

      if (timeRange.start && timeRange.end) {
        requestBody.timeRange = {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end),
        };
      }

      const response = await fetch("/api/analytics/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to process analytics query");
      }

      const data: AnalyticsQueryResult = await response.json();
      setResult(data);

      // Add to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: query.trim(),
        result: data,
        timestamp: data.timestamp,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]); // Keep last 10

      toast.success("Analytics query processed successfully!");
    } catch (error) {
      console.error("Analytics query error:", error);
      toast.error("Failed to process analytics query. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const loadExample = (example: string) => {
    setQuery(example);
    setSelectedExample(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatTrend = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return {
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50",
          label: "Improving",
        };
      case "down":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          label: "Declining",
        };
      default:
        return {
          icon: Activity,
          color: "text-gray-600",
          bg: "bg-gray-50",
          label: "Stable",
        };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Analytics Query Assistant
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about user behavior and business metrics using Power
            BI/Google Analytics-style queries
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                New Query
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Examples
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Your Analytics Question
                  </label>
                  <Textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about user behavior, engagement trends, conversion rates..."
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={timeRange.start}
                      onChange={(e) =>
                        setTimeRange((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={timeRange.end}
                      onChange={(e) =>
                        setTimeRange((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Run Analytics Query
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              {capabilities?.examples && (
                <div className="grid gap-2">
                  <h3 className="font-medium">Try these example queries:</h3>
                  {capabilities.examples.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => loadExample(example)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{example}</span>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No query history yet. Start by asking an analytics question!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium truncate flex-1">
                              {item.query}
                            </h4>
                            <Badge variant="outline" className="ml-2">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.result.insights.substring(0, 150)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">
                              {item.result.metrics.length} metrics
                            </Badge>
                            <Badge variant="secondary">
                              {item.result.recommendations.length}{" "}
                              recommendations
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="font-medium">Analyzing your data...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Analytics Results
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.insights)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Insights */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                AI Insights
              </h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {result.insights}
                </p>
              </div>
            </div>

            <Separator />

            {/* Key Metrics */}
            {result.metrics.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Key Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {result.metrics.map((metric, index) => {
                      const trendInfo = formatTrend(metric.trend);
                      return (
                        <Card key={index} className={trendInfo.bg}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                {metric.name}
                              </span>
                              <trendInfo.icon
                                className={`h-4 w-4 ${trendInfo.color}`}
                              />
                            </div>
                            <div
                              className={`text-2xl font-bold ${trendInfo.color}`}
                            >
                              {typeof metric.value === "number" &&
                              metric.value > 1000
                                ? `${(metric.value / 1000).toFixed(1)}k`
                                : metric.value.toLocaleString()}
                            </div>
                            {metric.change !== undefined && (
                              <div
                                className={`text-sm ${
                                  metric.change >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {metric.change >= 0 ? "+" : ""}
                                {metric.change}%
                              </div>
                            )}
                            {metric.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {metric.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Dimensions */}
            {result.dimensions.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-green-600" />
                    Data Breakdown
                  </h3>
                  <div className="grid gap-4">
                    {result.dimensions.map((dimension, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {dimension.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {dimension.topValues && (
                            <div className="space-y-2">
                              {dimension.topValues
                                .slice(0, 5)
                                .map((value, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="text-sm truncate flex-1">
                                      {value.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full"
                                          style={{
                                            width: `${value.percentage}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium w-12 text-right">
                                        {value.percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Trends */}
            {result.trends.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Trends Analysis
                  </h3>
                  <div className="grid gap-3">
                    {result.trends.map((trend, index) => (
                      <Card
                        key={index}
                        className="border-l-4 border-l-orange-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                trend.direction === "increasing"
                                  ? "default"
                                  : trend.direction === "decreasing"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {trend.direction}
                            </Badge>
                            <Badge variant="outline">{trend.magnitude}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">
                            {trend.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Recommendations
                  </h3>
                  <div className="grid gap-3">
                    {result.recommendations.map((recommendation, index) => (
                      <Card
                        key={index}
                        className="border-l-4 border-l-yellow-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-yellow-600">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {recommendation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Data Quality */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                Data Quality Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Quality Score</span>
                      <span
                        className={`text-2xl font-bold ${
                          result.dataQuality.score >= 0.8
                            ? "text-green-600"
                            : result.dataQuality.score >= 0.6
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {Math.round(result.dataQuality.score * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={result.dataQuality.score * 100}
                      className="w-full"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Suggestions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.dataQuality.suggestions
                        .slice(0, 3)
                        .map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {result.dataQuality.issues.length > 0 && (
                <Card className="border-red-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-red-600 mb-2">
                      Data Quality Issues
                    </h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {result.dataQuality.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
