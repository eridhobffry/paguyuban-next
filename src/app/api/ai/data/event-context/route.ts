import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { sponsors, sponsorTiers, sponsorLogos, artists, speakers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { getCached } from "@/lib/cache";
import type { PublicSponsorDto, PublicSponsorTierDto } from "@/types/people";

interface EventContextResponse {
  metadata: {
    intent?: string | null;
    requested_data: string[];
  };
  sponsors?: PublicSponsorDto[];
  tiers?: (PublicSponsorTierDto & { remaining: number })[];
  availability?: {
    title: number | string | null;
    platinum: number | string | null;
    gold: number | string | null;
    silver: number | string | null;
    bronze: number | string | null;
  };
  artists?: unknown[];
  speakers?: unknown[];
  sponsor_logos?: Array<{
    id: string;
    sponsorId: string;
    label?: string;
    url: string;
    width?: number;
    height?: number;
    sortOrder?: number;
  }>;
  pricing_context?: {
    total_revenue_target: string;
    current_sponsors_count: number;
    average_tier_price: string;
    sponsorship_percentage: string;
    break_even_achieved: boolean;
  };
}

const QuerySchema = z.object({
  intent: z.string().nullable().optional(),
  include: z.string().nullable().optional(), // comma-separated list: sponsors,tiers,artists,speakers
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      intent: searchParams.get("intent") || undefined,
      include: searchParams.get("include") || undefined,
    });

    const includeItems = query.include
      ? query.include.split(",").map((s) => s.trim())
      : ["sponsors", "tiers"]; // default unchanged

    const response: EventContextResponse = {
      metadata: {
        intent: query.intent,
        requested_data: includeItems,
      },
    };

    // Fetch sponsors if requested
    if (includeItems.includes("sponsors")) {
      const sponsorsData = await getCached(
        `event-context:sponsors`,
        5 * 60_000, // 5m cache for sponsors list
        async () =>
          db
            .select({
              id: sponsors.id,
              name: sponsors.name,
              logoUrl: sponsors.logoUrl,
              url: sponsors.url,
              tags: sponsors.tags,
              sortOrder: sponsors.sortOrder,
              updatedAt: sponsors.updatedAt,
            })
            .from(sponsors)
            .orderBy(asc(sponsors.sortOrder))
            .limit(50)
      );
      // Normalize nulls to undefined to satisfy PublicSponsorDto optional props
      response.sponsors = sponsorsData.map((s) => ({
        id: s.id,
        name: s.name,
        url: (s as { url: string | null }).url ?? undefined,
        logoUrl: (s as { logoUrl: string | null }).logoUrl ?? undefined,
        tags: (s as { tags: string[] | null }).tags ?? undefined,
        sortOrder: (s as { sortOrder: number | null }).sortOrder ?? undefined,
      }));
    }

    // Fetch sponsor logos if requested (DB-backed, 5m cache)
    if (includeItems.includes("sponsor_logos")) {
      const logosRaw = await getCached(
        `event-context:sponsor-logos`,
        5 * 60_000,
        async () =>
          db
            .select({
              id: sponsorLogos.id,
              sponsorId: sponsorLogos.sponsorId,
              label: sponsorLogos.label,
              url: sponsorLogos.url,
              width: sponsorLogos.width,
              height: sponsorLogos.height,
              sortOrder: sponsorLogos.sortOrder,
            })
            .from(sponsorLogos)
            .orderBy(asc(sponsorLogos.sortOrder))
            .limit(200)
      );

      response.sponsor_logos = (logosRaw as Array<{
        id: string;
        sponsorId: string;
        label: string | null;
        url: string;
        width: number | null;
        height: number | null;
        sortOrder: number | null;
      }>).map((l) => ({
        id: l.id,
        sponsorId: l.sponsorId,
        label: l.label ?? undefined,
        url: l.url,
        width: l.width ?? undefined,
        height: l.height ?? undefined,
        sortOrder: l.sortOrder ?? undefined,
      }));
    }

    // Fetch sponsor tiers if requested (DB-backed, 5m cache)
    if (includeItems.includes("tiers")) {
      const tiersRaw = (await getCached(
        `event-context:tiers`,
        5 * 60_000,
        async () =>
          db
            .select({
              id: sponsorTiers.id,
              name: sponsorTiers.name,
              slug: sponsorTiers.slug,
              description: sponsorTiers.description,
              price: sponsorTiers.price,
              available: sponsorTiers.available,
              sold: sponsorTiers.sold,
              features: sponsorTiers.features,
              sortOrder: sponsorTiers.sortOrder,
              updatedAt: sponsorTiers.updatedAt,
            })
            .from(sponsorTiers)
            .orderBy(asc(sponsorTiers.sortOrder))
            .limit(50)
      )) as Array<{
        id: string;
        name: string;
        slug: string | null;
        description: string | null;
        price: number | null;
        available: number | null;
        sold: number | null;
        features: unknown;
        sortOrder: number | null;
        updatedAt: Date | null;
      }>;

      const tiersData = tiersRaw.map<PublicSponsorTierDto>((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug ?? undefined,
        description: t.description ?? undefined,
        price: t.price ?? undefined,
        available: t.available ?? undefined,
        sold: t.sold ?? undefined,
        features: Array.isArray(t.features)
          ? (t.features as string[])
          : undefined,
        sortOrder: t.sortOrder ?? undefined,
      }));

      response.tiers = tiersData.map((t) => ({
        ...t,
        remaining: Math.max(0, (t.available ?? 0) - (t.sold ?? 0)),
      }));

      // Simple availability summary by common tier names if present
      const byName = Object.fromEntries(
        tiersData.map((t) => [
          (t.name || "").toLowerCase(),
          Math.max(0, (t.available ?? 0) - (t.sold ?? 0)),
        ])
      );
      response.availability = {
        title: byName["title"] ?? null,
        platinum: byName["platinum"] ?? null,
        gold: byName["gold"] ?? null,
        silver: byName["silver"] ?? null,
        bronze: byName["bronze"] ?? null,
      };
    }

    // Fetch artists if requested
    if (includeItems.includes("artists")) {
      const artistsData = await db.select().from(artists).limit(20);

      response.artists = artistsData;
    }

    // Fetch speakers if requested
    if (includeItems.includes("speakers")) {
      const speakersData = await db.select().from(speakers).limit(20);

      response.speakers = speakersData;
    }

    // Add pricing context for business discussions
    if (query.intent === "pricing" || query.intent === "business_analysis") {
      response.pricing_context = {
        total_revenue_target: "€1,018,660",
        current_sponsors_count: response.sponsors?.length || 0,
        average_tier_price: "€52,000",
        sponsorship_percentage: "77.6%",
        break_even_achieved: true,
      };
    }

    // Short cache for whole response (60s)
    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Error in event-context API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch event context",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
