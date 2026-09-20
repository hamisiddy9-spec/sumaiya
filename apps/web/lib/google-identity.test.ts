/**
 * Google Identity Services — the browser half of Google sign-in.
 *
 * These tests exist because the web path used to go through Supabase
 * (`signInWithOAuth`) and needed a Supabase-hosted Google client SECRET that
 * this project does not have; every click answered
 * 400 "Unsupported provider: missing OAuth secret". GIS mints the ID token in
 * the browser instead, and Supabase only verifies it.
 *
 * No jsdom here: the window/document GIS touches are injected, so every branch
 * is reachable from plain node.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_GIS_SCRIPT_SRC,
  googleClientIdIsConfigured,
  loadGoogleIdentityScript,
  requestGoogleIdToken,
  type GoogleCredentialResponse,
  type GoogleIdentityDocumentLike,
  type GoogleIdentityWindowLike,
  type GooglePromptNotification,
} from "./google-identity";

interface FakeGis {
  win: GoogleIdentityWindowLike;
  configs: Record<string, unknown>[];
  deliver: (credential: string) => void;
  notify: (notification: GooglePromptNotification) => void;
}

/** A GIS stand-in: records initialize() config, lets the test drive both callbacks. */
function fakeGis(): FakeGis {
  const configs: Record<string, unknown>[] = [];
  let callback: ((response: GoogleCredentialResponse) => void) | null = null;
  let listener: ((notification: GooglePromptNotification) => void) | undefined;
  const win: GoogleIdentityWindowLike = {
    google: {
      accounts: {
        id: {
          initialize: (config) => {
            configs.push(config as unknown as Record<string, unknown>);
            callback = config.callback;
          },
          prompt: (momentListener) => {
            listener = momentListener;
          },
          cancel: () => {},
        },
      },
    },
  };
  return {
    win,
    configs,
    deliver: (credential) => callback?.({ credential }),
    notify: (notification) => listener?.(notification),
  };
}

/** A document stand-in that either loads the GIS script or fails to. */
function fakeDoc(win: GoogleIdentityWindowLike, opts: { fail?: boolean } = {}) {
  let appended = 0;
  const doc: GoogleIdentityDocumentLike = {
    getElementById: () => null,
    createElement: () => ({}),
    head: {
      appendChild: (node) => {
        appended += 1;
        if (opts.fail) {
          node.onerror?.();
          return;
        }
        win.google = {
          accounts: {
            id: {
              initialize: () => {},
              prompt: () => {},
            },
          },
        };
        node.onload?.();
      },
    },
  };
  return { doc, appended: () => appended };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("GOOGLE_CLIENT_ID", () => {
  it("ships a usable public web client ID even with no env var set", () => {
    // The deployed web app has no NEXT_PUBLIC_GOOGLE_CLIENT_ID (apps/web/.env.local
    // holds DATABASE_URL only) — the literal fallback is what keeps the button
    // alive. It is the same client ID the NATIVE app passes to webClientId, so an
    // ID token from either surface verifies against the same Supabase provider.
    expect(googleClientIdIsConfigured()).toBe(true);
    expect(GOOGLE_CLIENT_ID).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
  });

  it("rejects empty, blank and malformed client IDs", () => {
    expect(googleClientIdIsConfigured("")).toBe(false);
    expect(googleClientIdIsConfigured("   ")).toBe(false);
    expect(googleClientIdIsConfigured("811013224847.apps.googleusercontent.com")).toBe(false);
    expect(googleClientIdIsConfigured("not-a-client-id")).toBe(false);
  });

  it("trims before validating (a copy-pasted env value keeps its spaces)", () => {
    expect(googleClientIdIsConfigured("  811013224847-abcd.apps.googleusercontent.com  ")).toBe(true);
  });
});

describe("requestGoogleIdToken", () => {
  it("returns the Google ID token and never touches Supabase's OAuth route", async () => {
    const gis = fakeGis();
    const promise = requestGoogleIdToken({ win: gis.win, doc: null });
    gis.deliver("header.payload.signature");
    const outcome = await promise;

    expect(outcome).toEqual({
      ok: true,
      token: "header.payload.signature",
      clientId: GOOGLE_CLIENT_ID,
    });
    expect(gis.configs[0].client_id).toBe(GOOGLE_CLIENT_ID);
    // FedCM is the current transport; without it Chrome suppresses the sheet.
    expect(gis.configs[0].use_fedcm_for_prompt).toBe(true);
  });

  it("refuses to start when no client ID is configured", async () => {
    const gis = fakeGis();
    const outcome = await requestGoogleIdToken({ win: gis.win, doc: null, clientId: "" });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("not_configured");
    expect(gis.configs).toHaveLength(0);
  });

  it("reports why Google refused to show the sheet", async () => {
    const gis = fakeGis();
    const promise = requestGoogleIdToken({ win: gis.win, doc: null });
    gis.notify({
      isNotDisplayed: () => true,
      getNotDisplayedReason: () => "unregistered_origin",
    });
    const outcome = await promise;
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("not_supported");
    expect(outcome.message).toContain("unregistered_origin");
  });

  it("distinguishes 'the user closed it' from 'the browser refused'", async () => {
    const gis = fakeGis();
    const promise = requestGoogleIdToken({ win: gis.win, doc: null });
    gis.notify({ isSkippedMoment: () => true, getSkippedReason: () => "user_cancel" });
    const outcome = await promise;
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("dismissed");
  });

  it("gives up instead of hanging forever if Google never answers", async () => {
    vi.useFakeTimers();
    const gis = fakeGis();
    const promise = requestGoogleIdToken({ win: gis.win, doc: null, timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(51);
    const outcome = await promise;
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("timeout");
  });

  it("loads the GIS client script when the page has not loaded it yet", async () => {
    const win: GoogleIdentityWindowLike = {};
    const { doc, appended } = fakeDoc(win);
    // The fake document installs window.google and fires onload on append; the
    // installed API is a no-op, so with nothing delivering a credential this can
    // only end in the timeout — which is what proves the script load path ran
    // (script_unavailable would mean it never did).
    const outcome = await requestGoogleIdToken({ win, doc, timeoutMs: 20 });
    expect(appended()).toBe(1);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("timeout");
  });

  it("fails cleanly when the GIS script cannot be fetched", async () => {
    const win: GoogleIdentityWindowLike = {};
    const { doc } = fakeDoc(win, { fail: true });
    const outcome = await requestGoogleIdToken({ win, doc, timeoutMs: 10 });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("script_unavailable");
    expect(outcome.message).toContain(GOOGLE_GIS_SCRIPT_SRC);
  });

  it("cannot invent a browser when there is no document at all", async () => {
    const outcome = await requestGoogleIdToken({ win: {}, doc: null });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("unreachable");
    expect(outcome.reason).toBe("script_unavailable");
  });
});

describe("loadGoogleIdentityScript", () => {
  it("injects the GIS client exactly once", async () => {
    const win: GoogleIdentityWindowLike = {};
    const { doc, appended } = fakeDoc(win);
    expect(await loadGoogleIdentityScript(doc)).toBe(true);
    expect(appended()).toBe(1);
  });

  it("reuses an already-present script tag instead of adding a second", async () => {
    let appended = 0;
    const doc: GoogleIdentityDocumentLike = {
      getElementById: (id) => (id === "google-identity-services" ? { id } : null),
      createElement: () => ({}),
      head: {
        appendChild: () => {
          appended += 1;
        },
      },
    };
    expect(await loadGoogleIdentityScript(doc)).toBe(true);
    expect(appended).toBe(0);
  });
});
