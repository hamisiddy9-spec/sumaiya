/**
 * Early-access offer constants.
 *
 * Lives here rather than in the route file because Next.js only permits a
 * fixed set of exports from a route module — exporting a plain constant from
 * `app/api/.../route.ts` fails the production build with
 * "not a valid Route export field".
 */
export const EARLY_ACCESS_SEATS = 50;
