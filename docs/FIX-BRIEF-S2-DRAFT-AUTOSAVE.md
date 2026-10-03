# BRIEF S2 — A draft you do not lose (Sumaiya §12, the autosave half)

Repo: `C:\Users\hamis\projects\sumaiya` (branch from current HEAD). **LOCAL COMMITS ONLY — do not push.**
The owner reviews and releases; an APK release is public and irreversible.

## The queue item, split honestly

`docs/CLAUDE-QUEUE-2026-09-20.md` §12 says "guest mode and autosave". Measured: **guest mode works** —
a signed-out visitor sees the job feed and real listings (verified on device). **Autosave was never
checked.** This brief is only the unchecked half; do not re-do the guest work.

## What to establish first, by measurement

Before changing anything, answer one question with evidence: **if a person is filling in a CV and the
app is closed or killed, what do they get back?** Write the answer in your report as a measurement —
which file you inspected, what test or manual step showed it — not as a belief. If drafts already
persist, say so with the code path that does it and this brief becomes a test-writing job.

## What to build if they do not survive

1. **Draft persistence for the CV editor** — the form state saved locally as it is typed, restored on
   next open, keyed to the document being edited. Local-first: it must work with no network and no
   account, because most of this audience is on prepaid data.
2. **A visible, honest state** — the existing screens already carry an "unsaved" indicator
   (`Haijahifadhiwa` on the CV editor is the string already shipped). Autosave must make that
   indicator truthful: it should reflect whether the draft is safe, not whether a manual save ran.
3. **Never lose work to a failed save.** A failed or offline write leaves the draft intact and says
   so; it must not clear the form or the draft. Corruption on write must not be possible to reach a
   state where the stored draft is worse than nothing — write to a temporary key and swap, or keep
   the last known-good draft until the new one is complete.
4. **Do not put a draft where a real document belongs.** A saved CV is a real user record with its own
   rules; a draft is local until the person saves. Do not merge the two silently, and do not let a
   draft overwrite a saved document without the person asking.
5. **Tests** for what can be tested: persistence round-trips, restoration after a fresh mount, a
   failed write leaving the previous draft intact, and no draft leak into the saved-document path.
6. **Swahili copy** for any new string, in the house voice — the user's own object in the second
   person ("CV yako", never "CV yangu"), and the vocabulary in `docs/SWAHILI-STANDARD-2026-09-20.md`.

## Gates before you commit

From `apps/native`: `npx tsc --noEmit` → 0 errors, and **`npx jest`** (jest is this app's runner;
vitest reports ~39 phantom failures here — the scripts differ deliberately). Also run
`node scripts/test-release-invariants.js` → 22/22.

From `apps/web`: `npx tsc --noEmit` → 0 errors and `npx vitest run` if you touched it.

Report the test counts before and after. **If the counts do not move, your tests did not run.**
