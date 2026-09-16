import { describe, it, expect } from "vitest";
import { locationRelevance } from "./location-relevance";

describe("locationRelevance", () => {
  it("does not penalize a remote job regardless of user location", () => {
    expect(locationRelevance("Dar es Salaam, Tanzania", "Remote")).toBe(1);
    expect(locationRelevance("Dar es Salaam, Tanzania", "Remote - Worldwide")).toBe(1);
  });

  it("does not penalize when the job states no location", () => {
    expect(locationRelevance("Dar es Salaam, Tanzania", "")).toBe(1);
    expect(locationRelevance("Dar es Salaam, Tanzania", "   ")).toBe(1);
  });

  it("defaults an unknown user location to Tanzania (Tanzania-first)", () => {
    // A user with no stated location is treated as Tanzanian, so a far-away
    // posting is demoted rather than floating to the top on keyword match.
    expect(locationRelevance("", "Toronto, Canada")).toBeLessThan(1);
    expect(locationRelevance("", "Dar es Salaam, Tanzania")).toBe(1);
    expect(locationRelevance("", "Nairobi, Kenya")).toBeGreaterThan(0.5);
  });

  it("does not penalize a real geographic overlap", () => {
    expect(locationRelevance("Dar es Salaam, Tanzania", "Dar es Salaam")).toBe(1);
    expect(locationRelevance("Arusha, Tanzania", "Tanzania")).toBe(1);
    expect(locationRelevance("Nairobi, Kenya", "Nairobi, Kenya")).toBe(1);
  });

  it("demotes a specific non-remote location that shares nothing with the user's", () => {
    expect(locationRelevance("Dar es Salaam, Tanzania", "Toronto, Canada")).toBeLessThan(1);
    expect(locationRelevance("Dar es Salaam, Tanzania", "London, United Kingdom")).toBeLessThan(1);
  });

  it("gives a nearby East African nation mild (not hard) demotion", () => {
    const nearby = locationRelevance("Dar es Salaam, Tanzania", "Nairobi, Kenya");
    const far = locationRelevance("Dar es Salaam, Tanzania", "Berlin, Germany");
    expect(nearby).toBeGreaterThan(far);
  });

  it("ignores generic geography words when comparing", () => {
    // "Region" and "Area" alone shouldn't manufacture a false overlap.
    expect(locationRelevance("Coastal Region, Tanzania", "Bay Area, USA")).toBeLessThan(1);
  });
});
