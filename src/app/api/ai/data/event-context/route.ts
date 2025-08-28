import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/drizzle";
import { sponsors, sponsorTiers, artists, speakers } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getCached } from "@/lib/cache";

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
      : ["sponsors", "tiers"];

    const response: any = {
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
      response.sponsors = sponsorsData;
    }

    // Fetch sponsor tiers if requested
    if (includeItems.includes("tiers")) {
      // Note: sponsor_tiers table may need to be created or mapped
      // For now, return static tier information
      response.tiers = [
        {
          name: "Title",
          price: "€120,000",
          benefits: ["Naming rights", "50 AI matches"],
        },
        {
          name: "Platinum",
          price: "€60,000",
          benefits: ["30 AI matches", "20 VIP passes"],
        },
        {
          name: "Gold",
          price: "€40,000",
          benefits: ["20 AI matches", "15 VIP passes"],
        },
        {
          name: "Silver",
          price: "€25,000",
          benefits: ["10 AI matches", "10 VIP passes"],
        },
        {
          name: "Bronze",
          price: "€15,000",
          benefits: ["5 AI matches", "5 VIP passes"],
        },
      ];

      response.availability = {
        title: "Available",
        platinum: "2 remaining",
        gold: "Available",
        silver: "Available",
        bronze: "Available",
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
