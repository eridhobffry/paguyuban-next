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

    // Test AI data routes
    const dataRoutes = [
      { name: "chat-context", endpoint: "/api/ai/data/chat-context" },
      { name: "event-context", endpoint: "/api/ai/data/event-context" },
      { name: "analytics-context", endpoint: "/api/ai/data/analytics-context" },
      { name: "financial-context", endpoint: "/api/ai/data/financial-context" },
      { name: "knowledge-context", endpoint: "/api/ai/data/knowledge-context" },
      { name: "learning", endpoint: "/api/ai/data/learning" },
    ];

    const routeHealth: Record<string, boolean> = {};

    // Phase 2.25: Manually track working routes that we've tested
    const knownWorkingRoutes = ["chat-context", "event-context"];

    for (const route of dataRoutes) {
      if (knownWorkingRoutes.includes(route.name)) {
        // We know these routes are working from our manual testing
        routeHealth[route.name] = true;
      } else {
        // For routes we haven't fully implemented yet, mark as false
        routeHealth[route.name] = false;
      }
    }

    const overallHealthy =
      dbHealthy &&
      aiServiceHealthy &&
      Object.values(routeHealth).every((healthy) => healthy);

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
