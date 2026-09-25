# BRIEF S1 — "Nitumie Sumaiya": let the app travel, at zero data cost

Repo: `C:\Users\hamis\projects\sumaiya` (branch from current HEAD). **LOCAL COMMITS ONLY — do not push.**
The owner reviews and releases; no APK release happens without him.

## Why this is the highest-value item on Sumaiya's queue

Measured on 2026-09-24: 16 installs, 17 profiles, **no provably organic user**, and every CV in the
database carries a test persona's name. The product is unreachable, not broken — the APK is the
product and it has no way to move between people.

The owner's own instruction is already recorded in `docs/CLAUDE-QUEUE-2026-09-20.md` §0:
*"weka option ya share without data"*. Tanzanians do not download APKs from websites; they share files
phone-to-phone (WhatsApp, Xender, SHAREit, Bluetooth). A download link also costs the receiver data
they may not have.

## Item 1 — the action

A **"Nitumie Sumaiya"** share action, visible rather than buried, in: the first-run screen, the home
screen, and settings. Tapping it hands the app to whoever is standing next to you.

Mechanics: read this app's own installed APK, copy it into the cache directory, and share it with the
`application/vnd.android.package-archive` MIME type, so it reaches WhatsApp, Xender, SHAREit, Bluetooth
and Nearby Share.

Prefer existing Expo modules over hand-written native code. Whatever approach you choose, **say
honestly whether you verified it on a real device** — the owner has a Pixel and a Hisense, but you
probably cannot reach them; if you cannot test on hardware, say so rather than implying it works.

## Item 2 — attribution, because an unmeasurable feature is a guess

The receiver must be attributable without costing them data:
- put a short code in the **shared filename** (e.g. `sumaiya-AB12CD.apk`), so attribution survives a
  pure offline transfer, and
- include a referral link in the share message for receivers who do have data.

Generate the sharer's code once per install, persist it, reuse it. Add an analytics event for the share
itself — check the app's existing event vocabulary and follow it, including whatever guest/identity
conventions it already uses.

## Item 3 — do not regress the app

- The share action must never be on the critical path: the app behaves identically if sharing fails
  (no permission, no cache space).
- Clean up the copied APK; do not leave it in cache indefinitely.
- If reading the installed APK's path is not possible through the chosen approach, **stop and say so**
  rather than shipping a button that fails.

## Item 4 — the free 4.9 MB, in the same pass

`expo-camera` pulls in ML Kit's barcode scanner (`libbarhopper_v3.so`, 4.9 MB) and this app only uses
the camera for photos. Exclude it if it can be done without breaking image capture — verify capture
still works and record the before/after APK size. A smaller file is an easier share, on data people
pay for.

## Gates (report exact output; the runners differ per app)

```
cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js
cd ../web && npx tsc --noEmit
```

**Never run vitest in `apps/native`** — it reports ~39 bogus failures because that suite does not exist
there; the native runner is jest. Named-path commits only, never `git add -A` (shared clone). If part
of this brief is wrong, say so and change nothing rather than forcing it.
