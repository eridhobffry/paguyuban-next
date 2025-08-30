import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { secureFetch } from "@/lib/ai/secure-fetch";
import {
  sanitizeInput,
  redactPII,
  sanitizeOutput,
} from "@/lib/security/sanitize";
import { hasUserConsent, requiredConsentVersion } from "@/lib/security/consent";
import { parseAiTextResponse } from "@/lib/ai/response-schema";
import { withTelemetry } from "@/lib/telemetry";

const AIRespondSchema = z.object({
  query: z.string().min(1, "Query is required"),
  language: z.string().optional().default("en"),
  sessionId: z.string().uuid().optional(),
  userId: z.string().optional(),
  intent: z.string().optional(),
  context: z.record(z.string(), z.any()).optional().default({}),
  useIntentResolution: z.boolean().optional().default(true),
});

type UnknownRecord = Record<string, unknown>;
type Recommendations = Array<{
  title: string;
  description: string;
  priority: string;
}>;
interface ResponsePayload {
  response: string;
  metadata: UnknownRecord;
  context_summary: UnknownRecord;
  recommendations: Recommendations;
  [key: string]: unknown;
}

function isObject(v: unknown): v is UnknownRecord {
  return v !== null && typeof v === "object";
}

export async function POST(request: NextRequest) {
  let parsedData: z.infer<typeof AIRespondSchema> | null = null;
  const path = new URL(request.url).pathname;

  try {
    // Require consent header
    if (!hasUserConsent(request.headers)) {
      return NextResponse.json(
        {
          error: "consent_required",
          requiredVersion: requiredConsentVersion(),
          message:
            "User consent is required before using AI features. Please present the consent modal and set the x-ai-consent header.",
        },
        { status: 403 }
      );
    }

    return await withTelemetry(
      { endpoint: path, headers: request.headers, queryType: "ai" },
      async () => {
        const body = await request.json();
        const parsed = AIRespondSchema.safeParse(body);

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

        parsedData = parsed.data;
        const {
          query,
          language,
          sessionId,
          userId,
          intent: providedIntent,
          context,
          useIntentResolution,
        } = parsed.data;

        const sanitizedQuery = sanitizeInput(query);

        let finalIntent = providedIntent;
        let finalContext = context;
        let metadata: UnknownRecord = {
          agent_version: "Phase 4.0 - Smart Response",
          timestamp: new Date().toISOString(),
          language,
          session_id: sessionId,
          user_id: userId,
        };

        // Step 1: Intent Resolution (if not provided or if enabled)
        if (!providedIntent || useIntentResolution) {
          try {
            const intentResponse = await fetch(
              `${
                process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
              }/api/ai/intent/resolve`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: sanitizedQuery,
                  language,
                  sessionId,
                  userId,
                  context,
                }),
              }
            );

            if (intentResponse.ok) {
              const intentData = await intentResponse.json();
              finalIntent = intentData.intent;
              finalContext = { ...finalContext, ...intentData.context };
              metadata = { ...metadata, ...intentData.metadata };
            }
          } catch (error) {
            console.warn("Intent resolution failed, using fallback:", error);
            finalIntent = providedIntent || "general_inquiry";
          }
        }

        // Step 2: Determine AI endpoint based on intent
        const finalIntentStr = finalIntent || "general_inquiry";
        const aiEndpointPath = determineAIEndpoint(finalIntentStr);

        // Step 3: Prepare AI request payload with intelligent context selection
        const aiPayload = {
          query: redactPII(sanitizedQuery),
          language,
          session_id: sessionId,
          user_id: userId,
          intent: finalIntentStr,
          context_data: selectRelevantContext(finalContext, finalIntentStr),
        };

        // Step 4: Call AI service with enhanced payload
        const aiResponse = await secureFetch(aiEndpointPath, {
          method: "POST",
          body: aiPayload,
        });

        if (!aiResponse.ok) {
          throw new Error(
            `AI response generation failed: ${aiResponse.status}`
          );
        }

        const aiData = await aiResponse.json();
        const parsedText = parseAiTextResponse(aiData);

        // Step 5: Enhanced response with business intelligence
        const metaTimestamp =
          typeof (metadata as UnknownRecord)["timestamp"] === "string"
            ? ((metadata as UnknownRecord)["timestamp"] as string)
            : new Date().toISOString();

        const response = {
          response: sanitizeOutput(String(parsedText || "")),
          metadata: {
            ...metadata,
            ai_endpoint: aiEndpointPath,
            intent: finalIntentStr,
            confidence: aiData.metadata?.confidence || metadata.confidence,
            data_sources_used: Object.keys(finalContext),
            processing_time: Date.now() - new Date(metaTimestamp).getTime(),
            agent_architecture:
              "Phase 4.0 - Data-Driven Agent with Intent Resolution",
          },
          context_summary: createContextSummary(finalContext),
          recommendations: generateBusinessRecommendations(
            finalIntentStr,
            finalContext
          ),
        };

        // Step 6: Response optimization based on intent
        const optimizedResponse = optimizeResponseForIntent(
          response,
          finalIntentStr
        );

        return NextResponse.json(optimizedResponse, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-AI-Intent": finalIntentStr,
            "X-AI-Version": "Phase-4.0",
          },
        });
      },
      { onSuccessStatus: "success", onErrorStatus: "failure" }
    );
  } catch (error) {
    console.error("Error in AI response generation:", error);

    // Use parsed data if available, otherwise defaults
    const fallbackQuery = parsedData?.query || "";
    const fallbackLanguage = parsedData?.language || "en";

    // Intelligent fallback response based on query analysis
    const fallbackResponse = generateFallbackResponse(
      sanitizeInput(fallbackQuery),
      fallbackLanguage
    );

    return NextResponse.json(
      {
        response: fallbackResponse,
        metadata: {
          agent_version: "Phase 4.0 - Fallback Mode",
          error: true,
          timestamp: new Date().toISOString(),
          intent: "general_inquiry",
        },
        context_summary: {},
        recommendations: [],
      },
      { status: 200 } // Return 200 with fallback to maintain UX
    );
  }
}

function determineAIEndpoint(intent: string): string {
  // Smart endpoint routing based on intent
  switch (intent) {
    case "prospect_analysis":
    case "business_partnership":
    case "business_budget":
      return "/api/chat/generate"; // Use advanced chat for business queries

    case "event_details":
    case "event_timing":
    case "event_location":
    case "event_artists":
    case "event_pricing":
      return "/api/event/chat"; // Use event-specific agent

    default:
      return "/api/chat/generate"; // Default to general chat
  }
}

function selectRelevantContext(
  context: UnknownRecord,
  intent: string
): UnknownRecord {
  const relevantContext: UnknownRecord = {};

  // Intelligent context filtering based on intent
  switch (intent) {
    case "prospect_analysis": {
      const chat = isObject(context["chat-context"])
        ? (context["chat-context"] as UnknownRecord)
        : undefined;
      if (chat) {
        relevantContext["chat_logs"] = Array.isArray(chat["logs"])
          ? (chat["logs"] as unknown[])
          : [];
        relevantContext["prospect"] = chat["prospect"] ?? null;
        relevantContext["sentiment"] =
          typeof chat["sentiment"] === "string"
            ? (chat["sentiment"] as string)
            : "neutral";
      }
      const analytics = isObject(context["analytics-context"])
        ? (context["analytics-context"] as UnknownRecord)
        : undefined;
      if (analytics) {
        relevantContext["user_behavior"] = isObject(analytics["behavior"])
          ? (analytics["behavior"] as UnknownRecord)
          : {};
      }
      break;
    }

    case "event_details":
    case "event_timing":
    case "event_location":
    case "event_artists": {
      const ev = isObject(context["event-context"])
        ? (context["event-context"] as UnknownRecord)
        : undefined;
      if (ev) {
        relevantContext["artists"] = Array.isArray(ev["artists"])
          ? (ev["artists"] as unknown[])
          : [];
        relevantContext["speakers"] = Array.isArray(ev["speakers"])
          ? (ev["speakers"] as unknown[])
          : [];
      }
      break;
    }

    case "event_pricing":
    case "business_partnership": {
      const ev = isObject(context["event-context"])
        ? (context["event-context"] as UnknownRecord)
        : undefined;
      if (ev) {
        relevantContext["sponsors"] = Array.isArray(ev["sponsors"])
          ? (ev["sponsors"] as unknown[])
          : [];
        relevantContext["tiers"] = Array.isArray(ev["tiers"])
          ? (ev["tiers"] as unknown[])
          : [];
        relevantContext["availability"] = isObject(ev["availability"])
          ? (ev["availability"] as UnknownRecord)
          : {};
        relevantContext["pricing_context"] = isObject(ev["pricing_context"])
          ? (ev["pricing_context"] as UnknownRecord)
          : {};
      }
      break;
    }

    case "business_analysis":
    case "personalized_response": {
      const analytics = isObject(context["analytics-context"])
        ? (context["analytics-context"] as UnknownRecord)
        : undefined;
      if (analytics) {
        (relevantContext as UnknownRecord)["behavior"] = isObject(
          analytics["behavior"]
        )
          ? (analytics["behavior"] as UnknownRecord)
          : {};
        (relevantContext as UnknownRecord)["personalization"] = isObject(
          analytics["personalization"]
        )
          ? (analytics["personalization"] as UnknownRecord)
          : {};
      }
      break;
    }

    default: {
      // Include basic event info for general queries
      const ev = isObject(context["event-context"])
        ? (context["event-context"] as UnknownRecord)
        : undefined;
      if (ev) {
        const sponsors = Array.isArray(ev["sponsors"])
          ? (ev["sponsors"] as unknown[])
          : [];
        const tiers = Array.isArray(ev["tiers"])
          ? (ev["tiers"] as unknown[])
          : [];
        relevantContext["basic_info"] = {
          sponsors: sponsors.slice(0, 3),
          tiers: tiers.slice(0, 3),
        } as UnknownRecord;
      }
      break;
    }
  }

  return relevantContext;
}

function createContextSummary(context: UnknownRecord): UnknownRecord {
  const summary: UnknownRecord = {};

  Object.keys(context).forEach((key) => {
    const data = (context as UnknownRecord)[key];

    switch (key) {
      case "chat-context": {
        const d = isObject(data) ? (data as UnknownRecord) : {};
        (summary as UnknownRecord)["chat_summary"] = {
          total_messages: Array.isArray(d["logs"])
            ? (d["logs"] as unknown[]).length
            : 0,
          sentiment:
            typeof d["sentiment"] === "string"
              ? (d["sentiment"] as string)
              : "neutral",
          has_prospect: !!d["prospect"],
        } as UnknownRecord;
        break;
      }

      case "event-context": {
        const d = isObject(data) ? (data as UnknownRecord) : {};
        (summary as UnknownRecord)["event_summary"] = {
          sponsors_count: Array.isArray(d["sponsors"])
            ? (d["sponsors"] as unknown[]).length
            : 0,
          tiers_available: Array.isArray(d["tiers"])
            ? (d["tiers"] as unknown[]).length
            : 0,
          has_pricing_context: isObject(d["pricing_context"]),
        } as UnknownRecord;
        break;
      }

      case "analytics-context": {
        const d = isObject(data) ? (data as UnknownRecord) : {};
        (summary as UnknownRecord)["analytics_summary"] = {
          has_behavior_data: isObject(d["behavior"]),
          has_personalization: isObject(d["personalization"]),
          events_count: Array.isArray(d["events"])
            ? (d["events"] as unknown[]).length
            : 0,
        } as UnknownRecord;
        break;
      }
    }
  });

  return summary;
}

function generateBusinessRecommendations(
  intent: string,
  context: UnknownRecord
): Recommendations {
  const recommendations: Recommendations = [];

  // Intent-based business intelligence
  switch (intent) {
    case "prospect_analysis": {
      const chat = isObject(context["chat-context"])
        ? (context["chat-context"] as UnknownRecord)
        : undefined;
      if (chat && chat["sentiment"] === "positive") {
        recommendations.push({
          title: "High Conversion Potential",
          description:
            "Prospect showing positive sentiment - prioritize immediate follow-up",
          priority: "high",
        });
      }
      const logsLen =
        isObject(chat) && Array.isArray((chat as UnknownRecord)["logs"])
          ? ((chat as UnknownRecord)["logs"] as unknown[]).length
          : 0;
      if (logsLen > 5) {
        recommendations.push({
          title: "Engaged Prospect",
          description:
            "Multiple messages indicate high engagement - schedule direct call",
          priority: "high",
        });
      }
      break;
    }

    case "business_partnership": {
      const ev = isObject(context["event-context"])
        ? (context["event-context"] as UnknownRecord)
        : undefined;
      if (ev && isObject(ev["availability"])) {
        const availableTiers = Object.entries(
          ev["availability"] as Record<string, unknown>
        ).filter(([, count]) => count != null && Number(count) > 0);

        if (availableTiers.length > 0) {
          recommendations.push({
            title: "Limited Availability Alert",
            description: `${availableTiers.length} sponsorship tiers still available - create urgency`,
            priority: "medium",
          });
        }
      }
      break;
    }

    case "personalized_response": {
      const analytics = isObject(context["analytics-context"])
        ? (context["analytics-context"] as UnknownRecord)
        : undefined;
      const personalization =
        analytics && isObject(analytics["personalization"])
          ? (analytics["personalization"] as UnknownRecord)
          : undefined;
      if (personalization && personalization["engagement_pattern"] === "high") {
        recommendations.push({
          title: "High-Value User",
          description:
            "User shows high engagement pattern - offer premium support",
          priority: "medium",
        });
      }
      break;
    }
  }

  return recommendations;
}

function optimizeResponseForIntent(
  response: ResponsePayload,
  intent: string
): ResponsePayload {
  // Intent-specific response optimization
  switch (intent) {
    case "prospect_analysis":
      // Add call-to-action for prospects
      (response as UnknownRecord)["cta"] = {
        primary: "Schedule a partnership call",
        secondary: "Download sponsorship brochure",
      };
      break;

    case "event_pricing":
    case "business_partnership":
      // Add pricing urgency for business queries
      (response as UnknownRecord)["urgency"] = {
        message: "Limited sponsorship slots available for August 2026",
        deadline: "Early bird pricing ends June 1st, 2025",
      };
      break;

    case "event_details":
      // Add event highlights for event queries
      (response as UnknownRecord)["highlights"] = [
        "6,500m² Arena Berlin venue",
        "5,800+ expected participants",
        "Premium Indonesian artists lineup",
      ];
      break;
  }

  return response;
}

function generateFallbackResponse(query: string, language: string): string {
  // Intelligent fallback based on query keywords
  const queryLower = query.toLowerCase();

  if (queryLower.includes("price") || queryLower.includes("sponsor")) {
    if (language === "id") {
      return "Terima kasih atas ketertarikan Anda pada Paguyuban Messe 2026. Kami memiliki berbagai paket sponsorship mulai dari €15,000. Silakan hubungi tim kami untuk informasi lengkap.";
    } else if (language === "de") {
      return "Vielen Dank für Ihr Interesse an der Paguyuban Messe 2026. Wir haben verschiedene Sponsoring-Pakete ab €15,000. Bitte kontaktieren Sie unser Team für vollständige Informationen.";
    } else {
      return "Thank you for your interest in Paguyuban Messe 2026. We have various sponsorship packages starting from €15,000. Please contact our team for complete information.";
    }
  }

  if (
    queryLower.includes("when") ||
    queryLower.includes("date") ||
    queryLower.includes("kapan") ||
    queryLower.includes("waktu") ||
    queryLower.includes("wann")
  ) {
    if (language === "id") {
      return "Paguyuban Messe 2026 akan diadakan pada 7-8 Agustus 2026 di Arena Berlin. Kami sangat senang dapat berbagi acara budaya dan bisnis Indonesia-Jerman ini dengan Anda.";
    } else if (language === "de") {
      return "Die Paguyuban Messe 2026 findet am 7.-8. August 2026 in der Arena Berlin statt. Wir freuen uns darauf, diese deutsch-indonesische Kultur- und Geschäftsveranstaltung mit Ihnen zu teilen.";
    } else {
      return "Paguyuban Messe 2026 will be held on August 7-8, 2026 at Arena Berlin. We're excited to share this German-Indonesian cultural and business event with you.";
    }
  }

  // Default fallback
  if (language === "id") {
    return "Maaf, saya mengalami kendala teknis. Paguyuban Messe 2026 adalah acara bisnis dan budaya Indonesia-Jerman. Silakan hubungi kami di nusantaraexpoofficial@gmail.com untuk informasi lebih lanjut.";
  } else if (language === "de") {
    return "Entschuldigung, ich habe technische Schwierigkeiten. Die Paguyuban Messe 2026 ist eine deutsch-indonesische Geschäfts- und Kulturveranstaltung. Bitte kontaktieren Sie uns unter nusantaraexpoofficial@gmail.com für weitere Informationen.";
  } else {
    return "I apologize for the technical difficulty. Paguyuban Messe 2026 is a German-Indonesian business and cultural event. Please contact us at nusantaraexpoofficial@gmail.com for more information.";
  }
}
