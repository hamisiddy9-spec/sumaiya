import { describe, it, expect } from "vitest";
import { toStringArray } from "./index";

// `job_recommendation.matched_terms` is a JSON STRING in 46 of 46 production
// rows, and both readers took it with an unchecked `as string[]`. A string
// wearing an array type does not fail where you notice: it is not null-ish so
// `?? []` never fires, `.length` is the character count, and `.slice(0, 8)`
// is the first eight CHARACTERS — so the chips showing a user WHY a job
// matched would have rendered fragments of serialised JSON.

describe("toStringArray — the boundary between a jsonb column and a term list", () => {
  it("unwraps a JSON string into the array it holds", () => {
    expect(toStringArray('["Mauzo","Excel","Hesabu"]')).toEqual(["Mauzo", "Excel", "Hesabu"]);
  });

  it("passes a healthy array through unchanged", () => {
    expect(toStringArray(["Mauzo", "Excel"])).toEqual(["Mauzo", "Excel"]);
  });

  it("drops non-string members rather than leaking them into a string[]", () => {
    expect(toStringArray('["Mauzo",3,null,{"a":1},"Excel"]')).toEqual(["Mauzo", "Excel"]);
  });

  it("returns an empty array for anything it cannot read, and never throws", () => {
    for (const bad of [null, undefined, "", "not json", "{}", 42, true, { a: 1 }, '{"a":1}']) {
      expect(toStringArray(bad)).toEqual([]);
    }
  });

  it("is not satisfied by a string — the exact bug", () => {
    // The old code was `(v ?? []) as string[]`. Assert what that produced, so
    // the difference is on the record rather than in a comment.
    const stored = '["Mauzo"]';
    const legacy = (stored ?? []) as unknown as string[];
    // Derived, never hand-counted: I miscounted this string as 10 characters
    // and the assertion failed on my arithmetic rather than on the behaviour.
    expect(legacy.length).toBe(stored.length);
    expect(legacy.length).not.toBe(1);        // one term, not one element
    expect(legacy.slice(0, 3)).toBe('[\"M');  // the first three CHARACTERS
    expect(toStringArray(stored)).toEqual(["Mauzo"]);
  });
});
