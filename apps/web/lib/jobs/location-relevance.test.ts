import { describe, it, expect } from "vitest";
import {
  locationFit,
  locationRelevance,
  parsePlace,
  parseRemoteRestriction,
  rankScore,
  compareByReach,
  REACH_MULTIPLIER,
  DEFAULT_MARKET,
  GENERIC_WORDS,
  type ReachTier,
} from "./location-relevance";

const DAR = "Dar es Salaam, Tanzania";
const NAIROBI = "Nairobi, Kenya";
const LAGOS = "Lagos, Nigeria";
const LONDON = "London, United Kingdom";
const LISBON = "Lisbon, Portugal";
const LIMA = "Lima, Peru";

/** tier convenience */
const tier = (user: string | string[], job: string, opts?: Parameters<typeof locationFit>[2]): ReachTier =>
  locationFit(user, job, opts).tier;

describe("locationFit — the tiers", () => {
  it("same-city: a Dar user and a Dar listing", () => {
    expect(tier(DAR, "Dar es Salaam, Tanzania")).toBe("same-city");
    expect(tier(DAR, "Dar Es Salaam")).toBe("same-city");
  });

  it("same-country: a Dar user and a country-only or other-city Tanzanian listing", () => {
    expect(tier(DAR, "Tanzania")).toBe("same-country");
    expect(tier(DAR, "Arusha, Tanzania")).toBe("same-country");
    expect(tier(DAR, "Tanzania, United Republic of")).toBe("same-country");
  });

  it("same-subregion: Tanzania <-> Kenya/Uganda/Rwanda — and it is NOT Tanzania-only", () => {
    expect(tier(DAR, "Nairobi, Kenya")).toBe("same-subregion");
    expect(tier(DAR, "Kampala, Uganda")).toBe("same-subregion");
    expect(tier(NAIROBI, "Dar es Salaam, Tanzania")).toBe("same-subregion");
    expect(tier(LAGOS, "Nairobi, Kenya")).toBe("same-region"); // West vs East Africa
  });

  it("same-region: wider Africa, computed from continent not from a neighbour list", () => {
    expect(tier(DAR, "Lagos, Nigeria")).toBe("same-region");
    expect(tier(DAR, "Accra, Ghana")).toBe("same-region");
    expect(tier(DAR, "Johannesburg, South Africa")).toBe("same-region");
    expect(tier(LAGOS, "Cairo, Egypt")).toBe("same-region");
  });

  it("remote-worldwide: remote with no geographic restriction", () => {
    for (const job of ["Remote", "Remote - Worldwide", "Worldwide", "Anywhere", "Global", "Remote (Work from Home)"]) {
      expect(tier(DAR, job), job).toBe("remote-worldwide");
      expect(locationFit(DAR, job).reachable, job).toBe(true);
    }
  });

  it("remote-region-locked: 'Remote US' is NOT reachable from Dar es Salaam", () => {
    // 63 live rows read exactly "Remote US" and the old multiplier scored them 1.0.
    for (const job of ["Remote US", "Remote - USA", "Remote (US Only)", "Remote Canada", "Remote UK", "Remote Poland"]) {
      const f = locationFit(DAR, job);
      expect(f.tier, job).toBe("remote-region-locked");
      expect(f.reachable, job).toBe(false);
      expect(f.multiplier).toBeLessThan(1);
    }
  });

  it("remote-region-eligible: a region lock that DOES contain the user", () => {
    expect(tier(DAR, "Remote - Africa")).toBe("remote-region-eligible");
    expect(tier(LAGOS, "Remote EMEA")).toBe("remote-region-eligible");
    expect(tier(LISBON, "Remote - Europe")).toBe("remote-region-eligible");
    expect(tier(LISBON, "Remote EU")).toBe("remote-region-eligible");
    // ...and the same lock excludes a user outside the region.
    expect(tier(DAR, "Remote - Europe")).toBe("remote-region-locked");
    expect(tier(LAGOS, "Remote APAC")).toBe("remote-region-locked");
  });

  it("location-locked: a specific foreign place, on-site", () => {
    for (const job of ["London, United Kingdom", "Berlin, Germany", "Toronto, Canada", "Dubai, UAE", "Lagos, Nigeria"]) {
      if (job.startsWith("Lagos")) continue; // same-region for a Dar user
      const f = locationFit(DAR, job);
      expect(f.tier, job).toBe("location-locked");
      expect(f.reachable, job).toBe(false);
    }
  });

  it("home-market / unrestricted: a user with NO stated location is never penalised", () => {
    for (const job of ["", "London", "Remote US", "USA, Canada, Argentina, Mexico, Peru", "Remote", "Tanzania"]) {
      expect(locationFit("", job).multiplier, job).toBeGreaterThanOrEqual(1);
    }
    // Tanzania-first is expressed as ORDERING (a small tailwind), not as a
    // penalty on everything else — the old code multiplied 100% of foreign
    // listings by 0.3 for these users.
    expect(locationFit("", "Tanzania").tier).toBe("home-market");
    expect(locationFit("", "Tanzania").multiplier).toBeGreaterThan(1);
    expect(locationFit("", "London").tier).toBe("unrestricted");
    expect(locationFit("", "London").multiplier).toBe(1);
    expect(locationFit(null, "London").multiplier).toBe(1);
    expect(locationFit([] as string[], "London").multiplier).toBe(1);
  });

  it("location-unknown: an unparseable job location is not a demotion", () => {
    expect(tier(DAR, "")).toBe("location-unknown");
    expect(tier(DAR, "   ")).toBe("location-unknown");
    expect(tier(DAR, "Somewhereville")).toBe("location-unknown");
    expect(tier(DAR, "N/A")).toBe("location-unknown");
    expect(locationFit(DAR, "N/A").multiplier).toBe(1);
  });
});

describe("locationFit — boundary cases", () => {
  it("multi-country strings resolve to MULTIPLE countries and are locked when none is yours", () => {
    const job = "USA, Canada, Argentina, Mexico, Peru";
    const p = parsePlace(job);
    expect(p.countries.sort()).toEqual(["Argentina", "Canada", "Mexico", "Peru", "United States"]);
    expect(locationFit(DAR, job).tier).toBe("location-locked"); // was 0.3 before
    // ...and the same string is a country match for a user IN one of them.
    expect(tier("Buenos Aires, Argentina", job)).toBe("same-country");
    expect(tier(LIMA, job)).toBe("same-country");
  });

  it("region-only strings: eligibility depends on the user's continent", () => {
    expect(tier(DAR, "Africa")).toBe("same-region");
    expect(tier(LAGOS, "Africa")).toBe("same-region");
    expect(tier(DAR, "Europe")).toBe("location-locked");
    expect(tier(LISBON, "Europe")).toBe("same-region");
    expect(tier(DAR, "APAC")).toBe("location-locked");
    expect(tier("Sydney, Australia", "APAC")).toBe("same-region");
    expect(tier(DAR, "Northern America, LATAM, Europe, APAC")).toBe("location-locked");
  });

  it("a user OUTSIDE Africa gets the same model with their own country as home", () => {
    expect(tier(LONDON, "London")).toBe("same-city");
    expect(tier(LONDON, "United Kingdom")).toBe("same-country");
    expect(tier(LONDON, "Dublin, Ireland")).toBe("same-subregion"); // both Northern Europe
    expect(tier(LONDON, "Warsaw, Poland")).toBe("same-region"); // different European sub-regions
    expect(tier(LONDON, "Lagos, Nigeria")).toBe("location-locked");
    expect(tier(LONDON, "Remote UK")).toBe("remote-region-eligible");
    expect(tier(LONDON, "Remote US")).toBe("remote-region-locked");
    expect(tier(LIMA, "Lima, Peru")).toBe("same-city");
    expect(tier(LIMA, "Bogota, Colombia")).toBe("same-subregion"); // both South America
    expect(tier(LIMA, "Mexico City, Mexico")).toBe("location-locked"); // different continent in this model
    expect(tier(LIMA, "Remote LATAM")).toBe("remote-region-eligible");
    expect(locationFit(LONDON, "London").multiplier).toBe(REACH_MULTIPLIER["same-city"]);
  });

  it("unrecognised USER location never manufactures a penalty", () => {
    expect(tier("Somewhereville", "London, United Kingdom")).toBe("unrestricted");
    expect(locationFit("Somewhereville", "London, United Kingdom").multiplier).toBe(1);
    expect(locationFit("Somewhereville", "Tanzania").multiplier).toBe(1);
  });

  it("accent folding, country codes and ISO-2 suffixes resolve", () => {
    expect(parsePlace("München").countries).toEqual(["Germany"]);
    expect(parsePlace("Köln").countries).toEqual(["Germany"]);
    expect(parsePlace("Düsseldorf").countries).toEqual(["Germany"]);
    expect(parsePlace("London, gb").countries).toEqual(["United Kingdom"]);
    expect(parsePlace("Vancouver, ca").countries).toEqual(["Canada"]);
    expect(parsePlace("Munich (DEU)").countries).toEqual(["Germany"]);
    expect(parsePlace("9th arrondissement of Paris, 75009, Paris").countries).toEqual(["France"]);
  });

  it("does not let ambient 2-letter words become countries ('in' is not India)", () => {
    // Regression: a naive ISO-2 lookup turns any incidental "in"/"no"/"so"
    // token into a country, which would silently re-rank the whole feed.
    expect(parsePlace("Based in London").countries).toEqual(["United Kingdom"]);
    expect(parsePlace("No location").countries).toEqual([]);
    expect(parsePlace("Open to all, any site").countries).toEqual([]);
  });

  it("generic geography words are never places", () => {
    for (const w of ["area", "region", "office", "hq", "hybrid", "onsite", "county", "state"]) {
      expect(GENERIC_WORDS.has(w), w).toBe(true);
      expect(parsePlace(w).recognised, w).toBe(false);
      expect(parsePlace(w).countries, w).toEqual([]);
    }
  });

  it("preferred locations are best-of, so stating a second location only ever helps", () => {
    const user = ["Dar es Salaam, Tanzania", "Nairobi, Kenya"];
    // London is locked under either user location.
    expect(tier(user, "London, United Kingdom")).toBe("location-locked");
    // Nairobi becomes a same-city match instead of a foreign-ish one.
    expect(tier(user, "Nairobi")).toBe("same-city");
    expect(tier(user, "Dar es Salaam")).toBe("same-city");
    expect(tier(user, "Mombasa, Kenya")).toBe("same-country");
  });

  it("willing to relocate removes every geographic penalty", () => {
    const opts = { relocate: true };
    for (const job of ["London, United Kingdom", "Remote US", "USA, Canada, Argentina, Mexico, Peru", "Europe"]) {
      const f = locationFit(DAR, job, opts);
      expect(f.multiplier, job).toBe(1);
      expect(f.reachable, job).toBe(true);
    }
    // Relocation does not erase the home advantage.
    expect(locationFit(DAR, "Dar es Salaam, Tanzania", opts).tier).toBe("same-city");
  });

  it("the default market is configurable — nothing is hard-wired to Tanzania", () => {
    expect(DEFAULT_MARKET).toBe("Tanzania");
    expect(locationFit("", "Nairobi, Kenya", { defaultMarket: "Kenya" }).tier).toBe("home-market");
    expect(locationFit("", "Nairobi, Kenya").tier).toBe("unrestricted");
    expect(locationFit("", "Tanzania", { defaultMarket: "Kenya" }).tier).toBe("unrestricted");
  });
});

describe("locationFit — calibration invariants", () => {
  it("no tier falls below 0.86 or rises above 1.06", () => {
    for (const [t, m] of Object.entries(REACH_MULTIPLIER)) {
      expect(m, t).toBeGreaterThanOrEqual(0.86);
      expect(m, t).toBeLessThanOrEqual(1.06);
    }
  });

  it("the widest geographic gap is smaller than 25% of keyword score", () => {
    const values = Object.values(REACH_MULTIPLIER);
    const ratio = Math.max(...values) / Math.min(...values);
    expect(ratio).toBeLessThan(1.25);
    // Concretely: a listing 25% better on keyword evidence always outranks the
    // most local listing available, however far away the better one is.
    const localRaw = 40; // Dar job
    const farRaw = 50; // London job, 25% better
    const local = localRaw * REACH_MULTIPLIER["same-city"];
    const far = farRaw * REACH_MULTIPLIER["location-locked"];
    expect(far).toBeGreaterThan(local);
  });

  it("never removes anything: the multiplier is always > 0", () => {
    const jobs = [
      "Dar es Salaam, Tanzania", "Nairobi, Kenya", "Lagos, Nigeria",
      "London, United Kingdom", "USA, Canada, Argentina, Mexico, Peru",
      "Remote US", "Remote - Europe", "Worldwide", "APAC", "", "Somewhereville",
    ];
    for (const u of [DAR, NAIROBI, LAGOS, LONDON, LIMA, "", "Somewhereville"]) {
      for (const j of jobs) {
        const f = locationFit(u, j);
        expect(f.multiplier, `${u} / ${j}`).toBeGreaterThan(0);
      }
    }
  });

  it("is order-consistent: a nearer tier never scores below a farther one", () => {
    const order: ReachTier[] = [
      "same-city", "same-country", "home-market", "remote-worldwide",
      "unrestricted", "location-unknown", "same-subregion", "same-region",
      "remote-region-eligible", "remote-region-locked", "location-locked",
    ];
    const seq = order.map((t) => REACH_MULTIPLIER[t]);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i], `${order[i]} after ${order[i - 1]}`).toBeLessThanOrEqual(seq[i - 1]);
    }
  });

  it("every tier is reachable or flagged unreachable, with a label", () => {
    expect(locationFit(DAR, "Dar es Salaam, Tanzania").label.length).toBeGreaterThan(0);
    expect(locationFit(DAR, "London, United Kingdom").reachable).toBe(false);
    expect(locationFit(DAR, "Dar es Salaam, Tanzania").reachable).toBe(true);
    expect(locationFit(DAR, "Remote US").reachable).toBe(false);
    expect(locationFit(DAR, "Remote").reachable).toBe(true);
  });
});

describe("compareByReach — the ordering rule", () => {
  const row = (user: string, job: string, raw: number) => {
    const fit = locationFit(user, job);
    return { job, raw, rank: rankScore(raw, fit), fit, reachable: fit.reachable };
  };

  it("puts every reachable listing above every unreachable one, however well matched", () => {
    const dar = "Dar es Salaam, Tanzania";
    const rows = [
      row(dar, "San Francisco, CA", 58),      // 49.88 — a US on-site role
      row(dar, "Remote", 30),                 // 30.00 — worldwide remote
      row(dar, "Nairobi, Kenya", 12),         // 11.88 — neighbouring region
      row(dar, "Lagos, Nigeria", 11),         // 10.56 — wider Africa
      row(dar, "Remote US", 37),              // 33.30 — remote, locked away
      row(dar, "Tanzania", 20),               // 20.60 — own country
    ].sort(compareByReach);
    const names = rows.map((r) => r.job);
    const firstUnreachable = names.indexOf("San Francisco, CA");
    // Every reachable listing precedes the 58%-match San Francisco role.
    expect(firstUnreachable).toBeGreaterThan(names.indexOf("Tanzania"));
    expect(firstUnreachable).toBeGreaterThan(names.indexOf("Remote"));
    expect(firstUnreachable).toBeGreaterThan(names.indexOf("Nairobi, Kenya"));
    expect(firstUnreachable).toBeGreaterThan(names.indexOf("Lagos, Nigeria"));
    // Remote US (37% match) is unreachable for a Dar user and also comes after.
    expect(names.indexOf("Remote US")).toBeGreaterThan(names.indexOf("Nairobi, Kenya"));
    // Within the reachable class, the better keyword match still wins: the
    // worldwide-remote role matches at 30 vs the Tanzanian role's 20, so it
    // leads — geography did NOT override a materially better match.
    expect(names[0]).toBe("Remote");
  });

  it("within a class, orders by rank (so a better keyword match wins)", () => {
    const dar = "Dar es Salaam, Tanzania";
    const rows = [
      row(dar, "Tanzania", 12),
      row(dar, "Tanzania", 30),
      row(dar, "Arusha, Tanzania", 20),
      row(dar, "Dar es Salaam, Tanzania", 14),
    ].sort(compareByReach);
    // same-city 1.06 * 14 = 14.84 beats same-country 1.03 * 12 = 12.36
    expect(rows[3].raw).toBe(12);
    expect(rows[0].raw).toBe(30);
  });

  it("a user OUTSIDE Africa gets their own continent class first, too", () => {
    const rows = [
      row(LONDON, "Lagos, Nigeria", 60),
      row(LONDON, "Dublin, Ireland", 20),
      row(LONDON, "Remote UK", 18),
      row(LONDON, "Remote US", 55),
    ].sort(compareByReach);
    // Lagos (60% match) and Remote US (55%) are locked for a London user.
    expect(rows.map((r) => r.job).slice(0, 2)).toEqual(["Dublin, Ireland", "Remote UK"]);
  });

  it("relocate: true lifts a foreign on-site role into the reachable class", () => {
    const dar = "Dar es Salaam, Tanzania";
    const sf = locationFit(dar, "San Francisco, CA", { relocate: true });
    expect(sf.reachable).toBe(true);
    const rows = [
      { rank: 10, fit: locationFit(dar, "Tanzania") },
      { rank: 49, fit: sf },
    ].sort(compareByReach);
    expect(rows[0].rank).toBe(49); // now ordered purely on rank
  });
});

describe("rankScore", () => {
  it("is the bounded nudge applied to keyword evidence, never a gate", () => {
    const dar = "Dar es Salaam, Tanzania";
    expect(rankScore(50, locationFit(dar, "Dar es Salaam, Tanzania"))).toBeCloseTo(53, 5);
    expect(rankScore(50, locationFit(dar, "London, United Kingdom"))).toBeCloseTo(43, 5);
    expect(rankScore(0, locationFit(dar, "London, United Kingdom"))).toBe(0);
    // Clamped, so the stored integer column is always valid.
    expect(rankScore(100, locationFit(dar, "Dar es Salaam, Tanzania"))).toBeLessThanOrEqual(100);
  });
});

describe("parseRemoteRestriction", () => {
  it("separates the remote flag from the geographic restriction", () => {
    expect(parseRemoteRestriction("Remote").restricted).toBe(false);
    expect(parseRemoteRestriction("Remote US").countries).toEqual(["United States"]);
    expect(parseRemoteRestriction("Remote (US Only)").countries).toEqual(["United States"]);
    expect(parseRemoteRestriction("Remote - Europe").regions).toEqual(["europe"]);
    expect(parseRemoteRestriction("Remote - California").countries).toEqual(["United States"]);
    expect(parseRemoteRestriction("Remote (Deutschland)").countries).toEqual(["Germany"]);
    expect(parseRemoteRestriction("Anywhere").restricted).toBe(false);
    expect(parseRemoteRestriction("Worldwide").restricted).toBe(false);
    expect(parseRemoteRestriction("London, United Kingdom").remote).toBe(false);
  });
});

describe("locationRelevance (back-compat shim)", () => {
  it("returns the fit multiplier so existing callers keep working", () => {
    expect(locationRelevance(DAR, "Dar es Salaam, Tanzania")).toBe(1.06);
    expect(locationRelevance(DAR, "Nairobi, Kenya")).toBe(0.99);
    expect(locationRelevance(DAR, "Lagos, Nigeria")).toBe(0.96);
    expect(locationRelevance(DAR, "London, United Kingdom")).toBe(0.86);
    expect(locationRelevance(DAR, "Worldwide")).toBe(1);
    expect(locationRelevance(DAR, "Remote")).toBe(1);
    expect(locationRelevance(DAR, "Remote US")).toBe(0.9);
    expect(locationRelevance(DAR, "USA, Canada, Argentina, Mexico, Peru")).toBe(0.86);
    expect(locationRelevance(DAR, "")).toBe(1);
    expect(locationRelevance(DAR, "Dar es Salaam, Tanzania")).toBe(locationFit(DAR, "Dar es Salaam, Tanzania").multiplier);
  });

  it("keeps the original relative ordering guarantees", () => {
    // The old test file asserted these three; they must still hold.
    expect(locationRelevance(DAR, "Remote")).toBe(1);
    expect(locationRelevance(DAR, "Remote - Worldwide")).toBe(1);
    expect(locationRelevance(DAR, "Toronto, Canada")).toBeLessThan(1);
    expect(locationRelevance(DAR, "London, United Kingdom")).toBeLessThan(1);
    const nearby = locationRelevance(DAR, "Nairobi, Kenya");
    const far = locationRelevance(DAR, "Berlin, Germany");
    expect(nearby).toBeGreaterThan(far);
    expect(locationRelevance("Coastal Region, Tanzania", "Bay Area, USA")).toBeLessThan(1);
    expect(locationRelevance("Arusha, Tanzania", "Tanzania")).toBe(1.03);
  });
});
