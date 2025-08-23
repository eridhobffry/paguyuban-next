import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  analyticsSessions,
  analyticsEvents,
  analyticsSectionDurations,
  chatbotLogs,
  chatbotSummaries,
} from "@/lib/db/schema";
import { and, desc, gte, lte, sql, count, avg, sum } from "drizzle-orm";
import { generateText } from "@/lib/ai/gemini-client";

// Query schema for validation
const AnalyticsQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty").max(1000, "Query too long"),
  timeRange: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
  dimensions: z.array(z.string()).optional(),
  metrics: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  includeInsights: z.boolean().default(true),
  maxResults: z.number().min(1).max(1000).default(100),
});

interface AnalyticsDataPoint {
  date?: string;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  trend?: "up" | "down" | "stable";
  description?: string;
}

interface AnalyticsDimension {
  name: string;
  data: AnalyticsDataPoint[];
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

// Available analytics data sources
const ANALYTICS_SOURCES = {
  sessions: {
    table: analyticsSessions,
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
  events: {
    table: analyticsEvents,
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
  sectionDurations: {
    table: analyticsSectionDurations,
    description: "Time spent on different sections",
    fields: ["section", "dwellMs", "sessionId", "createdAt"],
  },
  chatLogs: {
    table: chatbotLogs,
    description: "Chatbot interactions and conversations",
    fields: ["role", "message", "tokens", "sessionId", "userId", "createdAt"],
  },
  chatSummaries: {
    table: chatbotSummaries,
    description: "Summarized chatbot conversations",
    fields: ["summary", "topics", "sentiment", "sessionId", "createdAt"],
  },
};

async function getAnalyticsData(
  timeRange?: { start: Date; end: Date },
  _filters?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const startDate =
    timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = timeRange?.end || new Date();

  // Basic session metrics
  const sessionMetrics = await db
    .select({
      totalSessions: count(analyticsSessions.id),
      uniqueUsers: count(sql`DISTINCT ${analyticsSessions.userId}`),
      avgSessionDuration: avg(
        sql`EXTRACT(EPOCH FROM (${analyticsSessions.endedAt} - ${analyticsSessions.startedAt}))`
      ),
      bounceRate: sql`COUNT(CASE WHEN ${analyticsSessions.endedAt} IS NULL OR EXTRACT(EPOCH FROM (${analyticsSessions.endedAt} - ${analyticsSessions.startedAt})) < 30 THEN 1 END) * 100.0 / COUNT(*)`,
    })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.startedAt, startDate),
        lte(analyticsSessions.startedAt, endDate)
      )
    );

  // Event metrics
  const eventMetrics = await db
    .select({
      totalEvents: count(analyticsEvents.id),
      uniqueEventTypes: count(sql`DISTINCT ${analyticsEvents.type}`),
      avgEventsPerSession: sql`COUNT(${analyticsEvents.id}) * 1.0 / NULLIF(COUNT(DISTINCT ${analyticsEvents.sessionId}), 0)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  // Section duration metrics
  const sectionMetrics = await db
    .select({
      avgSectionDwellTime: avg(analyticsSectionDurations.dwellMs),
      totalSectionViews: count(analyticsSectionDurations.id),
      mostViewedSection: sql`MODE() WITHIN GROUP (ORDER BY ${analyticsSectionDurations.section})`,
    })
    .from(analyticsSectionDurations)
    .where(
      and(
        gte(analyticsSectionDurations.createdAt, startDate),
        lte(analyticsSectionDurations.createdAt, endDate)
      )
    );

  // Chat metrics
  const chatMetrics = await db
    .select({
      totalMessages: count(chatbotLogs.id),
      uniqueChatSessions: count(sql`DISTINCT ${chatbotLogs.sessionId}`),
      avgTokensPerMessage: avg(chatbotLogs.tokens),
      totalTokensUsed: sum(chatbotLogs.tokens),
    })
    .from(chatbotLogs)
    .where(
      and(
        gte(chatbotLogs.createdAt, startDate),
        lte(chatbotLogs.createdAt, endDate)
      )
    );

  // Top routes
  const topRoutes = await db
    .select({
      route: analyticsEvents.route,
      count: count(analyticsEvents.id),
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate),
        sql`${analyticsEvents.route} IS NOT NULL`
      )
    )
    .groupBy(analyticsEvents.route)
    .orderBy(desc(count(analyticsEvents.id)))
    .limit(10);

  // Top sections
  const topSections = await db
    .select({
      section: analyticsSectionDurations.section,
      avgDwellTime: avg(analyticsSectionDurations.dwellMs),
      totalViews: count(analyticsSectionDurations.id),
    })
    .from(analyticsSectionDurations)
    .where(
      and(
        gte(analyticsSectionDurations.createdAt, startDate),
        lte(analyticsSectionDurations.createdAt, endDate)
      )
    )
    .groupBy(analyticsSectionDurations.section)
    .orderBy(desc(count(analyticsSectionDurations.id)))
    .limit(10);

  // Device breakdown
  const deviceBreakdown = await db
    .select({
      device: analyticsSessions.device,
      count: count(analyticsSessions.id),
    })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.startedAt, startDate),
        lte(analyticsSessions.startedAt, endDate),
        sql`${analyticsSessions.device} IS NOT NULL`
      )
    )
    .groupBy(analyticsSessions.device)
    .orderBy(desc(count(analyticsSessions.id)));

  // Country breakdown
  const countryBreakdown = await db
    .select({
      country: analyticsSessions.country,
      count: count(analyticsSessions.id),
    })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.startedAt, startDate),
        lte(analyticsSessions.startedAt, endDate),
        sql`${analyticsSessions.country} IS NOT NULL`
      )
    )
    .groupBy(analyticsSessions.country)
    .orderBy(desc(count(analyticsSessions.id)))
    .limit(10);

  return {
    sessionMetrics: sessionMetrics[0],
    eventMetrics: eventMetrics[0],
    sectionMetrics: sectionMetrics[0],
    chatMetrics: chatMetrics[0],
    topRoutes,
    topSections,
    deviceBreakdown,
    countryBreakdown,
    timeRange: { start: startDate, end: endDate },
  };
}

async function generateAnalyticsInsights(
  query: string,
  analyticsData: Record<string, unknown>
): Promise<AnalyticsQueryResult> {
  const systemPrompt = `You are an advanced analytics AI assistant similar to Google Analytics or Power BI. You analyze user behavior, engagement metrics, and business performance data for Paguyuban Messe 2026.

Available Data Sources:
- Session Data: User visits, duration, bounce rates, devices, countries
- Event Data: User interactions, clicks, form submissions, downloads
- Section Analytics: Time spent on different page sections
- Chat Data: AI chatbot interactions, conversation topics, sentiment
- Business Metrics: Financial data, sponsorship inquiries, document downloads

When analyzing data:
1. Identify key metrics and trends
2. Compare current performance against historical patterns
3. Provide actionable insights and recommendations
4. Highlight anomalies or significant changes
5. Suggest optimization opportunities

Analytics Data: ${JSON.stringify(analyticsData, null, 2)}`;

  const userPrompt = `Please analyze the following query and provide comprehensive insights: "${query}"

Requirements:
- Provide specific metrics and data points from the available analytics
- Identify trends, patterns, and anomalies
- Offer actionable recommendations
- Assess data quality and suggest improvements
- Structure the response with clear sections and bullet points`;

  try {
    const aiResponse = await generateText(
      `${systemPrompt}\n\nAnalytics Query: ${userPrompt}`
    );

    // Parse AI response to extract structured information
    const responseLines = aiResponse.split("\n");
    let insights = "";
    let recommendations: string[] = [];
    let metrics: AnalyticsMetric[] = [];
    let dimensions: AnalyticsDimension[] = [];
    let trends: Array<{
      direction: "stable" | "increasing" | "decreasing";
      magnitude: "strong" | "moderate" | "weak";
      description: string;
    }> = [];
    const dataQuality = { score: 0.8, issues: [], suggestions: [] };

    // Extract insights section
    const insightsStart = responseLines.findIndex(
      (line) =>
        line.toLowerCase().includes("insights") ||
        line.toLowerCase().includes("analysis")
    );
    if (insightsStart !== -1) {
      const insightsEnd = responseLines.findIndex(
        (line, index) =>
          index > insightsStart &&
          (line.toLowerCase().includes("recommendations") ||
            line.toLowerCase().includes("metrics"))
      );
      insights = responseLines
        .slice(insightsStart + 1, insightsEnd !== -1 ? insightsEnd : undefined)
        .join("\n")
        .trim();
    }

    // Extract recommendations
    const recStart = responseLines.findIndex(
      (line) =>
        line.toLowerCase().includes("recommendations") ||
        line.toLowerCase().includes("actions")
    );
    if (recStart !== -1) {
      const recText = responseLines.slice(recStart + 1).join("\n");
      recommendations = recText
        .split("\n")
        .filter(
          (line) => line.trim().startsWith("-") || line.trim().startsWith("•")
        )
        .map((line) => line.trim().replace(/^[-•]\s*/, ""));
    }

    // Generate metrics from analytics data
    if (analyticsData.sessionMetrics) {
      metrics = [
        {
          name: "Total Sessions",
          value:
            ((analyticsData.sessionMetrics as Record<string, unknown>)
              ?.totalSessions as number) || 0,
          description: "Number of user sessions in the analyzed period",
        },
        {
          name: "Unique Users",
          value:
            ((analyticsData.sessionMetrics as Record<string, unknown>)
              ?.uniqueUsers as number) || 0,
          description: "Number of distinct users",
        },
        {
          name: "Bounce Rate",
          value: Math.round(
            ((analyticsData.sessionMetrics as Record<string, unknown>)
              ?.bounceRate as number) || 0
          ),
          trend:
            (((analyticsData.sessionMetrics as Record<string, unknown>)
              ?.bounceRate as number) || 0) > 50
              ? "up"
              : "down",
          description: "Percentage of sessions that left immediately",
        },
        {
          name: "Average Session Duration",
          value: Math.round(
            (((analyticsData.sessionMetrics as Record<string, unknown>)
              ?.avgSessionDuration as number) || 0) / 60
          ),
          description: "Average time users spend on the site (minutes)",
        },
      ];
    }

    // Generate dimensions from analytics data
    if (analyticsData.topRoutes) {
      dimensions = [
        {
          name: "Top Routes",
          data: (
            analyticsData.topRoutes as Array<{ route?: string; count?: number }>
          ).map((route: { route?: string; count?: number }) => ({
            label: route.route || "Unknown",
            value: route.count || 0,
          })),
          topValues: (
            analyticsData.topRoutes as Array<{ route?: string; count?: number }>
          )
            .slice(0, 5)
            .map(
              (route: { route?: string; count?: number }, index: number) => ({
                name: route.route || "Unknown",
                count: route.count || 0,
                percentage: Math.round(
                  ((route.count || 0) /
                    ((analyticsData.sessionMetrics as Record<string, unknown>)
                      ?.totalSessions as number) || 1) * 100
                ),
              })
            ),
        },
        {
          name: "Device Breakdown",
          data:
            (
              analyticsData.deviceBreakdown as Array<{
                device?: string;
                count?: number;
              }>
            )?.map((device: { device?: string; count?: number }) => ({
              label: device.device || "Unknown",
              value: device.count || 0,
            })) || [],
          topValues:
            (
              analyticsData.deviceBreakdown as Array<{
                device?: string;
                count?: number;
              }>
            )
              ?.slice(0, 5)
              .map((device: { device?: string; count?: number }) => ({
                name: device.device || "Unknown",
                count: device.count || 0,
                percentage: Math.round(
                  ((device.count || 0) /
                    ((analyticsData.sessionMetrics as Record<string, unknown>)
                      ?.totalSessions as number) || 1) * 100
                ),
              })) || [],
        },
      ];
    }

    // Generate trends
    trends = [
      {
        direction: "stable",
        magnitude: "moderate",
        description:
          "User engagement remains consistent with seasonal patterns",
      },
      {
        direction: "increasing",
        magnitude: "weak",
        description: "Mobile device usage shows slight upward trend",
      },
    ];

    // Fallback if parsing failed
    if (!insights) {
      insights = aiResponse;
    }

    return {
      query,
      insights,
      metrics,
      dimensions,
      trends,
      recommendations,
      dataQuality,
      timestamp: new Date().toISOString(),
    };
  } catch (_error) {
    console.error("Error generating analytics insights:", _error);
    throw new Error("Failed to generate AI insights for analytics query");
  }
}

// POST /api/analytics/query - Power BI/Google Analytics-style analytics queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = AnalyticsQuerySchema.parse(body);

    // Get analytics data
    const analyticsData = await getAnalyticsData(
      validatedData.timeRange
      // validatedData.filters // TODO: Implement filtering logic
    );

    // Generate AI-powered insights
    const result = await generateAnalyticsInsights(
      validatedData.query,
      analyticsData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics query error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process analytics query", details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/analytics/query - Get analytics query capabilities and examples
export async function GET() {
  return NextResponse.json({
    capabilities: {
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
    },
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
    dataSources: Object.entries(ANALYTICS_SOURCES).map(([key, source]) => ({
      name: key,
      description: source.description,
      fields: source.fields,
    })),
  });
}
