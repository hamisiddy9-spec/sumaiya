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
import { subjectForUser } from "@/lib/entitlements-server";
import { runTool, executableTools, type ToolCaller } from "@/lib/assistant/run-tool";


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
    const toolId = c.req.param("toolId");
    const body = c.req.valid("json");
    // Language: honour the x-lang header the middleware forwards for the app subtree.
    const sw = c.req.raw.headers.get("x-lang") !== "en";

    let result;
    try {
      const user = await getAuthUser(c);
      // Resolve the FULL subject — a bare `{ userId }` would silently drop the
      // caller's earned Premium window, so a plan-gated capability would be
      // refused to exactly the people who had earned it.
      const subject = await subjectForUser(user?.id ?? null);
      result = await runTool({
        toolId,
        args: body.args ?? {},
        subject: { ...subject, sw },
        caller: (body.caller ?? "ui") as ToolCaller,
        confirmed: body.confirmed,
        context: {
          cv: (body.cv ?? null) as CVData | null,
          hasFile: body.hasFile,
          extra: body.context,
        },
      });
    } catch (err) {
      console.error(`[capabilities] ${toolId} faulted:`, err);
      return c.json({ success: false, data: { status: "error", tool: toolId, code: "pipeline_fault" } }, 500);
    }

    // The capability layer always answers 200 when the transport + pipeline ran:
    // a `blocked` / `error` / `confirm_required` outcome is DATA the caller acts
    // on, not an exception. Only a thrown pipeline fault (below) is a 5xx.
    return c.json(
      { success: result.status === "ok" || result.status === "preview", data: result },
      200,
    );
  });

