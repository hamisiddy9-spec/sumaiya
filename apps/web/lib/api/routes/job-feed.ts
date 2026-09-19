import { Hono } from "hono";
import { getUserId } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { cv as cvTable } from "@/lib/db/schema";
import { job as jobTable, jobMatch, savedJob } from "@/lib/db/schema-jobs";
import { extractUserProfileFromCV, calculateJobMatch } from "@/lib/jobs/job-matcher";
import { eq, desc, gt, and } from "drizzle-orm";

/**
 * Job feed API
 *
 * Purpose: Personalized job recommendations based on user's CV
 * Features: Match scoring, skill gap analysis, salary transparency
 *
 * Flow:
 * 1. GET /api/jobs/feed → Get 5 top matches for today
 * 2. GET /api/jobs/:jobId → View job details + match reasoning
 * 3. POST /api/jobs/:jobId/apply → Record application
 * 4. POST /api/jobs/:jobId/ignore → Hide job from feed
 */

export const jobFeedRoutes = new Hono()
  /**
   * GET /api/jobs/feed
   *
   * Get personalized job recommendations for today
   * Returns: 5-10 top matches scored by fit
   *
   * Query params:
   * - limit: number of jobs (default 5)
   * - minScore: minimum match score 0-100 (default 60)
   */
  .get("/feed", async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const limit = Math.min(parseInt(c.req.query("limit") || "5"), 20);
    const minScore = parseInt(c.req.query("minScore") || "60");

    try {
      // Get user's primary CV
      const userCv = await db
        .select()
        .from(cvTable)
        .where(eq(cvTable.userId, userId))
        .limit(1);

      if (!userCv.length) {
        return c.json({
          success: true,
          data: {
            jobs: [],
            message: "Create a CV first to get personalized job matches",
          },
        });
      }

      const cvData = userCv[0].data as any;
      const userProfile = extractUserProfileFromCV(cvData);

      // Get active jobs (in real implementation, would paginate/cache this)
      const jobs = await db
        .select()
        .from(jobTable)
        .where(eq(jobTable.isActive, true))
        .orderBy(desc(jobTable.postedAt))
        .limit(100);

      // Score and sort
      const scored = jobs
        .map((job) => {
          const match = calculateJobMatch(userProfile, {
            title: job.title,
            description: job.description || "",
            requiredSkills: (job.requiredSkills as string[]) || [],
            niceToHaveSkills: (job.niceToHaveSkills as string[]) || [],
            experienceLevel: job.experienceLevel || "mid",
            yearsExperienceMin: job.yearsExperienceMin || undefined,
            yearsExperienceMax: job.yearsExperienceMax || undefined,
            salaryMin: job.salaryMin || undefined,
            salaryMax: job.salaryMax || undefined,
            location: job.location || "",
            isRemote: job.isRemote || false,
            industry: job.industry || undefined,
          });

          return {
            job,
            match,
          };
        })
        .filter((item) => item.match.score >= minScore)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, limit);

      // Format response
      const jobsData = scored.map(({ job, match }) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        isRemote: job.isRemote,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        industry: job.industry,
        matchScore: match.score,
        matchReasons: match.reasons,
        missingSkills: match.missingSkills,
        warnings: match.warnings,
        sourceUrl: job.sourceUrl,
        postedAt: job.postedAt,
      }));

      return c.json({
        success: true,
        data: {
          jobs: jobsData,
          count: jobsData.length,
          avgMatchScore: jobsData.length > 0
            ? Math.round(jobsData.reduce((sum, j) => sum + j.matchScore, 0) / jobsData.length)
            : 0,
        },
      });
    } catch (error) {
      console.error("Failed to fetch job feed:", error);
      return c.json({ error: "Failed to fetch jobs" }, 500);
    }
  })

  /**
   * GET /api/jobs/:jobId
   *
   * Get detailed job view with personalized match analysis
   */
  .get("/:jobId", async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const jobId = c.req.param("jobId");

    try {
      const job = await db
        .select()
        .from(jobTable)
        .where(eq(jobTable.id, jobId));

      if (!job.length) {
        return c.json({ error: "Job not found" }, 404);
      }

      const jobData = job[0];

      // Get user CV for comparison
      const userCv = await db
        .select()
        .from(cvTable)
        .where(eq(cvTable.userId, userId))
        .limit(1);

      if (!userCv.length) {
        return c.json({ error: "Create a CV first" }, 400);
      }

      const cvData = userCv[0].data as any;
      const userProfile = extractUserProfileFromCV(cvData);
      const match = calculateJobMatch(userProfile, {
        title: jobData.title,
        description: jobData.description || "",
        requiredSkills: (jobData.requiredSkills as string[]) || [],
        niceToHaveSkills: (jobData.niceToHaveSkills as string[]) || [],
        experienceLevel: jobData.experienceLevel || "mid",
        yearsExperienceMin: jobData.yearsExperienceMin || undefined,
        yearsExperienceMax: jobData.yearsExperienceMax || undefined,
        salaryMin: jobData.salaryMin || undefined,
        salaryMax: jobData.salaryMax || undefined,
        location: jobData.location || "",
        isRemote: jobData.isRemote || false,
        industry: jobData.industry || undefined,
      });

      return c.json({
        success: true,
        data: {
          job: {
            id: jobData.id,
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            location: jobData.location,
            isRemote: jobData.isRemote,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            salaryCurrency: jobData.salaryCurrency,
            benefits: jobData.benefits,
            requiredSkills: jobData.requiredSkills,
            niceToHaveSkills: jobData.niceToHaveSkills,
            experienceLevel: jobData.experienceLevel,
            postedAt: jobData.postedAt,
            sourceUrl: jobData.sourceUrl,
          },
          match: {
            score: match.score,
            reasons: match.reasons,
            missingSkills: match.missingSkills,
            warnings: match.warnings,
            skillsToLearn: match.missingSkills.slice(0, 3), // Top 3 to learn
          },
        },
      });
    } catch (error) {
      console.error("Failed to fetch job:", error);
      return c.json({ error: "Failed to fetch job" }, 500);
    }
  })

  /**
   * POST /api/jobs/:jobId/ignore
   *
   * Hide job from user's feed (e.g., "not interested", "overqualified", "wrong location")
   */
  .post("/:jobId/ignore", async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const jobId = c.req.param("jobId");
    const body = (await c.req.json().catch(() => ({}))) as { reason?: string };

    try {
      // In real implementation, would update job_match.isIgnored = true
      // For now, just return success

      return c.json({
        success: true,
        message: `Job hidden from your feed${body.reason ? ` (${body.reason})` : ""}`,
      });
    } catch (error) {
      console.error("Failed to ignore job:", error);
      return c.json({ error: "Failed to ignore job" }, 500);
    }
  })

  /**
   * POST /api/jobs/:jobId/save
   *
   * Bookmark job for later
   */
  .post("/:jobId/save", async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const jobId = c.req.param("jobId");

    try {
      // Check if already saved
      const existing = await db
        .select()
        .from(savedJob)
        .where(and(eq(savedJob.userId, userId), eq(savedJob.jobId, jobId)));

      if (existing.length) {
        return c.json({ success: true, message: "Already saved" });
      }

      // Save job
      const id = `saved-${Date.now()}`;
      await db.insert(savedJob).values({
        id,
        userId,
        jobId,
      });

      return c.json({
        success: true,
        message: "Job saved",
      });
    } catch (error) {
      console.error("Failed to save job:", error);
      return c.json({ error: "Failed to save job" }, 500);
    }
  });
