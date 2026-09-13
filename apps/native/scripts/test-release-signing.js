/**
 * Covers the string surgery in plugins/with-release-signing.js.
 *
 * The plugin exists so `expo prebuild --clean` cannot silently revert release
 * builds to the public debug key. If the Expo Android template changes, the
 * plugin must fail loudly rather than no-op — these checks prove it does.
 *
 * Run: node scripts/test-release-signing.js
 */
const { applyFixes } = require("../plugins/with-release-signing");

// Verbatim stock Expo Android template — what `expo prebuild --clean` writes.
const STOCK = `apply plugin: "com.android.application"

def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()

android {
    defaultConfig {
        versionCode 1
        versionName "1.0"
    }
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

const checks = [];

// --- 1. the real job: stock template must end up on the real key -----------
const r1 = applyFixes(STOCK);
checks.push(["release signingConfig defined", /signingConfigs\s*\{[\s\S]*release\s*\{/.test(r1.out)]);
checks.push(["release buildType uses the release key", r1.out.includes("signingConfig signingConfigs.release")]);
const countOf = (haystack, needle) => haystack.split(needle).length - 1;

checks.push([
  "exactly one release-keyed buildType",
  countOf(r1.out, "signingConfig signingConfigs.release") === 1,
]);
// Before the fix the debug key is referenced twice — once by the debug
// buildType (correct) and once by release (the bug). Afterwards only the
// debug buildType may reference it.
checks.push([
  "debug key referenced once (debug buildType only)",
  countOf(r1.out, "signingConfig signingConfigs.debug") === 1,
]);
checks.push([
  "stock template really did reference the debug key twice",
  countOf(STOCK, "signingConfig signingConfigs.debug") === 2,
]);
checks.push(["keystore properties loader injected", r1.out.includes("releaseStoreFileName")]);
checks.push([
  "fails loudly when key is missing",
  r1.out.includes("Refusing to fall back to the debug keystore"),
]);
checks.push(["all three edits applied", r1.applied.length === 3]);

// --- 2. re-running must not duplicate anything -----------------------------
const r2 = applyFixes(r1.out);
checks.push(["idempotent on second run", r2.out === r1.out && r2.applied.length === 0]);

// --- 3. an unrecognised template must throw, not silently pass -------------
let threw = false;
try {
  applyFixes("apply plugin: \"com.android.application\"\n// totally different template\n");
} catch {
  threw = true;
}
checks.push(["throws on an unknown template", threw]);

// --- 4. a debug build must still be possible without the release key -------
const debugOnly = applyFixes(STOCK).out;
checks.push([
  "debug builds still use the debug key",
  /debug\s*\{\s*signingConfig signingConfigs\.debug/.test(debugOnly),
]);

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
console.log(
  failed
    ? `\n${failed} of ${checks.length} checks FAILED`
    : `\nAll ${checks.length} checks passed — a prebuild cannot silently ship a debug-signed release.`,
);
process.exit(failed ? 1 : 0);
