import { db } from "@/lib/db";
import { speakers } from "@/lib/db/schemas/speakers";
import { artists } from "@/lib/db/schemas/artists";
import { sponsors } from "@/lib/db/schemas/sponsors";
import {
  financialRevenueItems,
  financialCostItems,
} from "@/lib/db/schemas/financial";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";
import { deepMerge } from "@/lib/knowledge/loader";
import { computeTotals } from "@/lib/financial";

class DynamicKnowledgeBuilder {
  async buildKnowledge() {
    const [
      speakersList,
      artistsList,
      sponsorsList,
      financialData,
      manualOverlay,
    ] = await Promise.all([
      this.getSpeakers(),
      this.getArtists(),
      this.getSponsors(),
      this.getFinancial(),
      this.getManualOverlay(),
    ]);

    const dynamicKnowledge = {
      speakers: speakersList,
      artists: artistsList,
      sponsors: sponsorsList,
      financial: financialData,
    };

    // Merge manual overlay into dynamic knowledge, preserving arrays
    const result = deepMerge(dynamicKnowledge, manualOverlay);

    // Ensure arrays are preserved if overlay didn't override them
    return {
      speakers: result.speakers || speakersList,
      artists: result.artists || artistsList,
      sponsors: result.sponsors || sponsorsList,
      financial: result.financial || financialData,
      overlay: manualOverlay, // Keep overlay separate for UI editing
      ...Object.fromEntries(
        Object.entries(result).filter(
          ([key]) =>
            ![
              "speakers",
              "artists",
              "sponsors",
              "financial",
              "overlay",
            ].includes(key)
        )
      ),
    };
  }

  private async getSpeakers() {
    return db.select().from(speakers).orderBy(desc(speakers.createdAt));
  }

  private async getArtists() {
    return db.select().from(artists).orderBy(desc(artists.createdAt));
  }

  private async getSponsors() {
    return db.select().from(sponsors).orderBy(desc(sponsors.createdAt));
  }

  private async getFinancial() {
    const [revenues, costs] = await Promise.all([
      db
        .select()
        .from(financialRevenueItems)
        .orderBy(desc(financialRevenueItems.createdAt)),
      db
        .select()
        .from(financialCostItems)
        .orderBy(desc(financialCostItems.createdAt)),
    ]);

    const totals = computeTotals({ revenues, costs });

    return {
      revenues,
      costs,
      totals: {
        totalRevenue: totals.totalRevenue,
        totalCosts: totals.totalCosts,
        net: totals.net,
        revenueCount: revenues.length,
        costCount: costs.length,
      },
      // Group by categories for easier analysis
      revenueByCategory: revenues.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof revenues>),
      costsByCategory: costs.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof costs>),
    };
  }

  private async getManualOverlay() {
    const activeKnowledge = await db
      .select()
      .from(knowledge)
      .where(eq(knowledge.isActive, true))
      .orderBy(desc(knowledge.updatedAt))
      .limit(1);

    if (activeKnowledge.length > 0) {
      return activeKnowledge[0].overlay as Record<string, unknown>;
    }

    return {};
  }
}

export const dynamicKnowledgeBuilder = new DynamicKnowledgeBuilder();
