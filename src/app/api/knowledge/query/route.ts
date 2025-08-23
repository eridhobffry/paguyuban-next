import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";
import { generateText } from "@/lib/ai/gemini-client";

// Query schema for validation
const KnowledgeQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty").max(1000, "Query too long"),
  context: z.string().optional(),
  maxSources: z.number().min(1).max(20).default(5),
  includeSources: z.boolean().default(true),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
});

interface SourceCitation {
  document: string;
  section: string;
  content: string;
  relevance: number;
  page?: number;
  url?: string;
}

interface KnowledgeQueryResult {
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  reasoning: string;
  suggestedFollowUp: string[];
  timestamp: string;
}

// Enhanced knowledge base with document sources
async function getKnowledgeWithSources(): Promise<{
  knowledge: Record<
    string,
    string | number | boolean | Record<string, unknown>
  >;
  sources: Record<
    string,
    { document: string; section: string; content: string; url?: string }
  >;
}> {
  const activeKnowledge = await db
    .select()
    .from(knowledge)
    .where(eq(knowledge.isActive, true))
    .orderBy(desc(knowledge.updatedAt))
    .limit(1);

  const baseKnowledge =
    activeKnowledge.length > 0
      ? (activeKnowledge[0].overlay as Record<
          string,
          string | number | boolean | Record<string, unknown>
        >)
      : {};

  // Enhanced knowledge with source tracking
  const knowledgeWithSources = {
    knowledge: {
      ...baseKnowledge,
      event: {
        ...(baseKnowledge.event as Record<string, unknown>),
        _source: "Paguyuban Messe 2026 Event Overview",
        _url: "/docs/brochure.pdf",
      },
      financials: {
        ...(baseKnowledge.financials as Record<string, unknown>),
        _source: "Financial Report 2026",
        _url: "/docs/financial-report.pdf",
      },
      sponsorship: {
        ...(baseKnowledge.sponsorship as Record<string, unknown>),
        _source: "Sponsorship Kit 2026",
        _url: "/docs/sponsor-deck.pdf",
      },
      speakers: {
        ...(baseKnowledge.speakers as Record<string, unknown>),
        _source: "Speaker Profiles",
        _url: "/speakers",
      },
      artists: {
        ...(baseKnowledge.artists as Record<string, unknown>),
        _source: "Artist Lineup",
        _url: "/artists",
      },
      documents: {
        ...(baseKnowledge.documents as Record<string, unknown>),
        _source: "Document Library",
        _url: "/documents",
      },
    },
    sources: {
      "event-overview": {
        document: "Paguyuban Messe 2026 Brochure",
        section: "Event Overview",
        content: JSON.stringify(baseKnowledge.event),
        url: "/docs/brochure.pdf",
      },
      "financial-report": {
        document: "Financial Report 2026",
        section: "Financial Analysis",
        content: JSON.stringify(baseKnowledge.financials),
        url: "/docs/financial-report.pdf",
      },
      "sponsorship-kit": {
        document: "Sponsorship Kit 2026",
        section: "Sponsorship Opportunities",
        content: JSON.stringify(baseKnowledge.sponsorship),
        url: "/docs/sponsor-deck.pdf",
      },
      "speaker-profiles": {
        document: "Speaker Profiles",
        section: "Keynote Speakers",
        content: JSON.stringify(baseKnowledge.speakers),
        url: "/speakers",
      },
      "artist-lineup": {
        document: "Artist Lineup",
        section: "Entertainment",
        content: JSON.stringify(baseKnowledge.artists),
        url: "/artists",
      },
      "document-library": {
        document: "Document Library",
        section: "Technical Documentation",
        content: JSON.stringify(baseKnowledge.documents),
        url: "/documents",
      },
    },
  };

  return knowledgeWithSources;
}

async function generateKnowledgeQuery(
  query: string,
  knowledgeData: Record<
    string,
    string | number | boolean | Record<string, unknown>
  >,
  sources: Record<
    string,
    { document: string; section: string; content: string; url?: string }
  >,
  maxSources: number
): Promise<KnowledgeQueryResult> {
  const systemPrompt = `You are an intelligent knowledge assistant for Paguyuban Messe 2026. You have access to comprehensive information about the event, including:

Event Details: Dates, location, venue, attendance
Financial Information: Revenue, costs, profit margins, sponsorship details
Sponsorship Packages: Available tiers, benefits, pricing
Speakers & Artists: Profiles, schedules, expertise
Documents: Technical specs, schedules, proposals

When answering questions:
1. Provide accurate, detailed responses based on the available knowledge
2. Cite specific sources with document names and sections
3. Include confidence levels based on how directly the knowledge supports the answer
4. Suggest relevant follow-up questions
5. Format answers in a clear, structured way

Knowledge Base: ${JSON.stringify(knowledgeData, null, 2)}

Available Sources: ${JSON.stringify(sources, null, 2)}`;

  const userPrompt = `Please answer the following question about Paguyuban Messe 2026: "${query}"

Requirements:
- Provide a comprehensive answer based on available knowledge
- Cite at least 1-3 most relevant sources with specific document names and sections
- Include confidence level (0-1) based on how well the knowledge supports the answer
- Suggest 2-3 relevant follow-up questions
- Structure the response clearly`;

  try {
    const aiResponse = await generateText(
      `${systemPrompt}\n\nUser Query: ${userPrompt}`
    );

    // Parse AI response to extract structured information
    const responseLines = aiResponse.split("\n");
    let answer = "";
    const _reasoning = "";
    let confidence = 0.8;
    let sourcesUsed: SourceCitation[] = [];
    let suggestedFollowUp: string[] = [];

    // Extract answer section
    const answerStart = responseLines.findIndex(
      (line) =>
        line.toLowerCase().includes("answer:") ||
        line.toLowerCase().includes("response:")
    );
    if (answerStart !== -1) {
      answer = responseLines
        .slice(answerStart + 1)
        .join("\n")
        .trim();
    }

    // Extract sources section
    const sourcesStart = responseLines.findIndex(
      (line) =>
        line.toLowerCase().includes("sources:") ||
        line.toLowerCase().includes("citations:")
    );
    if (sourcesStart !== -1) {
      const sourcesText = responseLines.slice(sourcesStart + 1).join("\n");
      // Parse sources from AI response
      Object.entries(sources)
        .slice(0, maxSources)
        .forEach(([_key, sourceInfo]) => {
          if (
            sourcesText
              .toLowerCase()
              .includes(sourceInfo.document.toLowerCase())
          ) {
            sourcesUsed.push({
              document: sourceInfo.document,
              section: sourceInfo.section,
              content: sourceInfo.content.substring(0, 200) + "...",
              relevance: 0.9,
              url: sourceInfo.url,
            });
          }
        });
    }

    // Extract confidence
    const confidenceMatch = aiResponse.match(/confidence:?\s*([0-9.]+)/i);
    if (confidenceMatch) {
      confidence = parseFloat(confidenceMatch[1]);
    }

    // Extract follow-up questions
    const followupStart = responseLines.findIndex(
      (line) =>
        line.toLowerCase().includes("follow") &&
        line.toLowerCase().includes("question")
    );
    if (followupStart !== -1) {
      const followupText = responseLines.slice(followupStart + 1).join("\n");
      const questions = followupText
        .split("\n")
        .filter(
          (line) => line.trim().startsWith("-") || line.trim().startsWith("•")
        )
        .map((line) => line.trim().replace(/^[-•]\s*/, ""));
      suggestedFollowUp = questions.slice(0, 3);
    }

    // Fallback if parsing failed
    if (!answer) {
      answer = aiResponse;
      sourcesUsed = Object.values(sources)
        .slice(0, maxSources)
        .map((source) => ({
          document: source.document,
          section: source.section,
          content: source.content.substring(0, 200) + "...",
          relevance: 0.7,
          url: source.url,
        }));
    }

    return {
      answer,
      sources: sourcesUsed,
      confidence,
      reasoning:
        "Answer generated based on available knowledge base with AI analysis",
      suggestedFollowUp,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating knowledge query response:", error);
    throw new Error("Failed to generate AI response for knowledge query");
  }
}

// POST /api/knowledge/query - NotebookLM-style knowledge queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = KnowledgeQuerySchema.parse(body);

    // Get knowledge with source tracking
    const { knowledge: knowledgeData, sources } =
      await getKnowledgeWithSources();

    // Generate AI-powered response
    const result = await generateKnowledgeQuery(
      validatedData.query,
      knowledgeData,
      sources,
      validatedData.maxSources
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Knowledge query error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process knowledge query", details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/knowledge/query - Get query capabilities and examples
export async function GET() {
  return NextResponse.json({
    capabilities: {
      supportedQueryTypes: [
        "event information",
        "financial data",
        "sponsorship details",
        "speaker profiles",
        "artist lineup",
        "document information",
        "venue details",
        "attendance figures",
      ],
      maxSources: 20,
      confidenceThreshold: 0.7,
      features: [
        "Source citations with document names and sections",
        "Confidence scoring",
        "Follow-up question suggestions",
        "Multi-source correlation",
        "Context-aware responses",
      ],
    },
    examples: [
      "What are the total expected attendance figures for Paguyuban Messe 2026?",
      "How much revenue is expected from sponsorship deals?",
      "What are the benefits of the title sponsor package?",
      "Who are the keynote speakers and what are their expertise areas?",
      "What is the breakdown of costs for venue and entertainment?",
    ],
  });
}
