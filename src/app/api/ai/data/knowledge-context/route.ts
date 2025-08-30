import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { knowledge, documents } from "@/lib/db/schema";
import { ilike, desc, or, sql } from "drizzle-orm";
import { withTelemetry } from "@/lib/telemetry";

const QuerySchema = z.object({
  topic: z.string().optional(),
  language: z.string().default("en"),
  limit: z.number().min(1).max(20).default(10),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const headers = request.headers;
  return withTelemetry(
    {
      endpoint,
      queryType: "data",
      intent: url.searchParams.get("topic") || undefined,
      headers,
    },
    async () => {
      try {
        const { searchParams } = url;
        const query = QuerySchema.parse({
          topic: searchParams.get("topic") || undefined,
          language: searchParams.get("language") || "en",
          limit: parseInt(searchParams.get("limit") || "10"),
        });

        const response: Record<string, unknown> = {
          metadata: {
            topic: query.topic,
            language: query.language,
            requested_limit: query.limit,
          },
        };

        // Fetch knowledge based on topic or get general knowledge
        const baseQuery = db.select().from(knowledge);
        const filtered = query.topic
          ? baseQuery.where(
              // JSONB overlay text search for topic
              sql`(${knowledge.overlay})::text ILIKE ${`%${query.topic}%`}`
            )
          : baseQuery;
        const knowledgeData = await filtered
          .orderBy(desc(knowledge.createdAt))
          .limit(query.limit);
        response.knowledge = knowledgeData;

        // Fetch relevant documents if topic specified
        if (query.topic) {
          const documentsQuery = await db
            .select()
            .from(documents)
            .where(
              or(
                ilike(documents.title, `%${query.topic}%`),
                ilike(documents.description, `%${query.topic}%`),
                ilike(documents.preview, `%${query.topic}%`)
              )
            )
            .orderBy(desc(documents.createdAt))
            .limit(5);

          response.documents = documentsQuery;
        }

        // Add language-specific knowledge adaptation
        if (query.language !== "en") {
          response.language_adaptation = {
            detected_language: query.language,
            translation_available: false, // Could be enhanced with translation service
            cultural_context: getCulturalContext(query.language),
          };
        }

        // Add topic-specific context
        if (query.topic) {
          response.topic_context = {
            primary_topic: query.topic,
            related_topics: getRelatedTopics(query.topic),
            confidence_score: calculateConfidence(knowledgeData, query.topic),
            last_updated: knowledgeData[0]?.createdAt || null,
          };
        }

        // Add static knowledge as fallback (from current system)
        if (knowledgeData.length === 0) {
          response.static_knowledge = {
            event_overview: {
              name: "Paguyuban Messe 2026 - Level-Up Indonesia",
              dates: "August 7-8, 2026",
              location: "Arena Berlin (Halle CE, Beach Club, and Club)",
              attendance: "5,800-6,800 participants",
            },
            sponsorship_tiers: [
              {
                name: "Title",
                price: "€120,000",
                benefits: ["Naming rights", "50 AI matches"],
              },
              {
                name: "Platinum",
                price: "€60,000",
                benefits: ["30 AI matches", "20 VIP passes"],
              },
              {
                name: "Gold",
                price: "€40,000",
                benefits: ["20 AI matches", "15 VIP passes"],
              },
              {
                name: "Silver",
                price: "€25,000",
                benefits: ["10 AI matches", "10 VIP passes"],
              },
              {
                name: "Bronze",
                price: "€15,000",
                benefits: ["5 AI matches", "5 VIP passes"],
              },
            ],
            artists: ["Tulus", "Dewa 19", "The Panturas", "Efek Rumah Kaca"],
          };
        }

        return NextResponse.json(response);
      } catch (error) {
        console.error("Error in knowledge-context API:", error);
        return NextResponse.json(
          { error: "Failed to fetch knowledge context" },
          { status: 500 }
        );
      }
    }
  );
}

function getCulturalContext(language: string) {
  const contexts = {
    id: {
      business_approach: "More relationship-focused, less direct",
      communication_style: "Polite and hierarchical",
      decision_making: "Consensus-based, may take longer",
      greeting_preference: "Include titles and show respect",
    },
    de: {
      business_approach: "Direct and efficient, value precision",
      communication_style: "Formal and structured",
      decision_making: "Fast and data-driven",
      greeting_preference: "Professional and straightforward",
    },
    en: {
      business_approach: "Balanced between relationship and efficiency",
      communication_style: "Professional but approachable",
      decision_making: "Data-informed with clear timelines",
      greeting_preference: "Friendly but professional",
    },
  };

  return contexts[language] || contexts["en"];
}

function getRelatedTopics(topic: string) {
  const topicMap: Record<string, string[]> = {
    event: ["dates", "location", "attendance", "schedule"],
    sponsorship: ["pricing", "tiers", "benefits", "partnerships"],
    artists: ["music", "performance", "lineup", "entertainment"],
    pricing: ["sponsorship", "costs", "investment", "roi"],
    location: ["venue", "berlin", "accessibility", "transportation"],
  };

  return topicMap[topic.toLowerCase()] || ["general"];
}

function calculateConfidence(
  knowledgeData: Array<{ overlay?: Record<string, unknown> }>,
  topic: string
) {
  if (knowledgeData.length === 0) return 0;

  const needle = topic.toLowerCase();
  let hits = 0;
  knowledgeData.forEach((item) => {
    const overlayText = JSON.stringify(item.overlay || {}).toLowerCase();
    if (overlayText.includes(needle)) {
      hits += 1;
    }
  });

  return Math.min(1, hits / knowledgeData.length);
}
