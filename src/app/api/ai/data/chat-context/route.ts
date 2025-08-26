import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { chatbotLogs, partnership_applications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

const QuerySchema = z.object({
  sessionId: z.string().uuid().nullable().optional(),
  intent: z.string().nullable().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      sessionId: searchParams.get("sessionId") || undefined,
      intent: searchParams.get("intent") || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
    });

    // Fetch chat logs for the session
    const chatLogs = await db
      .select({
        id: chatbotLogs.id,
        session_id: chatbotLogs.sessionId,
        role: chatbotLogs.role,
        message: chatbotLogs.message,
        user_id: chatbotLogs.userId,
        tokens: chatbotLogs.tokens,
        created_at: chatbotLogs.createdAt,
      })
      .from(chatbotLogs)
      .where(eq(chatbotLogs.sessionId, query.sessionId))
      .orderBy(desc(chatbotLogs.createdAt))
      .limit(query.limit);

    // For now, prospect data will be null since partnership_applications
    // doesn't have a direct session_id relationship
    // This can be enhanced later when we have proper session tracking
    const prospectData = null;

    // Simple sentiment analysis from recent messages
    const recentMessages = chatLogs.slice(0, 10);
    const userMessages = recentMessages.filter((log) => log.role === "user");
    const messageText = userMessages
      .map((log) => log.message)
      .join(" ")
      .toLowerCase();

    let sentiment = "neutral";
    const positiveWords = [
      "interested",
      "good",
      "great",
      "excellent",
      "yes",
      "perfect",
      "love",
      "like",
      "excited",
    ];
    const negativeWords = [
      "expensive",
      "too much",
      "not sure",
      "maybe later",
      "no",
      "worried",
      "concerns",
      "disappointed",
    ];

    const positiveCount = positiveWords.reduce(
      (count, word) => count + (messageText.includes(word) ? 1 : 0),
      0
    );
    const negativeCount = negativeWords.reduce(
      (count, word) => count + (messageText.includes(word) ? 1 : 0),
      0
    );

    if (positiveCount > negativeCount) sentiment = "positive";
    else if (negativeCount > positiveCount) sentiment = "negative";

    return NextResponse.json({
      logs: chatLogs.reverse(), // Reverse to chronological order
      prospect: prospectData && prospectData[0] ? prospectData[0] : null,
      sentiment,
      metadata: {
        total_logs: chatLogs.length,
        user_messages: userMessages.length,
        session_id: query.sessionId,
        intent: query.intent,
      },
    });
  } catch (error) {
    console.error("Error in chat-context API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chat context",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
