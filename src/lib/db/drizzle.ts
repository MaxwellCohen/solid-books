import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getPooledDatabaseUrl } from "./database-url";

const connectionString = getPooledDatabaseUrl();

const sql = connectionString ? neon(connectionString) : null;
export const db = sql ? drizzle(sql) : null;

const missingUrlMessage =
  "DATABASE_URL is not set. Run `neon env pull` to write Neon credentials into .env.";

export function requireDb() {
  if (!db) throw new Error(missingUrlMessage);
  return db;
}
