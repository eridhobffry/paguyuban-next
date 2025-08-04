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
