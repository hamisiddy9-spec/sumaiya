# MOTION REVIEW — onboarding, welcome, splash, portal

2026-09-21. Independent audit of every animated element on the welcome path, measured from the
code. Owner's standard, verbatim: *"animations na transitions kusiwe na boom apearance every
thing is to be done the apple way"* — and it must stay light on cheap Android phones.

Two claims below I re-checked myself and they hold: `sumaiya-mark.tsx:52 useFrameCallback` (a
per-frame worklet) and `first-run-screen.tsx:283,319,327,445` hard-coding `116` where `MARK_WELL`
is `128/r40/72`. One I could not confirm: the claim that the mark-well **guard test** omits
`first-run-screen.tsx` — a grep for that test file returned nothing, so treat it as unconfirmed.

## The "boom appearance" is real, and it is in three places

1. **The portal field arrives ACCELERATING.** `portal-transition.tsx:134,139` uses `EASE.in` on
   the disc and the mark's growth. At t=470ms — halfway through the 580ms bloom — the disc covers
   ~2% of the screen, then doubles in its final 120ms. **A dead beat, then a bang.** This is the
   single most "off" thing on the whole path.
2. **The mark ghosts.** `onDone` fires at `COVER_AT` 760ms (`:143`) while the mark only finishes
   leaving at 900ms (`:128`) — **140ms of mark drawn over the incoming screen.**
3. **The splash has no exit at all.** `splash-screen.tsx:38-107` is a plain `View`, while
   `root-navigator.tsx:282` swaps the whole tree to Onboarding and the incoming welcome starts at
   `opacity 0` (`onboarding-screen.tsx:179`). So **the mark bangs out and re-climbs from nothing**
   ~300ms later, at a different `y` (full-screen centre vs centred above the ~200dp choice block).

## Where the "one continuous whole" breaks — the numbers side by side

| | values in use |
|---|---|
| entry duration | **300ms** at 6 sites · **260ms** hard-coded (`first-run:553`) · **320ms** (`progress-bar:44`) · **580ms** (portal) |
| exit duration | **140ms** · **150ms** (`first-run:553`) · **260ms** (`onboarding:324,347`) |
| distance | rise **12px** · translateX **25px** (`first-run:553`) · scale **1→0.84** · **1→1.55** |
| curve | `EASE.out` at 6 sites · **`EASE.in` on three ARRIVING things** (the bug above) · **Reanimated default `inOut(quad)` at 4 sites** — never a deliberate choice |
| same 300ms rise, three start delays | word **70ms** · language buttons **30/70ms** · CTA **140ms** |
| same mark beat, three dwells | **1200** · **1600** · **1400ms** |

And `first-run` disagrees with itself: the progress bar and Skip paint instantly while the primary
CTA fades in over 300ms (`first-run:528,570`).

## The two things that cost a cheap phone

- **A per-frame worklet that never stops.** `sumaiya-mark.tsx:52-66` integrates the angle every
  frame, forever, for a 24°/s idle drift — and the SVG is rasterised at 3× (`:106-115`), so that is
  a **216dp bitmap being rotated every frame** on a low-end device.
- **Two marks turning at once.** `portal-transition.tsx:117-148` mounts a second turning mark while
  the slide's own mark is still mounted and thinking (`onboarding:366,323`), so the heaviest 760ms
  carries **two per-frame integrators plus a `withRepeat` breath**.

One genuinely good piece of news: **there is no JS-driven `Animated` anywhere** in `apps/native/src`
— zero `useNativeDriver` / `Animated.timing` / `LayoutAnimation`. Every element here is a
Reanimated UI-thread worklet. The JS-thread risk is confined to `setTimeout`s.

## Web vs native — they are different animations, not the same one

| | web | native |
|---|---|---|
| idle mark | bounded drift, `7s ease-in-out`, 0→10deg, scale→1.03, **compositor-only** | continuous **24°/s** + whole-mark breath 1→1.06/720ms, **UI-thread frame callback** |
| thinking spin | **240°/s**, switched instantly | **260°/s**, ramped over 520ms |
| first entrance | `hero-rise` 0.6s `cubic-bezier(.16,1,.3,1)`, translateY 12px, **transform-only so the h1 paints on frame 1** | 300ms `EASE.out` **with `opacity 0→1` — gates first paint behind opacity** |
| route enter | 0.24s / 6px | 260ms / 12px |
| tokens | `duration-150/200/300` | `micro/fast/base` = 90/140/220 |

**The welcome surface has no web counterpart at all** — `apps/web` has no splash/onboarding/
first-run route. So `MARK_WELL` is native-only, which is why nothing caught `first-run` hard-coding
its own numbers.

## Ranked changes — quality gained per unit of risk

1. **`portal-transition.tsx:134,139`** — `EASE.in` → `EASE.out`/emphasized on the flood and the
   mark, and start the slide collapse on the same clock (`IGNITE` 180ms) instead of 260ms
   (`onboarding:324`). *Kills the bang.*
2. **`portal-transition.tsx:128,143`** — fire `onDone` at the mark's exit (900ms), not `COVER_AT`
   760ms. *Kills the 140ms ghost.*
3. **`first-run-screen.tsx:553,570`** — replace `FadeInRight`/`FadeOutLeft`/`FadeIn`
   (260/150/300ms, 25px, default curve) with the repo's `Reveal` (300ms, rise 12, `EASE.out`; exit
   140 `EASE.in`). *Also takes layout animations off the interactive step wrappers.*
4. **`sumaiya-mark.tsx:52-66`** — idle drift via `withRepeat(withTiming(linear))`; keep the frame
   callback only for the 520ms speed ramp. *Stops a forever-per-frame worklet on cheap phones.*
5. **`onboarding-screen.tsx:106-117`** — animate the dot with `scaleX` + opacity at 300ms
   `EASE.out` instead of `width 8→24` at 220ms. *Stops a row relayout and shares the entry beat.*
6. **`splash-screen.tsx:38,64-68` + `onboarding-screen.tsx:187`** — give the splash an exit, match
   the well's `y` so the mark is **one object** across the handoff, and collapse the three thinking
   dwells (1200/1400/1600ms) to one constant.

## Unmeasured, stated as such

- The exact `y` gap between the splash well and the welcome well is inferred from layout code, not
  measured on a device — the direction of the jump is certain, the dp is not.
- Whether Reanimated actually plays `WelcomeStage`'s `FadeOut` when the parent changes from a
  `Fragment` (`onboarding:354`) to a `View` (`:364`) is untested; if the exit is dropped, the
  welcome is cut instantly rather than fading. **One device capture settles it.**
- The JS-thread timing drift (the dwells, the 150ms `measureInWindow` fallback, the 180ms haptics
  `setTimeout`) all fire while the JS thread is busiest — cold start. Timing inferred, not measured.
