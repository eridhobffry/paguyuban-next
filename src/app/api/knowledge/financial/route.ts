import { NextResponse } from "next/server";
import { dynamicKnowledgeBuilder } from "@/lib/knowledge/builder";

export async function GET() {
  try {
    const knowledge = await dynamicKnowledgeBuilder.buildKnowledge();
    const financialData = knowledge.financial;

    if (!financialData) {
      return NextResponse.json(
        { error: "No financial data available" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        financial: financialData,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: "knowledge_system",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("/api/knowledge/financial GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
