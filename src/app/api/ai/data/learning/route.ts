import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { query_performance } from "@/lib/db/drizzle";

const LearningSchema = z.object({
  session_id: z.string().uuid().optional(),
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
  try {
    const body = await request.json();
    const data = LearningSchema.parse(body);

    // Store learning data in query_performance table
    const learningRecord = {
      session_id: data.session_id || null,
      user_id: data.user_id || null,
      query_type: data.intent,
      response_time: data.response_time || null,
      token_count: data.token_count || null,
      success: data.success !== false, // Default to true if not specified
      user_rating: data.user_rating || null,
      user_feedback: data.user_feedback || null,
      error_message: data.error_message || null,
    };

    // Insert into database
    const result = await db
      .insert(query_performance)
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
  } catch (error) {
    console.error("Error in learning API:", error);
    return NextResponse.json(
      { error: "Failed to record learning data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Fetch learning patterns for analysis
    let query = db
      .select({
        id: query_performance.id,
        session_id: query_performance.session_id,
        user_id: query_performance.user_id,
        query_type: query_performance.query_type,
        response_time: query_performance.response_time,
        token_count: query_performance.token_count,
        success: query_performance.success,
        user_rating: query_performance.user_rating,
        user_feedback: query_performance.user_feedback,
        created_at: query_performance.created_at,
      })
      .from(query_performance)
      .orderBy(desc(query_performance.created_at))
      .limit(limit);

    if (sessionId) {
      query = query.where(eq(query_performance.session_id, sessionId));
    } else if (userId) {
      query = query.where(eq(query_performance.user_id, userId));
    }

    if (intent) {
      query = query.where(eq(query_performance.query_type, intent));
    }

    const learningData = await query;

    // Analyze patterns
    const patterns = analyzeLearningPatterns(learningData, intent);

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
  } catch (error) {
    console.error("Error fetching learning data:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning data" },
      { status: 500 }
    );
  }
}

function analyzeLearningPatterns(learningData: any[], intentFilter?: string) {
  if (learningData.length === 0) {
    return {
      success_rate: 0,
      average_response_time: 0,
      average_rating: 0,
      common_intents: [],
      improvement_suggestions: ["Collect more interaction data"],
    };
  }

  // Calculate success rate
  const successfulQueries = learningData.filter((item) => item.success);
  const successRate = successfulQueries.length / learningData.length;

  // Calculate average response time
  const responseTimes = learningData
    .filter((item) => item.response_time)
    .map((item) => item.response_time);
  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  // Calculate average rating
  const ratings = learningData
    .filter((item) => item.user_rating)
    .map((item) => item.user_rating);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

  // Analyze common intents
  const intentCount: Record<string, number> = {};
  learningData.forEach((item) => {
    const intent = item.query_type || "unknown";
    intentCount[intent] = (intentCount[intent] || 0) + 1;
  });

  const commonIntents = Object.entries(intentCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([intent, count]) => ({ intent, count }));

  // Generate improvement suggestions
  const suggestions = [];
  if (successRate < 0.8) {
    suggestions.push("Improve response accuracy for better success rates");
  }
  if (averageResponseTime > 3000) {
    suggestions.push("Optimize response times for better user experience");
  }
  if (averageRating < 3.5) {
    suggestions.push("Analyze user feedback to improve response quality");
  }
  if (suggestions.length === 0) {
    suggestions.push("Continue monitoring and maintaining current performance");
  }

  return {
    success_rate: Math.round(successRate * 100) / 100,
    average_response_time: Math.round(averageResponseTime),
    average_rating: averageRating ? Math.round(averageRating * 10) / 10 : 0,
    common_intents: commonIntents,
    improvement_suggestions: suggestions,
    data_points_analyzed: learningData.length,
  };
}
