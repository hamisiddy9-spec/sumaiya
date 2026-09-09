import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, businessCard } from "@/lib/db";
import { nanoid } from "nanoid";

// Create-with-data endpoint for business cards — parity with POST /api/cv, so the
// universal AI assistant (and any future caller) can create a fully-populated
// card in one request instead of the create-empty-then-PATCH dance. Owner-scoped.
const createSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  data: z.record(z.unknown()).optional(),
});

export const businessCardRoutes = new Hono()
  .post("/", zValidator("json", createSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    const [doc] = await db.insert(businessCard).values({
      id: nanoid(),
      userId,
      title: body.title ?? "My Business Card",
      templateId: body.templateId ?? "classic",
      primaryColor: body.primaryColor ?? "#1e293b",
      data: body.data ?? {},
    }).returning();

    return c.json({ success: true, data: doc }, 201);
  });
