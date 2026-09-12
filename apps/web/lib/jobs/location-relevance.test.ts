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

  it("does not penalize when the user's location is unknown", () => {
    expect(locationRelevance("", "Toronto, Canada")).toBe(1);
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

  it("ignores generic geography words when comparing", () => {
    // "Region" and "Area" alone shouldn't manufacture a false overlap.
    expect(locationRelevance("Coastal Region, Tanzania", "Bay Area, USA")).toBeLessThan(1);
  });
});
