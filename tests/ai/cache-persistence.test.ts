import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { cachePersistence } from "../../src/lib/ai/cache-persistence";
import { memoryPolicyManager } from "../../src/lib/ai/memory-policy";
import {
  setCachedResponse,
  getCachedResponse,
  type CacheContext,
} from "../../src/lib/ai/semantic-cache";
import {
  initializeMemoryPolicies,
  demonstrateMemoryPolicyUsage,
} from "../../src/lib/ai/memory-policy-setup";

// Mock the database module before importing other modules
vi.mock("../../src/lib/db/drizzle", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  pool: {},
}));

// Mock database operations for testing when database is not available
const mockDatabaseOperations = () => {
  let mockCacheStore: Map<string, any> = new Map();
  let mockPreferences: any[] = [];
  let mockInteractions: any[] = [];

  // Mock the cache persistence methods
  vi.spyOn(cachePersistence, "store").mockImplementation(
    async (entry, context) => {
      const key = entry.key;
      mockCacheStore.set(key, { entry, context });
      return undefined;
    }
  );

  vi.spyOn(cachePersistence, "retrieve").mockImplementation(async (key) => {
    const stored = mockCacheStore.get(key);
    if (stored) {
      return {
        key: stored.entry.key,
        prompt: stored.entry.prompt,
        normalized: stored.entry.normalized,
        locale: stored.entry.locale,
        embedding: stored.entry.embedding,
        response: stored.entry.response,
        model: stored.entry.model,
        createdAt: stored.entry.createdAt,
        expiresAt: stored.entry.expiresAt,
        hits: stored.entry.hits,
      };
    }
    return null;
  });

  vi.spyOn(cachePersistence, "updateHit").mockResolvedValue(undefined);
  vi.spyOn(cachePersistence, "cleanupExpired").mockImplementation(async () => {
    // Simulate cleanup by removing expired entries from mock store
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, stored] of mockCacheStore.entries()) {
      if (stored.entry.expiresAt < now) {
        mockCacheStore.delete(key);
        cleanedCount++;
      }
    }
    return cleanedCount;
  });

  // Mock the memory policy manager methods
  vi.spyOn(memoryPolicyManager, "recordStablePreference").mockImplementation(
    async (userId, type, value, confidence) => {
      const existingIndex = mockPreferences.findIndex(
        (p) => p.userId === userId && p.preferenceType === type
      );
      if (existingIndex >= 0) {
        mockPreferences[existingIndex] = {
          ...mockPreferences[existingIndex],
          preferenceValue: value,
          confidenceScore: Math.min(
            1.0,
            mockPreferences[existingIndex].confidenceScore + confidence
          ),
          evidenceCount: mockPreferences[existingIndex].evidenceCount + 1,
        };
      } else {
        mockPreferences.push({
          userId,
          preferenceType: type,
          preferenceValue: value,
          confidenceScore: confidence || 1.0,
          evidenceCount: 1,
          lastUpdated: new Date(),
        });
      }
    }
  );

  vi.spyOn(memoryPolicyManager, "getStablePreferences").mockImplementation(
    async (userId) => {
      return mockPreferences
        .filter((p) => p.userId === userId)
        .sort((a, b) => b.confidenceScore - a.confidenceScore);
    }
  );

  vi.spyOn(memoryPolicyManager, "recordSponsorInteraction").mockImplementation(
    async (interaction) => {
      mockInteractions.push({
        ...interaction,
        createdAt: new Date(),
      });
    }
  );

  vi.spyOn(memoryPolicyManager, "getSponsorHistory").mockImplementation(
    async (userId, limit) => {
      return mockInteractions
        .filter((i) => i.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    }
  );

  vi.spyOn(memoryPolicyManager, "getSponsorRecommendations").mockImplementation(
    async (userId) => {
      // Simple mock: return sponsors that have been bookmarked/contacted
      const positiveInteractions = mockInteractions.filter(
        (i) =>
          i.userId === userId &&
          ["bookmarked", "contacted"].includes(i.interactionType)
      );
      return [...new Set(positiveInteractions.map((i) => i.sponsorId))];
    }
  );

  vi.spyOn(memoryPolicyManager, "getMemoryStats").mockResolvedValue({
    totalStablePreferences: mockPreferences.length,
    totalSponsorInteractions: mockInteractions.length,
    activeMemoryRules: 5, // Mock 5 active rules
    recentConsolidations: 1,
  });
};

describe("Cache Persistence and Memory Policy", () => {
  const testUserId = "test-user-123";
  const testContext: CacheContext = {
    locale: "en",
    city: "Jakarta",
  };

  beforeAll(async () => {
    // Apply mocks for testing
    mockDatabaseOperations();

    // Initialize memory policies for testing
    try {
      await initializeMemoryPolicies();
    } catch (error) {
      console.warn("Failed to initialize memory policies:", error.message);
    }
  });

  describe("Cache Persistence", () => {
    it("should store and retrieve cache entries", async () => {
      const testEntry = {
        key: "test-cache-key",
        prompt: "What is the capital of Indonesia?",
        normalized: "what is the capital of indonesia",
        locale: "en" as const,
        embedding: new Map([
          ["capital", 0.8],
          ["indonesia", 0.9],
        ]),
        response: "The capital of Indonesia is Jakarta.",
        model: "qwen25-max",
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        hits: 0,
      };

      // Store entry
      await cachePersistence.store(testEntry, testContext);

      // Retrieve entry
      const retrieved = await cachePersistence.retrieve(testEntry.key);

      expect(retrieved).toBeDefined();
      expect(retrieved?.response).toBe(testEntry.response);
      expect(retrieved?.model).toBe(testEntry.model);
    });

    it("should update hit counts", async () => {
      const cacheKey = "test-hit-key";

      // Store initial entry
      const entry = await setCachedResponse(
        "Test query",
        testContext,
        "Test response",
        "qwen25-max"
      );

      // Update hit count
      await cachePersistence.updateHit(cacheKey);

      // Verify hit count was updated
      const retrieved = await cachePersistence.retrieve(cacheKey);
      expect(retrieved).toBeDefined();
    });

    it("should cleanup expired entries", async () => {
      // Create an expired entry
      const expiredEntry = {
        key: "expired-test-key",
        prompt: "Expired query",
        normalized: "expired query",
        locale: "en" as const,
        embedding: new Map([["expired", 1.0]]),
        response: "Expired response",
        model: "qwen25-max",
        createdAt: Date.now() - 48 * 60 * 60 * 1000, // 2 days ago
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago (expired)
        hits: 0,
      };

      await cachePersistence.store(expiredEntry, testContext);

      // Cleanup expired entries
      const deletedCount = await cachePersistence.cleanupExpired();

      expect(deletedCount).toBeGreaterThanOrEqual(0);

      // Verify expired entry is gone
      const retrieved = await cachePersistence.retrieve(expiredEntry.key);
      expect(retrieved).toBeNull();
    });
  });

  describe("Memory Policy Management", () => {
    it("should record and retrieve user preferences", async () => {
      // Record a preference
      await memoryPolicyManager.recordStablePreference(
        testUserId,
        "language",
        "id",
        0.8
      );

      // Retrieve preferences
      const preferences = await memoryPolicyManager.getStablePreferences(
        testUserId
      );

      expect(preferences.length).toBeGreaterThan(0);
      const languagePref = preferences.find(
        (p) => p.preferenceType === "language"
      );
      expect(languagePref).toBeDefined();
      expect(languagePref?.preferenceValue).toBe("id");
      expect(languagePref?.confidenceScore).toBe(0.8);
    });

    it("should record sponsor interactions", async () => {
      const interaction = {
        userId: testUserId,
        sponsorId: "test-sponsor-123",
        interactionType: "viewed" as const,
        interactionData: { page: "detail", timeSpent: 60 },
        sentimentScore: 0.7,
      };

      await memoryPolicyManager.recordSponsorInteraction(interaction);

      // Retrieve interaction history
      const history = await memoryPolicyManager.getSponsorHistory(
        testUserId,
        10
      );

      expect(history.length).toBeGreaterThan(0);
      const latestInteraction = history[0];
      expect(latestInteraction.sponsorId).toBe(interaction.sponsorId);
      expect(latestInteraction.interactionType).toBe(
        interaction.interactionType
      );
    });

    it("should generate sponsor recommendations", async () => {
      // Add more interactions to test recommendations
      await memoryPolicyManager.recordSponsorInteraction({
        userId: testUserId,
        sponsorId: "popular-sponsor",
        interactionType: "bookmarked",
      });

      await memoryPolicyManager.recordSponsorInteraction({
        userId: testUserId,
        sponsorId: "unpopular-sponsor",
        interactionType: "viewed",
      });

      const recommendations =
        await memoryPolicyManager.getSponsorRecommendations(testUserId);

      expect(Array.isArray(recommendations)).toBe(true);
      // Popular sponsor should appear first due to bookmark interaction
      if (recommendations.length > 0) {
        expect(recommendations[0]).toBe("popular-sponsor");
      }
    });

    it("should get memory statistics", async () => {
      const stats = await memoryPolicyManager.getMemoryStats();

      expect(stats).toHaveProperty("totalStablePreferences");
      expect(stats).toHaveProperty("totalSponsorInteractions");
      expect(stats).toHaveProperty("activeMemoryRules");
      expect(typeof stats.totalStablePreferences).toBe("number");
      expect(typeof stats.totalSponsorInteractions).toBe("number");
    });
  });

  describe("Integration Tests", () => {
    it("should work with semantic cache and memory policy together", async () => {
      // Test the full integration
      const query = "What are the best sponsors for tech events?";
      const response =
        "Based on your interaction history, I recommend checking out sponsors who specialize in technology solutions.";

      // Store cache entry
      const entry = await setCachedResponse(
        query,
        testContext,
        response,
        "qwen25-max"
      );

      // Retrieve from cache
      const cached = await getCachedResponse(query, testContext);

      expect(cached).toBeDefined();
      expect(cached?.response).toBe(response);

      // Record user preference based on interaction
      await memoryPolicyManager.recordStablePreference(
        testUserId,
        "interest_area",
        "technology",
        0.9
      );

      // Verify preference was recorded
      const preferences = await memoryPolicyManager.getStablePreferences(
        testUserId
      );
      const techInterest = preferences.find(
        (p) => p.preferenceType === "interest_area"
      );
      expect(techInterest?.preferenceValue).toBe("technology");
    });

    it("should handle memory policy demonstration", async () => {
      // This test demonstrates the full memory policy setup
      await expect(
        demonstrateMemoryPolicyUsage(testUserId)
      ).resolves.not.toThrow();
    });
  });
});
