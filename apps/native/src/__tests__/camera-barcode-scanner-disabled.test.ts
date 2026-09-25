/**
 * Guards against ML Kit's barcode scanner (libbarhopper_v3.so, ~4.9 MB) coming
 * back into the APK. This app only ever calls takePictureAsync (see
 * src/screens/app/scan-screen.tsx) — no barcode/QR use anywhere in src/ — so
 * expo-camera's optional barcode-scanning dependencies
 * (play-services-code-scanner, mlkit barcode-scanning, camera-mlkit-vision)
 * have no reason to ship.
 *
 * Two places have to agree: app.json (what the NEXT `expo prebuild` writes)
 * and android/gradle.properties (what the checked-in, already-prebuilt
 * android/ project actually builds with today). A build is only observable on
 * a real device — this proves the SOURCE is correct, not that an installed
 * APK actually shrank.
 */
import fs from "fs";
import path from "path";

const root = path.join(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

describe("expo-camera barcode scanner — disabled", () => {
  it("app.json pins expo-camera's config plugin to barcodeScannerEnabled: false", () => {
    const appJson = JSON.parse(read("app.json"));
    const plugins = appJson.expo.plugins as unknown[];
    const cameraPlugin = plugins.find(
      (p) => Array.isArray(p) && p[0] === "expo-camera",
    ) as [string, { barcodeScannerEnabled?: boolean }] | undefined;
    expect(cameraPlugin).toBeTruthy();
    expect(cameraPlugin![1].barcodeScannerEnabled).toBe(false);
  });

  it("android/gradle.properties disables the barcode scanner for the current build", () => {
    const props = read("android/gradle.properties");
    expect(props).toMatch(/^expo\.camera\.barcode-scanner-enabled=false$/m);
  });

  it("no source file references a barcode/QR scanning API", () => {
    const SCAN_APIS = ["BarCodeScanner", "BarcodeScanner", "onBarcodeScanned", "expo-barcode-scanner"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "__tests__") continue;
          walk(rel);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          const code = read(rel);
          for (const api of SCAN_APIS) {
            if (code.includes(api)) offenders.push(`${rel} -> ${api}`);
          }
        }
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });
});
