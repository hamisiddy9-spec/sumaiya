/** A job with no deadline at all is kept — unknown is not the same as
 *  expired. Standalone so it's unit-testable without pulling in the whole
 *  screen (which drags in native-only modules jest can't load in isolation). */
export function isExpiredListing(deadline?: string | null): boolean {
  return !!deadline && new Date(deadline).getTime() < Date.now();
}
