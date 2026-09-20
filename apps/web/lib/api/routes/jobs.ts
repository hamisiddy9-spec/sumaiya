import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getAuthUser } from "@/lib/api/auth";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";
import { db, job, userProfile } from "@/lib/db";
import { eq, desc, inArray, and, or, ilike } from "drizzle-orm";
import { nanoid } from "nanoid";
import { LIVE_STATUSES } from "@/lib/jobs/constants";
import { homeMarketFirst } from "@/lib/jobs/feed-filter";
import { getRecommendations } from "@/lib/jobs/recommend";
import { enrichJob } from "@/lib/jobs/enrich";
import { parseCareerProfile } from "@/types";
import { buildTargetedCv } from "@/lib/targeted-cv";
import { isPickRequest, normalizePickQuery, parsePickLimit } from "@sumaiya/api-client";

const jobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  employmentType: z.string().max(60).optional(),
  description: z.string().max(20000).optional(),
  // Only http(s) links — a stored javascript:/data: URL would execute when a
  // visitor clicks Apply on the public feed.
  applyUrl: z.string().max(500).refine((v) => v === "" || /^https?:\/\//i.test(v), {
    message: "Apply URL must start with http:// or https://",
  }).optional(),
  source: z.string().max(200).optional(),
  status: z.enum(["draft", "published", "expiring", "expired", "rejected"]).optional(),
  applicationDeadline: z.string().datetime().optional().nullable(),
  featured: z.boolean().optional(),
  // Legacy alias accepted for backward compatibility (maps to status).
  active: z.boolean().optional(),
});

export const jobRoutes = new Hono()

  // Public feed: live listings (published + expiring), featured first, newest
  // first. Auth not required to browse. Project only public-safe columns —
  // never expose postedBy (an internal user id) or source (internal notes) on
  // an unauthenticated endpoint.
  //
  // The chat's job picker ("chagua kutoka kwenye kazi zetu") uses the SAME
  // endpoint with `?light=1&limit=N[&q=…]`: a projected list with no
  // descriptions (the full feed is ~350 KB of advert text for 100 rows, which
  // is not something a first-time jobseeker on a cheap Android phone should pay
  // to see a list of job titles), and `?id=…` to fetch the one advert they
  // actually chose. With no parameters the response is byte-for-byte what it
  // has always been — the jobs page, the assistant's own job search and the
  // Android jobs screen all depend on that.
  .get("/", async (c) => {
    const pick = {
      id: (c.req.query("id") ?? "").trim(),
      q: normalizePickQuery(c.req.query("q")),
      light: c.req.query("light"),
      limit: c.req.query("limit"),
    };
    try {
      if (isPickRequest(pick)) {
        const limit = parsePickLimit(pick.limit);
        const where = [inArray(job.status, LIVE_STATUSES)];
        // One row, by id — the advert the user chose. Still gated on LIVE_STATUSES
        // so a listing that expired between the list and the tap is not served.
        if (pick.id) where.push(eq(job.id, pick.id));
        // Search across the fields a jobseeker would type: the role, the company,
        // the place. LIKE wildcards are stripped in normalizePickQuery.
        if (pick.q) {
          where.push(
            or(
              ilike(job.title, `%${pick.q}%`),
              ilike(job.company, `%${pick.q}%`),
              ilike(job.location, `%${pick.q}%`),
            )!,
          );
        }
        const rows = await db
          .select({
            id: job.id, title: job.title, company: job.company, location: job.location,
            category: job.category, employmentType: job.employmentType, applyUrl: job.applyUrl,
            status: job.status, featured: job.featured, applicationDeadline: job.applicationDeadline,
            sourceName: job.sourceName, createdAt: job.createdAt,
            // The description is the expensive column: omitted ONLY for the
            // projected pick-list (`light=1`), and always kept for a single-row
            // lookup, which exists precisely to get the advert text.
            ...(pick.light === "1" && !pick.id ? {} : { description: job.description }),
          })
          .from(job)
          .where(and(...where))
          .orderBy(desc(job.featured), desc(job.createdAt))
          .limit(limit);
        c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return c.json({ success: true, data: homeMarketFirst(rows) });
      }

      const rows = await db
        .select({
          id: job.id, title: job.title, company: job.company, location: job.location,
          category: job.category, employmentType: job.employmentType, description: job.description,
          applyUrl: job.applyUrl, status: job.status, featured: job.featured,
          applicationDeadline: job.applicationDeadline, sourceName: job.sourceName,
          createdAt: job.createdAt,
        })
        .from(job)
        .where(inArray(job.status, LIVE_STATUSES))
        .orderBy(desc(job.featured), desc(job.createdAt))
        .limit(100);
      // Public, cacheable feed — let the CDN hold it for 5 min so every visitor
      // doesn't hit Postgres (the nightly cron refreshes the data).
      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      // Home-market first. The query above ranks featured-then-newest, which is
      // correct within a country; across countries it put Berlin, London and
      // Paris at the top of a Tanzanian product's job tab (0 of 8,079 rows
      // mentioned Tanzania before the JobwebTanzania source existed). Ordering
      // only — every row is still returned.
      return c.json({ success: true, data: homeMarketFirst(rows) });
    } catch (err) {
      // Degrade to an empty feed (never 500 the public page), but ALWAYS log
      // the real error — a silent swallow made every DB failure look like
      // "no jobs yet" with zero observability.
      console.error("[jobs] feed query failed:", err);
      return c.json({ success: true, data: [] });
    }
  })

  // Personalized recommendations — top jobs matched to the signed-in user's
  // most recent CV, cached (recomputed on-demand when >12h stale).
  .get("/recommendations", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 3), 1), 10);
    try {
      const recs = await getRecommendations(user.id, limit);
      return c.json({ success: true, data: recs });
    } catch (err) {
      console.error("[jobs] recommendations failed:", err);
      return c.json({ success: true, data: [] });
    }
  })

  // Job → Match → Targeted CV: build a CV reordered around a specific job,
  // using ONLY verified Career Profile facts. Deterministic — no AI, no
  // fabricated scores. The before/after match numbers come from the real
  // engine (matchCvToJd); missing requirements are returned as toConfirm so
  // the UI can ask the user to confirm them (never auto-added).
  .post("/targeted-cv", zValidator("json", z.object({
    jobTitle: z.string().min(1).max(200),
    company: z.string().max(200).optional(),
    jobDescription: z.string().max(20000).optional(),
  })), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const b = c.req.valid("json");

    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile })
      .from(userProfile)
      .where(eq(userProfile.id, user.id))
      .limit(1);

    if (!row?.careerProfile) {
      return c.json({ error: "No career profile yet. Build one from your CV first." }, 404);
    }

    const profile = parseCareerProfile(row.careerProfile);
    const jd = [b.jobTitle, b.company, b.jobDescription ?? ""].filter(Boolean).join("\n");
    const result = buildTargetedCv(profile, jd);

    // Outcome instrumentation (PR-1): the real score the user just saw.
    try {
      const { recordMatchScored } = await import("@/lib/outcomes/events");
      await recordMatchScored(db, user.id, { score: result.after.score, source: "targeted-cv" });
    } catch {
      // instrumentation never breaks the flow
    }

    return c.json({ success: true, data: result });
  })

  // On-demand JD enrichment: fetch the FULL posting from the source's own
  // page for a THIN job (title + a line) and cache the enriched description
  // on the row. Uses the same per-hop SSRF guard as /ai/read-url; falls back
  // to the thin description when the page can't be read — never fabricates.
  .post("/enrich", zValidator("json", z.object({ jobId: z.string().min(1).max(100) })), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    try {
      const result = await enrichJob(c.req.valid("json").jobId);
      if (!result) return c.json({ error: "Job not found" }, 404);
      return c.json({ success: true, data: result });
    } catch (err) {
      console.error("[jobs] enrich failed:", err);
      return c.json({ success: true, data: { enriched: false, reason: "no-usable-page" } });
    }
  })

  // Admin-only management below.
  .post("/", zValidator("json", jobSchema), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!isAdmin(user.email)) return c.json({ error: "Forbidden" }, 403);

    const b = c.req.valid("json");
    // Legacy `active` maps onto the status lifecycle (true → published).
    const status = b.status ?? (b.active === false ? "expired" : "published");
    const [row] = await db.insert(job).values({
      id: nanoid(),
      title: b.title,
      company: b.company ?? "",
      location: b.location ?? "",
      category: b.category ?? "",
      employmentType: b.employmentType ?? "",
      description: b.description ?? "",
      applyUrl: b.applyUrl ?? "",
      source: b.source ?? "admin",
      sourceName: b.source === "jobicy" ? "Jobicy" : b.source === "remotive" ? "Remotive" : "Manual",
      postedBy: user.id,
      status,
      applicationDeadline: b.applicationDeadline ? new Date(b.applicationDeadline) : null,
      featured: b.featured ?? false,
      lastVerifiedAt: new Date(),
    }).returning();
    return c.json({ success: true, data: row }, 201);
  })

  .patch("/:id", zValidator("json", jobSchema.partial()), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!isAdmin(user.email)) return c.json({ error: "Forbidden" }, 403);

    const b = c.req.valid("json");
    const { active, ...rest } = b;
    // Legacy `active` maps onto the status lifecycle (false → expired).
    const patch = { ...rest, updatedAt: new Date() } as Record<string, unknown>;
    if (active === false) patch.status = "expired";
    else if (active === true && !patch.status) patch.status = "published";
    if (typeof patch.applicationDeadline === "string") {
      patch.applicationDeadline = new Date(patch.applicationDeadline as string);
    }

    const [row] = await db.update(job).set(patch).where(eq(job.id, c.req.param("id"))).returning();
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: row });
  })

  // Admin action shortcuts: /:id/status { status } — approve, reject, expire, feature…
  .patch("/:id/status", zValidator("json", z.object({
    status: z.enum(["draft", "published", "expiring", "expired", "rejected"]),
  })), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!isAdmin(user.email)) return c.json({ error: "Forbidden" }, 403);

    const [row] = await db
      .update(job)
      .set({ status: c.req.valid("json").status, updatedAt: new Date() })
      .where(eq(job.id, c.req.param("id")))
      .returning();
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: row });
  })

  .delete("/:id", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    if (!isAdmin(user.email)) return c.json({ error: "Forbidden" }, 403);

    await db.delete(job).where(eq(job.id, c.req.param("id")));
    return c.json({ success: true });
  });
