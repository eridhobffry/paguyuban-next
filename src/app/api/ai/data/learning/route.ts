import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { queryPerformance } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { withTelemetry } from "@/lib/telemetry";

const LearningSchema = z.object({
  // Accept any string; we'll validate UUID format at runtime and store null if invalid
  session_id: z.string().optional(),
  user_id: z.string().optional(),
  query: z.string(),
  intent: z.string(),
  response_quality: z.number().min(0).max(5).optional(),
  user_feedback: z.string().optional(),
  response_time: z.number().optional(),
  token_count: z.number().optional(),
  success: z.boolean().optional(),
  user_rating: z.number().min(0).max(5).optional(),
  error_message: z.string().optional(),
  data_sources_used: z.array(z.string()).optional(),
  follow_up_required: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const body = await request.json();
  const data = LearningSchema.parse(body);
  const validSessionId = isUuid(data.session_id) ? data.session_id! : null;
  return withTelemetry(
    {
      endpoint: path,
      intent: data.intent,
      queryType: "data",
      sessionId: validSessionId,
      userId: data.user_id ?? null,
      headers: request.headers,
    },
    async () => {
      // Store learning data in query_performance table
      const learningRecord = {
        sessionId: validSessionId,
        userId: data.user_id || null,
        queryType: data.intent,
        responseTime: data.response_time ?? 0,
        tokenCount: data.token_count ?? null,
        success: data.success !== false, // Default to true if not specified
        userRating: data.user_rating ?? null,
        userFeedback: data.user_feedback ?? null,
        errorMessage: data.error_message ?? null,
      };

      // Insert into database
      const result = await db
        .insert(queryPerformance)
        .values(learningRecord)
        .returning();

      // Log additional learning insights
      console.log("AI Learning Data:", {
        session_id: data.session_id,
        intent: data.intent,
        response_quality: data.response_quality,
        data_sources_used: data.data_sources_used,
        follow_up_required: data.follow_up_required,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        record_id: result[0].id,
        message: "Learning data recorded successfully",
      });
    }
  ).catch((error) => {
    console.error("Error in learning API:", error);
    return NextResponse.json(
      { error: "Failed to record learning data" },
      { status: 500 }
    );
  });
}

export async function GET(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const userId = searchParams.get("userId");
  const intent = searchParams.get("intent");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!sessionId && !userId) {
    return NextResponse.json(
      { error: "sessionId or userId required" },
      { status: 400 }
    );
  }

  return withTelemetry(
    {
      endpoint: path,
      intent: intent ?? undefined,
      queryType: "data",
      sessionId: isUuid(sessionId) ? sessionId : null,
      userId: userId ?? null,
      headers: request.headers,
    },
    async () => {
      // Fetch learning patterns for analysis
      const base = db
        .select({
          id: queryPerformance.id,
          session_id: queryPerformance.sessionId,
          user_id: queryPerformance.userId,
          query_type: queryPerformance.queryType,
          response_time: queryPerformance.responseTime,
          token_count: queryPerformance.tokenCount,
          success: queryPerformance.success,
          user_rating: queryPerformance.userRating,
          user_feedback: queryPerformance.userFeedback,
          created_at: queryPerformance.createdAt,
        })
        .from(queryPerformance);

      const conditions: SQL[] = [];
      if (isUuid(sessionId)) {
        conditions.push(eq(queryPerformance.sessionId, sessionId as string));
      } else if (userId) {
        conditions.push(eq(queryPerformance.userId, userId));
      }
      if (intent) {
        conditions.push(eq(queryPerformance.queryType, intent));
      }
      const whereExpr: SQL | undefined = conditions.length > 0 ? and(...conditions) : undefined;
      const filtered = whereExpr
        ? (base as unknown as { where: (c: SQL) => typeof base }).where(whereExpr)
        : base;

      const learningData = await (filtered as typeof base)
        .orderBy(desc(queryPerformance.createdAt))
        .limit(limit);

      // Analyze patterns
      const patterns = analyzeLearningPatterns(learningData);

      return NextResponse.json({
        patterns,
        raw_data: learningData,
        metadata: {
          session_id: sessionId,
          user_id: userId,
          intent_filter: intent,
          total_records: learningData.length,
        },
      });
    }
  ).catch((error) => {
    console.error("Error fetching learning data:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning data" },
      { status: 500 }
    );
  });
}

type LearningRow = {
  id: string;
  session_id: string | null;
  user_id: string | null;
  query_type: string | null;
  response_time: number | null;
  token_count: number | null;
  success: boolean | null;
  user_rating: number | null;
  user_feedback: string | null;
  created_at: Date | string;
};

function analyzeLearningPatterns(learningData: LearningRow[]) {
  if (learningData.length === 0) {
    return {
      success_rate: 0,
      average_response_time: 0,
      average_rating: 0,
      common_intents: [],
      improvement_suggestions: ["Collect more interaction data"],
    };
  }

  const responseTimes = learningData
    .map((r) => r.response_time)
    .filter((v): v is number => typeof v === "number");
  const ratings = learningData
    .map((r) => r.user_rating)
    .filter((v): v is number => typeof v === "number");
  const successes = learningData
    .map((r) => r.success)
    .filter((v): v is boolean => typeof v === "boolean");

  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;

  const successRate = successes.length
    ? Math.round((successes.filter((s) => s).length / successes.length) * 10000) / 100
    : 0;

  const intentCounts: Record<string, number> = {};
  for (const row of learningData) {
    const key = row.query_type || "unknown";
    intentCounts[key] = (intentCounts[key] || 0) + 1;
  }
  const commonIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const improvementSuggestions: string[] = [];
  if (avg(responseTimes) > 1500) improvementSuggestions.push("Optimize slow queries (>1.5s)");
  if (avg(ratings) < 3) improvementSuggestions.push("Investigate low user ratings");
  if (successRate < 90) improvementSuggestions.push("Reduce error rate below 10%");

  return {
    success_rate: successRate,
    average_response_time: avg(responseTimes),
    average_rating: avg(ratings),
    common_intents: commonIntents,
    improvement_suggestions: improvementSuggestions,
    data_points_analyzed: learningData.length,
  };
}

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  // RFC 4122 version-agnostic UUID (accepts v1-v5)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
