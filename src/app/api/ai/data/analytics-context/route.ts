import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import {
  analytics_events,
  user_query_preferences,
  query_performance,
} from "@/lib/db/drizzle";
import { eq, desc, and, gte } from "drizzle-orm";

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
      sessionId: searchParams.get("sessionId"),
      userId: searchParams.get("userId"),
      intent: searchParams.get("intent"),
      timeRange: parseInt(searchParams.get("timeRange") || "7"),
    });

    const response: any = {
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
          language: user_query_preferences.language,
          theme: user_query_preferences.theme,
          preferred_metrics: user_query_preferences.preferred_metrics,
          preferred_dimensions: user_query_preferences.preferred_dimensions,
          auto_save_queries: user_query_preferences.auto_save_queries,
          updated_at: user_query_preferences.updated_at,
        })
        .from(user_query_preferences)
        .where(eq(user_query_preferences.user_id, query.userId))
        .limit(1);

      response.preferences = preferences[0] || null;
    }

    // Fetch recent analytics events for the session/user
    let analyticsQuery = db
      .select({
        id: analytics_events.id,
        type: analytics_events.type,
        section: analytics_events.section,
        route: analytics_events.route,
        metadata: analytics_events.metadata,
        created_at: analytics_events.created_at,
      })
      .from(analytics_events)
      .where(gte(analytics_events.created_at, dateThreshold))
      .orderBy(desc(analytics_events.created_at))
      .limit(100);

    if (query.sessionId) {
      analyticsQuery = analyticsQuery.where(
        eq(analytics_events.session_id, query.sessionId)
      );
    } else if (query.userId) {
      analyticsQuery = analyticsQuery.where(
        eq(analytics_events.user_id, query.userId)
      );
    }

    const events = await analyticsQuery;
    response.events = events;

    // Fetch query performance data for learning
    if (query.sessionId || query.userId) {
      let performanceQuery = db
        .select({
          id: query_performance.id,
          query_type: query_performance.query_type,
          response_time: query_performance.response_time,
          token_count: query_performance.token_count,
          success: query_performance.success,
          user_rating: query_performance.user_rating,
          user_feedback: query_performance.user_feedback,
          created_at: query_performance.created_at,
        })
        .from(query_performance)
        .where(gte(query_performance.created_at, dateThreshold))
        .orderBy(desc(query_performance.created_at))
        .limit(50);

      if (query.sessionId) {
        performanceQuery = performanceQuery.where(
          eq(query_performance.session_id, query.sessionId)
        );
      } else if (query.userId) {
        performanceQuery = performanceQuery.where(
          eq(query_performance.user_id, query.userId)
        );
      }

      const performanceData = await performanceQuery;
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
            .reduce((sum, p, _, arr) => sum + (p.user_rating || 0), 0) /
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in analytics-context API:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics context" },
      { status: 500 }
    );
  }
}

function getPreferredQueryTypes(performanceData: any[]) {
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

function getFrequentSections(events: any[]) {
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

function getCommonRoutes(events: any[]) {
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

function analyzeEngagementPattern(events: any[]) {
  if (events.length === 0) return "low";

  const recentEvents = events.slice(0, 20);
  const avgTimeGap = calculateAverageTimeGap(recentEvents);

  if (avgTimeGap < 300000) return "high"; // < 5 minutes
  if (avgTimeGap < 1800000) return "medium"; // < 30 minutes
  return "low";
}

function calculateAverageTimeGap(events: any[]) {
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
