import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { recordVersionCreated } from "@/lib/outcomes/events";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, documentVersion, cv, coverLetter, letter, businessCard } from "@/lib/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

// Map a document type to its owning table so a snapshot can only be attached to
// a document the caller actually owns.
const DOC_TABLES = {
  cv,
  "cover-letter": coverLetter,
  letter,
  "business-card": businessCard,
} as const;

const MAX_VERSIONS_PER_DOC = 20;

const createSchema = z.object({
  documentId: z.string().min(1),
  documentType: z.enum(["cv", "cover-letter", "letter", "business-card"]).default("cv"),
  title: z.string().max(200).default(""),
  // The full restorable payload (title, templateId, primaryColor, fontFamily, data).
  snapshot: z.record(z.unknown()),
});

export const versionRoutes = new Hono()

  // Create a version snapshot, then prune to the most recent N for this document.
  .post("/", zValidator("json", createSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    // Verify the caller owns the target document before snapshotting it, so a
    // user can't attach version history to a document that isn't theirs
    // (parity with ats-history).
    const table = DOC_TABLES[body.documentType];
    const [owned] = await db
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.id, body.documentId), eq(table.userId, userId)))
      .limit(1);
    if (!owned) return c.json({ error: "Not found" }, 404);

    const [row] = await db.insert(documentVersion).values({
      id: nanoid(),
      userId,
      documentId: body.documentId,
      documentType: body.documentType,
      title: body.title,
      snapshot: body.snapshot,
    }).returning({ id: documentVersion.id, createdAt: documentVersion.createdAt });

    // Keep only the newest MAX_VERSIONS_PER_DOC snapshots for this doc.
    const stale = await db
      .select({ id: documentVersion.id })
      .from(documentVersion)
      .where(and(eq(documentVersion.userId, userId), eq(documentVersion.documentId, body.documentId)))
      .orderBy(desc(documentVersion.createdAt))
      .offset(MAX_VERSIONS_PER_DOC);
    if (stale.length) {
      await db.delete(documentVersion).where(inArray(documentVersion.id, stale.map((s) => s.id)));
    }

    // WS-10 — product-value event: a recoverable version was created. The
    // title prefix "AI:" marks AI auto-snapshots (vs manual "Save version").
    void recordVersionCreated(db, userId, {
      documentType: body.documentType,
      source: body.title.startsWith("AI:") ? "ai" : "manual",
    }).catch(() => {});

    return c.json({ success: true, data: row }, 201);
  })

  // List version metadata (no snapshot bodies) for a document, newest first.
  .get("/:documentType/:documentId", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const documentId = c.req.param("documentId");
    const rows = await db
      .select({ id: documentVersion.id, title: documentVersion.title, createdAt: documentVersion.createdAt })
      .from(documentVersion)
      .where(and(eq(documentVersion.userId, userId), eq(documentVersion.documentId, documentId)))
      .orderBy(desc(documentVersion.createdAt))
      .limit(MAX_VERSIONS_PER_DOC);

    return c.json({ success: true, data: rows });
  })

  // Fetch a single version's full snapshot (for restore). Scoped to the caller.
  .get("/item/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const [row] = await db
      .select()
      .from(documentVersion)
      .where(and(eq(documentVersion.id, id), eq(documentVersion.userId, userId)))
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);

    return c.json({ success: true, data: row });
  });
