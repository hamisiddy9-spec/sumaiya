/**
 * auth-client wiring — the seam where the web Google button meets Supabase.
 *
 * What these tests protect:
 *   1. Google sign-in goes Google → ID token → `signInWithIdToken`. It must
 *      never go back to `signInWithOAuth`, which needs a Google client secret
 *      stored in Supabase. That secret is not configured, so the OAuth route
 *      answers 400 "Unsupported provider: missing OAuth secret" and the button
 *      is dead (reproduced with curl 2026-09-20). The wiring assertion is here;
 *      the web-vs-native parity assertion is in signin-mechanism-parity.test.ts.
 *   2. The EMAIL paths still work — the 6-digit code is the primary route for
 *      the target audience, and it must survive any Google change untouched.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithIdToken: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  requestGoogleIdToken: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithIdToken: mocks.signInWithIdToken,
      signInWithOAuth: mocks.signInWithOAuth,
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
    },
  }),
}));

vi.mock("@/lib/google-identity", () => ({
  requestGoogleIdToken: mocks.requestGoogleIdToken,
}));

import { signIn } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithIdToken.mockResolvedValue({ data: { session: { access_token: "at" } }, error: null });
  mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });
  mocks.verifyOtp.mockResolvedValue({ data: { session: { access_token: "at" } }, error: null });
});

describe("signIn.google — Google Identity Services + signInWithIdToken", () => {
  it("hands Google's ID token to Supabase and returns the session", async () => {
    mocks.requestGoogleIdToken.mockResolvedValue({
      ok: true,
      token: "google.id.token",
      clientId: "811013224847-x.apps.googleusercontent.com",
    });

    const result = await signIn.google();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ session: { access_token: "at" } });
    expect(mocks.signInWithIdToken).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "google.id.token",
    });
    // The route that needs a Supabase-hosted client secret must never be used.
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("never calls Supabase at all when Google gives no token", async () => {
    mocks.requestGoogleIdToken.mockResolvedValue({
      ok: false,
      reason: "not_configured",
      message: "Google sign-in is not configured (client id: \"(empty)\")",
    });

    const result = await signIn.google();

    expect(result.data).toBeNull();
    // The reason travels as `code` so the UI can localize it.
    expect(result.error?.code).toBe("not_configured");
    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("passes a Supabase rejection through with its code intact", async () => {
    mocks.requestGoogleIdToken.mockResolvedValue({
      ok: true,
      token: "google.id.token",
      clientId: "811013224847-x.apps.googleusercontent.com",
    });
    mocks.signInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: "Invalid token", code: "validation_failed" },
    });

    const result = await signIn.google();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: "Invalid token", code: "validation_failed" });
  });

  it("no longer exposes the old redirect entry point", () => {
    // Present tense matters: `signIn.social` is what made web go through
    // Supabase. If it comes back, screens can silently drift back to a path that
    // cannot work on this project.
    expect(signIn).not.toHaveProperty("social");
  });
});

describe("email sign-in still works (the primary path must not regress)", () => {
  it("sends a magic link", async () => {
    const result = await signIn.magicLink({ email: "a@b.co", callbackURL: "https://sumaiya.app/api/auth/callback?next=%2Fdashboard" });

    expect(result.error).toBeNull();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "a@b.co",
      options: { emailRedirectTo: "https://sumaiya.app/api/auth/callback?next=%2Fdashboard" },
    });
  });

  it("emails a 6-digit code for the installed PWA", async () => {
    const result = await signIn.emailCode({ email: "a@b.co" });

    expect(result.error).toBeNull();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "a@b.co",
      options: { shouldCreateUser: true },
    });
  });

  it("verifies the typed code and returns the session", async () => {
    const result = await signIn.verifyEmailCode({ email: "a@b.co", token: "123456" });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ session: { access_token: "at" } });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: "a@b.co", token: "123456", type: "email" });
  });

  it("maps a Supabase email error to a code the UI can localize", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      data: null,
      error: { message: "Email rate limit exceeded", code: "over_email_send_rate_limit" },
    });

    const result = await signIn.emailCode({ email: "a@b.co" });

    expect(result.error?.code).toBe("over_email_send_rate_limit");
  });
});
