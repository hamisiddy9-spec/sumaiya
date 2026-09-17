/**
 * Guards the one-source-of-truth rule in lib/app-hosts.ts.
 *
 * The bug this file exists to prevent: the canonical host lived in eight
 * hand-typed places across code AND config. Moving the domain caught the code
 * and silently missed two config files, which is how a build can call one host
 * while its App Links filter claims another. Every assertion below fails loudly
 * the moment a host is typed out by hand again.
 */
import fs from "fs";
import path from "path";
import {
  APK_DOWNLOAD_URL,
  CANONICAL_HOST,
  CANONICAL_ORIGIN,
  DEEP_LINK_PREFIXES,
  LEGACY_ORIGINS,
  PASSWORD_RESET_URL,
  SUPPORT_EMAIL,
} from "../lib/app-hosts";

// __dirname is apps/native/src/__tests__ — two levels up is the app root, where
// app.json, eas.json and .env actually live.
const root = path.join(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      walk(rel, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

describe("app-hosts — one source of truth", () => {
  it("is the apex, not www", () => {
    // www 308-redirects, and Android will not follow a redirect to fetch
    // assetlinks.json, so claiming www yields a permanent verification failure.
    expect(CANONICAL_HOST).toBe("sumaiya.app");
    expect(CANONICAL_ORIGIN).toBe(`https://${CANONICAL_HOST}`);
  });

  it("derives every app-facing URL from the canonical origin", () => {
    expect(APK_DOWNLOAD_URL).toBe(`${CANONICAL_ORIGIN}/downloads/sumaiya.apk`);
    expect(PASSWORD_RESET_URL).toBe(`${CANONICAL_ORIGIN}/reset-password`);
    expect(DEEP_LINK_PREFIXES[0]).toBe(CANONICAL_ORIGIN);
  });

  it("accepts the legacy origins so already-sent links still resolve", () => {
    expect(DEEP_LINK_PREFIXES).toEqual(
      expect.arrayContaining([...LEGACY_ORIGINS]),
    );
    expect(DEEP_LINK_PREFIXES).toContain(`https://www.${CANONICAL_HOST}`);
  });

  it("keeps support mail on the domain that has mailboxes", () => {
    // sumaiya.app has no MX records — anything sent to @sumaiya.app bounces.
    expect(SUPPORT_EMAIL.endsWith("@templatehub.pro")).toBe(true);
    expect(SUPPORT_EMAIL.startsWith("support@")).toBe(true);
  });

  describe("config files agree with the code", () => {
    it("app.json claims exactly the canonical host, with autoVerify", () => {
      const appJson = JSON.parse(read("app.json"));
      const filters = appJson.expo.android.intentFilters as any[];
      const verified = filters.filter((f) => f.autoVerify);
      expect(verified).toHaveLength(1);
      const hosts = verified[0].data.map((d: any) => d.host).filter(Boolean);
      expect(hosts).toEqual([CANONICAL_HOST]);
    });

    it("app.json version matches the versionCode scheme (10612 <-> 1.6.12)", () => {
      const appJson = JSON.parse(read("app.json")).expo;
      const [maj, min, patch] = appJson.version.split(".").map(Number);
      expect(appJson.android.versionCode).toBe(maj * 10000 + min * 100 + patch);
    });

    it("build.gradle ships the same version as app.json", () => {
      // This is the assertion that was missing: android/ is committed (bare
      // workflow), so Gradle — not app.json — is what actually goes into the
      // APK. Editing app.json alone produced a "1.6.12" build that still
      // installed as 1.6.11, and only reading the built APK revealed it.
      const gradle = read("android/app/build.gradle");
      const appJson = JSON.parse(read("app.json")).expo;

      const code = gradle.match(/versionCode\s+(\d+)/);
      const name = gradle.match(/versionName\s+"([^"]+)"/);
      if (!code || !name) {
        throw new Error("android/app/build.gradle has no versionCode/versionName to compare");
      }

      expect(Number(code[1])).toBe(appJson.android.versionCode);
      expect(name[1]).toBe(appJson.version);
    });

    it("the Android manifest claims exactly the canonical host", () => {
      const manifest = read("android/app/src/main/AndroidManifest.xml");
      const block = manifest.match(
        /<intent-filter android:autoVerify="true">[\s\S]*?<\/intent-filter>/,
      );
      expect(block).toBeTruthy();
      const hosts = [...block![0].matchAll(/android:host="([^"]+)"/g)].map((m) => m[1]);
      expect(hosts).toEqual([CANONICAL_HOST]);
    });

    it("nothing claims the redirecting www host", () => {
      expect(read("android/app/src/main/AndroidManifest.xml")).not.toContain(
        `android:host="www.${CANONICAL_HOST}"`,
      );
      const filters = JSON.parse(read("app.json")).expo.android.intentFilters;
      expect(JSON.stringify(filters)).not.toContain(`"host":"www.${CANONICAL_HOST}"`);
    });

    it("every eas.json build profile points at the canonical origin", () => {
      const eas = JSON.parse(read("eas.json")).build as Record<string, any>;
      const profiles = Object.entries(eas).filter(([, p]) => p.env?.EXPO_PUBLIC_API_URL);
      expect(profiles.length).toBeGreaterThan(0);
      for (const [name, profile] of profiles) {
        expect(`${name}=${profile.env.EXPO_PUBLIC_API_URL}`).toBe(
          `${name}=${CANONICAL_ORIGIN}`,
        );
      }
    });

    it("the tracked .env.example documents the canonical origin", () => {
      // .env itself is git-ignored, so asserting on it would pass locally and
      // fail in CI. .env.example is the tracked artefact, and it is what a new
      // machine copies from.
      expect(read(".env.example")).toContain(`EXPO_PUBLIC_API_URL=${CANONICAL_ORIGIN}`);
    });

    it("a local .env, when present, points at the canonical origin", () => {
      // .env is git-ignored, so this test has three states to stay honest in:
      // absent (a clean clone, or CI — nothing to check), present without an
      // EXPO_PUBLIC_API_URL entry (legitimate: lib/api-client.ts falls back to
      // CANONICAL_ORIGIN, the same host), and present with one (it must be the
      // canonical origin, never a local/staging/www host typed by hand).
      //
      // It reads that entry out of the file rather than demanding the whole
      // file be exactly one line. The old form did the latter, and so failed
      // the moment a local .env also carried EXPO_PUBLIC_SENTRY_DSN — a
      // second variable has nothing to do with which host the app talks to.
      const file = path.join(root, ".env");
      if (!fs.existsSync(file)) return; // git-ignored and absent — nothing to check

      const contents = read(".env");
      expect(contents.trim().length).toBeGreaterThan(0); // it really was read

      const PREFIX = "EXPO_PUBLIC_API_URL=";
      const values = contents
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith(PREFIX)) // a commented-out line does not count
        .map((line) => line.slice(PREFIX.length).trim());

      for (const value of values) {
        // Quoted or space-padded values fail here too: api-client.ts would
        // pass them to the transport verbatim.
        expect(value).toBe(CANONICAL_ORIGIN);
      }
    });
  });

  it("no source file hard-codes a host outside app-hosts.ts", () => {
    // Comments are allowed to name the host — that is where the reasoning about
    // apex-vs-www lives. What must never appear is a host inside executable
    // code, because that is the copy that silently drifts from this module.
    const stripComments = (text: string) =>
      text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");

    const offenders: string[] = [];
    for (const rel of walk("src")) {
      if (rel.endsWith("lib/app-hosts.ts")) continue;
      const code = stripComments(read(rel));
      for (const host of [CANONICAL_HOST, "templatehub.pro"]) {
        if (code.includes(host)) offenders.push(`${rel} -> ${host}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
