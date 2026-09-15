/**
 * The copy shown when the CV list fails.
 *
 * The screen said "Your CVs are safe on your account — we just couldn't reach
 * the server" no matter what went wrong, including a 401 — while the honest
 * thing was buttons away. These tests hold the line that the message must match
 * the cause, because a wrong message sends the user to fix the wrong thing (and
 * here it kept them tapping Try again against a request that could not succeed).
 */
import { ApiError } from "@sumaiya/api-client";

import { classifyCvError, cvErrorCopy, type CvErrorKind } from "./cv-fetch-error";

describe("classifyCvError", () => {
  it("reads a refused session as auth, never as a connection problem", () => {
    expect(classifyCvError(new ApiError(401, "Unauthorized", "unauthorized"))).toBe("unauthorized");
    expect(classifyCvError({ status: 401 })).toBe("unauthorized");
    expect(classifyCvError({ status: 403 })).toBe("unauthorized");
    // Even when the status is missing, the client's own label decides.
    expect(classifyCvError({ kind: "unauthorized" })).toBe("unauthorized");
  });

  it("separates a server fault from our own deadline from a dead link", () => {
    expect(classifyCvError({ status: 500 })).toBe("server");
    expect(classifyCvError({ status: 503 })).toBe("server");
    expect(classifyCvError(new ApiError(0, "took too long", "timeout"))).toBe("timeout");
    expect(classifyCvError(new ApiError(0, "no route", "network"))).toBe("offline");
    expect(classifyCvError({ status: 0 })).toBe("offline");
  });

  it("survives junk instead of throwing on the error path", () => {
    expect(classifyCvError(undefined)).toBe("unknown");
    expect(classifyCvError(null)).toBe("unknown");
    expect(classifyCvError("boom")).toBe("unknown");
    expect(classifyCvError(new Error("plain"))).toBe("unknown");
  });
});

describe("cvErrorCopy", () => {
  const kinds: CvErrorKind[] = ["unauthorized", "server", "timeout", "offline", "unknown"];

  it.each(kinds)("%s is written in both languages with a real action", (kind) => {
    const copy = cvErrorCopy(kind);
    for (const field of [copy.title, copy.body, copy.action]) {
      expect(field.en.trim().length).toBeGreaterThan(0);
      expect(field.sw.trim().length).toBeGreaterThan(0);
    }
  });

  it("offers a sign-in action — not a retry — when the session was refused", () => {
    const copy = cvErrorCopy("unauthorized");
    expect(copy.actionKind).toBe("signin");
    // The lie this replaces: blaming the network for a refused session.
    expect(copy.body.en.toLowerCase()).not.toMatch(/reach|connection|network|offline/);
    expect(copy.body.sw.toLowerCase()).not.toMatch(/kufikia server|muunganisho|mtandao/);
  });

  it("keeps every retryable failure retryable", () => {
    for (const kind of ["server", "timeout", "offline", "unknown"] as CvErrorKind[]) {
      expect(cvErrorCopy(kind).actionKind).toBe("retry");
    }
  });

  it("only promises the CVs are safe where that is actually true", () => {
    // True for a transport failure (the data never left the account)…
    expect(cvErrorCopy("offline").body.en).toMatch(/safe on your account/);
    // …and false for a server fault, where we simply do not know.
    expect(cvErrorCopy("server").body.en).not.toMatch(/safe on your account/);
  });
});
