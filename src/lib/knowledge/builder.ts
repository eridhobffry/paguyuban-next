import { db } from "@/lib/db";
import { speakers } from "@/lib/db/schemas/speakers";
import { artists } from "@/lib/db/schemas/artists";
import { sponsors } from "@/lib/db/schemas/sponsors";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc } from "drizzle-orm";
import { deepMerge } from "@/lib/knowledge/loader";

class DynamicKnowledgeBuilder {
  async buildKnowledge() {
    const [speakersList, artistsList, sponsorsList, manualOverlay] =
      await Promise.all([
        this.getSpeakers(),
        this.getArtists(),
        this.getSponsors(),
        this.getManualOverlay(),
      ]);

    const dynamicKnowledge = {
      speakers: speakersList,
      artists: artistsList,
      sponsors: sponsorsList,
    };

    // Merge manual overlay into dynamic knowledge, preserving arrays
    const result = deepMerge(dynamicKnowledge, manualOverlay);

    // Ensure arrays are preserved if overlay didn't override them
    return {
      speakers: result.speakers || speakersList,
      artists: result.artists || artistsList,
      sponsors: result.sponsors || sponsorsList,
      overlay: manualOverlay, // Keep overlay separate for UI editing
      ...Object.fromEntries(
        Object.entries(result).filter(
          ([key]) =>
            !["speakers", "artists", "sponsors", "overlay"].includes(key)
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
