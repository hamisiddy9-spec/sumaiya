import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, letter } from "@/lib/db";
import { nanoid } from "nanoid";

// The 20 supported formal-letter types (mirrors LetterType in types/index.ts and
// the letter_type Postgres enum). Used to keep the enum column valid.
const LETTER_TYPES = [
  "reference", "resignation", "application", "employment-verification",
  "salary-increase", "promotion", "leave-of-absence", "job-offer",
  "appointment-confirmation", "termination", "business-proposal", "complaint",
  "apology", "inquiry", "authorization", "partnership-mou", "vacate-notice",
  "scholarship", "internship", "sponsorship", "quotation", "invoice", "letterhead",
] as const;
type LetterTypeId = (typeof LETTER_TYPES)[number];

// Create-with-data endpoint for formal letters — parity with POST /api/cv. The
// enum column is set from letterType (or data.letterType), coerced to a valid
// value so a bad string can never break the insert.
const createSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  letterType: z.string().optional(),
  templateId: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  data: z.record(z.unknown()).optional(),
});

function coerceLetterType(raw: unknown): LetterTypeId {
  return LETTER_TYPES.includes(raw as LetterTypeId) ? (raw as LetterTypeId) : "reference";
}

export const letterRoutes = new Hono()
  .post("/", zValidator("json", createSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    const letterType = coerceLetterType(
      body.letterType ?? (body.data as { letterType?: string } | undefined)?.letterType
    );

    const [doc] = await db.insert(letter).values({
      id: nanoid(),
      userId,
      title: body.title ?? "My Letter",
      letterType,
      templateId: body.templateId ?? "formal",
      primaryColor: body.primaryColor ?? "#1e293b",
      data: body.data ?? {},
    }).returning();

    return c.json({ success: true, data: doc }, 201);
  });
