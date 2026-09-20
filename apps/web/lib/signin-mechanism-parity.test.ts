/**
 * THE SEAM TEST — web and native must sign in to Google the SAME way.
 *
 * Why this test exists (the bug it would have caught)
 * ---------------------------------------------------
 * On 2026-09-20 Google sign-in worked on the phone and failed on the web, and
 * every piece passed its own tests, because the two clients used different
 * mechanisms across a seam nobody asserted:
 *
 *   web    → supabase.auth.signInWithOAuth({ provider: "google" })
 *            → THROUGH Supabase → needs the Google client SECRET stored in the
 *              Supabase project → unset → every request answered
 *              400 "Unsupported provider: missing OAuth secret"
 *   native → GoogleSignin.signIn() (Google directly) → ID token
 *            → supabase.auth.signInWithIdToken() → needs NO secret
 *
 * So the web now mirrors native: Google mints the ID token in the browser, and
 * Supabase only verifies it. This file reads BOTH source trees and asserts they
 * still agree, plus that the browser is actually allowed to reach Google (CSP).
 * Drift in either direction — reintroducing the OAuth redirect, or the two
 * surfaces using different client IDs — fails here instead of on a user's phone.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildCsp } from "./security/csp.mjs";

// apps/web/lib → apps/web → apps
const APPS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const WEB = {
  authClient: path.join(APPS_DIR, "web", "lib", "auth-client.ts"),
  googleIdentity: path.join(APPS_DIR, "web", "lib", "google-identity.ts"),
  signInForm: path.join(APPS_DIR, "web", "app", "(app)", "(auth)", "sign-in", "sign-in-form.tsx"),
  editor: path.join(APPS_DIR, "web", "components", "editor", "cv-editor-client.tsx"),
  csp: path.join(APPS_DIR, "web", "lib", "security", "csp.mjs"),
};
const NATIVE = {
  authContext: path.join(APPS_DIR, "native", "src", "contexts", "auth-context.tsx"),
  supabase: path.join(APPS_DIR, "native", "src", "lib", "supabase.ts"),
};

function read(file: string): string {
  return readFileSync(file, "utf8");
}

/** `signInWithIdToken({ provider: "google", token: … })` in either dialect. */
const ID_TOKEN_CALL = /signInWithIdToken\(\{[^}]*provider:\s*"google"[^}]*token:/;

describe("web and native sign in with Google the same way", () => {
  it("both verify a Google ID token through Supabase", () => {
    expect(read(WEB.authClient)).toMatch(ID_TOKEN_CALL);
    expect(read(NATIVE.authContext)).toMatch(ID_TOKEN_CALL);
  });

  it("rejects a real OAuth-redirect call on either side", () => {
    // A CALL (any `<client>.signInWithOAuth(`) is what breaks; prose in a comment
    // that warns against it is fine.
    expect(read(WEB.authClient)).not.toMatch(/\.signInWithOAuth\s*\(/);
    expect(read(NATIVE.authContext)).not.toMatch(/\.signInWithOAuth\s*\(/);
    // And no hand-rolled redirect to Supabase's authorize endpoint either.
    for (const file of [WEB.authClient, NATIVE.authContext]) {
      expect(read(file)).not.toContain("/auth/v1/authorize");
      expect(read(file)).not.toContain("provider=google");
    }
  });

  it("both get the ID token straight from Google, not from a redirect", () => {
    // Web: the browser-side Google Identity Services client.
    expect(read(WEB.googleIdentity)).toContain("https://accounts.google.com/gsi/client");
    // Native: the OS account-picker library.
    const native = read(NATIVE.authContext);
    expect(native).toContain("@react-native-google-signin/google-signin");
    expect(native).toMatch(/GoogleSignin\.signIn\(\)/);
  });

  it("resolves Google from the SAME OAuth client ID on both surfaces", () => {
    const pattern = /\d{6,}-[a-z0-9]+\.apps\.googleusercontent\.com/;
    const webId = read(WEB.googleIdentity).match(pattern)?.[0];
    const nativeId = read(NATIVE.supabase).match(pattern)?.[0];
    expect(webId).toBeTruthy();
    expect(nativeId).toBeTruthy();
    // A mismatch here is invisible until sign-in fails: Supabase validates the
    // ID token's audience against the one client ID the provider is configured
    // with.
    expect(webId).toBe(nativeId);
  });
});

describe("the web UI can only reach the working path", () => {
  it("every Google button calls signIn.google — never the removed signIn.social", () => {
    for (const file of [WEB.signInForm, WEB.editor]) {
      const source = read(file);
      expect(source).toContain("signIn.google(");
      expect(source).not.toContain("signIn.social(");
    }
  });

  it("the API exposes google and no longer exposes social", () => {
    const api = read(WEB.authClient);
    expect(api).toMatch(/^\s*google:\s*async/m);
    expect(api).not.toMatch(/^\s*social:\s*async/m);
  });
});

describe("the browser is actually allowed to reach Google (CSP)", () => {
  it("allows the GIS script, its stylesheet, callback origin and its iframe", () => {
    for (const dev of [true, false]) {
      const csp = buildCsp(dev);
      expect(csp).toMatch(/script-src [^;]*https:\/\/accounts\.google\.com/);
      // GIS ships its own stylesheet: blocked style-src leaves the prompt unstyled.
      expect(csp).toMatch(/style-src [^;]*https:\/\/accounts\.google\.com/);
      expect(csp).toMatch(/connect-src [^;]*https:\/\/accounts\.google\.com/);
      // No frame-src means default-src 'self' governs, and Google's account sheet
      // is silently blocked — the button fails with a console error only.
      expect(csp).toMatch(/frame-src [^;]*https:\/\/accounts\.google\.com/);
    }
  });

  it("ships that policy as a real response header", () => {
    const config = read(path.join(APPS_DIR, "web", "next.config.mjs"));
    expect(config).toContain("buildCsp");
    expect(config).toMatch(/Content-Security-Policy/);
  });
});
