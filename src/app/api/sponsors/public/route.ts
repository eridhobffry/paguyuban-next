import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { sponsors, sponsorTiers } from "@/lib/db/schema";
import { z } from "zod";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // CI smoke mode: return empty arrays without hitting DB
    if (process.env.CI_SMOKE === "1") {
      return NextResponse.json(
        { sponsors: [], sponsorTiers: [] },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const tag = (searchParams.get("tag") || "").trim();
    const slug = (searchParams.get("slug") || "").trim();
    const tier = (searchParams.get("tier") || "").trim(); // tier slug

    // Sponsors query with optional filters
    const sponsorFilters = [
      q ? ilike(sponsors.name, `%${q}%`) : undefined,
      slug ? eq(sponsors.slug, slug) : undefined,
      tag ? sql`${sponsors.tags} @> ARRAY[${tag}]::text[]` : undefined,
    ].filter((c): c is SQL => Boolean(c));

    // Use a left join only if tier filter is provided
    const useTierJoin = Boolean(tier);

    const sponsorSelect = db
      .select({
        id: sponsors.id,
        name: sponsors.name,
        url: sponsors.url,
        logoUrl: sponsors.logoUrl,
        slug: sponsors.slug,
        tierId: sponsors.tierId,
        tags: sponsors.tags,
        sortOrder: sponsors.sortOrder,
      })
      .from(sponsors);

    const items = await (useTierJoin
      ? sponsorSelect
          .leftJoin(sponsorTiers, eq(sponsors.tierId, sponsorTiers.id))
          .where(
            and(
              ...(sponsorFilters.length ? [and(...sponsorFilters)] : []),
              eq(sponsorTiers.slug, tier)
            )
          )
          .orderBy(asc(sponsors.sortOrder), asc(sponsors.name))
      : sponsorSelect
          .where(sponsorFilters.length ? and(...sponsorFilters) : undefined)
          .orderBy(asc(sponsors.sortOrder), asc(sponsors.name)));

    // Sponsor tiers list (no filters, for UI rendering & pricing)
    const tiers = await db
      .select({
        id: sponsorTiers.id,
        name: sponsorTiers.name,
        slug: sponsorTiers.slug,
        description: sponsorTiers.description,
        price: sponsorTiers.price,
        available: sponsorTiers.available,
        sold: sponsorTiers.sold,
        color: sponsorTiers.color,
        features: sponsorTiers.features,
        sortOrder: sponsorTiers.sortOrder,
      })
      .from(sponsorTiers)
      .orderBy(asc(sponsorTiers.sortOrder), asc(sponsorTiers.name));

    // Runtime validation (defensive)
    const SponsorSchema = z.object({
      id: z.any(),
      name: z.string(),
      url: z.string().url().nullable().optional(),
      logoUrl: z.string().nullable().optional(),
      slug: z.string().nullable().optional(),
      tierId: z.any().nullable().optional(),
      tags: z.array(z.string()).nullable().optional(),
      sortOrder: z.number().nullable().optional(),
    });
    const TierSchema = z.object({
      id: z.any(),
      name: z.string(),
      slug: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      price: z.number().nullable().optional(),
      available: z.number().nullable().optional(),
      sold: z.number().nullable().optional(),
      color: z.string().nullable().optional(),
      features: z.array(z.string()).nullable().optional(),
      sortOrder: z.number().nullable().optional(),
    });

    const parsedSponsors = z.array(SponsorSchema).parse(items);
    const parsedTiers = z.array(TierSchema).parse(tiers);

    return NextResponse.json(
      { sponsors: parsedSponsors, sponsorTiers: parsedTiers },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("/api/sponsors/public GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
