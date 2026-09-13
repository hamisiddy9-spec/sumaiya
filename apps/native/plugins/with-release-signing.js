const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Injects real release signing into android/app/build.gradle.
 *
 * Why a config plugin: `android/` is checked in, but anyone running
 * `expo prebuild --clean` (as the previous APK build did) regenerates
 * build.gradle from the stock Expo template — which signs *release* builds with
 * the public debug keystore. Doing that fix by hand once would silently undo
 * itself the next time someone prebuilds.
 *
 * The keystore and its passwords are never in git. They live in
 * android/keystore.properties (git-ignored), with env-var fallbacks so CI can
 * supply the same key without a checked-in file.
 */

const PROPS_BLOCK = `
def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()
`;

const PROPS_ANCHOR = `def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()`;

const SIGNING_PROPS = `
/**
 * Release signing material — injected by plugins/with-release-signing.js.
 * Read from android/keystore.properties (git-ignored) with env-var fallbacks.
 * Backed up outside the repo at ~/sumaiya-keys/sumaiya-release.jks
 */
def releaseKeystoreProps = new Properties()
def releaseKeystorePropsFile = rootProject.file("keystore.properties")
if (releaseKeystorePropsFile.exists()) {
    releaseKeystorePropsFile.withInputStream { releaseKeystoreProps.load(it) }
}
def releaseStoreFileName = releaseKeystoreProps.getProperty("SUMAIYA_RELEASE_STORE_FILE") ?: System.getenv("SUMAIYA_RELEASE_STORE_FILE")
def releaseStorePass = releaseKeystoreProps.getProperty("SUMAIYA_RELEASE_STORE_PASSWORD") ?: System.getenv("SUMAIYA_RELEASE_STORE_PASSWORD")
def releaseAlias = releaseKeystoreProps.getProperty("SUMAIYA_RELEASE_KEY_ALIAS") ?: System.getenv("SUMAIYA_RELEASE_KEY_ALIAS")
def releaseKeyPass = releaseKeystoreProps.getProperty("SUMAIYA_RELEASE_KEY_PASSWORD") ?: System.getenv("SUMAIYA_RELEASE_KEY_PASSWORD")
def hasReleaseKeystore = releaseStoreFileName != null && file(releaseStoreFileName).exists()

gradle.taskGraph.whenReady { graph ->
    def wantsRelease = graph.allTasks.any { it.name.toLowerCase().contains("release") }
    if (wantsRelease && !hasReleaseKeystore) {
        throw new GradleException(
            "Release build needs a signing key but none was found.\\n" +
            "  Expected: android/keystore.properties pointing at android/app/sumaiya-release.keystore\\n" +
            "  Restore from the backup at ~/sumaiya-keys/sumaiya-release.jks.\\n" +
            "  Refusing to fall back to the debug keystore — that key is public."
        )
    }
}
`;

const STOCK_SIGNING_CONFIGS = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const REAL_SIGNING_CONFIGS = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file(releaseStoreFileName)
            storePassword releaseStorePass
            keyAlias releaseAlias
            keyPassword releaseKeyPass
        }
    }`;

const STOCK_RELEASE_SIGNING = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const REAL_RELEASE_SIGNING = `        release {
            // Signed with the real release key — injected by
            // plugins/with-release-signing.js. Never the debug key.
            signingConfig signingConfigs.release`;

function applyFixes(contents) {
  // Idempotent: skip anything already injected.
  const already = contents.includes("releaseStoreFileName");

  let out = contents;
  const applied = [];

  if (!already) {
    if (!out.includes(PROPS_ANCHOR)) {
      throw new Error(
        "[with-release-signing] Could not find 'projectRoot' in build.gradle — " +
          "the Expo Android template changed. Update plugins/with-release-signing.js.",
      );
    }
    out = out.replace(PROPS_ANCHOR, PROPS_BLOCK.trim() + "\n" + SIGNING_PROPS);
    applied.push("signing properties + release guard");
  }

  if (out.includes(STOCK_SIGNING_CONFIGS)) {
    out = out.replace(STOCK_SIGNING_CONFIGS, REAL_SIGNING_CONFIGS);
    applied.push("release signingConfig");
  }

  if (out.includes(STOCK_RELEASE_SIGNING)) {
    out = out.replace(STOCK_RELEASE_SIGNING, REAL_RELEASE_SIGNING);
    applied.push("release buildType -> real key");
  }

  if (!out.includes("signingConfig signingConfigs.release")) {
    throw new Error(
      "[with-release-signing] Release build still not pointing at the real key. " +
        "Refusing to leave a debug-signed release build behind.",
    );
  }

  return { out, applied };
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error("[with-release-signing] Expected a Groovy build.gradle.");
    }
    const { out, applied } = applyFixes(cfg.modResults.contents);
    cfg.modResults.contents = out;
    if (applied.length) {
      console.log(`[with-release-signing] applied: ${applied.join(", ")}`);
    }
    return cfg;
  });
};

// Exported for scripts/test-release-signing.js so the string surgery above is
// covered by a test rather than trusted.
module.exports.applyFixes = applyFixes;

