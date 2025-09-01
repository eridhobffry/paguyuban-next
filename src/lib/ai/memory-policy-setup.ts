import { memoryPolicyManager } from "./memory-policy";

/**
 * Initialize default memory policy rules for the AI system
 */
export async function initializeMemoryPolicies() {
  const defaultRules = [
    {
      ruleName: "cache_expiration_event_based",
      ruleType: "expiration" as const,
      conditions: {
        hasEventEnd: true,
        daysAfterEvent: 14,
      },
      actions: {
        type: "extend_ttl",
        multiplier: 1.0, // No extension, use computed expiry
      },
      priority: 10,
    },
    {
      ruleName: "cache_expiration_high_hit_rate",
      ruleType: "retention" as const,
      conditions: {
        hitCount: { min: 10 },
        hitRate: { min: 0.8 },
      },
      actions: {
        type: "extend_ttl",
        multiplier: 2.0, // Double the TTL for popular entries
      },
      priority: 8,
    },
    {
      ruleName: "preference_consolidation_weekly",
      ruleType: "consolidation" as const,
      conditions: {
        schedule: "weekly",
        evidenceThreshold: 3,
      },
      actions: {
        type: "consolidate_preferences",
        confidenceDecay: 0.9,
      },
      priority: 5,
    },
    {
      ruleName: "sponsor_history_cleanup_monthly",
      ruleType: "expiration" as const,
      conditions: {
        schedule: "monthly",
        olderThanDays: 90,
      },
      actions: {
        type: "cleanup_interactions",
        preservePositiveOnly: true,
      },
      priority: 3,
    },
    {
      ruleName: "cache_cleanup_low_value",
      ruleType: "expiration" as const,
      conditions: {
        hitCount: { max: 1 },
        ageDays: { min: 30 },
        evalScore: { max: 0.5 },
      },
      actions: {
        type: "expire_early",
        factor: 0.5, // Expire 50% earlier
      },
      priority: 2,
    },
  ];

  console.log("Initializing memory policies...");

  for (const rule of defaultRules) {
    try {
      await memoryPolicyManager.setMemoryPolicyRule(rule);
      console.log(`✓ Initialized policy: ${rule.ruleName}`);
    } catch (error) {
      console.error(`✗ Failed to initialize policy ${rule.ruleName}:`, error);
    }
  }

  console.log("Memory policy initialization completed");
}

/**
 * Example usage of memory policy manager
 */
export async function demonstrateMemoryPolicyUsage(userId: string) {
  // Record user preferences
  await memoryPolicyManager.recordStablePreference(
    userId,
    "language",
    "id",
    0.8
  );

  await memoryPolicyManager.recordStablePreference(
    userId,
    "communication_style",
    "formal",
    0.6
  );

  // Record sponsor interactions
  await memoryPolicyManager.recordSponsorInteraction({
    userId,
    sponsorId: "sponsor-123",
    interactionType: "viewed",
    interactionData: {
      page: "sponsor-detail",
      timeSpent: 120,
      scrollDepth: 0.8,
    },
  });

  await memoryPolicyManager.recordSponsorInteraction({
    userId,
    sponsorId: "sponsor-456",
    interactionType: "contacted",
    interactionData: {
      method: "email",
      subject: "Partnership inquiry",
    },
    sentimentScore: 0.9,
  });

  // Get user preferences
  const preferences = await memoryPolicyManager.getStablePreferences(userId);
  console.log("User preferences:", preferences);

  // Get sponsor recommendations
  const recommendations = await memoryPolicyManager.getSponsorRecommendations(
    userId
  );
  console.log("Sponsor recommendations:", recommendations);

  // Get memory stats
  const stats = await memoryPolicyManager.getMemoryStats();
  console.log("Memory stats:", stats);
}

/**
 * Maintenance tasks for memory management
 */
export async function runMemoryMaintenance() {
  console.log("Running memory maintenance...");

  try {
    // Consolidate stable preferences
    const consolidatedPrefs =
      await memoryPolicyManager.consolidateStablePreferences();
    console.log(`Consolidated ${consolidatedPrefs} preferences`);

    // Cleanup old sponsor history
    const cleanedInteractions =
      await memoryPolicyManager.cleanupOldSponsorHistory(90);
    console.log(`Cleaned up ${cleanedInteractions} old interactions`);

    // Log the maintenance
    await memoryPolicyManager.logConsolidation(
      "maintenance_run",
      consolidatedPrefs + cleanedInteractions,
      { type: "scheduled_maintenance" },
      { duration: Date.now() }
    );

    console.log("Memory maintenance completed");
  } catch (error) {
    console.error("Memory maintenance failed:", error);
  }
}
