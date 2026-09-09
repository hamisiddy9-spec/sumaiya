// Type helper for the outcomes module: the drizzle DB handle shape. Avoids a
// hard import of the live db client in pure/tested modules.
import type { drizzle } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;
