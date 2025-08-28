import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/ai/data/event-context/route";

// Hoisted state for DB rows and shared schema to avoid hoisting issues
const hoisted = vi.hoisted(() => {
  const getCachedMock = vi.fn((key: string, _ttl: number, provider: () => any) => provider());
  const state = {
    sponsorsRows: [] as any[],
    tiersRows: [] as any[],
    artistsRows: [] as any[],
    speakersRows: [] as any[],
  };
  const makeChain = (rowsProvider: () => any[]) => ({
    orderBy: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(async () => rowsProvider()),
  });
  const schema = {
    sponsors: {
      id: "id",
      name: "name",
      logoUrl: "logo_url",
      url: "url",
      tags: "tags",
      sortOrder: "sort_order",
      updatedAt: "updated_at",
    },
    sponsorTiers: {
      id: "id",
      name: "name",
      slug: "slug",
      description: "description",
      price: "price",
      available: "available",
      sold: "sold",
      features: "features",
      sortOrder: "sort_order",
      updatedAt: "updated_at",
    },
    artists: { id: "id" },
    speakers: { id: "id" },
  } as const;
  return { getCachedMock, state, makeChain, schema };
});

// Cache mock using hoisted reference to avoid hoisting error
vi.mock("@/lib/cache", () => ({ getCached: (hoisted as any).getCachedMock }));

// Schema mock uses hoisted.schema so identity is shared with drizzle mock
vi.mock("@/lib/db/schema", () => (hoisted as any).schema);

// Drizzle DB mock built inside factory; uses mocked schema identity
vi.mock("@/lib/db/drizzle", () => {
  const { state, makeChain, schema } = hoisted as unknown as {
    state: {
      sponsorsRows: any[];
      tiersRows: any[];
      artistsRows: any[];
      speakersRows: any[];
    };
    makeChain: (rowsProvider: () => any[]) => any;
    schema: any;
  };
  const db = {
    select: vi.fn((_fields?: any) => ({
      from: vi.fn((table: any) => {
        if (table === schema.sponsors) return makeChain(() => state.sponsorsRows);
        if (table === schema.sponsorTiers) return makeChain(() => state.tiersRows);
        if (table === schema.artists) return makeChain(() => state.artistsRows);
        if (table === schema.speakers) return makeChain(() => state.speakersRows);
        return makeChain(() => []);
      }),
    })),
  };
  return { db };
});

describe("API: /api/ai/data/event-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset hoisted state arrays and repopulate
    hoisted.state.sponsorsRows.length = 0;
    hoisted.state.sponsorsRows.push(
      {
        id: "s1",
        name: "Acme Corp",
        logoUrl: null,
        url: null,
        tags: null,
        sortOrder: 1,
        updatedAt: new Date(),
      }
    );
    hoisted.state.tiersRows.length = 0;
    hoisted.state.tiersRows.push(
      {
        id: "t1",
        name: "Gold",
        slug: "gold",
        description: "Gold tier",
        price: 50000,
        available: 10,
        sold: 7,
        features: ["Logo", "Booth"],
        sortOrder: 1,
        updatedAt: new Date(),
      },
      {
        id: "t2",
        name: "Silver",
        slug: "silver",
        description: null,
        price: null,
        available: 5,
        sold: null,
        features: null,
        sortOrder: 2,
        updatedAt: new Date(),
      }
    );
    hoisted.state.artistsRows.length = 0;
    hoisted.state.artistsRows.push({ id: "a1" });
    hoisted.state.speakersRows.length = 0;
    hoisted.state.speakersRows.push({ id: "p1" });
  });

  it("returns sponsors and tiers by default and computes remaining/availability", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/data/event-context");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(
      "s-maxage=60, stale-while-revalidate=30"
    );

    expect(data.metadata.requested_data).toEqual(["sponsors", "tiers"]);

    // Sponsors mapped with nulls normalized (undefined gets dropped in JSON)
    expect(Array.isArray(data.sponsors)).toBe(true);
    expect(data.sponsors.length).toBe(1);
    expect(data.sponsors[0]).toMatchObject({ id: "s1", name: "Acme Corp" });
    expect("url" in data.sponsors[0]).toBe(false);

    // Tiers include remaining and features mapped only when array
    const gold = data.tiers.find((t: any) => t.name === "Gold");
    expect(gold.remaining).toBe(3); // 10 - 7
    const silver = data.tiers.find((t: any) => t.name === "Silver");
    expect(silver.remaining).toBe(5); // 5 - 0

    // Availability summary
    expect(data.availability.gold).toBe(3);
    expect(data.availability.silver).toBe(5);

    // Cached providers called
    const calls = (hoisted as any).getCachedMock.mock.calls.map((c: any[]) => ({ key: c[0], ttl: c[1] }));
    expect(calls).toEqual(
      expect.arrayContaining([
        { key: "event-context:sponsors", ttl: 5 * 60_000 },
        { key: "event-context:tiers", ttl: 5 * 60_000 },
      ])
    );
  });

  it("returns artists and speakers when requested via include", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/event-context?include=artists,speakers"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.requested_data).toEqual(["artists", "speakers"]);
    expect(Array.isArray(data.artists)).toBe(true);
    expect(Array.isArray(data.speakers)).toBe(true);
    expect(data.artists.length).toBe(1);
    expect(data.speakers.length).toBe(1);
  });

  it("adds pricing_context when intent=pricing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/ai/data/event-context?intent=pricing&include=sponsors"
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.pricing_context).toBeTruthy();
    expect(data.pricing_context.current_sponsors_count).toBe(1);
  });
});
