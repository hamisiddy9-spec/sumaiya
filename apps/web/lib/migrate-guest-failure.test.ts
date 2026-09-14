import { describe, it, expect } from "vitest";
import {
  isUnusableSession,
  migrationFailure,
  MAX_MIGRATION_ATTEMPTS,
} from "./migrate-guest-failure";

describe("isUnusableSession — failures a retry cannot fix", () => {
  it("treats 401 and 403 as unusable", () => {
    expect(isUnusableSession(401)).toBe(true);
    expect(isUnusableSession(403)).toBe(true);
  });

  it("does not treat a transport failure as an unusable session", () => {
    // fetch rejected: there is no response, so nothing says the token is dead.
    // Calling this unusable would send a signed-in user back to sign-in for no
    // reason and lose the retry that would actually have worked.
    expect(isUnusableSession(null)).toBe(false);
  });

  it("does not treat a server or client error as an unusable session", () => {
    for (const status of [400, 404, 422, 429, 500, 502, 503]) {
      expect(isUnusableSession(status)).toBe(false);
    }
  });
});

describe("migrationFailure — what to say, and whether to offer a retry", () => {
  it("is retryable for the first failure", () => {
    const f = migrationFailure(true, 1);
    expect(f.retryable).toBe(true);
    expect(f.message).toContain("jaribu tena");
  });

  it("is still retryable on the last attempt inside the budget", () => {
    expect(migrationFailure(true, MAX_MIGRATION_ATTEMPTS - 1).retryable).toBe(true);
  });

  it("stops offering a retry once the budget is spent", () => {
    expect(migrationFailure(true, MAX_MIGRATION_ATTEMPTS).retryable).toBe(false);
    expect(migrationFailure(true, MAX_MIGRATION_ATTEMPTS + 10).retryable).toBe(false);
  });

  it("tells the user the draft survived, because it only leaves localStorage after a 2xx", () => {
    expect(migrationFailure(true, MAX_MIGRATION_ATTEMPTS).message).toContain("rasimu yako");
    expect(migrationFailure(false, MAX_MIGRATION_ATTEMPTS).message).toContain("your draft is safe");
  });

  it("never returns an empty message in either language", () => {
    for (const sw of [true, false]) {
      for (const attempts of [1, 2, MAX_MIGRATION_ATTEMPTS, MAX_MIGRATION_ATTEMPTS + 5]) {
        expect(migrationFailure(sw, attempts).message.length).toBeGreaterThan(0);
      }
    }
  });

  it("answers in the requested language", () => {
    expect(migrationFailure(true, 1).message).not.toBe(migrationFailure(false, 1).message);
  });
});
