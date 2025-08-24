#!/usr/bin/env node

import "dotenv/config";
import { db, pool } from "../src/lib/db/drizzle";
import { artists } from "../src/lib/db/schemas/artists";
import { speakers } from "../src/lib/db/schemas/speakers";
import {
  financialRevenueItems,
  financialCostItems,
} from "../src/lib/db/schemas/financial";

async function seedTestData() {
  console.log("🌱 Seeding all test data...");

  try {
    // Clear existing data
    console.log("🧹 Clearing existing test data...");
    await db.delete(artists);
    await db.delete(speakers);

    // Create test artists
    console.log("🎤 Creating test artists...");
    const testArtists = [
      {
        name: "Dewa 19",
        role: "Rock Band",
        company: "Aquarius Musikindo",
        imageUrl: "/images/artists/dewa19.jpg",
        bio: "Legendary Indonesian rock band with decades of experience",
        tags: ["rock", "indonesian", "legendary"],
        slug: "dewa-19",
        instagram: "https://instagram.com/dewa19official",
        youtube: "https://youtube.com/@dewa19official",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Erka",
        role: "Pop Singer",
        company: "Universal Music Indonesia",
        imageUrl: "/images/artists/erk.jpg",
        bio: "Rising star in Indonesian pop music scene",
        tags: ["pop", "indonesian", "contemporary"],
        slug: "erka",
        instagram: "https://instagram.com/erk.official",
        youtube: "https://youtube.com/@erkaofficial",
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Panturas",
        role: "Indie Rock Band",
        company: "Independent",
        imageUrl: "/images/artists/panturas.jpg",
        bio: "Popular Indonesian indie rock band",
        tags: ["indie", "rock", "indonesian"],
        slug: "panturas",
        instagram: "https://instagram.com/panturasofficial",
        youtube: "https://youtube.com/@panturasofficial",
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tulus",
        role: "Pop Singer",
        company: "Tulus Company",
        imageUrl: "/images/artists/tulus.jpg",
        bio: "Award-winning Indonesian singer-songwriter",
        tags: ["pop", "indonesian", "singer-songwriter"],
        slug: "tulus",
        instagram: "https://instagram.com/tulus",
        youtube: "https://youtube.com/@tulusofficial",
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(artists).values(testArtists);

    // Create test speakers
    console.log("🎤 Creating test speakers...");
    const testSpeakers = [
      {
        name: "Gita Wirjawan",
        role: "Former Minister of Trade",
        company: "Government of Indonesia",
        imageUrl: "/images/speakers/gita-wirjawan.jpg",
        bio: "Former Indonesian Minister of Trade and prominent business leader",
        tags: ["government", "trade", "business"],
        slug: "gita-wirjawan",
        speakerType: "summit",
        linkedin: "https://linkedin.com/in/gita-wirjawan",
        twitter: "https://twitter.com/gita_wirjawan",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Joko Anwar",
        role: "Film Director",
        company: "Independent",
        imageUrl: "/images/speakers/joko-anwar.jpg",
        bio: "Award-winning Indonesian film director and producer",
        tags: ["entertainment", "film", "culture"],
        slug: "joko-anwar",
        speakerType: "main_stage",
        instagram: "https://instagram.com/jokoanwar",
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Iyas Lawrence",
        role: "Business Consultant",
        company: "Lawrence Consulting",
        imageUrl: "/images/speakers/iyas-lawrence.jpg",
        bio: "International business consultant and entrepreneur",
        tags: ["business", "consulting", "entrepreneurship"],
        slug: "iyas-lawrence",
        speakerType: "summit",
        linkedin: "https://linkedin.com/in/iyas-lawrence",
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Rahayu Saraswati",
        role: "Cultural Ambassador",
        company: "Indonesian Ministry of Culture",
        imageUrl: "/images/speakers/rahayu-saraswati.jpg",
        bio: "Cultural ambassador promoting Indonesian arts and heritage",
        tags: ["culture", "arts", "heritage"],
        slug: "rahayu-saraswati",
        speakerType: "main_stage",
        instagram: "https://instagram.com/rahayu_saraswati",
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(speakers).values(testSpeakers);

    // Clear existing financial data and seed new data
    console.log("💰 Clearing existing financial data...");
    await db.delete(financialRevenueItems);
    await db.delete(financialCostItems);

    // Create test financial revenue data
    console.log("📈 Creating test financial revenue data...");
    const testRevenues = [
      {
        category: "Sponsorship Revenue",
        amount: 750000,
        notes: "Expected sponsorship income from all tiers",
        evidenceUrl: "/docs/sponsorship-prospectus.pdf",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Ticket Sales",
        amount: 150000,
        notes: "Projected ticket revenue from 6,800 attendees",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Exhibition Fees",
        amount: 120000,
        notes: "Booth rental and exhibition space fees",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Workshop Revenue",
        amount: 80000,
        notes: "Cultural workshop and training program fees",
        evidenceUrl: "/docs/workshop-guide.pdf",
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Media & Partnership",
        amount: 50000,
        notes: "Media partnerships and content licensing",
        evidenceUrl: "/docs/sponsorship-prospectus.pdf",
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(financialRevenueItems).values(testRevenues);

    // Create test financial cost data
    console.log("📉 Creating test financial cost data...");
    const testCosts = [
      {
        category: "Venue Rental",
        amount: 200000,
        notes: "Arena Berlin rental and setup costs",
        evidenceUrl: "/docs/technical-specs.pdf",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Marketing & Advertising",
        amount: 150000,
        notes: "Digital marketing, social media, and promotional activities",
        evidenceUrl: "/docs/marketing-strategy.pdf",
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Production & Technical",
        amount: 120000,
        notes: "AV equipment, lighting, sound system, and technical crew",
        evidenceUrl: "/docs/technical-specs.pdf",
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Artist & Speaker Fees",
        amount: 100000,
        notes:
          "Performance fees, travel, and accommodation for artists and speakers",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Staff & Volunteer Program",
        amount: 80000,
        notes: "Event staff salaries and volunteer program management",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Insurance & Legal",
        amount: 50000,
        notes: "Event insurance, permits, and legal consultation",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Catering & Hospitality",
        amount: 60000,
        notes: "Food, beverages, and hospitality services",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        category: "Transportation & Logistics",
        amount: 40000,
        notes: "Equipment transport, storage, and logistics coordination",
        evidenceUrl: "/docs/financial-report.pdf",
        sortOrder: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(financialCostItems).values(testCosts);

    // Verify the data was inserted correctly
    const verifyRevenues = await db.select().from(financialRevenueItems);
    const verifyCosts = await db.select().from(financialCostItems);
    const verifyArtists = await db.select().from(artists);
    const verifySpeakers = await db.select().from(speakers);

    console.log("✅ All test data seeding complete!");
    console.log("📝 Created:");
    console.log("  -", verifyArtists.length, "test artists");
    console.log("  -", verifySpeakers.length, "test speakers");
    console.log("  -", verifyRevenues.length, "financial revenue items");
    console.log("  -", verifyCosts.length, "financial cost items");

    console.log("\n🔍 Verification:");
    console.log("Sample revenue:", verifyRevenues[0]);
    console.log("Sample cost:", verifyCosts[0]);
  } catch (error) {
    console.error("❌ Error seeding artists and speakers data:", error);
    process.exitCode = 1;
  } finally {
    // Close pool for clean exit
    try {
      await pool.end();
    } catch {}
  }
}

seedTestData();
