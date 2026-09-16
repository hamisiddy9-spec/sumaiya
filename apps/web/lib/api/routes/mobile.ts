import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { MAX_PHOTO_CHARS } from "@/lib/api/photo-limits";
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
import { db, deviceToken, userProfile } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { parseCareerProfile } from "@/types";
import { ensureProfileRow } from "@/lib/career-profile/sync";
import { stampProfileAllFacts } from "@/lib/career-profile/mapper";
import { computeSignals } from "@/lib/assistant/signals";
import { checkTailoring } from "@/lib/api/tailoring-guards";
import { checkNoFabrication } from "@/lib/ai/fabrication-check";
import { guardReplyAgainstRepeat } from "@/lib/assistant/repeat-guard";
import { recordExport, normalizeExportKind, mintUnstoredExportId } from "@/lib/documents/export-ledger";
import {
  nativeProfileToCareer,
  careerToNativeProfile,
  EMPTY_NATIVE_PROFILE,
} from "@/lib/career-profile/mobile-bridge";

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
        lang: z.enum(["en", "sw"]).optional(),
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
      // The client already knows the user's selected language (it's shown it
      // in the UI) but this endpoint never asked for it, leaving the model to
      // guess from message content alone — a short or ambiguous message (a
      // greeting, a number, "sawa/ok") can misjudge it. Explicit when sent;
      // falls back to the old language-matching instruction for older builds.
      const langLine = body.lang
        ? `Reply in ${body.lang === "sw" ? "Swahili" : "English"} — the user has this app set to that language, regardless of what script their message used.`
        : "Answer in the same language the user is writing in.";

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

      const prompt = `You are Sumaiya, a warm, direct career coach inside the Sumaiya CV app — to the user you are simply a real, warm person behind the screen, not an assistant reciting help text. You talk like a friend who knows their stuff: short, natural sentences, zero robotic filler. Never say "I'm happy to help", "As an AI", "Great question!", "Absolutely!", "Certainly!" or any other canned phrase; no bullet-point essays, no corporate cheer, no exclamation-mark spam. You are ALREADY mid-conversation — do NOT open with a greeting ("Hi", "Habari", "Mambo", "Karibu"), do NOT re-introduce yourself, and do NOT repeat advice you've already given. If the user repeats themselves, acknowledge it and vary your wording — never send the exact sentence you already sent; a human does not say the same line twice (there is also an automatic guard that catches verbatim repeats, but never rely on it). Read the whole exchange below and reply ONLY to the user's latest message, building on it. Answer in under 120 words. ${langLine} When the latest message is unclear or looks like a typo, ask a short specific clarifying question that refers to what you were just discussing — never a generic "please rephrase". Suggest one concrete next step when it helps. Never invent job listings, statistics, or company names. When the user has no advert yet and is asking where to find work, name at most two real sources and nothing else — Ajira Portal (portal.ajira.go.tz) for government, BrighterMonday (brightermonday.co.tz), JobwebTanzania (jobwebtanzania.com), Fuzu (fuzu.com), Mabumbe (mabumbe.com/ajira), or ReliefWeb (reliefweb.int/jobs) for NGO and UN roles — and remind them of the ones near them — district and ward notice boards, VETA, churches and mosques, and the advert pages of Mwananchi or Uhuru. When someone has no advert yet, keep the words plain and name the thing: "Umeona nafasi ya kazi sehemu yoyote? Niletee tangazo" — never "umeona kimoja", which leaves them asking "one what?". For the offline route say: "Kazi nyingi haziwekwi mtandaoni — pitia kwenye ubao wa matangazo wa halmashauri ya wilaya, ofisi ya kata, VETA, makanisa na misikiti, na kurasa za kazi za Mwananchi, Uhuru au The Guardian." Then ask them to paste the advert text, the link, or a photo of it, and promise to say what it really wants and whether their CV fits. Never invent a job site, URL, or listing. The app can make and download real PDFs — a CV, a cover letter, a letter and a business card — and every one is exported from inside the app, never by you: when someone asks how to send their CV or letter to an employer, tell them to open the document and tap "Pakua PDF", then share it straight to WhatsApp or email. If the notes above show a document was exported a day or two ago, you may ask ONCE, like a friend, whether it went through ("ile ilipita?") and then offer one next step — but never nag, never repeat the question, and drop it the moment they move on. Never claim the user "already told you" something that is not written in the exchange below — if it's missing, ask for it plainly. If a message says a file was attached but gives you NO text from it, say you couldn't read the file and ask them to paste the text — never guess or invent its contents. Never ask where the user lives, their neighbourhood, or whether they feel safe — keep every question tied to their work and the job they want. Stay on the one goal they came with; don't drift to a side topic.
${knownBlock}
Conversation so far:
${transcript}

Sumaiya:`;

      const raw = await callAi(prompt, { temperature: 0.6, maxTokens: 400, timeoutMs: 25_000 });
      if (!raw) {
        await refundAiUsage(userId);
        return c.json({ error: "Sumaiya is taking too long to respond. Try again." }, 502);
      }

      // Deterministic backstop (same as the web assistant): the prompt says
      // never repeat, but that's advisory. Compare against Sumaiya's own
      // recent replies in this thread and swap in a varied, forward-moving
      // line when the fresh reply is too close to one already sent.
      const priorAssistantReplies = turns.filter((m) => m.role === "assistant").map((m) => m.content);
      const guardedReply = guardReplyAgainstRepeat(
        raw.trim(),
        priorAssistantReplies,
        body.lang === "en" ? "en" : "sw",
        priorAssistantReplies.length,
      );

      return c.json({
        success: true,
        message: guardedReply,
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

      // Name/role/location/summary used to come ONLY from the separate Career
      // Profile blob (user_profile.career_profile) — never from the CV's own
      // data, even though a CV has all of the same fields. A user whose
      // career profile was never seeded (the seed can silently no-op on an
      // older CV) but who plainly owns a real CV would fall straight through
      // to "I need to know something about you first", telling them to build
      // the exact thing they already had open. Fall back to the CV's own
      // personal/summary when the career profile hasn't got there yet — a
      // user who has given the app a CV has already given it enough.
      const p = ctx.profile?.personal ?? cv?.data.personal;
      const facts: string[] = [];
      if (p?.fullName) facts.push(`Name: ${p.fullName}`);
      if (p?.jobTitle) facts.push(`Current role: ${p.jobTitle}`);
      if (p?.location) facts.push(`Location: ${p.location}`);
      const summary = ctx.profileSummary || cv?.data.summary || "";
      if (summary) facts.push(`Profile summary: ${summary}`);
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
        // This has fired with a CV that visibly has content moments earlier —
        // log what the server actually saw so a repeat is diagnosable instead
        // of just "some users get this randomly".
        console.error(
          `[mobile.apply] no facts for userId=${userId} want=${want} cvId=${cvId ?? "(none sent)"} ` +
          `resolvedCvId=${cv?.id ?? "(none)"} hasProfile=${!!ctx.profile} ` +
          `expCount=${cv?.data.experience?.length ?? 0} hasSummary=${!!(cv?.data.summary?.trim())}`,
        );
        // Sumaiya is the one speaking, so she says "tell me" — never "tell
        // Sumaiya". A person does not refer to herself by name mid-sentence.
        // And the language is the user's, not ours: this used to come back in
        // English on a Swahili screen because the client never sent `lang`.
        return c.json({
          error:
            lang === "sw"
              ? "Nahitaji kujua kitu kukuhusu kwanza — pakia au jenga CV, au niambie historia yako."
              : "I need to know something about you first — upload or build a CV, or tell me about your background.",
        }, 422);
      }

      const L = lang === "sw" ? "Swahili" : lang === "en" ? "English" : "the same language as the candidate's details";
      const shape: string[] = [`"jobTitle":"", "company":""`];
      if (wantCv) shape.push(`"summary":"", "experience":[{"id":"","description":""}]`);
      if (wantLetter) shape.push(`"coverLetter":""`);

      const prompt = `You are helping a candidate apply for a SPECIFIC job. From the job description and the candidate's REAL details below, produce STRICT JSON (no markdown, no commentary) matching exactly: {${shape.join(", ")}}
- "jobTitle" / "company": read them from the job description ("company":"" if not named).
${wantCv ? `- "summary": rewrite the candidate's professional summary to foreground the experience this job wants and weave in the posting's real keywords — only where truthful. The summary is about the role(s) the candidate has ACTUALLY held — reframe their real work in this job's vocabulary, but never describe them as already holding this posting's job title or seniority unless their own facts say they held it. Never add mentoring, managing or leading others, a specific tool/certification, or years of experience the facts don't state. "experience": return the SAME ids listed under Work history, each with a rewritten description as concise bullets starting "- ", emphasising relevance to this job. Do not add, drop, reorder or renumber entries.` : ""}
${wantLetter ? `- "coverLetter": a compelling cover-letter BODY of 3–4 short paragraphs — no address block, no date, no "Dear…" greeting, no sign-off. Ground every claim in the candidate's details — never describe them as already holding this posting's job title, seniority or duties they have not performed. If they have thin work history, write a confident entry-level letter leading with motivation, education and relevant skills, not an invented track record.` : ""}
Write all prose in ${L}, in a natural, confident voice — like a real person wrote it, not corporate copy. Avoid clichés ("results-driven", "team player", "go-getter", "synergy", "dynamic", "passionate", "detail-oriented") and don't open with "I am". ${TRUTH_CONSTRAINT}

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

      // An empty body is not a success. Before this, `"coverLetter": ""` passed
      // the "is it a string" test and the app exported a PDF holding nothing but
      // the job title and the company name.
      const verdict = checkTailoring(parsed, { wantCv, wantLetter });
      if (!verdict.ok) {
        await refundAiUsage(userId);
        return c.json({ error: verdict.error }, 502);
      }

      // A second, adversarial pass: the generation prompt's own TRUTH_CONSTRAINT
      // is an instruction, not enforcement. Observed in the wild: a shop
      // worker's summary rewritten into a fabricated "Principal Sales Engineer"
      // career lifted from the job posting, with the constraint sitting right
      // there in the same prompt. Check the summary and rewritten bullets for
      // claims the candidate's own facts don't support before this ever reaches
      // a document someone can send to an employer.
      if (wantCv || wantLetter) {
        // One combined check when both were generated — a cover letter can
        // fabricate a fake career story exactly the same way a CV summary
        // can, and checking them together costs one AI call instead of two.
        const generatedText = [
          wantCv && typeof parsed.summary === "string" ? parsed.summary : "",
          ...(wantCv ? expOut.map((e) => e.description) : []),
          wantLetter && typeof parsed.coverLetter === "string" ? parsed.coverLetter : "",
        ].filter(Boolean).join("\n\n");
        const fab = await checkNoFabrication(facts.join("\n"), generatedText);
        if (fab.fabricated) {
          await refundAiUsage(userId);
          return c.json({
            error:
              lang === "sw"
                ? "Ninachukua tahadhari — matokeo yalionekana kudai zaidi ya ulichoniambia. Jaribu tena."
                : "Playing it safe — that result seemed to claim more than what you told me. Please try again.",
          }, 502);
        }
      }

      return c.json({
        success: true,
        data: {
          jobTitle: typeof parsed.jobTitle === "string" ? parsed.jobTitle : "",
          company: typeof parsed.company === "string" ? parsed.company : "",
          cvId: wantCv && cv ? cv.id : null,
          cv:
            wantCv && parsed.summary !== undefined
              ? { summary: String(parsed.summary ?? "").trim(), experience: expOut }
              : null,
          letter:
            wantLetter && typeof parsed.coverLetter === "string"
              ? { content: parsed.coverLetter.trim() }
              : null,
        },
      });
    }
  )

  // POST /api/mobile/build-cv — turn what the user told Sumaiya (chat transcript
  // + their saved profile) into a structured CV the app can preview and save.
  // Same anti-fabrication rules as everywhere: nothing invented, "" for missing.
  .post(
    "/build-cv",
    zValidator(
      "json",
      z.object({
        transcript: z.string().min(20).max(12000),
        lang: z.enum(["en", "sw"]).optional(),
      }),
    ),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      if (!hasAiProvider()) return c.json({ error: "AI is not configured." }, 503);

      const quota = await checkAiQuota(userId);
      if (!quota.allowed) return c.json({ error: quota.message, retryAfter: quota.retryAfter }, 429);

      const { transcript, lang } = c.req.valid("json");

      // Fold in the server-side profile so the CV is as complete as possible.
      let knownBlock = "";
      try {
        knownBlock = contextToPromptBlock(await assembleUserContext(userId));
      } catch { /* thin context is fine */ }

      const langLine =
        lang === "sw"
          ? "Write the summary and descriptions in Kiswahili."
          : "Write the summary and descriptions in English.";

      const prompt = `Build a CV as STRICT JSON matching exactly this shape (no extra keys, no commentary, no markdown):
{"personalInfo":{"fullName":"","email":"","phone":"","location":"","headline":""},"summary":"","experience":[{"company":"","title":"","startDate":"","endDate":"","description":"","keyAchievements":[]}],"education":[{"institution":"","degree":"","field":"","graduationDate":""}],"skills":[{"name":"","level":"intermediate"}],"languages":[{"language":"","proficiency":"professional"}]}
Rules: base every field ONLY on what the person actually said below — use "" for anything not stated and [] for empty lists. Never invent an employer, title, date, qualification or number. Dates as "YYYY-MM" when known. "level" is one of beginner/intermediate/advanced/expert. "proficiency" is one of elementary/limited/professional/fluent/native. Write a 2–3 sentence summary grounded in their real experience. ${langLine} ${TRUTH_CONSTRAINT}
Return ONLY the JSON object.
${knownBlock}
WHAT THE PERSON TOLD SUMAIYA:
"""
${sanitizePromptText(transcript, 12000)}
"""`;

      const raw = await callAi(prompt, { temperature: 0.3, maxTokens: 2200, jsonMode: true, timeoutMs: 45_000 });
      if (!raw) {
        await refundAiUsage(userId);
        return c.json({ error: "Sumaiya is taking too long. Try again." }, 502);
      }
      const parsed = safeParseJson(raw) as Record<string, unknown> | null;
      if (!parsed || typeof parsed !== "object") {
        await refundAiUsage(userId);
        return c.json({ error: "Couldn't build the CV. Tell Sumaiya a bit more and try again." }, 422);
      }

      const id = () => nanoid(8);
      const pi = (parsed.personalInfo ?? {}) as Record<string, unknown>;
      const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
      const cv = {
        personalInfo: {
          fullName: String(pi.fullName ?? ""),
          email: String(pi.email ?? ""),
          phone: String(pi.phone ?? ""),
          location: String(pi.location ?? ""),
          headline: String(pi.headline ?? ""),
        },
        summary: String(parsed.summary ?? ""),
        experience: arr(parsed.experience).map((e) => ({
          id: id(),
          company: String(e.company ?? ""),
          title: String(e.title ?? ""),
          startDate: String(e.startDate ?? ""),
          endDate: String(e.endDate ?? ""),
          description: String(e.description ?? ""),
          keyAchievements: Array.isArray(e.keyAchievements) ? e.keyAchievements.map(String) : [],
        })),
        education: arr(parsed.education).map((e) => ({
          id: id(),
          institution: String(e.institution ?? ""),
          degree: String(e.degree ?? ""),
          field: String(e.field ?? ""),
          graduationDate: String(e.graduationDate ?? ""),
        })),
        skills: arr(parsed.skills).map((s) => ({
          id: id(),
          name: String(s.name ?? ""),
          level: ["beginner", "intermediate", "advanced", "expert"].includes(String(s.level))
            ? String(s.level)
            : "intermediate",
        })),
        certifications: [],
        languages: arr(parsed.languages).map((l) => ({
          id: id(),
          language: String(l.language ?? ""),
          proficiency: ["elementary", "limited", "professional", "fluent", "native"].includes(String(l.proficiency))
            ? String(l.proficiency)
            : "professional",
        })),
      };

      if (!cv.personalInfo.fullName && cv.experience.length === 0 && cv.skills.length === 0) {
        await refundAiUsage(userId);
        // First person, and in the user's language — see the guard above.
        return c.json({
          error:
            lang === "sw"
              ? "Bado hakuna vya kutosha — niambie jina lako, kazi uliyowahi kufanya, na ujuzi wako."
              : "Not enough to go on yet — tell me your name, a job you've done, and your skills.",
        }, 422);
      }

      return c.json({ success: true, data: { cv } });
    },
  )

  // GET /api/mobile/profile — the user's Career Profile in the native app's
  // flat shape (mapped from the structured Spine store). Empty shape when the
  // user has never saved one, so a fresh install can tell "nothing yet" from
  // "offline".
  .get("/profile", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile, updatedAt: userProfile.updatedAt })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    if (!row?.careerProfile) {
      return c.json({ success: true, data: EMPTY_NATIVE_PROFILE });
    }
    const cp = parseCareerProfile(row.careerProfile);
    const updatedAt = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
    return c.json({ success: true, data: careerToNativeProfile(cp, updatedAt) });
  })

  // PUT /api/mobile/profile — save the Career Profile from the native app.
  // The native flat shape is mapped to the structured profile and stamped
  // "interview" (first-run wizard / in-app profile edit is the user authoring
  // facts directly — same provenance the web Career Interview uses). Wholesale
  // replace, like the web POST /api/profile { careerProfile }.
  .put(
    "/profile",
    zValidator(
      "json",
      z.object({
        fullName: z.string().max(200).default(""),
        headline: z.string().max(400).default(""),
        location: z.string().max(200).default(""),
        phone: z.string().max(50).default(""),
        email: z.string().max(200).default(""),
        summary: z.string().max(4000).default(""),
        skills: z.string().max(4000).default(""),
        experience: z.string().max(8000).default(""),
        education: z.string().max(4000).default(""),
        goals: z.string().max(2000).default(""),
        languages: z.string().max(1000).default(""),
        /** Data URL of the compressed headshot (see photo-limits.ts). */
        photo: z.string().max(MAX_PHOTO_CHARS).default(""),
        updatedAt: z.number().nonnegative().optional(),
      }),
    ),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const body = c.req.valid("json");
      await ensureProfileRow(userId);

      const cp = stampProfileAllFacts(
        nativeProfileToCareer({ ...EMPTY_NATIVE_PROFILE, ...body, updatedAt: body.updatedAt ?? Date.now() }),
        { source: "interview", confidence: 1 },
      );

      const [saved] = await db
        .insert(userProfile)
        .values({ id: userId, careerProfile: cp, updatedAt: new Date() } as never)
        .onConflictDoUpdate({
          target: userProfile.id,
          set: { careerProfile: cp, updatedAt: new Date() } as never,
        })
        .returning({ updatedAt: userProfile.updatedAt });

      return c.json({
        success: true,
        data: { updatedAt: saved?.updatedAt ? new Date(saved.updatedAt).getTime() : Date.now() },
      });
    },
  )

  // GET /api/mobile/signals — deterministic proactive nudges for the native
  // home screen. Same engine (computeSignals) that drives the web dashboard
  // banner and Sumaiya's proactive opener — one truth everywhere.
  .get("/signals", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    try {
      const ctx = await assembleUserContext(userId);
      const signals = computeSignals(ctx).slice(0, 5);
      return c.json({ success: true, data: signals });
    } catch (err) {
      console.error("[mobile] signals failed:", err);
      return c.json({ success: true, data: [] });
    }
  })

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
  )

  // POST /api/mobile/export — the device tells us a document actually left the
  // phone.
  //
  // Until this existed the native app reported NOTHING: it prints the PDF
  // locally with expo-print and shares the file, so the export never touched
  // the server and `download_log` only ever contained rows written by the web
  // editor. The device is where most documents are actually exported, so the
  // assistant's library was blind to the majority of real activity.
  //
  // No stored row is required: a cover letter from POST /apply is built on
  // demand and never persisted, so the server mints a `mobile:`-prefixed
  // ledger id for it and keeps the human title the user saw in the file name.
  .post(
    "/export",
    zValidator(
      "json",
      z.object({
        documentType: z.string().min(1).max(32),
        documentId: z.string().min(1).max(64).optional(),
        title: z.string().max(200).optional(),
        format: z.string().max(16).optional(),
      }),
    ),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const body = c.req.valid("json");
      const kind = normalizeExportKind(body.documentType);
      if (!kind) return c.json({ error: "Unknown document type" }, 400);

      await recordExport({
        userId,
        documentId: body.documentId?.trim() || mintUnstoredExportId(),
        documentType: kind,
        title: body.title ?? null,
        format: body.format ?? "pdf",
      });

      // Always 200: this is bookkeeping. A failed ledger write must never show
      // the user an error for an export that already succeeded on their phone.
      return c.json({ success: true });
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

  const raw = await callAi(prompt, { temperature: 0.2, maxTokens: 1800, jsonMode: true, timeoutMs: 10_000 });
  if (!raw) {
    await refundAiUsage(userId);
    return null;
  }
  return safeParseJson(raw);
}
