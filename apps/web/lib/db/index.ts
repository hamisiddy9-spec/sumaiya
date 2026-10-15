import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
let _db: DrizzleDb | null = null;

function getDb(): DrizzleDb {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = drizzle(postgres(url, { prepare: false }), { schema });
  }
  return _db;
}

// Proxy defers client creation to first query — safe during build
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    return getDb()[prop as keyof DrizzleDb];
  },
});

export * from "./schema";
