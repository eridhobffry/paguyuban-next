import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Define hoisted state and table identities
const h = vi.hoisted(() => {
  return {
    state: {
      inserts: [] as Array<{ table: any; row: any }>,
      calls: {} as Record<string, unknown[]>,
      failPrimaryInsert: false,
    },
    tables: {
      aiQueryPerformance: { __name: "ai_query_performance" } as any,
      telemetryDlq: { __name: "telemetry_dlq" } as any,
    },
  };
});

// Top-level mocks using hoisted references
vi.mock("@/lib/db/schema", () => ({
  aiQueryPerformance: h.tables.aiQueryPerformance,
  telemetryDlq: h.tables.telemetryDlq,
}));

vi.mock("@/lib/db/drizzle", () => ({
  db: {
    insert: (table: any) => ({
      values: async (row: any) => {
        if (
          table === h.tables.aiQueryPerformance &&
          h.state.failPrimaryInsert
        ) {
          throw new Error("primary_insert_failed");
        }
        h.state.inserts.push({ table, row });
      },
    }),
    execute: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
  },
}));

// Import after mocks
import * as TelemetryMod from "@/lib/telemetry";
import { aiQueryPerformance, telemetryDlq } from "@/lib/db/schema";
import { db } from "@/lib/db/drizzle";

// Access hoisted state directly

function nextTick() {
  return new Promise((r) => setTimeout(r, 0));
}

describe("telemetry core", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    // reset env to defaults for each test
    process.env = { ...OLD_ENV };
    // default: enabled + require consent
    process.env.AI_TELEMETRY_ENABLED = "true";
    process.env.AI_TELEMETRY_REQUIRE_CONSENT = "true";
    process.env.AI_CONSENT_VERSION = "vtest";
    process.env.AI_TELEMETRY_SUCCESS_RATE = "1"; // to avoid large weights

    // clear recorded inserts
    h.state.inserts.length = 0;
    h.state.failPrimaryInsert = false;
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it("getOrCreateCorrelationId returns provided header value and generates when missing", () => {
    const id = "abc-123";
    const withHeader = TelemetryMod.getOrCreateCorrelationId(
      new Headers({ "x-correlation-id": id })
    );
    expect(withHeader).toBe(id);

    const generated = TelemetryMod.getOrCreateCorrelationId();
    expect(typeof generated).toBe("string");
    expect(generated).not.toHaveLength(0);
    expect(generated).not.toBe(id);
  });

  it("withTelemetry inserts aiQueryPerformance on success when consent matches", async () => {
    const headers = new Headers({ "x-telemetry-consent": "allow" });

    const result = await TelemetryMod.withTelemetry(
      { endpoint: "/api/x", intent: "foo", headers },
      async () => 42,
      { onSuccessStatus: "success" }
    );
    expect(result).toBe(42);

    // queued via queueMicrotask -> wait a tick
    await nextTick();
    const ins = h.state.inserts.find((i) => i.table === aiQueryPerformance);
    expect(ins).toBeTruthy();
    expect((ins!.row as any).endpoint).toBe("/api/x");
    expect((ins!.row as any).status).toBe("success");
    expect((ins!.row as any).success).toBe(true);
  });

  it("withTelemetry inserts aiQueryPerformance on error with failure status", async () => {
    const headers = new Headers({ "x-telemetry-consent": "allow" });

    await expect(
      TelemetryMod.withTelemetry(
        { endpoint: "/api/y", intent: "bar", headers },
        async () => {
          throw new Error("boom");
        },
        { onErrorStatus: "failure" }
      )
    ).rejects.toThrow("boom");

    await nextTick();
    const ins = h.state.inserts.find((i) => i.table === aiQueryPerformance);
    expect(ins).toBeTruthy();
    expect((ins!.row as any).endpoint).toBe("/api/y");
    expect((ins!.row as any).status).toBe("failure");
    expect((ins!.row as any).success).toBe(false);
    expect(
      typeof (ins!.row as any).errorMessage === "string" ||
        (ins!.row as any).errorMessage === null
    ).toBe(true);
  });

  it("recordTelemetry enqueues to DLQ when primary insert fails", async () => {
    h.state.failPrimaryInsert = true;

    await TelemetryMod.recordTelemetry({
      endpoint: "/api/z",
      intent: "baz",
      queryType: "ai",
      status: "failure",
      success: false,
      responseTime: 123,
      errorMessage: "sensitive error with email test@example.com",
      model: null,
      aiEndpoint: null,
      synthetic: false,
    });

    // We expect two attempts: primary failed (no insert recorded), DLQ insert recorded
    const dlqInsert = h.state.inserts.find((i) => i.table === telemetryDlq);
    expect(dlqInsert).toBeTruthy();
    expect((dlqInsert!.row as any).attempts).toBe(1);
    expect((dlqInsert!.row as any).payload).toBeTruthy();
    // nextAttemptAt should be a future Date
    expect((dlqInsert!.row as any).nextAttemptAt instanceof Date).toBe(true);
  });
});
