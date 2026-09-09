// /api/capabilities — the capability layer's HTTP door (system blueprint).
//
// One endpoint for every tool. The UI, the assistant client, and (later) the
// WhatsApp worker all POST here; the guardrail pipeline in lib/assistant/run-tool
// does auth-scoped entitlement, quota, content-boundary, policy gating, the
// audit row, the analytics event and the eval sample — identically regardless
// of caller.
//
// Existing endpoints keep working; this is additive. Routes migrate to it one
// capability at a time.

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { CVData } from "@/types";
import { getAuthUser } from "@/lib/api/auth";
import { runTool, executableTools, type ToolCaller } from "@/lib/assistant/run-tool";

const CALLERS: readonly ToolCaller[] = ["ui", "assistant", "cron", "whatsapp", "api"];

const bodySchema = z.object({
  args: z.record(z.unknown()).optional(),
  /** who's calling — defaults to "ui"; the assistant-turn route passes "assistant" */
  caller: z.enum(["ui", "assistant", "cron", "whatsapp", "api"]).optional(),
  /** required for `confirm`-policy tools to actually run */
  confirmed: z.boolean().optional(),
  /** the active CV, for tools with needsCv (guest CVs live in localStorage) */
  cv: z.unknown().optional(),
  hasFile: z.boolean().optional(),
  /** free-form executor context (job id, application id, …) */
  context: z.record(z.unknown()).optional(),
});

export const capabilityRoutes = new Hono()

  // GET /api/capabilities — which tools have a live executor right now.
  .get("/", (c) => {
    return c.json({ success: true, data: { executable: executableTools() } });
  })

  // POST /api/capabilities/:toolId — run one tool through the pipeline.
  .post("/:toolId", zValidator("json", bodySchema), async (c) => {
    const user = await getAuthUser(c);
    const toolId = c.req.param("toolId");
    const body = c.req.valid("json");

    // Language: honour the x-lang header the middleware forwards for the app subtree.
    const sw = c.req.raw.headers.get("x-lang") !== "en";

    const result = await runTool({
      toolId,
      args: body.args ?? {},
      subject: {
        userId: user?.id ?? null,
        sw,
      },
      caller: (body.caller ?? "ui") as ToolCaller,
      confirmed: body.confirmed,
      context: {
        cv: (body.cv ?? null) as CVData | null,
        hasFile: body.hasFile,
        extra: body.context,
      },
    });

    const httpStatus =
      result.status === "ok" || result.status === "preview" || result.status === "confirm_required"
        ? 200
        : result.status === "blocked"
          ? (result.reason === "quota" ? 429 : result.reason === "guest_only" || result.reason === "requires_plan" ? 403 : 400)
          : 500;

    return c.json({ success: result.status === "ok" || result.status === "preview", data: result }, httpStatus);
  });

// (unused export kept for symmetry with other route modules)
export { CALLERS };
