import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { knowledge, documents } from "@/lib/db/drizzle";
import { eq, ilike, desc } from "drizzle-orm";

const QuerySchema = z.object({
  topic: z.string().optional(),
  language: z.string().default("en"),
  limit: z.number().min(1).max(20).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      topic: searchParams.get("topic"),
      language: searchParams.get("language") || "en",
      limit: parseInt(searchParams.get("limit") || "10"),
    });

    const response: any = {
      metadata: {
        topic: query.topic,
        language: query.language,
        requested_limit: query.limit,
      },
    };

    // Fetch knowledge based on topic or get general knowledge
    let knowledgeQuery = db
      .select()
      .from(knowledge)
      .orderBy(desc(knowledge.created_at))
      .limit(query.limit);

    if (query.topic) {
      // Try to match topic in knowledge content
      knowledgeQuery = knowledgeQuery.where(
        ilike(knowledge.content, `%${query.topic}%`)
      );
    }

    const knowledgeData = await knowledgeQuery;
    response.knowledge = knowledgeData;

    // Fetch relevant documents if topic specified
    if (query.topic) {
      const documentsQuery = await db
        .select()
        .from(documents)
        .where(ilike(documents.title, `%${query.topic}%`))
        .or(ilike(documents.content, `%${query.topic}%`))
        .orderBy(desc(documents.created_at))
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
        last_updated: knowledgeData[0]?.created_at || null,
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

function calculateConfidence(knowledgeData: any[], topic: string) {
  if (knowledgeData.length === 0) return 0;

  // Simple confidence calculation based on content relevance
  let totalConfidence = 0;
  knowledgeData.forEach((item) => {
    const content = item.content || "";
    const title = item.title || "";

    if (content.toLowerCase().includes(topic.toLowerCase())) {
      totalConfidence += 0.8;
    }
    if (title.toLowerCase().includes(topic.toLowerCase())) {
      totalConfidence += 0.2;
    }
  });

  return Math.min(1, totalConfidence / knowledgeData.length);
}
