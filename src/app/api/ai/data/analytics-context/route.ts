import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import {
  analyticsEvents,
  userQueryPreferences,
  queryPerformance,
} from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

// Types to avoid 'any'
type EventRow = {
  id: string;
  type: string | null;
  section: string | null;
  route: string | null;
  metadata: unknown;
  created_at: string | Date;
};

type PerformanceRow = {
  id: string;
  query_type: string | null;
  response_time: number | null;
  token_count: number | null;
  success: boolean | null;
  user_rating: number | null;
  user_feedback: string | null;
  created_at: string | Date;
};

type SessionRow = {
  id: string;
  user_id: string | null;
  started_at: string | Date;
  ended_at: string | Date | null;
  route_first: string | null;
  referrer: string | null;
  device: string | null;
  country: string | null;
  engagement_score: number | null;
};

type Preferences = {
  language?: string | null;
  theme?: string | null;
  preferred_metrics?: string[] | null;
  preferred_dimensions?: string[] | null;
  auto_save_queries?: boolean | null;
  updated_at?: string | Date | null;
} | null;

interface AnalyticsContextResponse {
  metadata: {
    session_id?: string | null;
    user_id?: string | null;
    intent?: string | null;
    time_range_days: number;
  };
  preferences?: Preferences;
  events?: EventRow[];
  performance?: PerformanceRow[];
  sessions?: SessionRow[];
  behavior?: {
    average_response_time: number;
    success_rate: number;
    average_rating: number | null;
    total_queries: number;
    preferred_query_types: { type: string; count: number }[];
  };
  personalization?: {
    frequent_sections: { section: string; count: number }[];
    common_routes: { route: string; count: number }[];
    engagement_pattern: "high" | "medium" | "low";
    language_preference: string;
    theme_preference: string;
  };
}

const QuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  userId: z.string().optional(),
  intent: z.string().optional(),
  timeRange: z.number().default(7), // days
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      sessionId: searchParams.get("sessionId") || undefined,
      userId: searchParams.get("userId") || undefined,
      intent: searchParams.get("intent") || undefined,
      timeRange: parseInt(searchParams.get("timeRange") || "7"),
    });

    const response: AnalyticsContextResponse = {
      metadata: {
        session_id: query.sessionId,
        user_id: query.userId,
        intent: query.intent,
        time_range_days: query.timeRange,
      },
    };

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - query.timeRange);

    // Fetch user preferences if userId provided
    if (query.userId) {
      const preferences = await db
        .select({
          language: userQueryPreferences.language,
          theme: userQueryPreferences.theme,
          preferred_metrics: userQueryPreferences.preferredMetrics,
          preferred_dimensions: userQueryPreferences.preferredDimensions,
          auto_save_queries: userQueryPreferences.autoSaveQueries,
          updated_at: userQueryPreferences.updatedAt,
        })
        .from(userQueryPreferences)
        .where(eq(userQueryPreferences.userId, query.userId))
        .limit(1);

      response.preferences = preferences[0] || null;
    }

    // Fetch recent analytics events for the session/user
    const events: EventRow[] = await db
      .select({
        id: analyticsEvents.id,
        type: analyticsEvents.type,
        section: analyticsEvents.section,
        route: analyticsEvents.route,
        metadata: analyticsEvents.metadata,
        created_at: analyticsEvents.createdAt,
      })
      .from(analyticsEvents)
      .where(
        query.sessionId
          ? and(
              gte(analyticsEvents.createdAt, dateThreshold),
              eq(analyticsEvents.sessionId, query.sessionId)
            )
          : query.userId
          ? and(
              gte(analyticsEvents.createdAt, dateThreshold),
              eq(analyticsEvents.userId, query.userId)
            )
          : gte(analyticsEvents.createdAt, dateThreshold)
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(100);
    response.events = events;

    // Fetch query performance data for learning
    if (query.sessionId || query.userId) {
      // Optional sessions fetch is currently feature-flagged off and no-op to keep implementation minimal.
      // Set AI_INCLUDE_SESSIONS=1 in production and implement the actual fetch behind this flag.
      const includeSessions = process.env.AI_INCLUDE_SESSIONS === "1";
      if (includeSessions) {
        // intentionally no-op for now
      }

      const performanceData: PerformanceRow[] = await db
        .select({
          id: queryPerformance.id,
          query_type: queryPerformance.queryType,
          response_time: queryPerformance.responseTime,
          token_count: queryPerformance.tokenCount,
          success: queryPerformance.success,
          user_rating: queryPerformance.userRating,
          user_feedback: queryPerformance.userFeedback,
          created_at: queryPerformance.createdAt,
        })
        .from(queryPerformance)
        .where(
          query.sessionId
            ? and(
                gte(queryPerformance.createdAt, dateThreshold),
                eq(queryPerformance.sessionId, query.sessionId)
              )
            : and(
                gte(queryPerformance.createdAt, dateThreshold),
                eq(queryPerformance.userId, query.userId as string)
              )
        )
        .orderBy(desc(queryPerformance.createdAt))
        .limit(50);

      response.performance = performanceData;

      // Calculate user behavior insights
      if (performanceData.length > 0) {
        const avgResponseTime =
          performanceData.reduce((sum, p) => sum + (p.response_time || 0), 0) /
          performanceData.length;
        const successRate =
          performanceData.filter((p) => p.success).length /
          performanceData.length;
        const avgRating =
          performanceData
            .filter((p) => p.user_rating)
            .reduce((sum, p) => sum + (p.user_rating || 0), 0) /
          Math.max(1, performanceData.filter((p) => p.user_rating).length);

        response.behavior = {
          average_response_time: Math.round(avgResponseTime),
          success_rate: Math.round(successRate * 100) / 100,
          average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          total_queries: performanceData.length,
          preferred_query_types: getPreferredQueryTypes(performanceData),
        };
      }
    }

    // Add personalization insights
    if (query.intent === "personalization" && response.events.length > 0) {
      response.personalization = {
        frequent_sections: getFrequentSections(response.events),
        common_routes: getCommonRoutes(response.events),
        engagement_pattern: analyzeEngagementPattern(response.events),
        language_preference: response.preferences?.language || "en",
        theme_preference: response.preferences?.theme || "light",
      };
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Error in analytics-context API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics context",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

function getPreferredQueryTypes(performanceData: PerformanceRow[]) {
  const typeCount: Record<string, number> = {};
  performanceData.forEach((p) => {
    const type = p.query_type || "unknown";
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  return Object.entries(typeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type, count]) => ({ type, count }));
}

function getFrequentSections(events: EventRow[]) {
  const sectionCount: Record<string, number> = {};
  events.forEach((event) => {
    const section = event.section || "unknown";
    sectionCount[section] = (sectionCount[section] || 0) + 1;
  });
  return Object.entries(sectionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([section, count]) => ({ section, count }));
}

function getCommonRoutes(events: EventRow[]) {
  const routeCount: Record<string, number> = {};
  events.forEach((event) => {
    const route = event.route || "unknown";
    routeCount[route] = (routeCount[route] || 0) + 1;
  });
  return Object.entries(routeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));
}

function analyzeEngagementPattern(events: EventRow[]) {
  if (events.length === 0) return "low";

  const recentEvents = events.slice(0, 20);
  const avgTimeGap = calculateAverageTimeGap(recentEvents);

  if (avgTimeGap < 300000) return "high"; // < 5 minutes
  if (avgTimeGap < 1800000) return "medium"; // < 30 minutes
  return "low";
}

function calculateAverageTimeGap(events: EventRow[]) {
  if (events.length < 2) return Infinity;

  let totalGap = 0;
  for (let i = 1; i < events.length; i++) {
    const gap =
      new Date(events[i - 1].created_at).getTime() -
      new Date(events[i].created_at).getTime();
    totalGap += Math.abs(gap);
  }

  return totalGap / (events.length - 1);
}
