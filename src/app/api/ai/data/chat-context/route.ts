import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import {
  chatbotLogs,
  partnership_applications,
  chatbotSummaries,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasUserConsent } from "@/lib/security/consent";
import { recordTelemetry, getOrCreateCorrelationId } from "@/lib/telemetry";
import { getCached } from "@/lib/cache";
import { extractProspectFromSummary } from "@/lib/prospect";
import type { Prospect } from "@/lib/prospect";

const QuerySchema = z.object({
  sessionId: z.string().uuid(),
  intent: z.string().nullable().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const start = Date.now();
  const path = new URL(request.url).pathname;
  const correlationId = getOrCreateCorrelationId(request.headers);
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      sessionId: searchParams.get("sessionId") || undefined,
      intent: searchParams.get("intent") || undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }
    const query = parsed.data;

    // Fetch chat logs for the session (10s cache)
    const chatLogs = await getCached(
      `chat-context:${query.sessionId}:${query.limit}`,
      10_000,
      async () =>
        db
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
          .limit(query.limit)
    );

    // Prospect data: best-effort mapping.
    // 1) Heuristic A: try mapping via userId or sessionId to partnership_applications.source
    // 2) Heuristic B: if any email appears in recent messages, look up latest partnership application by email.
    // 3) Fallback: use chatbot summaries for this session and extract prospect details from the summary text.
    let prospect: Prospect | null = null;

    try {
      type AppRow = {
        name: string | null;
        email: string | null;
        company: string | null;
        phone: string | null;
        interest: string | null;
        budget: string | null;
        created_at: Date | null;
      };

      // Heuristic A: userId/sessionId -> partnership_applications.source
      const sessionUserId = chatLogs.find((l) => l.user_id)?.user_id ?? null;
      const sourceKey = sessionUserId || query.sessionId;
      if (sourceKey) {
        const viaSource: AppRow[] = await db
          .select({
            name: partnership_applications.name,
            email: partnership_applications.email,
            company: partnership_applications.company,
            phone: partnership_applications.phone,
            interest: partnership_applications.interest,
            budget: partnership_applications.budget,
            created_at: partnership_applications.created_at,
          })
          .from(partnership_applications)
          .where(eq(partnership_applications.source, sourceKey))
          .orderBy(desc(partnership_applications.created_at))
          .limit(1);
        if (viaSource[0]) {
          prospect = {
            name: viaSource[0].name ?? null,
            email: viaSource[0].email ?? null,
            phone: viaSource[0].phone ?? null,
            company: viaSource[0].company ?? null,
            interest: viaSource[0].interest ?? null,
            budget: viaSource[0].budget ?? null,
          };
        }
      }

      // Heuristic B: email found in recent messages
      if (!prospect) {
        const combinedText = chatLogs.map((l) => l.message).join(" \n ");
        const emailMatch = combinedText.match(
          /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
        );

        if (emailMatch) {
          const appRows: AppRow[] = await db
            .select({
              name: partnership_applications.name,
              email: partnership_applications.email,
              company: partnership_applications.company,
              phone: partnership_applications.phone,
              interest: partnership_applications.interest,
              budget: partnership_applications.budget,
              created_at: partnership_applications.created_at,
            })
            .from(partnership_applications)
            .where(eq(partnership_applications.email, emailMatch[0]))
            .orderBy(desc(partnership_applications.created_at))
            .limit(1);
          if (appRows[0]) {
            prospect = {
              name: appRows[0].name ?? null,
              email: appRows[0].email ?? null,
              phone: appRows[0].phone ?? null,
              company: appRows[0].company ?? null,
              interest: appRows[0].interest ?? null,
              budget: appRows[0].budget ?? null,
            };
          }
        }
      }

      if (!prospect) {
        const summaries = await db
          .select({
            summary: chatbotSummaries.summary,
            created_at: chatbotSummaries.createdAt,
          })
          .from(chatbotSummaries)
          .where(eq(chatbotSummaries.sessionId, query.sessionId))
          .orderBy(desc(chatbotSummaries.createdAt))
          .limit(1);
        const summary = summaries[0]?.summary as string | undefined;
        if (summary) {
          prospect = extractProspectFromSummary(summary);
        }
      }
    } catch {
      // Non-fatal: keep prospect null on any error
    }

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

    const res = NextResponse.json(
      {
        logs: chatLogs.reverse(), // Reverse to chronological order
        prospect,
        sentiment,
        metadata: {
          total_logs: chatLogs.length,
          user_messages: userMessages.length,
          session_id: query.sessionId,
          intent: query.intent,
        },
      },
      { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=10" } }
    );
    if (hasUserConsent(request.headers)) {
      queueMicrotask(() =>
        recordTelemetry({
          endpoint: path,
          queryType: "data",
          intent: query.intent ?? null,
          sessionId: query.sessionId,
          status: "success",
          success: true,
          responseTime: Date.now() - start,
          correlationId,
          metadata: {
            total_logs: chatLogs.length,
            user_messages: userMessages.length,
          },
        })
      );
    }
    return res;
  } catch (error) {
    console.error("Error in chat-context API:", error);
    if (hasUserConsent(request.headers)) {
      queueMicrotask(() =>
        recordTelemetry({
          endpoint: path,
          queryType: "data",
          intent: null,
          sessionId: null,
          status: "failure",
          success: false,
          responseTime: Date.now() - start,
          correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      );
    }
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
