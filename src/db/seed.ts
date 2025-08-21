import "dotenv/config";
import { db, pool } from "../lib/db/drizzle";
import { sponsorTiers, sponsors } from "../lib/db/schemas/sponsors";
import { eq } from "drizzle-orm";

async function upsertTier(input: {
  name: string;
  slug: string;
  description?: string | null;
  price?: number | null;
  available?: number | null;
  sold?: number | null;
  color?: string | null;
  features?: unknown;
  sortOrder?: number | null;
}) {
  const existing = await db
    .select()
    .from(sponsorTiers)
    .where(eq(sponsorTiers.slug, input.slug))
    .limit(1);

  if (existing.length > 0) {
    const id = existing[0].id!;
    await db
      .update(sponsorTiers)
      .set({
        name: input.name,
        description: input.description ?? null,
        price: input.price ?? null,
        available: input.available ?? null,
        sold: input.sold ?? null,
        color: input.color ?? null,
        features: input.features ?? null,
        sortOrder: input.sortOrder ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sponsorTiers.id, id));
    return id;
  }

  const inserted = await db
    .insert(sponsorTiers)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      price: input.price ?? null,
      available: input.available ?? null,
      sold: input.sold ?? null,
      color: input.color ?? null,
      features: input.features ?? null,
      sortOrder: input.sortOrder ?? null,
    })
    .returning();
  return inserted[0].id!;
}

async function upsertSponsor(input: {
  name: string;
  slug: string;
  url?: string | null;
  logoUrl?: string | null;
  tierSlug?: string | null;
  tags?: string[] | null;
  sortOrder?: number | null;
}) {
  let tierId: string | null = null;
  if (input.tierSlug) {
    const tier = await db
      .select({ id: sponsorTiers.id })
      .from(sponsorTiers)
      .where(eq(sponsorTiers.slug, input.tierSlug))
      .limit(1);
    tierId = tier[0]?.id ?? null;
  }

  const existing = await db
    .select()
    .from(sponsors)
    .where(eq(sponsors.slug, input.slug))
    .limit(1);

  const values = {
    name: input.name,
    url: input.url ?? null,
    logoUrl: input.logoUrl ?? null,
    slug: input.slug,
    tierId,
    tags: input.tags ?? null,
    sortOrder: input.sortOrder ?? null,
    updatedAt: new Date(),
  } as const;

  if (existing.length > 0) {
    const id = existing[0].id!;
    await db.update(sponsors).set(values).where(eq(sponsors.id, id));
    return id;
  }

  const inserted = await db.insert(sponsors).values(values).returning();
  return inserted[0].id!;
}

async function main() {
  console.log("🌱 Seeding sponsor tiers and sponsors (Drizzle)...");

  // Tiers
  const tierInputs = [
    {
      name: "Diamond",
      slug: "diamond",
      description: "Top exposure across venue and materials",
      price: 500_000_000,
      available: 3,
      sold: 0,
      color: "#00bcd4",
      features: [
        "Main stage logo",
        "Keynote mention",
        "Premium booth",
        "VIP lounge access",
      ],
      sortOrder: 1,
    },
    {
      name: "Gold",
      slug: "gold",
      description: "High visibility in event materials",
      price: 250_000_000,
      available: 5,
      sold: 0,
      color: "#FFD700",
      features: ["Secondary stage logo", "Large booth", "Newsletter mention"],
      sortOrder: 2,
    },
    {
      name: "Silver",
      slug: "silver",
      description: "Solid presence across channels",
      price: 100_000_000,
      available: 8,
      sold: 0,
      color: "#C0C0C0",
      features: ["Website logo", "Booth", "Social shout-out"],
      sortOrder: 3,
    },
  ];

  const tierIdsBySlug = new Map<string, string>();
  for (const t of tierInputs) {
    const id = await upsertTier(t);
    tierIdsBySlug.set(t.slug, id);
  }

  // Sponsors
  const sponsorInputs = [
    {
      name: "Vercel",
      slug: "vercel",
      url: "https://vercel.com",
      logoUrl: null,
      tierSlug: "diamond",
      tags: ["cloud", "edge"],
      sortOrder: 1,
    },
    {
      name: "Neon",
      slug: "neon",
      url: "https://neon.tech",
      logoUrl: null,
      tierSlug: "gold",
      tags: ["database", "serverless"],
      sortOrder: 2,
    },
    {
      name: "Local Dev Co",
      slug: "local-dev-co",
      url: "https://example.dev",
      logoUrl: null,
      tierSlug: "silver",
      tags: ["tools"],
      sortOrder: 3,
    },
  ];

  for (const s of sponsorInputs) {
    await upsertSponsor(s);
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Close pool for clean exit
    try {
      await pool.end();
    } catch {}
  });
