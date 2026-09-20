/**
 * Guards against RECORD_AUDIO silently coming back. No recording API exists
 * anywhere in src/ (expo-speech is TTS OUTPUT and needs no permission; the
 * only camera use is a still photo via takePictureAsync), so the DANGEROUS
 * RECORD_AUDIO permission has no reason to be requested. The real reason it
 * kept reappearing: expo-camera's config plugin defaults
 * recordAudioAndroid = true and injects the permission on every prebuild —
 * app.json now passes recordAudioAndroid: false explicitly so a prebuild
 * cannot re-add it.
 *
 * A manifest change is only observable after a build. This test proves the
 * SOURCE is correct (app.json + the committed AndroidManifest.xml), not that
 * an installed APK has actually changed.
 */
import fs from "fs";
import path from "path";

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

describe("android permissions — RECORD_AUDIO removed", () => {
  it("app.json no longer requests RECORD_AUDIO", () => {
    const appJson = JSON.parse(read("app.json"));
    expect(appJson.expo.android.permissions).not.toContain("RECORD_AUDIO");
  });

  it("app.json pins expo-camera's config plugin to recordAudioAndroid: false", () => {
    const appJson = JSON.parse(read("app.json"));
    const plugins = appJson.expo.plugins as unknown[];
    const cameraPlugin = plugins.find(
      (p) => Array.isArray(p) && p[0] === "expo-camera",
    ) as [string, { recordAudioAndroid: boolean }] | undefined;
    expect(cameraPlugin).toBeTruthy();
    expect(cameraPlugin![1]).toEqual({ recordAudioAndroid: false });
  });

  it("the committed AndroidManifest.xml has no RECORD_AUDIO line", () => {
    expect(read("android/app/src/main/AndroidManifest.xml")).not.toContain("RECORD_AUDIO");
  });

  it("no source file references a recording API (the permission would be unused)", () => {
    const files = walk("src");
    expect(files.length).toBeGreaterThan(50);

    const RECORDING_APIS = [
      "expo-av",
      "expo-audio",
      "MediaRecorder",
      "recordAsync",
      "startRecording",
      "new AudioRecorder",
    ];
    const offenders: string[] = [];
    for (const rel of files) {
      const code = read(rel);
      for (const api of RECORDING_APIS) {
        if (code.includes(api)) offenders.push(`${rel} -> ${api}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
