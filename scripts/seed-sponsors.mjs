#!/usr/bin/env node
import pg from "pg";

const { Client } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    console.log("Seeding sponsor tiers and sponsors...");

    const tiers = [
      {
        name: "Diamond",
        slug: "diamond",
        description: "Top exposure across venue and materials",
        price: 500000000, // IDR
        available: 3,
        sold: 0,
        color: "#00bcd4",
        features: [
          "Main stage logo",
          "Keynote mention",
          "Premium booth",
          "VIP lounge access",
        ],
        sort_order: 1,
      },
      {
        name: "Gold",
        slug: "gold",
        description: "High visibility and lead generation",
        price: 250000000,
        available: 6,
        sold: 0,
        color: "#ffd700",
        features: ["Stage logo", "Large booth", "Newsletter feature"],
        sort_order: 2,
      },
      {
        name: "Silver",
        slug: "silver",
        description: "Balanced exposure for growth brands",
        price: 125000000,
        available: 10,
        sold: 0,
        color: "#c0c0c0",
        features: ["Booth", "Website logo", "Social spotlight"],
        sort_order: 3,
      },
      {
        name: "Bronze",
        slug: "bronze",
        description: "Starter tier for awareness",
        price: 60000000,
        available: 12,
        sold: 0,
        color: "#cd7f32",
        features: ["Website logo", "On-site mention"],
        sort_order: 4,
      },
    ];

    // Upsert tiers by slug
    for (const t of tiers) {
      const existing = await client.query(
        `SELECT id FROM sponsor_tiers WHERE slug = $1 LIMIT 1`,
        [t.slug]
      );
      if (existing.rows.length) {
        const id = existing.rows[0].id;
        await client.query(
          `UPDATE sponsor_tiers
           SET name=$1, description=$2, price=$3, available=$4, sold=$5,
               color=$6, features=$7::jsonb, sort_order=$8, updated_at=now()
           WHERE id=$9`,
          [
            t.name,
            t.description,
            t.price,
            t.available,
            t.sold,
            t.color,
            JSON.stringify(t.features),
            t.sort_order,
            id,
          ]
        );
        console.log(`Updated tier: ${t.slug}`);
      } else {
        await client.query(
          `INSERT INTO sponsor_tiers (name, slug, description, price, available, sold, color, features, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
          [
            t.name,
            t.slug,
            t.description,
            t.price,
            t.available,
            t.sold,
            t.color,
            JSON.stringify(t.features),
            t.sort_order,
          ]
        );
        console.log(`Inserted tier: ${t.slug}`);
      }
    }

    // Map slugs to ids
    const tierRows = await client.query(
      `SELECT id, slug FROM sponsor_tiers WHERE slug = ANY($1)`,
      [tiers.map((t) => t.slug)]
    );
    const tierIdBySlug = Object.fromEntries(
      tierRows.rows.map((r) => [r.slug, r.id])
    );

    const sponsors = [
      {
        name: "Acme Corp",
        slug: "acme",
        url: "https://example.com/acme",
        logo_url: null,
        tier_slug: "gold",
        tags: ["saas", "cloud"],
        sort_order: 10,
      },
      {
        name: "Globex",
        slug: "globex",
        url: "https://example.com/globex",
        logo_url: null,
        tier_slug: "silver",
        tags: ["ai", "analytics"],
        sort_order: 20,
      },
      {
        name: "Initech",
        slug: "initech",
        url: "https://example.com/initech",
        logo_url: null,
        tier_slug: "bronze",
        tags: ["devtools"],
        sort_order: 30,
      },
    ];

    for (const s of sponsors) {
      const existing = await client.query(
        `SELECT id FROM sponsors WHERE slug = $1 LIMIT 1`,
        [s.slug]
      );
      const tier_id = tierIdBySlug[s.tier_slug] || null;
      if (existing.rows.length) {
        const id = existing.rows[0].id;
        await client.query(
          `UPDATE sponsors
           SET name=$1, url=$2, logo_url=$3, tier_id=$4, tags=$5, sort_order=$6, updated_at=now()
           WHERE id=$7`,
          [s.name, s.url, s.logo_url, tier_id, s.tags, s.sort_order, id]
        );
        console.log(`Updated sponsor: ${s.slug}`);
      } else {
        await client.query(
          `INSERT INTO sponsors (name, url, logo_url, slug, tier_id, tags, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [s.name, s.url, s.logo_url, s.slug, tier_id, s.tags, s.sort_order]
        );
        console.log(`Inserted sponsor: ${s.slug}`);
      }
    }

    console.log("Seeding complete.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
