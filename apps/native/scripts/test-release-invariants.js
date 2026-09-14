/**
 * Release-config invariants for the Android build.
 *
 * Every check here exists because this exact thing was wrong in production:
 *
 *  1. release builds were signed with the public debug keystore
 *  2. assetlinks.json declared a fingerprint nothing was signed with, so
 *     App Links could never verify
 *  3. the App Links filter claimed the host that 308-redirects, and Android
 *     won't follow a redirect to fetch assetlinks.json, so that entry failed
 *     forever (domain state 1024). Whichever host serves the file directly is
 *     the only one worth claiming.
 *
 * Run: node scripts/test-release-invariants.js
 */
const fs = require("fs");
const path = require("path");
const { applyFixes } = require("../plugins/with-release-signing");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
const checks = [];
const check = (name, ok) => checks.push([name, ok]);
const countOf = (haystack, needle) => haystack.split(needle).length - 1;

// ---------------------------------------------------------------- signing ---
const STOCK = `apply plugin: "com.android.application"

def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()

android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            minifyEnabled false
        }
    }
}
`;

const r1 = applyFixes(STOCK);
check("plugin: release uses the release key", r1.out.includes("signingConfig signingConfigs.release"));
check("plugin: exactly one release-keyed buildType", countOf(r1.out, "signingConfig signingConfigs.release") === 1);
// The stock template references the debug key twice: the debug buildType
// (correct) and release (the bug). Only the debug buildType may survive.
check("plugin: debug key referenced once (debug buildType only)", countOf(r1.out, "signingConfig signingConfigs.debug") === 1);
check("plugin: stock template did reference the debug key twice", countOf(STOCK, "signingConfig signingConfigs.debug") === 2);
check("plugin: keystore properties loader injected", r1.out.includes("releaseStoreFileName"));
check("plugin: refuses to build when key is missing", r1.out.includes("Refusing to fall back to the debug keystore"));
check("plugin: all three edits applied", r1.applied.length === 3);

const r2 = applyFixes(r1.out);
check("plugin: idempotent on second run", r2.out === r1.out && r2.applied.length === 0);

let threw = false;
try {
  applyFixes('apply plugin: "com.android.application"\n// unknown template\n');
} catch {
  threw = true;
}
check("plugin: throws on an unknown template", threw);

const live = read("android/app/build.gradle");
check("build.gradle: release does not use the debug key", /release\s*\{[\s\S]*?signingConfig signingConfigs\.release/.test(live));

// ---------------------------------------------------- App Links manifest ---
const manifest = read("android/app/src/main/AndroidManifest.xml");
const autoVerifyBlock = manifest.match(/<intent-filter android:autoVerify="true">[\s\S]*?<\/intent-filter>/);
check("manifest: an autoVerify filter exists", Boolean(autoVerifyBlock));

const av = autoVerifyBlock ? autoVerifyBlock[0] : "";
const httpsHosts = [...av.matchAll(/android:host="([^"]+)"/g)].map((m) => m[1]);
check("manifest: claims exactly one https host", httpsHosts.length === 1);
// The canonical host is the apex: sumaiya.app serves assetlinks.json directly.
check("manifest: that host is the canonical apex host", httpsHosts[0] === "sumaiya.app");
// www 308-redirects to the apex; claiming it yields a permanent verification
// failure. This assertion used to read the other way round, on the old domain
// where the apex was the one that redirected.
check("manifest: does not claim the redirecting www host", !/android:host="www\.sumaiya\.app"/.test(manifest));

// ------------------------------------------------------------ assetlinks ---
const assetlinks = read("../web/public/.well-known/assetlinks.json");
check("assetlinks: is valid JSON", (() => { try { JSON.parse(assetlinks); return true; } catch { return false; } })());

const fingerprints = (() => {
  try {
    return JSON.parse(assetlinks)[0].target.sha256_cert_fingerprints.map((f) => f.replace(/:/g, "").toLowerCase());
  } catch { return []; }
})();
// The debug keystore ships in this repo, so declaring it would let anyone
// build an APK that legitimately claims our links.
const DEBUG_FP = "fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c";
check("assetlinks: declares at least one fingerprint", fingerprints.length > 0);
check("assetlinks: never declares the public debug key", !fingerprints.includes(DEBUG_FP));
check("assetlinks: every fingerprint is a full 32-byte SHA-256", fingerprints.every((f) => /^[0-9a-f]{64}$/.test(f)));

// --------------------------------------------------------------- app.json ---
const appJson = JSON.parse(read("app.json")).expo;
const filters = (appJson.android && appJson.android.intentFilters) || [];
const verified = filters.filter((f) => f.autoVerify);
check("app.json: declares the App Links filter (survives prebuild)", verified.length === 1);
check(
  "app.json: verified filter targets the canonical host",
  verified.length === 1 && verified[0].data.some((d) => d.host === "sumaiya.app"),
);
check(
  "app.json: keeps the sumaiya:// scheme filter",
  filters.some((f) => f.data.some((d) => d.scheme === "sumaiya")),
);
check("app.json: no www host claimed", !JSON.stringify(filters).includes('"host":"www.sumaiya.app"'));

// ---------------------------------------------------------------- report ---
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
console.log(
  failed
    ? `\n${failed} of ${checks.length} checks FAILED`
    : `\nAll ${checks.length} checks passed — signing, App Links and prebuild durability are intact.`,
);
process.exit(failed ? 1 : 0);
