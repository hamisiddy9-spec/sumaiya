/**
 * Otta Job Sync Script
 *
 * Syncs job postings from Otta API (Kenya-focused, 50 jobs/day free tier)
 * to the Sumaiya database. Deduplicates by sourceJobId.
 *
 * Usage:
 *   node scripts/sync-otta-jobs.ts
 *
 * Environment variables:
 *   OTTA_API_KEY - Otta API key (free tier: https://otta.com/docs)
 *   DATABASE_URL - Postgres connection string (used by Drizzle)
 *
 * Cron setup (Vercel Cron):
 *   - Add to vercel.json: { "crons": [{ "path": "/api/cron/sync-jobs", "schedule": "0 2 * * *" }] }
 *   - Or use GitHub Actions with schedule trigger
 */

import { db } from "@/lib/db";
import { job as jobsTable } from "@/lib/db/schema-jobs";
import { eq, sql } from "drizzle-orm";

const OTTA_API_KEY = process.env.OTTA_API_KEY;
const OTTA_BASE_URL = "https://api.otta.com/graphql";

// Otta GraphQL query for job listings
const GET_JOBS_QUERY = `
  query GetJobs($limit: Int!, $offset: Int!) {
    jobs(first: $limit, offset: $offset) {
      edges {
        node {
          id
          title
          description
          applicationUrl
          createdAt
          closesAt
          company {
            id
            name
          }
          location {
            name
          }
          salary {
            currency
            minimum
            maximum
          }
          benefits {
            id
            label
          }
        }
      }
    }
  }
`;

interface OttaJob {
  id: string;
  title: string;
  description: string;
  applicationUrl: string;
  createdAt: string;
  closesAt?: string;
  company: {
    id: string;
    name: string;
  };
  location: {
    name: string;
  };
  salary?: {
    currency: string;
    minimum?: number;
    maximum?: number;
  };
  benefits?: Array<{ id: string; label: string }>;
}

interface OttaResponse {
  data?: {
    jobs: {
      edges: Array<{
        node: OttaJob;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

async function fetchOttaJobs(limit: number = 50, offset: number = 0): Promise<OttaJob[]> {
  if (!OTTA_API_KEY) {
    throw new Error("OTTA_API_KEY not set in environment variables");
  }

  try {
    const response = await fetch(OTTA_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OTTA_API_KEY}`,
      },
      body: JSON.stringify({
        query: GET_JOBS_QUERY,
        variables: { limit, offset },
      }),
    });

    if (!response.ok) {
      throw new Error(`Otta API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OttaResponse;

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data) {
      throw new Error("No data returned from Otta API");
    }

    return data.data.jobs.edges.map((edge) => edge.node);
  } catch (err) {
    console.error("Error fetching from Otta:", err);
    throw err;
  }
}

function parseSalary(salary?: { currency: string; minimum?: number; maximum?: number }): {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
} {
  if (!salary) {
    return { salaryMin: null, salaryMax: null, salaryCurrency: "KES" };
  }

  const { currency, minimum, maximum } = salary;
  const currencyCode = currency === "USD" ? "USD" : "KES";

  return {
    salaryMin: minimum || null,
    salaryMax: maximum || null,
    salaryCurrency: currencyCode,
  };
}

async function syncJobs() {
  console.log("Starting job sync from Otta...");

  try {
    // Fetch from Otta (50 jobs max per request, free tier)
    const ottaJobs = await fetchOttaJobs(50, 0);
    console.log(`Fetched ${ottaJobs.length} jobs from Otta`);

    if (ottaJobs.length === 0) {
      console.log("No jobs to sync");
      return { synced: 0, skipped: 0, errors: 0 };
    }

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const ottaJob of ottaJobs) {
      try {
        // Check if job already exists by sourceJobId
        const existing = await db.query.job.findFirst({
          where: eq(jobsTable.sourceJobId, ottaJob.id),
        });

        const { salaryMin, salaryMax, salaryCurrency } = parseSalary(ottaJob.salary);

        if (existing) {
          // Update if newer
          if (new Date(ottaJob.createdAt) > new Date(existing.createdAt || new Date(0))) {
            await db
              .update(jobsTable)
              .set({
                title: ottaJob.title,
                description: ottaJob.description,
                company: ottaJob.company.name,
                location: ottaJob.location.name,
                salaryMin,
                salaryMax,
                salaryCurrency,
                sourceUrl: ottaJob.applicationUrl,
                expiresAt: ottaJob.closesAt ? new Date(ottaJob.closesAt) : null,
                updatedAt: new Date(),
              })
              .where(eq(jobsTable.sourceJobId, ottaJob.id));
            synced++;
          } else {
            skipped++;
          }
          continue;
        }

        // Insert new job
        await db.insert(jobsTable).values({
          id: `otta-${ottaJob.id}`,
          sourceJobId: ottaJob.id,
          source: "otta",
          title: ottaJob.title,
          description: ottaJob.description,
          company: ottaJob.company.name,
          location: ottaJob.location.name,
          salaryMin,
          salaryMax,
          salaryCurrency,
          sourceUrl: ottaJob.applicationUrl,
          expiresAt: ottaJob.closesAt ? new Date(ottaJob.closesAt) : null,
          postedAt: new Date(ottaJob.createdAt),
          updatedAt: new Date(),
        });
        synced++;
      } catch (err) {
        console.error(`Error syncing job ${ottaJob.id}:`, err);
        errors++;
      }
    }

    console.log(`Sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`);
    return { synced, skipped, errors };
  } catch (err) {
    console.error("Sync failed:", err);
    throw err;
  }
}

// Run if called directly (not imported)
if (require.main === module) {
  syncJobs()
    .then((result) => {
      console.log("Sync result:", result);
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}

export { syncJobs };
