import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, cv, debugEvent } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { downloadLog } from "@/lib/db";
import { nanoid, customAlphabet } from "nanoid";
import { createHash } from "node:crypto";
import { parseCvLoose } from "@/lib/career-profile/mapper";
import { seedProfileFromCv } from "@/lib/career-profile/sync";
import { toStoredCvData } from "@sumaiya/utils/cv-shape";

// The native app's api-client normalizes to the stored (web) shape before
// writing, but a row written by an older/unpatched client — or anything that
// ever calls this API directly — can still be in the app's own shape
// (personalInfo/headline/title instead of personal/jobTitle/position). Web
// reads it as blank rather than erroring, so it looks like the CV lost all
// its content. Normalize on the way out so either shape renders correctly.
/** Appends a template id to a CV's usage history if it isn't already there.
 *  Never mutates the input; a jsonb column can come back as `unknown`, so
 *  a non-array value (a stale row from before this column existed, or a
 *  malformed one) is treated as empty rather than thrown on. */
export function withTemplateInHistory(history: unknown, templateId: string | undefined): string[] {
  const ids = Array.isArray(history) ? (history as string[]) : [];
  if (!templateId || ids.includes(templateId)) return ids;
  return [...ids, templateId];
}

function withStoredShape<T extends { data: unknown }>(doc: T): T {
  return { ...doc, data: toStoredCvData(doc.data) };
}

// URL-clean slug suffix — no ambiguous chars (0/o, 1/l), lowercase only. Keeps
// public links tidy AND unguessable (so /cv/<slug> can't be enumerated).
const slugSuffix = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 6);

async function mintPublicSlug(fullName: string, title: string): Promise<string> {
  const base = (fullName || title || "cv")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "") || "cv";
  for (let i = 0; i < 5; i++) {
    const slug = `${base}-${slugSuffix()}`;
    const [clash] = await db.select({ id: cv.id }).from(cv).where(eq(cv.publicSlug, slug)).limit(1);
    if (!clash) return slug;
  }
  return `cv-${slugSuffix()}${slugSuffix()}`;
}

const cvUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  status: z.enum(["draft", "complete"]).optional(),
});

const cvCreateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  // Optional idempotency key from the guest-CV migration flow. When present the
  // new CV's id is derived deterministically from (userId, clientId), so a
  // retried migration (lost response, back-nav, double-invoked effect) creates
  // the CV at most once instead of a duplicate on every attempt.
  clientId: z.string().min(8).max(64).optional(),
});

export const cvRoutes = new Hono()

  .post("/", zValidator("json", cvCreateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    // Derive a deterministic id from (userId, clientId) when an idempotency key
    // is supplied. Hashing in the user id guarantees a client can never target
    // (and, via the conflict path below, read back) another user's row.
    const id = body.clientId
      ? "m_" + createHash("sha256").update(`${userId}:${body.clientId}`).digest("base64url").slice(0, 20)
      : nanoid();

    const initialTemplateId = body.templateId ?? "nakuru";
    const values = {
      id,
      userId,
      title: body.title ?? "My CV",
      templateId: initialTemplateId,
      primaryColor: body.primaryColor ?? "#DA4A1C",
      fontFamily: body.fontFamily ?? "Inter",
      data: body.data ?? {},
      // Grandfather fix — see the PATCH handler below for the full reasoning.
      templateHistory: [initialTemplateId],
    };

    // THE SPINE: every CV write seeds the Career Profile (source "cv:<id>").
    // Non-destructive + provenance-aware; never throws, so a sync failure can
    // never break the CV save itself.
    const seed = async (docId: string) => {
      if (body.data && typeof body.data === "object" && Object.keys(body.data).length) {
        await seedProfileFromCv(userId, parseCvLoose(body.data), { source: `cv:${docId}`, confidence: 1 });
      }
    };

    if (body.clientId) {
      // Idempotent upsert keyed by (userId, clientId). A repeated write of the
      // same draft no-ops instead of creating a duplicate — but unlike a plain
      // insert-only conflict, a NEWER write (mobile sync edit) UPDATES the row
      // so the offline queue can propagate edits, not just the first create.
      // On conflict, return the existing row — which is provably this user's,
      // since the id is derived from their userId.
      const [inserted] = await db.insert(cv).values(values).onConflictDoNothing({ target: cv.id }).returning();
      if (inserted) {
        await seed(inserted.id);
        return c.json({ success: true, data: inserted }, 201);
      }
      const [existingRow] = await db.select({ templateHistory: cv.templateHistory }).from(cv).where(eq(cv.id, id)).limit(1);
      const [updated] = await db
        .update(cv)
        .set({
          title: values.title,
          templateId: values.templateId,
          primaryColor: values.primaryColor,
          fontFamily: values.fontFamily,
          data: values.data,
          templateHistory: withTemplateInHistory(existingRow?.templateHistory, values.templateId),
          updatedAt: new Date(),
        })
        .where(and(eq(cv.id, id), eq(cv.userId, userId)))
        .returning();
      if (updated) {
        await seed(updated.id);
        return c.json({ success: true, data: updated }, 200);
      }
      // Extremely unlikely (hash collision with another user's id): fall back to
      // a fresh random id so the user still gets their CV.
      const [fresh] = await db.insert(cv).values({ ...values, id: nanoid() }).returning();
      await seed(fresh.id);
      return c.json({ success: true, data: fresh }, 201);
    }

    const [doc] = await db.insert(cv).values(values).returning();
    await seed(doc.id);
    return c.json({ success: true, data: doc }, 201);
  })

  .get("/", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const docs = await db.select().from(cv).where(eq(cv.userId, userId));
    // TEMP diagnostic (remove once the intermittent-empty-list bug is caught):
    // a 200 with zero rows for an account known to have CVs looks identical
    // to "no CVs" on the client. console.log alone isn't enough to catch a
    // RARE, intermittent case — this plan's runtime-log retention is 1h/1day,
    // so by the time anyone notices and goes looking, the log is long gone.
    // Write a durable row instead (best-effort — a write failure here must
    // never break the actual response). Awaited, not fire-and-forget: a
    // serverless function can be frozen the instant the response is sent,
    // which would silently drop an un-awaited insert before it completes.
    if (docs.length === 0) {
      try {
        await db.insert(debugEvent).values({
          id: `dbg_${nanoid()}`,
          kind: "cv-list-empty",
          userId,
          detail: { path: "/api/cv", method: "GET" },
        });
      } catch (e) {
        console.error("[cv-list-diag] durable log write failed:", e);
      }
    }
    return c.json({ success: true, data: docs.map(withStoredShape) });
  })

  .get("/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [doc] = await db
      .select()
      .from(cv)
      .where(and(eq(cv.id, c.req.param("id")), eq(cv.userId, userId)))
      .limit(1);

    if (!doc) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: withStoredShape(doc) });
  })

  .patch("/:id", zValidator("json", cvUpdateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    const [existing] = await db
      .select({ id: cv.id, templateHistory: cv.templateHistory })
      .from(cv)
      .where(and(eq(cv.id, c.req.param("id")), eq(cv.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    // Grandfather fix: a template that was ever saved on this CV stays
    // unlocked for it even if it becomes premium later (lib/types "Premium
    // flagships"). Without this, switching templates away and back could
    // paywall something the owner already made for free.
    const nextHistory = withTemplateInHistory(existing.templateHistory, body.templateId);

    const [updated] = await db
      .update(cv)
      .set({ ...body, templateHistory: nextHistory, updatedAt: new Date() })
      .where(and(eq(cv.id, c.req.param("id")), eq(cv.userId, userId)))
      .returning();

    // THE SPINE: a save with CV data re-syncs the Career Profile (same source
    // family "cv:<id>", newer timestamp wins over the previous CV seed).
    if (body.data && typeof body.data === "object" && Object.keys(body.data).length) {
      await seedProfileFromCv(userId, parseCvLoose(body.data), { source: `cv:${existing.id}`, confidence: 1 });
    }

    return c.json({ success: true, data: updated });
  })

  .delete("/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [existing] = await db
      .select({ id: cv.id })
      .from(cv)
      .where(and(eq(cv.id, c.req.param("id")), eq(cv.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    await db.delete(cv).where(and(eq(cv.id, c.req.param("id")), eq(cv.userId, userId)));
    return c.json({ success: true });
  })

  // Idempotent delete for the mobile sync queue: the client only knows its
  // LOCAL cv id, so the server derives the row id from (userId, clientId) the
  // same way POST / does. Deleting a cv the server never saw is still success —
  // the desired end state (gone) is already true, so the queue drains instead
  // of retrying a 404 into the needs-attention state.
  .delete("/", zValidator("query", z.object({ clientId: z.string().min(8).max(64) })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { clientId } = c.req.valid("query");
    const id = "m_" + createHash("sha256").update(`${userId}:${clientId}`).digest("base64url").slice(0, 20);

    await db.delete(cv).where(and(eq(cv.id, id), eq(cv.userId, userId)));
    return c.json({ success: true });
  })

  .post("/:id/duplicate", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [source] = await db
      .select()
      .from(cv)
      .where(and(eq(cv.id, c.req.param("id")), eq(cv.userId, userId)))
      .limit(1);

    if (!source) return c.json({ error: "Not found" }, 404);

    const [copy] = await db.insert(cv).values({
      id: nanoid(),
      userId,
      title: `Copy of ${source.title}`,
      templateId: source.templateId,
      primaryColor: source.primaryColor,
      fontFamily: source.fontFamily,
      data: source.data ?? {},
    }).returning();

    return c.json({ success: true, data: copy }, 201);
  })

  .post("/:id/download", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const cvId = c.req.param("id");
    const [existing] = await db
      .select({ id: cv.id })
      .from(cv)
      .where(and(eq(cv.id, cvId), eq(cv.userId, userId)))
      .limit(1);
    if (!existing) return c.json({ error: "Not found" }, 404);

    await Promise.all([
      db.update(cv)
        .set({ downloadCount: sql`${cv.downloadCount} + 1`, updatedAt: new Date() })
        .where(eq(cv.id, cvId)),
      db.insert(downloadLog).values({
        id: nanoid(),
        userId,
        documentId: cvId,
        documentType: "cv",
        format: "pdf",
      }),
    ]);

    return c.json({ success: true });
  })

  // ── Public share toggle ("CV yako mtandaoni") ──────────────────────────────
  // Owner-only. Turns the public link on/off and controls whether contact
  // details show. The slug is minted once (on first enable) and kept when
  // toggled off, so re-sharing reuses the same URL.
  .post("/:id/share", zValidator("json", z.object({
    isPublic: z.boolean().optional(),
    showContact: z.boolean().optional(),
  })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const cvId = c.req.param("id");
    const body = c.req.valid("json");

    const [existing] = await db
      .select({ data: cv.data, title: cv.title, publicSlug: cv.publicSlug })
      .from(cv)
      .where(and(eq(cv.id, cvId), eq(cv.userId, userId)))
      .limit(1);
    if (!existing) return c.json({ error: "Not found" }, 404);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.showContact === "boolean") updates.publicShowContact = body.showContact;
    if (typeof body.isPublic === "boolean") {
      updates.isPublic = body.isPublic;
      if (body.isPublic && !existing.publicSlug) {
        const fullName = String((existing.data as { personal?: { fullName?: string } })?.personal?.fullName ?? "");
        updates.publicSlug = await mintPublicSlug(fullName, existing.title);
      }
    }

    const [updated] = await db
      .update(cv)
      .set(updates)
      .where(and(eq(cv.id, cvId), eq(cv.userId, userId)))
      .returning({ isPublic: cv.isPublic, publicSlug: cv.publicSlug, publicShowContact: cv.publicShowContact });

    return c.json({ success: true, data: updated });
  });
