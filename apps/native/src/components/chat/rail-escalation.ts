import type { ChatStep } from "./chat-progress";

/**
 * HOW LONG A TURN MAY STAY QUIET, and when the rail has to open itself.
 *
 * The progress rail used to be one object: a full-width bordered card with four rows, a bar, a
 * disclaimer sentence and a filled Stop button, thrown into the conversation for EVERY turn —
 * including the two-second ones. It read as a system dialog rather than something happening in a
 * chat, and it grew taller the more work there was.
 *
 * It is now proportional: a quiet one-line strip by default, the detail only when it carries
 * information. That is a real improvement in feel and a real risk in behaviour, because the rail
 * exists for a specific reason:
 *
 *   three pulsing dots look identical whether the request is healthy or dead, and on metered data
 *   a user who cannot tell re-sends — paying for it twice.
 *
 * A quiet one-liner would silently re-introduce exactly that bug. So the quiet state is allowed
 * ONLY while the turn is still healthy and brief, and these two rules are what decide it. They live
 * here, pure and tested, rather than inline in the component, because this is the part a future
 * redesign is most likely to drop by accident.
 */

/** Seconds of waiting after which the rail opens itself. */
export const RAIL_ESCALATE_AFTER_S = 8;

/**
 * Whether the rail must open itself.
 *
 * A failed step escalates IMMEDIATELY and regardless of elapsed time: a dead request must never keep
 * looking like a healthy one, and that is the case the whole surface exists for.
 */
export function shouldEscalate(
  steps: ChatStep[],
  seconds: number,
  afterS: number = RAIL_ESCALATE_AFTER_S,
): boolean {
  if (steps.some((s) => s.state === "failed")) return true;
  return seconds >= afterS;
}
