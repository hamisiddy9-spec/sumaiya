import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db, coverLetter, cv } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";

const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  cvId: z.string().optional(),
  content: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  templateId: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  templateId: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  content: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(["draft", "complete"]).optional(),
});

export const coverLetterRoutes = new Hono()

  .get("/", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const docs = await db.select().from(coverLetter).where(eq(coverLetter.userId, userId));
    return c.json({ success: true, data: docs });
  })

  // Create a cover letter — used by the cross-sell "matching cover letter" flow.
  .post("/", zValidator("json", createSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    // Only link a cvId the user actually owns; otherwise store null (the FK
    // would reject an unknown id and 500 the create).
    let cvId: string | null = null;
    if (body.cvId) {
      const [owned] = await db
        .select({ id: cv.id })
        .from(cv)
        .where(and(eq(cv.id, body.cvId), eq(cv.userId, userId)))
        .limit(1);
      cvId = owned ? body.cvId : null;
    }

    const [doc] = await db
      .insert(coverLetter)
      .values({
        id: nanoid(),
        userId,
        cvId,
        title: body.title ?? "My Cover Letter",
        content: body.content ?? "",
        jobTitle: body.jobTitle ?? null,
        companyName: body.companyName ?? null,
        templateId: body.templateId ?? "classic",
        primaryColor: body.primaryColor ?? "#DA4A1C",
        fontFamily: body.fontFamily ?? "Georgia, serif",
      })
      .returning();

    return c.json({ success: true, data: doc }, 201);
  })

  .get("/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [doc] = await db
      .select()
      .from(coverLetter)
      .where(and(eq(coverLetter.id, c.req.param("id")), eq(coverLetter.userId, userId)))
      .limit(1);

    if (!doc) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: doc });
  })

  .patch("/:id", zValidator("json", updateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    const [existing] = await db
      .select({ id: coverLetter.id })
      .from(coverLetter)
      .where(and(eq(coverLetter.id, c.req.param("id")), eq(coverLetter.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    const [updated] = await db
      .update(coverLetter)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(coverLetter.id, c.req.param("id")), eq(coverLetter.userId, userId)))
      .returning();

    return c.json({ success: true, data: updated });
  })

  .post("/:id/download", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [existing] = await db
      .select({ id: coverLetter.id })
      .from(coverLetter)
      .where(and(eq(coverLetter.id, c.req.param("id")), eq(coverLetter.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    await db
      .update(coverLetter)
      .set({ downloadCount: sql`${coverLetter.downloadCount} + 1` })
      .where(eq(coverLetter.id, c.req.param("id")));

    return c.json({ success: true });
  })

  .delete("/:id", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [existing] = await db
      .select({ id: coverLetter.id })
      .from(coverLetter)
      .where(and(eq(coverLetter.id, c.req.param("id")), eq(coverLetter.userId, userId)))
      .limit(1);

    if (!existing) return c.json({ error: "Not found" }, 404);

    await db.delete(coverLetter).where(and(eq(coverLetter.id, c.req.param("id")), eq(coverLetter.userId, userId)));
    return c.json({ success: true });
  });
