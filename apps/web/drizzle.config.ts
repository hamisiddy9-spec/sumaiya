import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./lib/db/schema.ts",
    "./lib/db/schema-jobs.ts",
    "./lib/db/schema-outcome.ts",
    "./lib/db/schema-email-applications.ts",
  ],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
