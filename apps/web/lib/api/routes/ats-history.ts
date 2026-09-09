import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, atsScoreSnapshot, cv } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

const createSchema = z.object({
  documentId: z.string(),
  documentType: z.string().default("cv"),
  score: z.number().int().min(0).max(100),
  checks: z.any().optional(),
});

export const atsHistoryRoutes = new Hono()

  .get("/:documentId", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const docId = c.req.param("documentId");
    const snapshots = await db
      .select()
      .from(atsScoreSnapshot)
      .where(
        and(
          eq(atsScoreSnapshot.documentId, docId),
          eq(atsScoreSnapshot.userId, userId)
        )
      )
      .orderBy(desc(atsScoreSnapshot.createdAt))
      .limit(30);

    return c.json({ success: true, data: snapshots });
  })

  .post("/", zValidator("json", createSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    // Verify the snapshot is being attached to a document the caller owns, so a
    // user can't pollute another user's ATS history/summary. (CV is the only
    // document type that produces snapshots.)
    if (body.documentType === "cv") {
      const [owned] = await db
        .select({ id: cv.id })
        .from(cv)
        .where(and(eq(cv.id, body.documentId), eq(cv.userId, userId)))
        .limit(1);
      if (!owned) return c.json({ error: "Not found" }, 404);
    }

    const [snapshot] = await db.insert(atsScoreSnapshot).values({
      id: nanoid(),
      documentId: body.documentId,
      documentType: body.documentType,
      userId,
      score: body.score,
      checks: body.checks ?? {},
    }).returning();

    return c.json({ success: true, data: snapshot }, 201);
  })

  // Get latest score for each of user's documents
  .get("/user/summary", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    // Get most recent snapshot per document
    const allSnapshots = await db
      .select()
      .from(atsScoreSnapshot)
      .where(eq(atsScoreSnapshot.userId, userId))
      .orderBy(desc(atsScoreSnapshot.createdAt))
      .limit(100);

    // Deduplicate: keep latest per document
    const perDoc = new Map<string, typeof allSnapshots[0]>();
    for (const s of allSnapshots) {
      if (!perDoc.has(s.documentId)) {
        perDoc.set(s.documentId, s);
      }
    }

    // Calculate trend: compare latest with previous for each doc
    const summaries: Record<string, any> = {};
    for (const [docId, latest] of perDoc) {
      const history = allSnapshots.filter(s => s.documentId === docId);
      const prev = history.length > 1 ? history[1].score : null;
      summaries[docId] = {
        current: latest.score,
        previous: prev,
        change: prev !== null ? latest.score - prev : null,
        snapshotId: latest.id,
        createdAt: latest.createdAt,
      };
    }

    return c.json({ success: true, data: summaries });
  });
