# MOTION FIX — brief 1 of 3: the portal (the "dead beat, then bang")

Hand this to Claude Code as the **entire** task. Two changes, one file. Do not attempt the other
motion items — briefs 2 and 3 are separate runs (`docs/MOTION-REVIEW-2026-09-21.md` holds the full
ranked list).

## HARD BOUNDARY

1. **VERIFY FIRST.** Every claim names a file:line. Open it. If a claim is false, say so and stop
   on that item — do not "fix" something that is not broken.
2. Minimal change: durations, curves, one ordering. No refactors, no new dependencies, no
   restructure. A new test is welcome; a new file is not, unless it is that test.
3. **NEVER** push, build an APK, deploy, migrate, or touch a database. The owner pays for builds.
4. Commit **named paths only**. Never `git add -A`, never a bare `git commit` — other agents share
   this clone.
5. Run `npx tsc --noEmit` and `npx jest` in `apps/native` (**jest, not vitest** — the wrong runner
   reports ~39 bogus failures). Report the real numbers.
6. Do not compose new Swahili on your own authority. Flag it instead.
7. **COMMIT INCREMENTALLY — do not leave it to the end.** After Item A passes its checks, commit
   Item A's named paths with its own message, then start Item B. A previous run finished all its
   work and then hit `Reached max turns` before committing anything; that must not happen again.

## Why

The owner's standing standard, verbatim: *"animations na transitions kusiwe na boom apearance every
thing is to be done the apple way"*. The welcome→app portal currently violates it in two ways, and
it is the most visible motion in the product — it plays every time a user starts an application.

## Item A — the field arrives ACCELERATING

`apps/native/src/components/portal-transition.tsx` animates the disc and the mark's growth using
**`EASE.in`** (around `:134` and `:139`). An arrival must decelerate; `EASE.in` makes it speed up as
it lands. The measured consequence: at t=470ms — halfway through the 580ms bloom — the disc covers
roughly **2% of the screen**, and then it doubles in the final 120ms. A dead beat, then a bang.

Change the arrival curves to an outgoing ease (`EASE.out`, or an emphasized variant if this repo
already has one — **check `apps/native/src/lib/motion-tokens.ts` for the available tokens and use
one that already exists rather than inventing a curve**).

Also align the clock: the slide collapse in `onboarding-screen.tsx` (around `:324`, `:347`) starts on
its own `dur.screen` 260ms while the portal ignites 180ms later. Put them on **one clock** — start the
collapse when the portal ignites (`IGNITE`, 180ms) — so the two are one gesture rather than two.

## Item B — the mark ghosts over the incoming screen

`portal-transition.tsx` fires `onDone` at `COVER_AT` (**760ms**, around `:143`) while the mark only
finishes leaving at **900ms** (around `:128`). For those **140ms** the outgoing mark is still drawn on
top of the screen that has already arrived.

Fire `onDone` when the mark's exit actually completes, not when the disc has covered the screen.

## Verification

- `npx tsc --noEmit` clean, `npx jest` with its real counts.
- If the timing invariants are testable without a device, add a test that pins them (for example that
  the completion callback is not scheduled before the mark's exit ends). If they are not testable in
  this codebase, say so plainly rather than writing a test that asserts nothing.
- Do not claim the motion "feels" better — that needs a device. Report what you changed numerically
  (curve, duration, ordering) and say the felt result is unverified.

## Finish with

what you verified · what you changed · what you refused and why · exact test output · the commit sha.
