import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import { checkAiQuota, refundAiUsage } from "@/lib/api/ai-limit";
import { callAi, hasAiProvider } from "@/lib/api/ai-provider";
import { sanitizePromptText } from "@/lib/jobs/text";
import { safeParseJson } from "@/lib/api/snap-apply";
import { resourcesForGaps } from "@/lib/learning-resources";
import { assembleUserContext, contextToPromptBlock } from "@/lib/assistant/context";
import { looksLikeJobDescription } from "@/lib/job-match";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";
import { nanoid } from "nanoid";
import { db, deviceToken } from "@/lib/db";
import { sql } from "drizzle-orm";

// Mobile-specific endpoints that the native app talks to with
// `Authorization: Bearer <supabase access token>` (see lib/api/auth.ts).
// These replace the old app/api/chat/sumaiya and app/api/learning/resources
// routes, which were cookie-only (unusable from the app) and returned
// hardcoded mock data.
export const mobileRoutes = new Hono()

  // GET /api/mobile/learning/resources?skills=react,sql
  // Real, verified course links from the same KB the web skill-gap feature
  // uses (lib/learning-resources.ts) — never AI-invented.
  .get(
    "/learning/resources",
    zValidator("query", z.object({ skills: z.string().max(500).optional() })),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const { skills } = c.req.valid("query");
      const terms = (skills ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const fallback = ["excel", "communication", "javascript", "sql", "project management"];
      const matches = resourcesForGaps(terms.length ? terms : fallback, 12);

      return c.json({
        success: true,
        data: matches.map((r, i) => ({
          id: String(i + 1),
          title: r.title,
          platform: r.provider,
          url: r.url,
          free: r.free,
        })),
      });
    }
  )

  // POST /api/mobile/chat — Sumaiya, the mobile CV/career assistant.
  // Multi-turn: the app sends the recent transcript (`messages`) so Sumaiya
  // actually remembers the conversation. `message` (single string) is still
  // accepted for older clients. Real DeepSeek/Anthropic/OpenAI via callAi().
  .post(
    "/chat",
    zValidator(
      "json",
      z.object({
        message: z.string().min(1).max(2000).optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(4000),
            })
          )
          .min(1)
          .max(40)
          .optional(),
        conversationId: z.string().max(128).optional(),
      })
    ),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      if (!hasAiProvider()) return c.json({ error: "AI is not configured." }, 503);

      const quota = await checkAiQuota(userId);
      if (!quota.allowed) {
        return c.json({ error: quota.message, retryAfter: quota.retryAfter }, 429);
      }

      const body = c.req.valid("json");
      // Normalise to a turn list: prefer `messages`, fall back to a lone `message`.
      const turns = (body.messages ?? (body.message ? [{ role: "user" as const, content: body.message }] : []))
        .filter((m) => m.content.trim())
        .slice(-16); // cap history to keep the prompt bounded
      if (turns.length === 0) return c.json({ error: "Nothing to answer." }, 400);
      if (turns[turns.length - 1].role !== "user") {
        return c.json({ error: "Last turn must be from the user." }, 400);
      }
      const conversationId = body.conversationId;

      const transcript = turns
        .map((m) => `${m.role === "user" ? "User" : "Sumaiya"}: ${sanitizePromptText(m.content, 2000)}`)
        .join("\n");

      // The SPINE: mobile Sumaiya reads the same unified profile the web builds
      // up (name, role, profile summary, active CV, tracked applications), so
      // she never re-asks what the user already told the web assistant. Best-
      // effort — a failed context read just means a less personalised reply.
      let knownBlock = "";
      try {
        knownBlock = contextToPromptBlock(await assembleUserContext(userId));
      } catch { /* unpersonalised is fine */ }

      const prompt = `You are Sumaiya, a warm, direct career coach inside the Sumaiya CV app. You are ALREADY mid-conversation — do NOT open with a greeting ("Hi", "Habari", "Mambo", "Karibu"), do NOT re-introduce yourself, and do NOT repeat advice you've already given. Read the whole exchange below and reply ONLY to the user's latest message, building on it. Answer in under 120 words, in the same language the user is writing in. When the latest message is unclear or looks like a typo, ask a short specific clarifying question that refers to what you were just discussing — never a generic "please rephrase". Suggest one concrete next step when it helps. Never invent job listings, statistics, or company names.
${knownBlock}
Conversation so far:
${transcript}

Sumaiya:`;

      const raw = await callAi(prompt, { temperature: 0.6, maxTokens: 400, timeoutMs: 25_000 });
      if (!raw) {
        await refundAiUsage(userId);
        return c.json({ error: "Sumaiya is taking too long to respond. Try again." }, 502);
      }

      return c.json({
        success: true,
        message: raw.trim(),
        conversationId: conversationId ?? null,
      });
    }
  )

  // POST /api/mobile/apply — paste a job description, get a tailored CV and/or
  // a cover letter, grounded in the user's real profile + CV. One AI call.
  // `want`: "cv" | "letter" | "both". Returns the rewritten summary + per-entry
  // experience descriptions (same ids) and/or the letter body — the app applies
  // them to the CV / creates a cover letter locally.
  .post(
    "/apply",
    zValidator(
      "json",
      z.object({
        jobDescription: z.string().min(1).max(8000),
        want: z.enum(["cv", "letter", "both"]),
        cvId: z.string().max(128).optional(),
        lang: z.enum(["en", "sw"]).optional(),
      })
    ),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      if (!hasAiProvider()) return c.json({ error: "AI is not configured." }, 503);

      const quota = await checkAiQuota(userId);
      if (!quota.allowed) return c.json({ error: quota.message, retryAfter: quota.retryAfter }, 429);

      const { jobDescription, want, cvId, lang } = c.req.valid("json");
      const cleanJd = sanitizePromptText(jobDescription, 8000);
      if (!looksLikeJobDescription(cleanJd)) {
        await refundAiUsage(userId);
        return c.json({ error: "That doesn't look like a full job posting — paste the role, responsibilities and requirements." }, 422);
      }

      const ctx = await assembleUserContext(userId, cvId ? { activeCvId: cvId } : {});
      const cv = ctx.activeCv;
      const wantCv = (want === "cv" || want === "both") && !!cv;
      const wantLetter = want === "letter" || want === "both";
      if (want !== "letter" && !cv) {
        // They asked to tailor a CV but have none.
        if (want === "cv") {
          await refundAiUsage(userId);
          return c.json({ error: "You don't have a CV yet — scan or build one first, then tailor it to this job." }, 422);
        }
      }

      const p = ctx.profile?.personal;
      const facts: string[] = [];
      if (p?.fullName) facts.push(`Name: ${p.fullName}`);
      if (p?.jobTitle) facts.push(`Current role: ${p.jobTitle}`);
      if (p?.location) facts.push(`Location: ${p.location}`);
      if (ctx.profileSummary) facts.push(`Profile summary: ${ctx.profileSummary}`);
      const expEntries = (cv?.data.experience ?? []).slice(0, 8).map((e) => ({
        id: e.id,
        position: e.position || "",
        company: e.company || "",
        description: e.description || "",
      }));
      if (expEntries.length) {
        facts.push(
          "Work history:\n" +
            expEntries
              .map((e) => `[${e.id}] ${e.position}${e.company ? " @ " + e.company : ""}\n${e.description || "(no details)"}`)
              .join("\n\n")
        );
      }
      const skills = (cv?.data.skills ?? []).map((s) => s.name).filter(Boolean).slice(0, 20);
      if (skills.length) facts.push(`Skills: ${skills.join(", ")}`);
      if (!facts.length) {
        await refundAiUsage(userId);
        return c.json({ error: "I need something about you first — scan or build a CV, or tell Sumaiya about your background." }, 422);
      }

      const L = lang === "sw" ? "Swahili" : lang === "en" ? "English" : "the same language as the candidate's details";
      const shape: string[] = [`"jobTitle":"", "company":""`];
      if (wantCv) shape.push(`"summary":"", "experience":[{"id":"","description":""}]`);
      if (wantLetter) shape.push(`"coverLetter":""`);

      const prompt = `You are helping a candidate apply for a SPECIFIC job. From the job description and the candidate's REAL details below, produce STRICT JSON (no markdown, no commentary) matching exactly: {${shape.join(", ")}}
- "jobTitle" / "company": read them from the job description ("company":"" if not named).
${wantCv ? `- "summary": rewrite the candidate's professional summary to foreground the experience this job wants and weave in the posting's real keywords — only where truthful. "experience": return the SAME ids listed under Work history, each with a rewritten description as concise bullets starting "- ", emphasising relevance to this job. Do not add, drop, reorder or renumber entries.` : ""}
${wantLetter ? `- "coverLetter": a compelling cover-letter BODY of 3–4 short paragraphs — no address block, no date, no "Dear…" greeting, no sign-off. Ground every claim in the candidate's details. If they have thin work history, write a confident entry-level letter leading with motivation, education and relevant skills.` : ""}
Write all prose in ${L}. ${TRUTH_CONSTRAINT}

JOB DESCRIPTION:
"""
${cleanJd}
"""

CANDIDATE (every line is true — never contradict or exceed this):
${facts.join("\n")}`;

      const raw = await callAi(prompt, { temperature: 0.55, maxTokens: 2400, jsonMode: true, timeoutMs: 40_000 });
      if (!raw) {
        await refundAiUsage(userId);
        return c.json({ error: "That took too long. Please try again." }, 502);
      }
      const parsed = safeParseJson(raw) as Record<string, unknown> | null;
      if (!parsed || typeof parsed !== "object") {
        await refundAiUsage(userId);
        return c.json({ error: "Couldn't tailor to this job. Please try again." }, 422);
      }

      const expOut = Array.isArray(parsed.experience)
        ? (parsed.experience as unknown[])
            .filter((e): e is { id: string; description?: unknown } => !!e && typeof (e as { id?: unknown }).id === "string")
            .map((e) => ({ id: e.id, description: String((e as { description?: unknown }).description ?? "") }))
        : [];

      return c.json({
        success: true,
        data: {
          jobTitle: typeof parsed.jobTitle === "string" ? parsed.jobTitle : "",
          company: typeof parsed.company === "string" ? parsed.company : "",
          cvId: wantCv && cv ? cv.id : null,
          cv:
            wantCv && parsed.summary !== undefined
              ? { summary: String(parsed.summary ?? ""), experience: expOut }
              : null,
          letter: wantLetter && typeof parsed.coverLetter === "string" ? { content: parsed.coverLetter } : null,
        },
      });
    }
  )

  // PUT /api/mobile/device-token — register/refresh a push token.
  // Bearer-authed (the old /api/auth/device-token was cookie-only, so the
  // native app could never reach it — blueprint handshake H2).
  .put(
    "/device-token",
    zValidator(
      "json",
      z.object({
        pushToken: z.string().min(1).max(512),
        platform: z.enum(["ios", "android", "web"]),
        deviceId: z.string().min(1).max(200),
      }),
    ),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const { pushToken, platform, deviceId } = c.req.valid("json");
      try {
        await db
          .insert(deviceToken)
          .values({ id: nanoid(), userId, deviceId, pushToken, platform })
          .onConflictDoUpdate({
            target: deviceToken.deviceId,
            set: { userId, pushToken, platform, updatedAt: sql`now()` },
          });
        return c.json({ success: true, data: { ok: true } });
      } catch (err) {
        console.error("[mobile] device-token upsert failed:", err);
        return c.json({ error: "Could not register push token" }, 500);
      }
    },
  );

/** Shared CVData-shaped extraction prompt, used by the mobile OCR route below. */
export async function extractCvFields(text: string, userId: string) {
  if (!hasAiProvider()) return null;
  const quota = await checkAiQuota(userId);
  if (!quota.allowed) return null;

  const prompt = `Extract the résumé/CV text below into STRICT JSON matching exactly this shape (no extra keys, no commentary, no markdown):
{"personalInfo":{"fullName":"","email":"","phone":"","location":"","headline":""},"summary":"","experience":[{"company":"","title":"","startDate":"","endDate":"","description":"","keyAchievements":[]}],"education":[{"institution":"","degree":"","field":"","graduationDate":""}],"skills":[{"name":"","level":"intermediate"}]}
Rules: use "" for anything not present (and [] for empty lists); dates as "YYYY-MM" when possible; "level" is one of beginner/intermediate/advanced/expert (default "intermediate" when unstated). Never fabricate employers, titles, dates, or numbers the text does not support. Return ONLY the JSON object.

CV TEXT:
"""
${sanitizePromptText(text)}
"""`;

  const raw = await callAi(prompt, { temperature: 0.2, maxTokens: 1800, jsonMode: true, timeoutMs: 40_000 });
  if (!raw) {
    await refundAiUsage(userId);
    return null;
  }
  return safeParseJson(raw);
}
