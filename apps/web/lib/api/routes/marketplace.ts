import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getAuthUser } from "@/lib/api/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db, templateSubmission } from "@/lib/db";
import { MARKETPLACE_ENABLED } from "@/lib/flags";

const submitSchema = z.object({
  docType: z.enum(["cv", "cover-letter", "business-card", "letter"]).default("cv"),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  baseTemplateId: z.string().min(1).max(120),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().max(120).optional(),
  sectionOrder: z.array(z.string()).optional(),
});

export const marketplaceRoutes = new Hono()
  // Submit a design to the moderation queue. Captures a color/font/section-order
  // combo over a built-in base — never arbitrary layout code.
  .post("/submit", zValidator("json", submitSchema), async (c) => {
    if (!MARKETPLACE_ENABLED) {
      return c.json({ error: "The template marketplace isn't open yet." }, 403);
    }
    const user = await getAuthUser(c);
    if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    const submitterName =
      ((user.user_metadata?.name as string | undefined) || user.email?.split("@")[0] || "").slice(0, 60);

    try {
      const [row] = await db
        .insert(templateSubmission)
        .values({
          id: nanoid(),
          userId: user.id,
          submitterName,
          docType: body.docType,
          name: body.name,
          description: body.description ?? "",
          category: body.category ?? "",
          baseTemplateId: body.baseTemplateId,
          primaryColor: body.primaryColor ?? "#DA4A1C",
          fontFamily: body.fontFamily ?? "Inter",
          sectionOrder: body.sectionOrder ?? [],
        })
        .returning();
      return c.json({ success: true, data: row }, 201);
    } catch (err) {
      // Table may not exist yet if the 0003 migration hasn't run.
      console.error("[marketplace:submit] failed:", err);
      return c.json({ error: "Couldn't submit right now. Please try again later." }, 500);
    }
  });
