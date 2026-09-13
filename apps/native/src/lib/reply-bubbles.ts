/**
 * Splits one long Sumaiya reply into a short sequence of chat bubbles instead
 * of one wall of text popping in at once.
 *
 * Why: the chat has no streaming (a real token-by-token reply would need a
 * provider-call rewrite and an unverified React Native fetch-streaming
 * capability — a bigger, riskier change than tonight's fixes). This is the
 * cheap alternative that gets most of the felt benefit: a multi-paragraph
 * reply already reads like separate thoughts, so show it that way instead of
 * a blocking request followed by a full paragraph appearing at once.
 *
 * Pure and dependency-free — the delay/animation is the caller's job.
 */

/** Never split a short reply — it already reads fine as one bubble. */
const MIN_LENGTH_TO_SPLIT = 140;

/** Cap the number of bubbles so a reply doesn't turn into a wall of pings. */
const MAX_BUBBLES = 3;

/**
 * Split on paragraph breaks. A trailing overflow past MAX_BUBBLES is folded
 * into the last bubble rather than dropped, so nothing the model said is
 * ever lost to the staging.
 */
export function splitReplyIntoBubbles(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length < MIN_LENGTH_TO_SPLIT) return [trimmed];

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) return [trimmed];

  if (paragraphs.length <= MAX_BUBBLES) return paragraphs;

  const head = paragraphs.slice(0, MAX_BUBBLES - 1);
  const tail = paragraphs.slice(MAX_BUBBLES - 1).join("\n\n");
  return [...head, tail];
}
