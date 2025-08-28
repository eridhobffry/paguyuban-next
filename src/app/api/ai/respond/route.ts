import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { secureFetch } from "@/lib/ai/secure-fetch";

const AIRespondSchema = z.object({
  query: z.string().min(1, "Query is required"),
  language: z.string().optional().default("en"),
  sessionId: z.string().uuid().optional(),
  userId: z.string().optional(),
  intent: z.string().optional(),
  context: z.record(z.any()).optional().default({}),
  useIntentResolution: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  let parsedData: any = null;

  try {
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

    let finalIntent = providedIntent;
    let finalContext = context;
    let metadata: any = {
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
              query,
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
    const aiEndpoint = determineAIEndpoint(finalIntent);

    // Step 3: Prepare AI request payload with intelligent context selection
    const aiPayload = {
      query,
      language,
      session_id: sessionId,
      user_id: userId,
      intent: finalIntent,
      context_data: selectRelevantContext(finalContext, finalIntent),
    };

    // Step 4: Call AI service with enhanced payload
    const aiResponse = await secureFetch(aiEndpoint, {
      method: "POST",
      body: aiPayload,
    });

    if (!aiResponse.ok) {
      throw new Error(`AI response generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Step 5: Enhanced response with business intelligence
    const response = {
      response: aiData.result || aiData.response,
      metadata: {
        ...metadata,
        ai_endpoint: aiEndpoint,
        intent: finalIntent,
        confidence: aiData.metadata?.confidence || metadata.confidence,
        data_sources_used: Object.keys(finalContext),
        processing_time: Date.now() - new Date(metadata.timestamp).getTime(),
        agent_architecture:
          "Phase 4.0 - Data-Driven Agent with Intent Resolution",
      },
      context_summary: createContextSummary(finalContext),
      recommendations: generateBusinessRecommendations(
        finalIntent,
        finalContext
      ),
    };

    // Step 6: Response optimization based on intent
    const optimizedResponse = optimizeResponseForIntent(response, finalIntent);

    return NextResponse.json(optimizedResponse, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-AI-Intent": finalIntent,
        "X-AI-Version": "Phase-4.0",
      },
    });
  } catch (error) {
    console.error("Error in AI response generation:", error);

    // Use parsed data if available, otherwise defaults
    const fallbackQuery = parsedData?.query || "";
    const fallbackLanguage = parsedData?.language || "en";

    // Intelligent fallback response based on query analysis
    const fallbackResponse = generateFallbackResponse(
      fallbackQuery,
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
  context: Record<string, any>,
  intent: string
): Record<string, any> {
  const relevantContext: Record<string, any> = {};

  // Intelligent context filtering based on intent
  switch (intent) {
    case "prospect_analysis":
      if (context["chat-context"]) {
        relevantContext.chat_logs = context["chat-context"].logs || [];
        relevantContext.prospect = context["chat-context"].prospect || null;
        relevantContext.sentiment =
          context["chat-context"].sentiment || "neutral";
      }
      if (context["analytics-context"]) {
        relevantContext.user_behavior =
          context["analytics-context"].behavior || {};
      }
      break;

    case "event_details":
    case "event_timing":
    case "event_location":
    case "event_artists":
      if (context["event-context"]) {
        relevantContext.artists = context["event-context"].artists || [];
        relevantContext.speakers = context["event-context"].speakers || [];
      }
      break;

    case "event_pricing":
    case "business_partnership":
      if (context["event-context"]) {
        relevantContext.sponsors = context["event-context"].sponsors || [];
        relevantContext.tiers = context["event-context"].tiers || [];
        relevantContext.availability =
          context["event-context"].availability || {};
        relevantContext.pricing_context =
          context["event-context"].pricing_context || {};
      }
      break;

    case "business_analysis":
    case "personalized_response":
      if (context["analytics-context"]) {
        relevantContext.behavior = context["analytics-context"].behavior || {};
        relevantContext.personalization =
          context["analytics-context"].personalization || {};
      }
      break;

    default:
      // Include basic event info for general queries
      if (context["event-context"]) {
        relevantContext.basic_info = {
          sponsors: context["event-context"].sponsors?.slice(0, 3) || [],
          tiers: context["event-context"].tiers?.slice(0, 3) || [],
        };
      }
      break;
  }

  return relevantContext;
}

function createContextSummary(
  context: Record<string, any>
): Record<string, any> {
  const summary: Record<string, any> = {};

  Object.keys(context).forEach((key) => {
    const data = context[key];

    switch (key) {
      case "chat-context":
        summary.chat_summary = {
          total_messages: data.logs?.length || 0,
          sentiment: data.sentiment || "neutral",
          has_prospect: !!data.prospect,
        };
        break;

      case "event-context":
        summary.event_summary = {
          sponsors_count: data.sponsors?.length || 0,
          tiers_available: data.tiers?.length || 0,
          has_pricing_context: !!data.pricing_context,
        };
        break;

      case "analytics-context":
        summary.analytics_summary = {
          has_behavior_data: !!data.behavior,
          has_personalization: !!data.personalization,
          events_count: data.events?.length || 0,
        };
        break;
    }
  });

  return summary;
}

function generateBusinessRecommendations(
  intent: string,
  context: Record<string, any>
): Array<{ title: string; description: string; priority: string }> {
  const recommendations = [];

  // Intent-based business intelligence
  switch (intent) {
    case "prospect_analysis":
      const chatContext = context["chat-context"];
      if (chatContext?.sentiment === "positive") {
        recommendations.push({
          title: "High Conversion Potential",
          description:
            "Prospect showing positive sentiment - prioritize immediate follow-up",
          priority: "high",
        });
      }
      if (chatContext?.logs?.length > 5) {
        recommendations.push({
          title: "Engaged Prospect",
          description:
            "Multiple messages indicate high engagement - schedule direct call",
          priority: "high",
        });
      }
      break;

    case "business_partnership":
      const eventContext = context["event-context"];
      if (eventContext?.availability) {
        const availableTiers = Object.entries(eventContext.availability).filter(
          ([_, count]) => count && count > 0
        );

        if (availableTiers.length > 0) {
          recommendations.push({
            title: "Limited Availability Alert",
            description: `${availableTiers.length} sponsorship tiers still available - create urgency`,
            priority: "medium",
          });
        }
      }
      break;

    case "personalized_response":
      const analyticsContext = context["analytics-context"];
      if (analyticsContext?.personalization?.engagement_pattern === "high") {
        recommendations.push({
          title: "High-Value User",
          description:
            "User shows high engagement pattern - offer premium support",
          priority: "medium",
        });
      }
      break;
  }

  return recommendations;
}

function optimizeResponseForIntent(response: any, intent: string): any {
  // Intent-specific response optimization
  switch (intent) {
    case "prospect_analysis":
      // Add call-to-action for prospects
      response.cta = {
        primary: "Schedule a partnership call",
        secondary: "Download sponsorship brochure",
      };
      break;

    case "event_pricing":
    case "business_partnership":
      // Add pricing urgency for business queries
      response.urgency = {
        message: "Limited sponsorship slots available for August 2026",
        deadline: "Early bird pricing ends June 1st, 2025",
      };
      break;

    case "event_details":
      // Add event highlights for event queries
      response.highlights = [
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
