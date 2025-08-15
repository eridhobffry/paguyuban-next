import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture queries executed through mocked pg Pool
let queries: any[] = [];

vi.mock("pg", () => {
  const client = {
    query: vi.fn(async (q: any, _params?: any[]) => {
      queries.push(q);
      return { rows: [], rowCount: 0 };
    }),
    release: vi.fn(() => {}),
  };
  class Pool {
    connect() {
      return client as any;
    }
  }
  return { Pool };
});

// Import after mocks
const load = async () => await import("@/lib/sql");

describe("partnership recommendations SQL helpers", () => {
  beforeEach(() => {
    queries = [];
  });

  it("ensurePartnershipApplicationRecommendationsTable creates table and indexes", async () => {
    const sql = await load();
    await sql.ensurePartnershipApplicationRecommendationsTable();
    const joined = queries.join("\n");
    expect(joined).toContain(
      "CREATE TABLE IF NOT EXISTS partnership_application_recommendations"
    );
    expect(joined).toContain(
      "CREATE INDEX IF NOT EXISTS idx_par_app_rec_app ON partnership_application_recommendations(application_id)"
    );
  });

  it("createPartnershipApplicationRecommendation inserts row", async () => {
    const sql = await load();
    const res = await sql.createPartnershipApplicationRecommendation({
      applicationId: "11111111-1111-1111-1111-111111111111",
      sentiment: "positive",
      recommendedActions: [{ title: "Call", description: "Schedule call" }],
      journey: [],
      followUps: { email_positive: "Hi" },
      nextBestAction: "Call",
      prospectSummary: "Summary",
    } as any);
    expect(queries.some((q) => String(q).includes("INSERT INTO partnership_application_recommendations"))).toBe(
      true
    );
  });
});
