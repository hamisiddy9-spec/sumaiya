import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db, profile } from "@/lib/db";
import { EARLY_ACCESS_SEATS } from "@/lib/early-access";

/**
 * GET /api/stats/early-access — how many early places are gone.
 *
 * The landing page shows "N of 50 places taken" next to the early-access offer.
 * That number has to be REAL, so it is counted from the same table the product
 * uses (one `profile` row per account) rather than stored as a marketing
 * constant that drifts from the truth the week after launch.
 *
 * When the seats are gone this returns `full: true` and the page stops
 * offering the bonus — an offer that stayed open after "50 of 50" would be the
 * kind of fake scarcity that costs more trust than it buys sign-ups.
 *
 * Cached for 5 minutes: the counter does not need to be live to the second, and
 * a stale-by-minutes number is a fair trade for not hitting the database on
 * every marketing page view.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const rows = await db.select({ n: count() }).from(profile);
    const taken = Number(rows[0]?.n ?? 0);
    return NextResponse.json(
      {
        taken,
        seats: EARLY_ACCESS_SEATS,
        remaining: Math.max(0, EARLY_ACCESS_SEATS - taken),
        full: taken >= EARLY_ACCESS_SEATS,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    // Never break the page over a counter. The client renders the offer without
    // a number when this fails.
    return NextResponse.json({ taken: null, seats: EARLY_ACCESS_SEATS, remaining: null, full: false });
  }
}
