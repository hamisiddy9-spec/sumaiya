import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, application, cv, coverLetter, atsScoreSnapshot } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { canTransitionStatus } from "@/lib/applications";
import { analyzeJobProfile } from "@/lib/job-analysis";

const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  companyName: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  jobDescription: z.string().optional(),
  jobDescriptionUrl: z.string().max(500).optional(),
  cvId: z.string().optional(),
  coverLetterId: z.string().optional(),
  matchScore: z.number().int().min(0).max(100).optional(),
  status: z.enum(["draft", "applied", "interviewing", "offer", "rejected", "archived"]).optional(),
  appliedAt: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

export const applicationRoutes = new Hono()

  .get("/", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    // Light list shape — the grid renders title/company/status/dates/notes and
    // the workspace (detail page) loads the FULL row itself. jobDescription can
    // be KBs of JD text; shipping it for every row wastes payload on the list.
    const docs = await db
      .select({
        id: application.id,
        title: application.title,
        companyName: application.companyName,
        jobTitle: application.jobTitle,
        cvId: application.cvId,
        coverLetterId: application.coverLetterId,
        matchScore: application.matchScore,
        status: application.status,
        appliedAt: application.appliedAt,
        notes: application.notes,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      })
      .from(application)
      .where(eq(application.userId, userId))
      .orderBy(desc(application.updatedAt))
      .limit(50);

    return c.json({ success: true, data: docs });
  })

  .get("/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [doc] = await db
      .select()
      .from(application)
      .where(and(eq(application.id, c.req.param("id")), eq(application.userId, userId)))
      .limit(1);

    if (!doc) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: doc });
  })

  .post("/", zValidator("json", createSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    const id = nanoid();

    const [doc] = await db.insert(application).values({
      id,
      userId,
      title: body.title ?? "My Application",
      companyName: body.companyName ?? "",
      jobTitle: body.jobTitle ?? "",
      jobDescription: body.jobDescription ?? "",
      jobDescriptionUrl: body.jobDescriptionUrl ?? "",
      cvId: body.cvId ?? null,
      coverLetterId: body.coverLetterId ?? null,
      matchScore: body.matchScore ?? null,
      status: body.status ?? "draft",
      appliedAt: (() => {
        if (!body.appliedAt) return null;
        const d = new Date(body.appliedAt);
        return isNaN(d.getTime()) ? null : d;
      })(),
      notes: body.notes ?? "",
    }).returning();

    // Outcome instrumentation (PR-1): match→outcome chain — the application
    // was created with its match score; later status transitions extend it.
    try {
      const { recordApplicationCreated } = await import("@/lib/outcomes/events");
      await recordApplicationCreated(db, userId, {
        applicationId: id,
        matchScore: body.matchScore ?? null,
        status: doc.status,
      });
    } catch {
      // instrumentation never breaks the flow
    }

    return c.json({ success: true, data: doc }, 201);
  })

  .patch("/:id", zValidator("json", updateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    const [existing] = await db
      .select({ id: application.id, status: application.status, matchScore: application.matchScore })
      .from(application)
      .where(and(eq(application.id, c.req.param("id")), eq(application.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    // Status-transition validation — terminal states (rejected/archived) are
    // TERMINAL; a resolved application can never be revived into the pipeline
    // (that would let a client fake the dashboard's offer/interviewing counts).
    if (body.status && !canTransitionStatus(existing.status, body.status)) {
      return c.json({ error: "That status change isn't allowed." }, 400);
    }

    // Linked documents must belong to THIS user — the from-cv route verifies
    // cv ownership, PATCH must too (an arbitrary id would attach someone
    // else's document to this application).
    if (body.cvId) {
      const [cvDoc] = await db
        .select({ id: cv.id })
        .from(cv)
        .where(and(eq(cv.id, body.cvId), eq(cv.userId, userId)))
        .limit(1);
      if (!cvDoc) return c.json({ error: "CV not found" }, 400);
    }
    if (body.coverLetterId) {
      const [clDoc] = await db
        .select({ id: coverLetter.id })
        .from(coverLetter)
        .where(and(eq(coverLetter.id, body.coverLetterId), eq(coverLetter.userId, userId)))
        .limit(1);
      if (!clDoc) return c.json({ error: "Cover letter not found" }, 400);
    }

    // Keep appliedAt out of the raw spread — an empty or malformed string would
    // otherwise be written straight into the timestamp column and error.
    const { appliedAt, ...rest } = body;
    const updateData: Record<string, any> = { ...rest, updatedAt: new Date() };
    if (appliedAt) {
      const d = new Date(appliedAt);
      if (!isNaN(d.getTime())) updateData.appliedAt = d;
    }

    const [updated] = await db
      .update(application)
      .set(updateData)
      .where(and(eq(application.id, c.req.param("id")), eq(application.userId, userId)))
      .returning();

    // Outcome instrumentation (PR-1): lifecycle transition — did the match
    // prediction hold? The application's matchScore travels with the event.
    if (body.status && body.status !== existing.status) {
      try {
        const { recordApplicationStatus } = await import("@/lib/outcomes/events");
        await recordApplicationStatus(db, userId, {
          applicationId: existing.id,
          from: existing.status,
          to: body.status,
          matchScore: existing.matchScore,
        });
      } catch {
        // instrumentation never breaks the flow
      }
    }

    return c.json({ success: true, data: updated });
  })

  .delete("/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [existing] = await db
      .select({ id: application.id })
      .from(application)
      .where(and(eq(application.id, c.req.param("id")), eq(application.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    await db.delete(application).where(
      and(eq(application.id, c.req.param("id")), eq(application.userId, userId))
    );

    return c.json({ success: true });
  })

  // Create application from CV + JD (one-shot)
  .post("/from-cv", zValidator("json", z.object({
    cvId: z.string(),
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    jobDescription: z.string().optional(),
    matchScore: z.number().int().min(0).max(100).optional(),
    // M2 — the snap-time match breakdown (REAL parsed data, never fabricated).
    // Persisted via atsScoreSnapshot.checks (jsonb) keyed to the application,
    // so the workspace can render per-requirement evidence without re-parsing
    // the JD or inventing anything.
    requirements: z.array(z.string().max(300)).max(60).optional(),
    matched: z.array(z.string().max(300)).max(60).optional(),
    missing: z.array(z.string().max(300)).max(60).optional(),
    // Phase 2 (E): chat-side jobs.track starts the lifecycle at "applied"
    // (the user says they're applying); the editor's "save as application"
    // keeps the draft default.
    status: z.enum(["draft", "applied", "interviewing", "offer", "rejected", "archived"]).optional(),
    appliedAt: z.string().optional(),
  })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    // Verify CV belongs to user
    const [cvDoc] = await db
      .select({ id: cv.id, title: cv.title })
      .from(cv)
      .where(and(eq(cv.id, body.cvId), eq(cv.userId, userId)))
      .limit(1);

    if (!cvDoc) return c.json({ error: "CV not found" }, 404);

    const id = nanoid();
    const title = body.jobTitle
      ? `${body.jobTitle}${body.companyName ? ` @ ${body.companyName}` : ""}`
      : `Application for ${cvDoc.title}`;

    // WS-2 — structured JD intelligence snapshot (deterministic, no AI).
    // Computed server-side from the job description so the application detail
    // page can render requirements/skills/salary without re-parsing.
    const jobProfile = body.jobDescription
      ? analyzeJobProfile(body.jobDescription, body.jobTitle ?? "")
      : undefined;

    const [doc] = await db.insert(application).values({
      id,
      userId,
      title,
      companyName: body.companyName ?? "",
      jobTitle: body.jobTitle ?? "",
      jobDescription: body.jobDescription ?? "",
      jobProfile: jobProfile ?? null,
      cvId: body.cvId,
      matchScore: body.matchScore ?? null,
      status: body.status ?? "draft",
      appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
    }).returning();

    // M2 — persist the snap-time match breakdown against the APPLICATION (not
    // the CV), so the workspace can render per-requirement evidence without
    // touching the CV's own ATS history. Only written when a score exists;
    // best-effort — a failed snapshot write must not fail the application.
    if (body.matchScore !== undefined && body.matchScore !== null) {
      try {
        await db.insert(atsScoreSnapshot).values({
          id: nanoid(),
          documentId: id,
          documentType: "application",
          userId,
          score: body.matchScore,
          checks: {
            requirements: body.requirements ?? [],
            matched: body.matched ?? [],
            missing: body.missing ?? [],
            source: "snap",
          },
        });
      } catch { /* non-fatal */ }
    }

    return c.json({ success: true, data: doc }, 201);
  });
