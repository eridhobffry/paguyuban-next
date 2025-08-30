import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { recordTelemetry } from "@/lib/telemetry";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: {
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}

// Synthetic probe definitions
interface SyntheticProbe {
  id: string;
  name: string;
  description: string;
  type: "health_check" | "api_test" | "database_test";
  endpoint?: string;
  method?: "GET" | "POST";
  payload?: Record<string, unknown>;
  timeoutMs: number;
  expectedStatus?: number;
  expectedResponseContains?: string;
  enabled: boolean;
}

const SYNTHETIC_PROBES: SyntheticProbe[] = [
  {
    id: "health_check",
    name: "System Health Check",
    description: "Basic health check endpoint",
    type: "health_check",
    endpoint: "/api/health",
    method: "GET",
    timeoutMs: 5000,
    expectedStatus: 200,
    enabled: true,
  },
  {
    id: "ai_respond_probe",
    name: "AI Response Probe",
    description: "Test AI response generation with synthetic query",
    type: "api_test",
    endpoint: "/api/ai/respond",
    method: "POST",
    payload: {
      query: "What is the date of Paguyuban Messe 2026?",
      language: "en",
      sessionId: "synthetic-probe-" + Date.now(),
      userId: "synthetic-user",
      intent: "event_details",
      useIntentResolution: false,
    },
    timeoutMs: 15000,
    expectedStatus: 200,
    expectedResponseContains: "August",
    enabled: true,
  },
  {
    id: "knowledge_context_probe",
    name: "Knowledge Context Probe",
    description: "Test knowledge context retrieval",
    type: "api_test",
    endpoint: "/api/ai/data/knowledge-context?topic=event&limit=1",
    method: "GET",
    timeoutMs: 5000,
    expectedStatus: 200,
    expectedResponseContains: "metadata",
    enabled: true,
  },
  {
    id: "database_probe",
    name: "Database Connectivity Probe",
    description: "Test database connectivity and basic query",
    type: "database_test",
    timeoutMs: 3000,
    enabled: true,
  },
];

async function executeProbe(probe: SyntheticProbe): Promise<{
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  details?: Record<string, unknown>;
}> {
  const startTime = Date.now();

  try {
    switch (probe.type) {
      case "health_check":
      case "api_test":
        return await executeApiProbe(probe, startTime);

      case "database_test":
        return await executeDatabaseProbe(probe, startTime);

      default:
        throw new Error(`Unknown probe type: ${probe.type}`);
    }
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function executeApiProbe(
  probe: SyntheticProbe,
  startTime: number
): Promise<{
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  details?: Record<string, unknown>;
}> {
  if (!probe.endpoint) {
    throw new Error("Endpoint required for API probe");
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = probe.endpoint.startsWith("http")
    ? probe.endpoint
    : `${baseUrl}${probe.endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), probe.timeoutMs);

  try {
    const response = await fetch(url, {
      method: probe.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SyntheticProbe/1.0",
      },
      body: probe.payload ? JSON.stringify(probe.payload) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    // Check expected status
    if (probe.expectedStatus && statusCode !== probe.expectedStatus) {
      return {
        success: false,
        responseTime,
        statusCode,
        error: `Expected status ${probe.expectedStatus}, got ${statusCode}`,
      };
    }

    // Check expected response content
    if (probe.expectedResponseContains) {
      const text = await response.text();
      if (!text.includes(probe.expectedResponseContains)) {
        return {
          success: false,
          responseTime,
          statusCode,
          error: `Response does not contain expected content: ${probe.expectedResponseContains}`,
          details: { responsePreview: text.substring(0, 200) },
        };
      }
    }

    return {
      success: true,
      responseTime,
      statusCode,
      details: { responseSize: response.headers.get("content-length") },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        responseTime,
        error: `Timeout after ${probe.timeoutMs}ms`,
      };
    }

    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function executeDatabaseProbe(
  probe: SyntheticProbe,
  startTime: number
): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
  details?: Record<string, unknown>;
}> {
  try {
    // Simple database connectivity test
    const result = await db.execute(
      `SELECT 1 as test_value, now() as current_time`
    );
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime,
      details: {
        testResult: result.rows[0],
        connectionTime: responseTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const probeId = url.searchParams.get("probeId");
  const recordResults = url.searchParams.get("record") !== "false"; // Default to true

  try {
    const probesToExecute = probeId
      ? SYNTHETIC_PROBES.filter((p) => p.id === probeId && p.enabled)
      : SYNTHETIC_PROBES.filter((p) => p.enabled);

    const results = [];

    for (const probe of probesToExecute) {
      console.log(`Executing synthetic probe: ${probe.name}`);
      const result = await executeProbe(probe);

      // Record telemetry if requested
      if (recordResults) {
        try {
          await recordTelemetry({
            endpoint: `/synthetic/${probe.id}`,
            intent: "synthetic_probe",
            queryType: "health_check",
            synthetic: true,
            success: result.success,
            responseTime: result.responseTime,
            status: result.success ? "success" : "failure",
            errorMessage: result.error,
            correlationId: `synthetic-${probe.id}-${Date.now()}`,
            model: null,
            metadata: {
              probe_type: probe.type,
              probe_name: probe.name,
              status_code: result.statusCode,
              details: result.details,
            },
          });
        } catch (telemetryError) {
          console.error(
            "Failed to record synthetic probe telemetry:",
            telemetryError
          );
        }
      }

      results.push({
        probeId: probe.id,
        probeName: probe.name,
        success: result.success,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error,
        details: result.details,
        timestamp: new Date().toISOString(),
      });
    }

    return json({
      executed: results.length,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        averageResponseTime:
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      },
      recorded: recordResults,
    });
  } catch (error) {
    console.error("Error executing synthetic probes:", error);
    return json({ error: "Failed to execute synthetic probes" }, 500);
  }
}
