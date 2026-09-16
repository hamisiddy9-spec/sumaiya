/**
 * Generate the TWA (Trusted Web Activity) Android project without any
 * interactive prompts. The @bubblewrap/cli `init` command re-prompts every
 * field through inquirer, which crashes/hangs on piped stdin (Node 24).
 * This script drives @bubblewrap/core's API directly — fully deterministic.
 *
 * Used by .github/workflows/apk-build.yml. Requires @bubblewrap/core on the
 * module path (NODE_PATH=$(npm root -g) in CI after `npm i -g @bubblewrap/cli`).
 *
 * Env:
 *   TWA_PACKAGE_ID   (default pro.sumaiya.app)
 *   TWA_START_URL    (default /?source=apk)
 *   TWA_VERSION_NAME (default 1.0.0)
 *   TWA_VERSION_CODE (default 1)
 *   TWA_KEY_PATH     (default ./android-keystore)
 *   TWA_KEY_ALIAS    (default sumaiya)
 */
const path = require('path');
const fs = require('fs');
const { TwaManifest, TwaGenerator } = require('@bubblewrap/core');

const targetDir = process.cwd();

(async () => {
  // 1. Fetch the LIVE web manifest and convert to a TWA manifest
  const manifest = await TwaManifest.fromWebManifest(
    'https://sumaiya.app/manifest.json'
  );

  // 2. Pin identifiers the web manifest cannot express
  manifest.packageId = process.env.TWA_PACKAGE_ID || 'pro.sumaiya.app';
  manifest.startUrl = process.env.TWA_START_URL || '/?source=apk';
  manifest.appVersionName = process.env.TWA_VERSION_NAME || '1.0.0';
  manifest.appVersionCode = parseInt(process.env.TWA_VERSION_CODE || '1', 10);
  manifest.signingKey = {
    path: process.env.TWA_KEY_PATH || './android-keystore',
    alias: process.env.TWA_KEY_ALIAS || 'sumaiya',
  };
  manifest.enableNotifications = true;
  manifest.enableSiteSettingsShortcut = true;
  manifest.webManifestUrl = new URL('https://sumaiya.app/manifest.json');

  // 3. Write the manifest + generate the Android project
  const manifestFile = path.join(targetDir, 'twa-manifest.json');
  await manifest.saveToFile(manifestFile);

  // 4. Write manifest-checksum.txt (sha1 of the manifest file) so `bubblewrap
  //    build` knows the project is up-to-date and does NOT prompt
  //    "would you like to regenerate your project?" (inquirer + Node 24 =
  //    crash on piped stdin).
  const crypto = require('crypto');
  const manifestContents = fs.readFileSync(manifestFile);
  const sum = crypto.createHash('sha1').update(manifestContents).digest('hex');
  fs.writeFileSync(path.join(targetDir, 'manifest-checksum.txt'), sum);

  const generator = new TwaGenerator();
  const quietLog = { log: (msg) => console.log(msg) };
  await generator.createTwaProject(targetDir, manifest, quietLog, () => {});
  console.log('TWA project generated OK');
  console.log('packageId=' + manifest.packageId);
  console.log('appVersionName=' + manifest.appVersionName);
  console.log('appVersionCode=' + manifest.appVersionCode);
  console.log('signingKey=' + JSON.stringify(manifest.signingKey));
})().catch((err) => {
  console.error('generate-twa failed:', err);
  process.exit(1);
});
