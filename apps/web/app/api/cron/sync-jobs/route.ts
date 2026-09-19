import { syncJobs } from "@/scripts/sync-otta-jobs";

/**
 * Cron endpoint for syncing jobs from Otta API
 *
 * Vercel Cron Configuration (in vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/sync-jobs",
 *       "schedule": "0 2 * * *"  // Daily at 2 AM UTC
 *     }
 *   ]
 * }
 *
 * GitHub Actions alternative:
 * - Trigger on schedule: cron: '0 2 * * *'
 * - Call: curl https://your-domain.com/api/cron/sync-jobs
 */

export async function GET(request: Request) {
  // Verify Vercel cron secret or basic auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    console.log("Starting scheduled job sync...");
    const result = await syncJobs();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Job sync completed",
        result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cron job sync failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
