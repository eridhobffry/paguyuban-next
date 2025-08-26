import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as test`);

    return NextResponse.json({
      status: "ok",
      message: "API and database are working",
      timestamp: new Date().toISOString(),
      database_test: result,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Phase 2.25 Data-Driven Agent Demonstration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        {
          error: "Query is required",
          example: {
            query: "I'm interested in sponsoring the event",
          },
        },
        { status: 400 }
      );
    }

    // Simulate the Data-Driven Agent Architecture
    const demoAgent = new DemoDataDrivenAgent();

    // Step 1: Analyze intent
    const intent = demoAgent.analyzeIntent(query);

    // Step 2: Decide what data to fetch
    const dataRequirements = demoAgent.decideDataNeeds(intent, query);

    // Step 3: Fetch relevant data from our API routes
    const contextData = await demoAgent.fetchContextData(dataRequirements);

    // Step 4: Generate response using real data
    const response = demoAgent.generateResponse(query, intent, contextData);

    return NextResponse.json({
      phase: "2.25 Data-Driven Agent",
      demonstration: {
        original_query: query,
        detected_intent: intent,
        data_requirements: dataRequirements,
        fetched_data: contextData,
        generated_response: response,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Demo error:", error);
    return NextResponse.json(
      {
        error: "Demo failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

class DemoDataDrivenAgent {
  analyzeIntent(query: string): string {
    const query_lower = query.toLowerCase();

    if (
      query_lower.includes("interested") ||
      query_lower.includes("sponsor") ||
      query_lower.includes("partnership")
    ) {
      return "prospect_analysis";
    }
    if (
      query_lower.includes("when") ||
      query_lower.includes("where") ||
      query_lower.includes("schedule")
    ) {
      return "event_details";
    }
    if (
      query_lower.includes("price") ||
      query_lower.includes("cost") ||
      query_lower.includes("fee")
    ) {
      return "pricing_info";
    }

    return "general_inquiry";
  }

  decideDataNeeds(intent: string, query: string) {
    const requirements = {
      intent,
      query,
      data_sources: [],
    };

    switch (intent) {
      case "prospect_analysis":
        requirements.data_sources = [
          { type: "chat_logs", purpose: "Understand conversation history" },
          { type: "prospect_data", purpose: "Get partnership details" },
        ];
        break;
      case "event_details":
        requirements.data_sources = [
          { type: "event_info", purpose: "Get schedule and location" },
          { type: "artists_speakers", purpose: "Get featured performers" },
        ];
        break;
      case "pricing_info":
        requirements.data_sources = [
          { type: "sponsor_tiers", purpose: "Get sponsorship packages" },
          { type: "ticket_prices", purpose: "Get ticket pricing" },
        ];
        break;
    }

    return requirements;
  }

  async fetchContextData(requirements: any) {
    const contextData = {};

    // Fetch real sponsor data from our API
    if (
      requirements.intent === "prospect_analysis" ||
      requirements.intent === "pricing_info"
    ) {
      try {
        const sponsorsResponse = await fetch(
          "http://localhost:3000/api/ai/data/event-context?include=sponsors",
          {
            headers: { Accept: "application/json" },
          }
        );
        if (sponsorsResponse.ok) {
          const sponsorsData = await sponsorsResponse.json();
          contextData.sponsors = sponsorsData.sponsors || [];
        }
      } catch (error) {
        console.log("Could not fetch sponsors data:", error.message);
      }
    }

    // Fetch real chat context
    try {
      const chatResponse = await fetch(
        "http://localhost:3000/api/ai/data/chat-context",
        {
          headers: { Accept: "application/json" },
        }
      );
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        contextData.chat_logs = chatData.logs || [];
        contextData.sentiment = chatData.sentiment;
      }
    } catch (error) {
      console.log("Could not fetch chat data:", error.message);
    }

    return contextData;
  }

  generateResponse(query: string, intent: string, contextData: any): string {
    switch (intent) {
      case "prospect_analysis":
        return this.generateProspectResponse(query, contextData);
      case "event_details":
        return this.generateEventResponse(query, contextData);
      case "pricing_info":
        return this.generatePricingResponse(query, contextData);
      default:
        return this.generateGeneralResponse(query, contextData);
    }
  }

  generateProspectResponse(query: string, contextData: any): string {
    const sponsors = contextData.sponsors || [];
    let response = `Based on your interest in partnership opportunities, I can see we have ${sponsors.length} current sponsors in our database. `;

    if (sponsors.length > 0) {
      response += `Our sponsors include ${sponsors
        .slice(0, 2)
        .map((s: any) => s.name)
        .join(", ")}`;
      if (sponsors.length > 2) response += ` and ${sponsors.length - 2} others`;
      response += ". ";
    }

    response +=
      "Would you like to learn about our sponsorship packages and how we can work together?";

    return response;
  }

  generateEventResponse(query: string, contextData: any): string {
    return "Our upcoming Paguyuban Messe event will be held October 24-26, 2025 in Jakarta Convention Center. This year's theme is 'Digital Innovation & Cultural Heritage' featuring local Indonesian artists, international cultural ambassadors, and business leaders from around the region.";
  }

  generatePricingResponse(query: string, contextData: any): string {
    const sponsors = contextData.sponsors || [];
    return `We offer flexible sponsorship packages starting from €10,000 for Silver level up to €60,000 for Platinum level. Currently we have ${sponsors.length} sponsors who have partnered with us. Individual tickets start at €150 for early bird pricing.`;
  }

  generateGeneralResponse(query: string, contextData: any): string {
    return "Thank you for your interest in Paguyuban Messe! I'm here to help you learn about our cultural celebration, partnership opportunities, and event details. What specific information are you looking for?";
  }
}
