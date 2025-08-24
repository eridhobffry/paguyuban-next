#!/usr/bin/env node

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { sponsorTiers, sponsors } from "../src/lib/db/schemas/sponsors.js";
import { knowledge } from "../src/lib/db/schemas/knowledge.js";
import { analytics } from "../src/lib/db/schemas/analytics.js";
import { users } from "../src/lib/db/schemas/users.js";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
const client = postgres(connectionString);
const db = drizzle(client);

async function seedTestData() {
  console.log("🌱 Seeding test data...");

  try {
    // Clear existing test data
    console.log("🧹 Clearing existing test data...");
    await db.delete(knowledge).where();
    await db.delete(sponsors).where();
    await db.delete(sponsorTiers).where();
    await db.delete(analytics).where();
    await db.delete(users).where();

    // Create test users
    console.log("👤 Creating test users...");
    const hashedPassword = await bcrypt.hash("testpassword123", 10);

    const testUsers = [
      {
        id: "test-admin-user",
        email: "admin@test.com",
        name: "Test Admin",
        role: "admin",
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-regular-user",
        email: "user@test.com",
        name: "Test User",
        role: "user",
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(users).values(testUsers);

    // Create test sponsor tiers
    console.log("🏆 Creating test sponsor tiers...");
    const testTiers = [
      {
        id: "test-diamond-tier",
        name: "Diamond",
        slug: "diamond",
        description: "Top tier sponsorship",
        price: 500000,
        available: 3,
        sold: 1,
        color: "#00bcd4",
        features: ["Main stage logo", "Keynote mention"],
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-gold-tier",
        name: "Gold",
        slug: "gold",
        description: "High visibility tier",
        price: 250000,
        available: 5,
        sold: 2,
        color: "#FFD700",
        features: ["Secondary stage logo", "Large booth"],
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-silver-tier",
        name: "Silver",
        slug: "silver",
        description: "Standard tier",
        price: 100000,
        available: 8,
        sold: 3,
        color: "#C0C0C0",
        features: ["Website logo", "Booth"],
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(sponsorTiers).values(testTiers);

    // Create test sponsors
    console.log("🤝 Creating test sponsors...");
    const testSponsors = [
      {
        id: "test-sponsor-1",
        name: "Test Company 1",
        slug: "test-company-1",
        url: "https://test1.com",
        logoUrl: "https://test1.com/logo.png",
        tierId: "test-diamond-tier",
        tags: ["technology", "cloud"],
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-sponsor-2",
        name: "Test Company 2",
        slug: "test-company-2",
        url: "https://test2.com",
        logoUrl: "https://test2.com/logo.png",
        tierId: "test-gold-tier",
        tags: ["finance", "blockchain"],
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-sponsor-3",
        name: "Test Company 3",
        slug: "test-company-3",
        url: "https://test3.com",
        logoUrl: "https://test3.com/logo.png",
        tierId: "test-silver-tier",
        tags: ["healthcare", "ai"],
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(sponsors).values(testSponsors);

    // Create test knowledge data
    console.log("🧠 Creating test knowledge data...");
    const testKnowledge = [
      {
        id: "test-knowledge-1",
        title: "Event Information",
        content: "Paguyuban Messe 2026 is scheduled for December 1-2, 2026 at Arena Berlin, Germany.",
        category: "event",
        tags: ["dates", "location", "venue"],
        overlay: {
          event: {
            dates: "December 1-2, 2026",
            location: "Arena Berlin, Germany",
            name: "Paguyuban Messe 2026"
          },
          contact: {
            email: "overlay@paguyuban-messe.com"
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-knowledge-2",
        title: "Sponsorship Details",
        content: "We offer Diamond, Gold, and Silver sponsorship tiers with various benefits and pricing.",
        category: "sponsorship",
        tags: ["sponsors", "pricing", "tiers"],
        overlay: {
          sponsorship: {
            tiers: ["Diamond", "Gold", "Silver"],
            benefits: ["Logo placement", "Booth space", "Speaking opportunities"]
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "test-knowledge-3",
        title: "Technical Specifications",
        content: "The venue has state-of-the-art AV equipment, high-speed internet, and multiple breakout rooms.",
        category: "technical",
        tags: ["venue", "equipment", "facilities"],
        overlay: {
          technical: {
            capacity: 2000,
            rooms: 15,
            internet: "1Gbps fiber",
            equipment: ["LED walls", "Microphones", "Projectors"]
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(knowledge).values(testKnowledge);

    // Create test analytics data
    console.log("📊 Creating test analytics data...");
    const testAnalytics = [
      {
        id: "test-analytics-1",
        eventType: "page_view",
        page: "/speakers",
        userAgent: "Mozilla/5.0 (Test Browser)",
        ipAddress: "127.0.0.1",
        referrer: "https://test.com",
        userId: "test-user-1",
        sessionId: "test-session-1",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          source: "direct",
          device: "desktop",
          browser: "chrome",
          country: "US"
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: "test-analytics-2",
        eventType: "sponsor_click",
        page: "/sponsors",
        userAgent: "Mozilla/5.0 (Mobile Browser)",
        ipAddress: "127.0.0.1",
        referrer: "https://google.com",
        userId: "test-user-2",
        sessionId: "test-session-2",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        metadata: {
          sponsorId: "test-sponsor-1",
          sponsorName: "Test Company 1",
          source: "search",
          device: "mobile",
          browser: "safari",
          country: "DE"
        },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        id: "test-analytics-3",
        eventType: "form_submission",
        page: "/partnership-application",
        userAgent: "Mozilla/5.0 (Desktop Browser)",
        ipAddress: "127.0.0.1",
        referrer: "https://test.com/sponsors",
        userId: "test-user-3",
        sessionId: "test-session-3",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        metadata: {
          formType: "partnership",
          source: "referral",
          device: "desktop",
          browser: "firefox",
          country: "UK"
        },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ];

    await db.insert(analytics).values(testAnalytics);

    console.log("✅ Test data seeding complete!");
    console.log("📝 Created:");
    console.log("  - 2 test users (admin & regular)");
    console.log("  - 3 sponsor tiers (Diamond, Gold, Silver)");
    console.log("  - 3 test sponsors");
    console.log("  - 3 knowledge entries");
    console.log("  - 3 analytics events");

  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTestData();
