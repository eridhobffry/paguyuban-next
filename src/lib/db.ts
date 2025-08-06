import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export { pool };

export interface User {
  id: string;
  email: string;
  password_hash: string;
  user_type: "admin" | "user";
  role?: "admin" | "user"; // for compatibility
  created_at: Date;
  updated_at: Date;
}

export interface AccessRequest {
  id: number;
  email: string;
  password_hash: string;
  status: "pending" | "approved" | "rejected";
  requested_at: Date;
  approved_at?: Date;
  approved_by?: string;
}

export async function createUser(
  email: string,
  passwordHash: string,
  userType: "admin" | "user" = "user"
): Promise<User> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO users (id, email, password_hash, user_type) VALUES (gen_random_uuid()::text, $1, $2, $3) RETURNING *",
      [email, passwordHash, userType]
    );
    const user = result.rows[0];
    user.role = user.user_type; // for compatibility
    return user;
  } finally {
    client.release();
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email]
    );
    const user = result.rows[0];
    if (user) {
      user.role = user.user_type; // for compatibility
    }
    return user || null;
  } finally {
    client.release();
  }
}

export async function createAccessRequest(
  email: string,
  passwordHash: string
): Promise<AccessRequest> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO access_requests (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email, passwordHash]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getAccessRequests(
  status?: string
): Promise<AccessRequest[]> {
  const client = await pool.connect();
  try {
    let query = "SELECT * FROM access_requests ORDER BY requested_at DESC";
    let params: string[] = [];

    if (status) {
      query =
        "SELECT * FROM access_requests WHERE status = $1 ORDER BY requested_at DESC";
      params = [status];
    }

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function updateAccessRequestStatus(
  id: number,
  status: "approved" | "rejected",
  approvedBy: string
): Promise<AccessRequest> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE access_requests SET status = $1, approved_at = CURRENT_TIMESTAMP, approved_by = $2 WHERE id = $3 RETURNING *",
      [status, approvedBy, id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getAccessRequestByEmail(
  email: string
): Promise<AccessRequest | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM access_requests WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getAllUsers(): Promise<User[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM users WHERE user_type != 'admin' ORDER BY created_at DESC"
    );
    return result.rows.map((user) => {
      user.role = user.user_type; // for compatibility
      return user;
    });
  } finally {
    client.release();
  }
}

export async function revokeUserAccess(email: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE users SET is_active = false WHERE email = $1 AND user_type != 'admin'",
      [email]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

export async function restoreUserAccess(email: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE users SET is_active = true WHERE email = $1 AND user_type != 'admin'",
      [email]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  } finally {
    client.release();
  }
}

export async function deleteUser(email: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    // Delete from both users and access_requests tables
    await client.query("BEGIN");

    const userResult = await client.query(
      "DELETE FROM users WHERE email = $1 AND user_type != 'admin'",
      [email]
    );

    await client.query("DELETE FROM access_requests WHERE email = $1", [email]);

    await client.query("COMMIT");
    return userResult.rowCount ? userResult.rowCount > 0 : false;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Document management interfaces and functions
export interface Document {
  id: string;
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  file_url?: string;
  external_url?: string;
  restricted: boolean;
  file_size?: number;
  mime_type?: string;
  ai_generated: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentInput {
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  file_url?: string;
  external_url?: string;
  restricted: boolean;
  file_size?: number;
  mime_type?: string;
  ai_generated?: boolean;
  created_by: string;
}

// Initialize document table
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

      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_restricted ON documents(restricted);
      CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
    `);
  } finally {
    client.release();
  }
}

export async function createDocument(doc: DocumentInput): Promise<Document> {
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
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getAllDocuments(): Promise<Document[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM documents ORDER BY created_at DESC"
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM documents WHERE id = $1", [
      id,
    ]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentInput>
): Promise<Document | null> {
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
    return result.rows[0] || null;
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

export async function getPublicDocuments(): Promise<Document[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM documents WHERE restricted = false ORDER BY created_at DESC"
    );
    return result.rows;
  } finally {
    client.release();
  }
}
