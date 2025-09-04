import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    let dbHealthy = false;
    try {
      await db.execute("SELECT 1");
      dbHealthy = true;
    } catch (error) {
      console.error("Database health check failed:", error);
    }

    // Test AI service connection
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
    let aiServiceHealthy = false;
    try {
      const response = await fetch(`${aiServiceUrl}/health`, {
        timeout: 5000,
      });
      aiServiceHealthy = response.ok;
    } catch (error) {
      console.log("AI service health check failed:", error.message);
    }

    // Test AI data routes (ping with minimal valid params)
    const origin = new URL(request.url).origin;
    async function ping(path: string, init?: RequestInit): Promise<boolean> {
      try {
        const res = await fetch(`${origin}${path}`, {
          method: "GET",
          headers: { "Cache-Control": "no-store" },
          ...init,
        } as RequestInit);
        return res.ok;
      } catch {
        return false;
      }
    }

    const routeHealth: Record<string, boolean> = {
      // Provide a dummy UUID for validation; route should return 200 with empty arrays
      "chat-context": await ping(
        `/api/ai/data/chat-context?sessionId=00000000-0000-4000-8000-000000000000&limit=1`
      ),
      "event-context": await ping(
        `/api/ai/data/event-context?intent=general&include=sponsors,tiers`
      ),
      "analytics-context": await ping(
        `/api/ai/data/analytics-context?timeRange=1`
      ),
      "financial-context": await ping(
        `/api/ai/data/financial-context?include=revenue&intent=general`
      ),
      "knowledge-context": await ping(`/api/ai/data/knowledge-context`),
      // learning GET requires params; instead issue a POST best-effort
      // and treat 200 as healthy
      "learning": await (async () => {
        try {
          const res = await fetch(`${origin}/api/ai/data/learning`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: "00000000-0000-4000-8000-000000000000",
              query: "health",
              intent: "health_check",
              response_quality: 5,
            }),
          });
          return res.ok;
        } catch {
          return false;
        }
      })(),
    };

    const overallHealthy = dbHealthy && aiServiceHealthy && Object.values(routeHealth).every(Boolean);

    return NextResponse.json(
      {
        status: overallHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? "healthy" : "unhealthy",
          ai_service: aiServiceHealthy ? "healthy" : "unhealthy",
          data_routes: routeHealth,
        },
        environment: {
          node_env: process.env.NODE_ENV,
          ai_service_url: aiServiceUrl,
          database_url: process.env.DATABASE_URL ? "configured" : "missing",
        },
        version: "2.25.0",
      },
      {
        status: overallHealthy ? 200 : 503,
      }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
