import { db } from "../db/drizzle";
import {
  userStablePreferences,
  sponsorInteractionHistory,
  memoryPolicyRules,
  memoryConsolidationLog,
} from "../db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface StablePreference {
  userId: string;
  preferenceType: string;
  preferenceValue: any;
  confidenceScore: number;
  evidenceCount: number;
  lastUpdated: Date;
}

export interface SponsorInteraction {
  userId?: string;
  sessionId?: string;
  sponsorId: string;
  interactionType: "viewed" | "contacted" | "bookmarked" | "dismissed";
  interactionData?: any;
  userFeedback?: string;
  sentimentScore?: number;
}

export interface MemoryPolicyRule {
  ruleName: string;
  ruleType: "retention" | "expiration" | "consolidation";
  conditions: any;
  actions: any;
  priority: number;
  isActive: boolean;
}

export class MemoryPolicyManager {
  /**
   * Record user stable preference with confidence scoring
   */
  async recordStablePreference(
    userId: string,
    preferenceType: string,
    value: any,
    confidence: number = 1.0
  ): Promise<void> {
    try {
      await db
        .insert(userStablePreferences)
        .values({
          userId,
          preferenceType,
          preferenceValue: value,
          confidenceScore: confidence,
          evidenceCount: 1,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            userStablePreferences.userId,
            userStablePreferences.preferenceType,
          ],
          set: {
            preferenceValue: value,
            confidenceScore: sql`LEAST(1.0, ${userStablePreferences.confidenceScore} + ${confidence})`,
            evidenceCount: sql`${userStablePreferences.evidenceCount} + 1`,
            lastUpdated: new Date(),
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Failed to record stable preference:", error);
    }
  }

  /**
   * Get user stable preferences
   */
  async getStablePreferences(userId: string): Promise<StablePreference[]> {
    try {
      const result = await db
        .select()
        .from(userStablePreferences)
        .where(eq(userStablePreferences.userId, userId))
        .orderBy(desc(userStablePreferences.confidenceScore));

      return result.map((row) => ({
        userId: row.userId,
        preferenceType: row.preferenceType,
        preferenceValue: row.preferenceValue,
        confidenceScore: Number(row.confidenceScore),
        evidenceCount: row.evidenceCount,
        lastUpdated: row.lastUpdated,
      }));
    } catch (error) {
      console.error("Failed to get stable preferences:", error);
      return [];
    }
  }

  /**
   * Record sponsor interaction for personalized recommendations
   */
  async recordSponsorInteraction(
    interaction: SponsorInteraction
  ): Promise<void> {
    try {
      await db.insert(sponsorInteractionHistory).values({
        userId: interaction.userId,
        sessionId: interaction.sessionId,
        sponsorId: interaction.sponsorId,
        interactionType: interaction.interactionType,
        interactionData: interaction.interactionData,
        userFeedback: interaction.userFeedback,
        sentimentScore: interaction.sentimentScore,
      });
    } catch (error) {
      console.error("Failed to record sponsor interaction:", error);
    }
  }

  /**
   * Get sponsor interaction history for a user
   */
  async getSponsorHistory(
    userId: string,
    limit: number = 50
  ): Promise<SponsorInteraction[]> {
    try {
      const result = await db
        .select()
        .from(sponsorInteractionHistory)
        .where(eq(sponsorInteractionHistory.userId, userId))
        .orderBy(desc(sponsorInteractionHistory.createdAt))
        .limit(limit);

      return result.map((row) => ({
        userId: row.userId || undefined,
        sessionId: row.sessionId || undefined,
        sponsorId: row.sponsorId,
        interactionType: row.interactionType as any,
        interactionData: row.interactionData,
        userFeedback: row.userFeedback || undefined,
        sentimentScore: row.sentimentScore
          ? Number(row.sentimentScore)
          : undefined,
      }));
    } catch (error) {
      console.error("Failed to get sponsor history:", error);
      return [];
    }
  }

  /**
   * Get sponsor recommendations based on interaction patterns
   */
  async getSponsorRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      // Simple recommendation logic based on positive interactions
      const result = await db
        .select({
          sponsorId: sponsorInteractionHistory.sponsorId,
          positiveScore: sql<number>`COUNT(CASE WHEN ${sponsorInteractionHistory.interactionType} IN ('bookmarked', 'contacted') THEN 1 END)`,
          recentInteractions: sql<number>`COUNT(*)`,
        })
        .from(sponsorInteractionHistory)
        .where(
          and(
            eq(sponsorInteractionHistory.userId, userId),
            gte(
              sponsorInteractionHistory.createdAt,
              sql`NOW() - INTERVAL '30 days'`
            )
          )
        )
        .groupBy(sponsorInteractionHistory.sponsorId)
        .orderBy(desc(sql`positiveScore`), desc(sql`recentInteractions`))
        .limit(limit);

      return result.map((row) => row.sponsorId);
    } catch (error) {
      console.error("Failed to get sponsor recommendations:", error);
      return [];
    }
  }

  /**
   * Add or update memory policy rule
   */
  async setMemoryPolicyRule(rule: MemoryPolicyRule): Promise<void> {
    try {
      await db
        .insert(memoryPolicyRules)
        .values({
          ruleName: rule.ruleName,
          ruleType: rule.ruleType,
          conditions: rule.conditions,
          actions: rule.actions,
          priority: rule.priority,
          isActive: rule.isActive,
        })
        .onConflictDoUpdate({
          target: memoryPolicyRules.ruleName,
          set: {
            ruleType: rule.ruleType,
            conditions: rule.conditions,
            actions: rule.actions,
            priority: rule.priority,
            isActive: rule.isActive,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Failed to set memory policy rule:", error);
    }
  }

  /**
   * Get active memory policy rules
   */
  async getActiveMemoryPolicyRules(): Promise<MemoryPolicyRule[]> {
    try {
      const result = await db
        .select()
        .from(memoryPolicyRules)
        .where(eq(memoryPolicyRules.isActive, true))
        .orderBy(desc(memoryPolicyRules.priority));

      return result.map((row) => ({
        ruleName: row.ruleName,
        ruleType: row.ruleType as any,
        conditions: row.conditions,
        actions: row.actions,
        priority: row.priority,
        isActive: row.isActive,
      }));
    } catch (error) {
      console.error("Failed to get memory policy rules:", error);
      return [];
    }
  }

  /**
   * Log memory consolidation operations
   */
  async logConsolidation(
    consolidationType: string,
    affectedRecords: number,
    details?: any,
    metrics?: any
  ): Promise<void> {
    try {
      await db.insert(memoryConsolidationLog).values({
        consolidationType,
        affectedRecords,
        consolidationDetails: details,
        performanceMetrics: metrics,
      });
    } catch (error) {
      console.error("Failed to log consolidation:", error);
    }
  }

  /**
   * Consolidate stable preferences based on evidence
   */
  async consolidateStablePreferences(): Promise<number> {
    try {
      // Update confidence scores based on evidence count and recency
      const result = await db
        .update(userStablePreferences)
        .set({
          confidenceScore: sql`LEAST(1.0, ${userStablePreferences.confidenceScore} * 0.9 + 0.1)`,
          updatedAt: new Date(),
        })
        .where(sql`${userStablePreferences.evidenceCount} > 1`);

      await this.logConsolidation("preference_update", result.rowCount || 0, {
        operation: "confidence_decay",
      });

      return result.rowCount || 0;
    } catch (error) {
      console.error("Failed to consolidate stable preferences:", error);
      return 0;
    }
  }

  /**
   * Clean up old sponsor interaction history
   */
  async cleanupOldSponsorHistory(daysOld: number = 90): Promise<number> {
    try {
      const result = await db
        .delete(sponsorInteractionHistory)
        .where(
          sql`${sponsorInteractionHistory.createdAt} < NOW() - INTERVAL '${daysOld} days'`
        );

      await this.logConsolidation(
        "sponsor_history_cleanup",
        result.rowCount || 0,
        { retentionDays: daysOld }
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error("Failed to cleanup sponsor history:", error);
      return 0;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{
    totalStablePreferences: number;
    totalSponsorInteractions: number;
    activeMemoryRules: number;
    recentConsolidations: number;
  }> {
    try {
      const [prefs, interactions, rules, consolidations] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(userStablePreferences),
        db
          .select({ count: sql<number>`count(*)` })
          .from(sponsorInteractionHistory),
        db
          .select({ count: sql<number>`count(*)` })
          .from(memoryPolicyRules)
          .where(eq(memoryPolicyRules.isActive, true)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(memoryConsolidationLog)
          .where(
            gte(
              memoryConsolidationLog.createdAt,
              sql`NOW() - INTERVAL '7 days'`
            )
          ),
      ]);

      return {
        totalStablePreferences: prefs[0].count,
        totalSponsorInteractions: interactions[0].count,
        activeMemoryRules: rules[0].count,
        recentConsolidations: consolidations[0].count,
      };
    } catch (error) {
      console.error("Failed to get memory stats:", error);
      return {
        totalStablePreferences: 0,
        totalSponsorInteractions: 0,
        activeMemoryRules: 0,
        recentConsolidations: 0,
      };
    }
  }
}

// Singleton instance
export const memoryPolicyManager = new MemoryPolicyManager();
