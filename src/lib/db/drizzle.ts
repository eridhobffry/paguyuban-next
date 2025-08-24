import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
});

export const db = drizzle(pool);
