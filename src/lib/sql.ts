import { pool } from "@/lib/db/drizzle";
import type { UserRole, UserStatus, User, AccessRequest } from "@/types/admin";
import type {
  PartnershipApplication,
  PartnershipApplicationInput,
  PartnershipApplicationRecommendation,
  PartnershipApplicationRecommendationInput,
} from "@/types/partnership";
import type { PublicDocument, DocumentInput } from "@/types/documents";

// Re-export for legacy imports like: import type { User } from "@/lib/sql";
export type { User, UserRole, UserStatus, AccessRequest } from "@/types/admin";
export type {
  PartnershipApplication,
  PartnershipApplicationInput,
  PartnershipApplicationRecommendation,
  PartnershipApplicationRecommendationInput,
} from "@/types/partnership";
export type {
  DocumentRow,
  NewDocumentRow,
  PublicDocument,
  DocumentInput,
} from "@/types/documents";

// Deprecated: Access requests are now represented by users with status='pending'

// ----- Utilities for migrating/ensuring the single-table model -----
export async function ensureUsersSingleTableModel(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Ensure users table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_type TEXT,
        role TEXT,
        status TEXT,
        is_super_admin BOOLEAN,
        is_active BOOLEAN,
        requested_at TIMESTAMPTZ,
        approved_at TIMESTAMPTZ,
        approved_by TEXT,
        rejected_at TIMESTAMPTZ,
        rejected_by TEXT,
        disabled_at TIMESTAMPTZ,
        disabled_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add new columns if missing
    const addColumnIfMissing = async (
      name: string,
      ddl: string
    ): Promise<void> => {
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = '${name}'
          ) THEN
            ALTER TABLE users ADD COLUMN ${ddl};
          END IF;
        END $$;
      `);
    };

    await addColumnIfMissing("role", "role TEXT");
    await addColumnIfMissing("status", "status TEXT");
    await addColumnIfMissing("requested_at", "requested_at TIMESTAMPTZ");
    await addColumnIfMissing("approved_at", "approved_at TIMESTAMPTZ");
    await addColumnIfMissing("approved_by", "approved_by TEXT");
    await addColumnIfMissing("rejected_at", "rejected_at TIMESTAMPTZ");
    await addColumnIfMissing("rejected_by", "rejected_by TEXT");
    await addColumnIfMissing("disabled_at", "disabled_at TIMESTAMPTZ");
    await addColumnIfMissing("disabled_by", "disabled_by TEXT");

    // Backfill role from legacy columns
    await client.query(
      `UPDATE users SET role = 'super_admin' WHERE is_super_admin = true AND (role IS NULL OR role = '')`
    );
    await client.query(
      `UPDATE users SET role = 'admin' WHERE (user_type = 'admin') AND (role IS NULL OR role = '')`
    );
    await client.query(
      `UPDATE users SET role = 'member' WHERE (role IS NULL OR role = '')`
    );

    // Backfill status from legacy is_active; default to 'active' if active, else 'disabled'
    await client.query(
      `UPDATE users SET status = CASE WHEN is_active = true THEN 'active' ELSE 'disabled' END WHERE status IS NULL OR status = ''`
    );

    // Ensure updated_at trigger-like behavior via app-level updates; here just leave as-is.
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function ensureUserStatusChangesTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_status_changes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT,
        changed_by TEXT,
        changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_status_changes_email ON user_status_changes(user_email);
      CREATE INDEX IF NOT EXISTS idx_user_status_changes_changed_at ON user_status_changes(changed_at);
    `);
  } finally {
    client.release();
  }
}

export async function createUser(
  email: string,
  passwordHash: string,
  userType: "admin" | "user" = "user"
): Promise<User> {
  const client = await pool.connect();
  try {
    const role: UserRole = userType === "admin" ? "admin" : "member";
    const result = await client.query(
      `INSERT INTO users (id, email, password_hash, user_type, role, status, is_active)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'active', true)
       RETURNING *`,
      [email, passwordHash, userType, role]
    );
    const user = result.rows[0] as User;
    return user;
  } finally {
    client.release();
  }
}

export async function createOrEnsureUser(
  email: string,
  passwordHash: string,
  userType: "admin" | "user" = "user"
): Promise<User> {
  const client = await pool.connect();
  try {
    const desiredRole: UserRole = userType === "admin" ? "admin" : "member";
    const result = await client.query(
      `INSERT INTO users (id, email, password_hash, user_type, role, status, is_active)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'active', true)
       ON CONFLICT (email)
       DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         user_type = CASE WHEN users.role = 'admin' OR users.role = 'super_admin' THEN users.user_type ELSE EXCLUDED.user_type END,
         role = CASE WHEN users.role = 'admin' OR users.role = 'super_admin' THEN users.role ELSE $4 END,
         status = CASE WHEN users.role = 'super_admin' THEN 'active' ELSE 'active' END,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [email, passwordHash, userType, desiredRole]
    );
    const user = result.rows[0] as User;
    return user;
  } finally {
    client.release();
  }
}

// Upsert a request into users by setting status='pending'
export async function upsertPendingUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const now = new Date();
    if (existing.rows[0]) {
      // If super_admin, do not move to pending; just refresh password
      const current: User = existing.rows[0];
      if (current.role === "super_admin") {
        const res = await client.query(
          `UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $1 RETURNING *`,
          [email, passwordHash]
        );
        return res.rows[0] as User;
      }
      const res = await client.query(
        `UPDATE users 
         SET password_hash = $2,
             status = 'pending',
             requested_at = $3,
             updated_at = CURRENT_TIMESTAMP,
             is_active = false,
             user_type = COALESCE(user_type, 'user'),
             role = COALESCE(role, 'member')
         WHERE email = $1
         RETURNING *`,
        [email, passwordHash, now]
      );
      return res.rows[0] as User;
    }
    const res = await client.query(
      `INSERT INTO users (id, email, password_hash, user_type, role, status, requested_at, is_active)
       VALUES (gen_random_uuid()::text, $1, $2, 'user', 'member', 'pending', $3, false)
       RETURNING *`,
      [email, passwordHash, now]
    );
    return res.rows[0] as User;
  } finally {
    client.release();
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1 AND status = 'active'",
      [email]
    );
    const user = result.rows[0] as User | undefined;
    return user || null;
  } finally {
    client.release();
  }
}

// Deprecated: access requests are no longer used
export async function createAccessRequest(
  email: string,
  passwordHash: string
): Promise<AccessRequest> {
  // Intentionally unused: deprecated API surface kept for backward compatibility
  void email;
  void passwordHash;
  throw new Error(
    "createAccessRequest is deprecated. Use upsertPendingUser instead."
  );
}

export async function getAccessRequests(
  _status?: string
): Promise<AccessRequest[]> {
  // Intentionally unused placeholder param
  void _status;
  return [];
}

export async function updateAccessRequestStatus(
  _id: number,
  _status: "approved" | "rejected",
  _approvedBy: string
): Promise<AccessRequest> {
  // Intentionally unused placeholder params
  void _id;
  void _status;
  void _approvedBy;
  throw new Error(
    "updateAccessRequestStatus is deprecated. Use approveUser/rejectUser instead."
  );
}

export async function deleteAccessRequestById(_id: number): Promise<boolean> {
  // Intentionally unused placeholder param
  void _id;
  return false;
}

export async function getAccessRequestByEmail(
  _email: string
): Promise<AccessRequest | null> {
  // Intentionally unused placeholder param
  void _email;
  return null;
}

export async function getAllUsers(status?: UserStatus): Promise<User[]> {
  const client = await pool.connect();
  try {
    if (status) {
      const result = await client.query(
        "SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC",
        [status]
      );
      return result.rows as User[];
    }
    const result = await client.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    return result.rows as User[];
  } finally {
    client.release();
  }
}

export async function disableUser(
  email: string,
  actorEmail: string
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE users SET status = 'disabled', disabled_at = CURRENT_TIMESTAMP, disabled_by = $2, is_active = false, updated_at = CURRENT_TIMESTAMP WHERE email = $1 AND role != 'super_admin'`,
      [email, actorEmail]
    );
    if (res.rowCount && res.rowCount > 0) {
      await client.query(
        `INSERT INTO user_status_changes (user_email, old_status, new_status, changed_by) VALUES ($1, NULL, 'disabled', $2)`,
        [email, actorEmail]
      );
      return true;
    }
    return false;
  } finally {
    client.release();
  }
}

export async function enableUser(
  email: string,
  actorEmail: string
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE users SET status = 'active', approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP), approved_by = COALESCE(approved_by, $2), is_active = true, updated_at = CURRENT_TIMESTAMP WHERE email = $1 AND role != 'super_admin'`,
      [email, actorEmail]
    );
    if (res.rowCount && res.rowCount > 0) {
      await client.query(
        `INSERT INTO user_status_changes (user_email, old_status, new_status, changed_by) VALUES ($1, NULL, 'active', $2)`,
        [email, actorEmail]
      );
      return true;
    }
    return false;
  } finally {
    client.release();
  }
}

export async function deleteUser(email: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      "DELETE FROM users WHERE email = $1 AND role != 'super_admin'",
      [email]
    );
    await client.query("COMMIT");
    return userResult.rowCount ? userResult.rowCount > 0 : false;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function promoteUserToAdmin(email: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE users SET user_type = 'admin', role = 'admin' WHERE email = $1 AND role != 'admin' AND role != 'super_admin'",
      [email]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

export async function demoteUserToMember(email: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE users SET user_type = 'user', role = 'member' WHERE email = $1 AND role = 'admin'",
      [email]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

export async function ensureSuperAdminFlag(email: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      "UPDATE users SET is_super_admin = true, user_type = 'admin', role = 'super_admin', status = 'active', is_active = true WHERE email = $1",
      [email]
    );
  } finally {
    client.release();
  }
}

// Admin actions aligned with new model
export async function approveUser(
  email: string,
  actorEmail: string
): Promise<boolean> {
  return enableUser(email, actorEmail);
}

export async function rejectUser(
  email: string,
  actorEmail: string
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE users SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP, rejected_by = $2, is_active = false, updated_at = CURRENT_TIMESTAMP WHERE email = $1 AND role != 'super_admin'`,
      [email, actorEmail]
    );
    if (res.rowCount && res.rowCount > 0) {
      await client.query(
        `INSERT INTO user_status_changes (user_email, old_status, new_status, changed_by) VALUES ($1, NULL, 'rejected', $2)`,
        [email, actorEmail]
      );
      return true;
    }
    return false;
  } finally {
    client.release();
  }
}

// Document management (raw SQL)

export async function initializeDocumentTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        preview TEXT NOT NULL,
        pages VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        slug VARCHAR(255),
        file_url TEXT,
        external_url TEXT,
        restricted BOOLEAN NOT NULL DEFAULT true,
        file_size BIGINT,
        mime_type VARCHAR(100),
        ai_generated BOOLEAN NOT NULL DEFAULT false,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'documents' AND column_name = 'slug'
        ) THEN
          ALTER TABLE documents ADD COLUMN slug VARCHAR(255);
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_slug ON documents(slug);
      CREATE INDEX IF NOT EXISTS idx_documents_restricted ON documents(restricted);
      CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
    `);
  } finally {
    client.release();
  }
}

export async function createDocument(
  doc: DocumentInput
): Promise<PublicDocument> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO documents (
        title, description, preview, pages, type, icon, 
        file_url, external_url, restricted, file_size, 
        mime_type, ai_generated, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        doc.title,
        doc.description,
        doc.preview,
        doc.pages,
        doc.type,
        doc.icon,
        doc.file_url,
        doc.external_url,
        doc.restricted,
        doc.file_size,
        doc.mime_type,
        doc.ai_generated || false,
        doc.created_by,
      ]
    );
    return result.rows[0] as PublicDocument;
  } finally {
    client.release();
  }
}

export async function getAllDocuments(): Promise<PublicDocument[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM documents ORDER BY created_at DESC"
    );
    return result.rows as PublicDocument[];
  } finally {
    client.release();
  }
}

export async function getDocumentById(
  id: string
): Promise<PublicDocument | null> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM documents WHERE id = $1", [
      id,
    ]);
    return (result.rows[0] as PublicDocument | undefined) || null;
  } finally {
    client.release();
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentInput>
): Promise<PublicDocument | null> {
  const client = await pool.connect();
  try {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = Object.values(updates);
    const result = await client.query(
      `UPDATE documents SET ${fields}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return (result.rows[0] as PublicDocument | undefined) || null;
  } finally {
    client.release();
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query("DELETE FROM documents WHERE id = $1", [
      id,
    ]);
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

export async function getPublicDocuments(): Promise<PublicDocument[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM documents WHERE restricted = false ORDER BY created_at DESC"
    );
    return result.rows as PublicDocument[];
  } finally {
    client.release();
  }
}

// Partnership Applications (raw SQL, runtime-initialized table)

export async function ensurePartnershipApplicationsTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS partnership_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        interest TEXT,
        budget TEXT,
        message TEXT,
        source TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_partnership_applications_email ON partnership_applications(email);
      CREATE INDEX IF NOT EXISTS idx_partnership_applications_created_at ON partnership_applications(created_at);
    `);
  } finally {
    client.release();
  }
}

export async function createPartnershipApplication(
  input: PartnershipApplicationInput
): Promise<PartnershipApplication> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO partnership_applications (name, email, company, phone, interest, budget, message, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.name,
        input.email,
        input.company ?? null,
        input.phone ?? null,
        input.interest ?? null,
        input.budget ?? null,
        input.message ?? null,
        input.source ?? null,
      ]
    );
    return result.rows[0] as PartnershipApplication;
  } finally {
    client.release();
  }
}

// Lookup a partnership application by id
export async function getPartnershipApplicationById(
  id: string
): Promise<PartnershipApplication | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT * FROM partnership_applications WHERE id = $1 LIMIT 1`,
      [id]
    );
    const row = res.rows[0] as PartnershipApplication | undefined;
    return row || null;
  } finally {
    client.release();
  }
}

// Recommendations for partnership applications

export async function ensurePartnershipApplicationRecommendationsTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS partnership_application_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL,
        sentiment TEXT,
        recommended_actions JSONB,
        journey JSONB,
        follow_ups JSONB,
        next_best_action TEXT,
        prospect_summary TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'partnership_application_recommendations'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
          ALTER TABLE partnership_application_recommendations
          ADD CONSTRAINT fk_par_app_rec_app
          FOREIGN KEY (application_id)
          REFERENCES partnership_applications(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS idx_par_app_rec_app ON partnership_application_recommendations(application_id);
      CREATE INDEX IF NOT EXISTS idx_par_app_rec_created_at ON partnership_application_recommendations(created_at);
    `);
  } finally {
    client.release();
  }
}

export async function createPartnershipApplicationRecommendation(
  input: PartnershipApplicationRecommendationInput
): Promise<PartnershipApplicationRecommendation> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO partnership_application_recommendations (
        application_id, sentiment, recommended_actions, journey, follow_ups, next_best_action, prospect_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.applicationId,
        input.sentiment ?? null,
        input.recommendedActions ?? null,
        input.journey ?? null,
        input.followUps ?? null,
        input.nextBestAction ?? null,
        input.prospectSummary ?? null,
      ]
    );
    return result.rows[0] as PartnershipApplicationRecommendation;
  } finally {
    client.release();
  }
}
