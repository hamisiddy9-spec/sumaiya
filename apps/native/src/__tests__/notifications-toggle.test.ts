/**
 * Guards that the Profile push-notifications row never requests the Android
 * notification permission while push cannot possibly work (no EAS
 * projectId — see lib/push.ts isPushAvailable()). Asking anyway would show a
 * real system permission prompt and then deliver nothing.
 *
 * This is a source-text guard, not a render test: there's no device or
 * emulator in this environment to actually mount the screen and inspect the
 * rendered Switch, so the check reads the file and confirms the `pushReady`
 * guard sits before the permission call in setNotif's control flow.
 */
import fs from "fs";
import path from "path";

const SOURCE = fs.readFileSync(
  path.join(__dirname, "..", "screens", "app", "profile-screen.tsx"),
  "utf8",
);

describe("profile-screen — push toggle cannot request a dead permission", () => {
  it("imports isPushAvailable", () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\bisPushAvailable\b[^}]*\}\s*from\s*"\.\.\/\.\.\/lib\/push"/);
  });

  it("guards setNotif with pushReady BEFORE requesting the OS permission", () => {
    const start = SOURCE.indexOf("const setNotif");
    const end = SOURCE.indexOf("const clearCache");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const body = SOURCE.slice(start, end);

    const guardIndex = body.indexOf("if (!pushReady)");
    const requestIndex = body.indexOf("requestPermissionsAsync");
    expect(guardIndex).toBeGreaterThan(-1);
    expect(requestIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(requestIndex);
  });

  it("shows the Swahili unavailability reason and the 'Bado' value label", () => {
    expect(SOURCE).toContain("Bado haipatikani");
    expect(SOURCE).toContain('t("Not yet", "Bado")');
  });
});
