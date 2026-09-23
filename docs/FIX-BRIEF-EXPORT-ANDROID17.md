# Fix brief: the export path — LETTER instead of A4, a misleading picker, a silent cancel

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. One item.
Do NOT bump the version, do NOT switch branches, do NOT upgrade a dependency.

**CORRECTION — a previous version of this brief said the export "cannot complete" on Android 17 and was
a "dead end". That was WRONG and is withdrawn.** Measured afterwards: the export DID complete. The
folder grant was accepted and the app wrote a real PDF — `/sdcard/Documents/Amina Hassan Mwinyi -
Mwakilishi wa Mauzo CV.pdf`, 46,948 bytes, 22:55. The earlier "no PDF" reading came from looking in
`/sdcard/Download` and from a broad `find /sdcard`, which scoped storage silently defeats. The real
defects are below.

## Defect 1 (the important one): the exported PDF is US LETTER, not A4

Measured on the exported file itself, pulled off the device (`pypdf`):

```
pages = 1
mediabox = 612 x 792 pt  =  216 x 279 mm
US Letter = 612 x 792 pt.     A4 = 595 x 842 pt = 210 x 297 mm.
```

The renderer declares A4 correctly — `src/lib/cv-html.ts:203` and `src/lib/cv-engine/render.ts:148`
both emit `@page { size: A4; margin: 0; }` — and `src/services/pdf-export.ts:66` prints with:

```ts
const { uri } = await Print.printToFileAsync({ html: cvToHtml(cv, opts), base64: false });
```

**expo-print on Android does not honour `@page { size: A4 }`** — it uses the WebView print path's
default media box. The entire engine is authored on A4 (`src/lib/cv-engine/fit.ts`: a 794px page,
1123px tall), so every exported document shifts its margins and its page breaks away from the design.

**The trap to fix as well.** `src/lib/cv-engine/registry-sync.test.ts:140` asserts
`expect(html).toContain("@page")`. That test is GREEN while the artifact is Letter: it asserts the
source string, not the media box. A test that cannot fail on the real defect is worse than none.

### What to do

1. Establish what actually controls the media box on that Android path, then fix it there. Evaluate and
   report on each candidate — do not guess: an option on `Print.printToFileAsync`; a CSS/print
   declaration the Android print path does honour; post-processing the MediaBox to 595x842pt after
   printing; or a different print path altogether. State which you chose and why the others lose.
2. Do NOT "fix" this by editing the CSS and calling it done — the CSS already says A4.
3. Strengthen the guard so it cannot regress silently: the test must assert the **output**, not the
   input string (parse a produced or golden PDF's MediaBox, or unit-test whatever conversion you add).
   If the only faithful test needs a real device, say exactly that instead of writing another
   green-but-blind assertion. Keep it in `apps/native`, JEST (never vitest here).

## Defect 2 (UX, smaller, but it cost real time): the picker misleads, and cancel is silent

`src/services/save-to-device.ts:56-67` anchors SAF at
`content://…/document/primary%3ADocuments`, with a comment recording that on **Android 15** "only
Documents enables the button" (root and Download were refused then). On **Android 17** the picker opens
showing *"Can't use this folder / To protect your privacy, choose another folder"* for that very
folder, and its roots drawer offers no Download entry. It still works once the user accepts the grant —
so this is confusion, not a dead end, but the user is placed in a folder the OS is complaining about.

The failure path makes it worse. `src/screens/cv-editor-screen.tsx:457-461` and
`src/screens/app/cv-list-screen.tsx:70-76`:

```ts
if (saved.status === "cancelled") return;                 // nothing written, nothing said
if (saved.status === "unsupported") { …share sheet… }      // effectively iOS-only
```

Android has no fallback path, while `expo-sharing` is already a dependency and already used by
`job-apply-screen.tsx:133` and `pdf-tools-screen.tsx:93`.

### What to do

1. A cancel/dismissal must say something and offer the share sheet instead of ending in silence. An
   export button that silently does nothing is the one outcome that is not allowed — the owner has
   already complained about exactly this class here: "picha kuwa pdf na buttons zake hazifanyi kitu".
2. Stop hardcoding a single anchor. Probe for a folder the running OS accepts (try a Downloads URI and
   fall back to the Documents URI, or the reverse) rather than pinning the one that worked on an older
   Android, and keep the existing comment's *reasoning* style: record what was measured, on which
   Android version, so the next inversion is diagnosable.
3. Test the pure logic in `src/services/save-to-device.test.ts` (it already mocks
   `StorageAccessFramework`): permission refused → the caller is told to share, not a silent return;
   permission granted → the file is written; and the URI choice order. Neighbouring style, bare
   `describe`/`it`, JEST, native modules mocked file-locally.

## Gates and report

`cd apps/native && npx tsc --noEmit` and `npx jest`. Commit NAMED PATHS ONLY — never `git add -A`;
this clone is shared with another agent. Report: files changed, the exact commands, pass/fail counts,
the commit sha, and what you could NOT establish (in particular: whether the MediaBox fix holds in a
real export needs a device build — say so rather than implying you verified it).

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or any secret.
