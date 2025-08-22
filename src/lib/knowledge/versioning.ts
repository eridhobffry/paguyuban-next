import { db } from "@/lib/db";
import { knowledge } from "@/lib/db/schemas/knowledge";
import { eq, desc, and } from "drizzle-orm";

interface KnowledgeVersion {
  id: string;
  overlay: Record<string, unknown>;
  isActive: boolean;
  version: number;
  changeLog: string;
  createdAt: Date;
  updatedAt: Date;
}

interface KnowledgeBackup {
  id: string;
  originalId: string;
  overlay: Record<string, unknown>;
  backupReason: string;
  createdAt: Date;
}

/**
 * Knowledge Versioning and Backup System
 *
 * Provides version control, backup, and rollback capabilities for knowledge overlays.
 * Maintains history of changes and enables safe knowledge management.
 */
export class KnowledgeVersioningService {
  /**
   * Create a backup before making changes
   */
  async createBackup(
    originalId: string,
    reason: string = "Automatic backup before update"
  ): Promise<string> {
    try {
      // Get the current knowledge
      const current = await db
        .select()
        .from(knowledge)
        .where(eq(knowledge.id, originalId))
        .limit(1);

      if (!current.length) {
        throw new Error("Knowledge record not found");
      }

      // Create backup entry (we'll store it as inactive knowledge with special metadata)
      const [backup] = await db
        .insert(knowledge)
        .values({
          overlay: {
            ...(current[0].overlay as Record<string, unknown>),
            _backup: {
              originalId,
              reason,
              timestamp: new Date().toISOString(),
              type: "backup",
            },
          },
          isActive: false, // Backups are inactive
        })
        .returning();

      return backup.id;
    } catch (error) {
      console.error("Failed to create knowledge backup:", error);
      throw new Error("Backup creation failed");
    }
  }

  /**
   * Get all backups for a knowledge record
   */
  async getBackups(originalId?: string): Promise<KnowledgeBackup[]> {
    try {
      const backups = await db
        .select()
        .from(knowledge)
        .where(
          and(
            eq(knowledge.isActive, false)
            // Filter for backup records (they have _backup metadata)
          )
        )
        .orderBy(desc(knowledge.createdAt));

      return backups
        .filter((backup) => {
          const overlay = backup.overlay as any;
          return (
            overlay._backup &&
            (!originalId || overlay._backup.originalId === originalId)
          );
        })
        .map((backup) => {
          const overlay = backup.overlay as any;
          const { _backup, ...cleanOverlay } = overlay;

          return {
            id: backup.id,
            originalId: _backup.originalId,
            overlay: cleanOverlay,
            backupReason: _backup.reason,
            createdAt: backup.createdAt!,
          };
        });
    } catch (error) {
      console.error("Failed to get backups:", error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<string> {
    try {
      // Get the backup
      const backup = await db
        .select()
        .from(knowledge)
        .where(eq(knowledge.id, backupId))
        .limit(1);

      if (!backup.length) {
        throw new Error("Backup not found");
      }

      const backupOverlay = backup[0].overlay as any;
      if (!backupOverlay._backup) {
        throw new Error("Invalid backup record");
      }

      const { _backup, ...cleanOverlay } = backupOverlay;

      // Deactivate current active knowledge
      await db
        .update(knowledge)
        .set({ isActive: false })
        .where(eq(knowledge.isActive, true));

      // Create new active knowledge from backup
      const [restored] = await db
        .insert(knowledge)
        .values({
          overlay: {
            ...cleanOverlay,
            _restored: {
              fromBackupId: backupId,
              originalId: _backup.originalId,
              restoredAt: new Date().toISOString(),
            },
          },
          isActive: true,
        })
        .returning();

      return restored.id;
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      throw new Error("Restore failed");
    }
  }

  /**
   * Create a new version with change tracking
   */
  async createVersion(
    newOverlay: Record<string, unknown>,
    changeLog: string = "Knowledge update"
  ): Promise<string> {
    try {
      // Create backup of current version first
      const current = await db
        .select()
        .from(knowledge)
        .where(eq(knowledge.isActive, true))
        .orderBy(desc(knowledge.updatedAt))
        .limit(1);

      if (current.length > 0) {
        await this.createBackup(current[0].id, `Before: ${changeLog}`);
      }

      // Deactivate current version
      await db
        .update(knowledge)
        .set({ isActive: false })
        .where(eq(knowledge.isActive, true));

      // Create new version
      const [newVersion] = await db
        .insert(knowledge)
        .values({
          overlay: {
            ...newOverlay,
            _version: {
              changeLog,
              createdAt: new Date().toISOString(),
              previousVersionId: current.length > 0 ? current[0].id : null,
            },
          },
          isActive: true,
        })
        .returning();

      return newVersion.id;
    } catch (error) {
      console.error("Failed to create knowledge version:", error);
      throw new Error("Version creation failed");
    }
  }

  /**
   * Get version history
   */
  async getVersionHistory(): Promise<KnowledgeVersion[]> {
    try {
      const versions = await db
        .select()
        .from(knowledge)
        .orderBy(desc(knowledge.createdAt));

      return versions
        .filter((version) => {
          const overlay = version.overlay as any;
          return !overlay._backup; // Exclude backups from version history
        })
        .map((version) => {
          const overlay = version.overlay as any;
          const { _version, _restored, ...cleanOverlay } = overlay;

          return {
            id: version.id,
            overlay: cleanOverlay,
            isActive: version.isActive || false,
            version: 1, // TODO: Implement proper version numbering
            changeLog:
              _version?.changeLog || _restored
                ? "Restored from backup"
                : "Initial version",
            createdAt: version.createdAt!,
            updatedAt: version.updatedAt!,
          };
        });
    } catch (error) {
      console.error("Failed to get version history:", error);
      return [];
    }
  }

  /**
   * Compare two knowledge versions
   */
  compareVersions(
    version1: Record<string, unknown>,
    version2: Record<string, unknown>
  ): {
    added: string[];
    removed: string[];
    modified: Array<{
      path: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
  } {
    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{
      path: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];

    // Find added and modified
    this.compareRecursive(version1, version2, "", added, modified, "forward");

    // Find removed
    this.compareRecursive(version2, version1, "", removed, [], "reverse");

    return { added, removed, modified };
  }

  private compareRecursive(
    obj1: unknown,
    obj2: unknown,
    currentPath: string,
    changes: string[],
    modifications: Array<{
      path: string;
      oldValue: unknown;
      newValue: unknown;
    }>,
    direction: "forward" | "reverse"
  ): void {
    if (typeof obj2 === "object" && obj2 !== null && !Array.isArray(obj2)) {
      const obj2Record = obj2 as Record<string, unknown>;

      for (const key in obj2Record) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        if (typeof obj1 === "object" && obj1 !== null && !Array.isArray(obj1)) {
          const obj1Record = obj1 as Record<string, unknown>;

          if (!(key in obj1Record)) {
            changes.push(newPath);
          } else if (obj1Record[key] !== obj2Record[key]) {
            if (direction === "forward") {
              modifications.push({
                path: newPath,
                oldValue: obj1Record[key],
                newValue: obj2Record[key],
              });
            }

            // Recurse for nested objects
            if (
              typeof obj1Record[key] === "object" &&
              typeof obj2Record[key] === "object"
            ) {
              this.compareRecursive(
                obj1Record[key],
                obj2Record[key],
                newPath,
                changes,
                modifications,
                direction
              );
            }
          }
        } else {
          changes.push(newPath);
        }
      }
    }
  }

  /**
   * Clean up old backups (keep last N backups)
   */
  async cleanupOldBackups(keepCount: number = 10): Promise<number> {
    try {
      const backups = await this.getBackups();

      if (backups.length <= keepCount) {
        return 0; // Nothing to clean up
      }

      const toDelete = backups.slice(keepCount);
      let deletedCount = 0;

      for (const backup of toDelete) {
        try {
          await db.delete(knowledge).where(eq(knowledge.id, backup.id));
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete backup ${backup.id}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("Failed to cleanup old backups:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const knowledgeVersioning = new KnowledgeVersioningService();
