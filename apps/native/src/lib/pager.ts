/**
 * Pager geometry for the onboarding carousel — pure, so it can be asserted.
 *
 * Two defects live here, and both are about the indicator guessing from the
 * scroll offset instead of being told the page:
 *
 * 1. A paged `ScrollView` does not always rest on an exact multiple of its page
 *    width. It settles a fraction of a pixel off (1007.6 instead of 1008), so
 *    `contentOffset.x / width` is not an integer and anything derived from it is
 *    ambiguous at rest. `settlePage` is the one place that division happens.
 *
 * 2. The dot row used to be *interpolated* from the raw offset — every dot
 *    stepping `[8, 24, 8]` across its own `[(i-1)W, iW, (i+1)W]` window on every
 *    scroll frame. That makes each dot's width a continuous function of a value
 *    shared by four animated nodes, and a device capture of the last slide
 *    caught it painting **two** dots at full width and full opacity at once
 *    (measured: two 23.9dp full-ember pills, the other two at their 0.35
 *    opacity ramp) — the "dot between two rosettes". Adding the snap to
 *    `onMomentumScrollEnd` did not remove it: the capture is from a build that
 *    already had the snap, and both dots are still lit.
 *
 *    So the indicator no longer reads the offset at all. It is derived from the
 *    settled page number, which is a single integer: exactly one dot can be
 *    active, by construction, and no frame can disagree with another because
 *    there is only one source. `activeDotIndex` is that derivation, and
 *    `pager.test.ts` asserts the uniqueness for every page.
 */

/**
 * The page a resting offset belongs to: the nearest integer page, never a
 * fraction. Non-finite or non-positive input clamps to page 0 rather than
 * producing NaN.
 */
export function settlePage(offsetX: number, width: number): number {
  if (!Number.isFinite(offsetX) || !Number.isFinite(width) || width <= 0) return 0;
  return Math.max(0, Math.round(offsetX / width));
}

/**
 * The one dot that is active for a page. Clamped into range, so a stale or
 * out-of-range page can never light a dot that does not exist — and can never
 * light a second one.
 */
export function activeDotIndex(page: number, count: number): number {
  if (!Number.isFinite(page) || !Number.isFinite(count) || count < 1) return 0;
  return Math.min(Math.max(0, Math.trunc(page)), Math.trunc(count) - 1);
}
