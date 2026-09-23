/**
 * The static guard for guest mode — the rules that a future change to a single
 * screen could quietly undo.
 *
 * Everything here is parsed out of the real source rather than restated, so a
 * regression fails this suite instead of shipping:
 *
 *   1. THE APP IS REACHABLE WITHOUT AN ACCOUNT. The root navigator no longer
 *      branches on `!user` to decide between the sign-in screen and the app.
 *   2. THE RIGHT SURFACES ARE GATED — the account-only ones, and only those.
 *      The CV path (list, editor, templateHub, the CV check) stays open: it is
 *      the promise.
 *   3. THE GUEST PATH DOES NOT NEED THE NETWORK. The CV list returns from the
 *      device before any request, and the guest modules issue none of their own.
 *   4. THE ACCOUNT IS OFFERED ONCE, from the deliverable, and from nowhere else
 *      — the guard against the nag.
 */
jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));

import { readFileSync } from "fs";
import { join } from "path";
import { GUEST_GATE_COPY, type GuestGateId } from "./guest-invite";

const SRC = join(__dirname, "..");
/** Source with comments blanked, so a string quoted in prose (these files
 *  explain themselves at length) is never mistaken for a call site. */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const code = (rel: string) => stripComments(read(rel));

describe("1. the app is reachable without an account", () => {
  const root = read("navigation/root-navigator.tsx");

  it("no longer chooses the sign-in screen INSTEAD of the app", () => {
    expect(root).not.toMatch(/:\s*!user\s*\?/);
    // The app tabs are the fallback for everyone who is not in onboarding.
    expect(root).toMatch(/user && !firstRunDone \?/);
    expect(root).toMatch(/<Stack\.Screen name="App" component=\{AppTabs\} \/>/);
  });

  it("presents sign-in as a modal over the app, and only while signed out", () => {
    expect(root).toMatch(/name="Auth"/);
    expect(root).toMatch(/presentation: "modal"/);
    // Registered conditionally: with a session there is nothing for it to do.
    expect(root).toMatch(/\{!user \? \(\s*<Stack\.Screen\s+name="Auth"/);
  });

  it("claims the guest's work when a session lands, before deciding they are new", () => {
    const claimAt = root.indexOf("claimGuestWork");
    const firstRunAt = root.indexOf("hasExistingData");
    expect(claimAt).toBeGreaterThan(-1);
    expect(firstRunAt).toBeGreaterThan(-1);
    // …and it runs FIRST: the wizard decision must see the claimed rows.
    expect(claimAt).toBeLessThan(firstRunAt);
    // Local CVs count as "this person is not new" — the offline half of the
    // check, which is what a just-claimed guest CV looks like.
    expect(root).toContain("countOwnedCvs");
  });
});

describe("2. the right surfaces are gated, and only those", () => {
  const tabs = read("navigation/stacks/app-tabs.tsx");

  const GATED: { route: string; gate: GuestGateId }[] = [
    { route: "SumaiyaTab", gate: "chat" },
    { route: "ImportTab", gate: "import" },
    { route: "Jobs", gate: "jobs" },
    { route: "JobDetail", gate: "jobs" },
    { route: "JobApply", gate: "jobs" },
    { route: "LearningHub", gate: "courses" },
    { route: "Invite", gate: "invite" },
  ];

  /** What the navigators actually pass to withAccountGate. */
  const wraps = [...tabs.matchAll(/const (\w+) = withAccountGate\((\w+), "(\w+)"\)/g)].map((m) => ({
    alias: m[1],
    screen: m[2],
    gate: m[3] as GuestGateId,
  }));

  it("wraps something — the scan cannot pass by finding nothing", () => {
    expect(wraps.length).toBe(GATED.length);
  });

  it.each(GATED)("$route is gated on an account ($gate)", ({ route, gate }) => {
    const found = wraps.filter((w) => w.gate === gate);
    expect(found.length).toBeGreaterThan(0);
    // The route really uses one of the wrapped components.
    const used = found.some((w) => new RegExp(`name="${route}"\\s+component=\\{${w.alias}\\}`).test(tabs) || new RegExp(`name="${route}"[\\s\\S]{0,200}component=\\{${w.alias}\\}`).test(tabs));
    expect(used).toBe(true);
  });

  it("every gate id has copy written for it", () => {
    for (const w of wraps) {
      expect(Object.keys(GUEST_GATE_COPY)).toContain(w.gate);
    }
    // …and the in-screen gate (the written review) is one of them too.
    const ats = read("screens/ats-checker-screen.tsx");
    const gateIds = [...ats.matchAll(/offerAccountForGate\("(\w+)"/g)].map((m) => m[1]);
    expect(gateIds.length).toBeGreaterThan(0);
    for (const id of gateIds) expect(Object.keys(GUEST_GATE_COPY)).toContain(id);
  });

  it("leaves the CV path open, because that is the promise", () => {
    // Home, My CVs, the builder, the CV check, the profile screens: a guest
    // builds, edits, previews and DOWNLOADS here with no account. Applications
    // join this list too — the store is device-only (lib/applications-store.ts),
    // so gating it was never honest (docs/FIX-BRIEF-MAOMBI-01.md).
    const OPEN: { route: string; component: string }[] = [
      { route: "HomeMain", component: "HomeScreen" },
      { route: "CvListMain", component: "CvListScreen" },
      { route: "CvEditor", component: "CvEditorScreen" },
      { route: "AtsChecker", component: "AtsCheckerScreen" },
      { route: "ProfileMain", component: "ProfileScreen" },
      { route: "CareerProfile", component: "CareerProfileScreen" },
      { route: "Applications", component: "ApplicationsScreen" },
      { route: "ApplicationDetail", component: "ApplicationDetailScreen" },
    ];
    for (const { route, component } of OPEN) {
      expect(tabs).toMatch(new RegExp(`name="${route}"\\s+component=\\{${component}\\}`));
    }
  });
});

describe("3. the guest path never needs the network", () => {
  it("the CV list returns from the device BEFORE it would call the server", () => {
    const hook = code("hooks/use-cvs.ts");
    const guestReturn = hook.indexOf("if (isGuest) {");
    const serverCall = hook.indexOf("await apiClient.listCVs()");
    expect(guestReturn).toBeGreaterThan(-1);
    expect(serverCall).toBeGreaterThan(-1);
    expect(guestReturn).toBeLessThan(serverCall);
    // And the guest's rows are owned by the same id the editor writes with.
    expect(hook).toContain("ownerIdFor(user)");
  });

  it("the editor writes the owner id the list reads — no invisible 'me' rows", () => {
    const editor = read("screens/cv-editor-screen.tsx");
    expect(editor).not.toMatch(/userId: "me"/);
    expect(editor).toContain("ownerIdFor(user)");
    // A guest's save stops at the device cache: it is not queued for upload,
    // because there is no account for it to belong to.
    expect(editor).toMatch(/if \(!isGuest\) await queueOperation/);
  });

  it("the guest modules open no socket of their own", () => {
    for (const file of ["lib/guest-invite.ts", "lib/local-owner.ts"]) {
      const source = read(file);
      expect(source).not.toMatch(/\bfetch\(/);
      expect(source).not.toMatch(/^import .*api-client/m);
    }
    // The one server call in the guest story is the CLAIM, after sign-in, and
    // it is behind a dynamic import so the module graph of the guest path stays
    // network-free.
    expect(read("lib/local-owner.ts")).toContain('await import("./api-client")');
  });

  it("the sync loop does not run for a guest", () => {
    expect(read("hooks/use-offline-sync.ts")).toContain("enabled");
    expect(read("screens/cv-editor-screen.tsx")).toContain("useOfflineSync({ enabled: !isGuest })");
  });
});

describe("4. the account is offered once, from the deliverable", () => {
  it("only the CV deliverable surfaces ask for an account", () => {
    // A caller added anywhere else (Home, Profile, a launch effect) turns this
    // list into the nag the owner ruled out — so the list is closed.
    const callers = [
      "screens/cv-editor-screen.tsx",
      "screens/app/cv-list-screen.tsx",
    ];
    for (const file of callers) {
      expect(code(file)).toContain("offerGuestAccountOnce(");
    }
    // The navigator (which runs on every launch) must never offer it.
    expect(code("navigation/root-navigator.tsx")).not.toContain("offerGuestAccountOnce");
    expect(code("screens/app/home-screen.tsx")).not.toContain("offerGuestAccountOnce");
    expect(code("screens/app/profile-screen.tsx")).not.toContain("offerGuestAccountOnce");
  });

  it("the offer fires after a save or a download, never before one", () => {
    const list = code("screens/app/cv-list-screen.tsx");
    const cancelled = list.indexOf('saved.status === "cancelled"');
    const saveAlert = list.indexOf('t("Saved to your phone"');
    const calls = [...list.matchAll(/offerGuestAccountOnce\(/g)].map((m) => m.index ?? -1);
    expect(cancelled).toBeGreaterThan(-1);
    expect(saveAlert).toBeGreaterThan(-1);
    // Two branches count as a download (the SAF save, and the share-sheet
    // fallback) — and neither may fire before the outcome is known, so a
    // dismissed folder picker is never followed by an account pitch.
    expect(calls.length).toBe(2);
    expect(Math.min(...calls)).toBeGreaterThan(cancelled);
    expect(Math.max(...calls)).toBeGreaterThan(saveAlert);

    const editor = code("screens/cv-editor-screen.tsx");
    // After the local write is confirmed (storedLocally), and after the export
    // confirmation, in both export branches.
    expect(editor).toMatch(/if \(storedLocally\) void offerGuestAccountOnce/);
    expect([...editor.matchAll(/offerGuestAccountOnce\(/g)].length).toBeGreaterThanOrEqual(3);
  });
});
