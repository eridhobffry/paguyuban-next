import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { secureFetch } from "@/lib/ai/secure-fetch";
import { sanitizeInput, redactPII } from "@/lib/security/sanitize";

const ResolveIntentSchema = z.object({
  query: z.string().min(1, "Query is required"),
  language: z.string().optional().default("en"),
  sessionId: z.string().uuid().optional(),
  userId: z.string().optional(),
  context: z.record(z.any()).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResolveIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    // Sanitize input before any processing
    const querySan = sanitizeInput(parsed.data.query);
    const { language, sessionId, userId, context } = parsed.data;
    const AI_BASE = (
      process.env.AI_SERVICE_URL ||
      process.env.AI_API_URL ||
      "http://localhost:8001"
    ).replace(/\/$/, "");

    // Advanced intent resolution using AI service
    const intentResponse = await secureFetch(
      `${AI_BASE}/api/ai/intent/analyze`,
      {
        method: "POST",
        body: JSON.stringify({
          query: redactPII(querySan),
          language,
          session_id: sessionId,
          user_id: userId,
          context,
        }),
      }
    );

    if (!intentResponse.ok) {
      throw new Error(`AI intent analysis failed: ${intentResponse.status}`);
    }

    const intentData = await intentResponse.json();
    const intent = intentData.intent || "general_inquiry";
    const confidence = intentData.confidence || 0.5;

    // Intelligent data source selection based on intent
    const dataRequirements = determineDataRequirements(
      intent,
      query,
      sessionId,
      userId
    );

    // Fetch required context data in parallel
    const contextPromises = dataRequirements.map((req) =>
      fetchContextData(req)
    );
    const contextResults = await Promise.allSettled(contextPromises);

    // Aggregate successful context data
    const aggregatedContext = contextResults.reduce((acc, result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const dataType = dataRequirements[index].type;
        acc[dataType] = result.value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Enhanced metadata for AI agent decision-making
    const metadata = {
      intent,
      confidence,
      language,
      session_id: sessionId,
      user_id: userId,
      data_sources: Object.keys(aggregatedContext),
      requirements: dataRequirements.map((req) => req.type),
      timestamp: new Date().toISOString(),
      agent_version: "Phase 4.0 - Intent Resolution",
    };

    return NextResponse.json(
      {
        intent,
        confidence,
        context: aggregatedContext,
        metadata,
        data_requirements: dataRequirements.map((req) => ({
          type: req.type,
          priority: req.priority,
          fetched: aggregatedContext.hasOwnProperty(req.type),
        })),
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error in AI intent resolution:", error);
    return NextResponse.json(
      {
        error: "Failed to resolve AI intent",
        details: error instanceof Error ? error.message : "Unknown error",
        intent: "general_inquiry",
        confidence: 0,
        context: {},
        metadata: {
          agent_version: "Phase 4.0 - Intent Resolution",
          error: true,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

interface DataRequirement {
  type: string;
  priority: "high" | "medium" | "low";
  params?: Record<string, any>;
}

function determineDataRequirements(
  intent: string,
  query: string,
  sessionId?: string,
  userId?: string
): DataRequirement[] {
  const requirements: DataRequirement[] = [];

  // Intent-based data source selection (smart AI routing)
  switch (intent) {
    case "prospect_analysis":
      if (sessionId) {
        requirements.push({
          type: "chat-context",
          priority: "high",
          params: { sessionId, intent: "prospect_analysis" },
        });
      }
      if (userId) {
        requirements.push({
          type: "analytics-context",
          priority: "medium",
          params: { userId, intent: "personalization" },
        });
      }
      break;

    case "event_details":
    case "event_timing":
    case "event_location":
    case "event_artists":
      requirements.push({
        type: "event-context",
        priority: "high",
        params: { intent: "event_details", include: "artists,speakers" },
      });
      break;

    case "event_pricing":
    case "business_partnership":
    case "business_budget":
      requirements.push({
        type: "event-context",
        priority: "high",
        params: { intent: "pricing", include: "sponsors,tiers" },
      });
      break;

    case "business_analysis":
    case "personalized_response":
      if (userId || sessionId) {
        requirements.push({
          type: "analytics-context",
          priority: "high",
          params: {
            userId,
            sessionId,
            intent: "business_analysis",
            timeRange: 30,
          },
        });
      }
      break;

    default:
      // General inquiry - fetch basic event info
      requirements.push({
        type: "event-context",
        priority: "medium",
        params: { intent: "general", include: "sponsors,tiers" },
      });
      break;
  }

  // Query-based enhancement (NLP-driven context augmentation)
  const queryLower = query.toLowerCase();

  if (
    queryLower.includes("sponsor") &&
    !requirements.some((r) => r.type === "event-context")
  ) {
    requirements.push({
      type: "event-context",
      priority: "high",
      params: { intent: "pricing", include: "sponsors,tiers" },
    });
  }

  if (
    (queryLower.includes("performance") || queryLower.includes("data")) &&
    userId
  ) {
    requirements.push({
      type: "analytics-context",
      priority: "medium",
      params: { userId, intent: "performance_analysis" },
    });
  }

  return requirements;
}

async function fetchContextData(requirement: DataRequirement): Promise<any> {
  const baseUrl = `/api/ai/data/${requirement.type.replace(
    "-context",
    "-context"
  )}`;

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }${baseUrl}?${new URLSearchParams(requirement.params || {}).toString()}`
    );

    if (response.ok) {
      return await response.json();
    } else {
      console.warn(`Failed to fetch ${requirement.type}: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.warn(`Error fetching ${requirement.type}:`, error);
    return null;
  }
}
