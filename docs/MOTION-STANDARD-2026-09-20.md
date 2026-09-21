# Sumaiya Motion Standard — 2026-09-20

**Status:** the enforced standard for both apps. The numbers in this document are
mirrored in exactly two places; if a number changes it changes in all three
together:

| Platform | File |
| --- | --- |
| Android / iOS (the product) | `apps/native/src/components/ui/motion.tsx` |
| Web | `apps/web/lib/motion.ts` |
| Tests pinning both | `apps/native/src/components/ui/motion.test.ts`, `apps/web/lib/motion-tokens.test.ts` |

---

## 1. The rule

> **Nothing appears. Everything arrives.**

No state change in this app may be visible as a single-frame replacement. A
screen, a list, a dialog, an error, an empty state, a loading result — each one
either *interpolates* into its place or *hands off* to what replaces it, with no
frame in which the surface is empty or the content has jumped.

This is not "add animations to everything". It is the opposite: the standard
names a small number of exact movements, and then says which parts of the
interface must stay completely still.

## 2. The principles (Apple's, sized for a cheap Android phone)

**1. Continuity — things come FROM somewhere and go BACK somewhere.**
A dialog scales up from behind its own centre and scales back down to it. A
pushed screen enters from the edge it will leave towards. A list row rises a
short distance from where it belongs. Nothing materialises at full opacity, and
nothing should have to be explained after the fact — the motion *is* the
explanation of where the thing came from.

**2. Interruptibility — motion is never a gate.**
Every animation here is a transition on a value that already exists, not a
lock the user has to wait behind. Tapping during an entrance must work; the
in-flight animation is superseded, not queued. This is why the standard uses
short timed curves almost everywhere instead of long springs: a 240ms spring has
a window in which a second tap is ambiguous, a 220ms ease-out does not.
Interactive states (pressing a button, a switch, a tab) animate *towards* the
pointer, never away from it.

**3. Direct manipulation — feedback is attached to the finger, not the result.**
Press-down feedback is immediate (the `Button` scale animation,
`haptics.light()`), because the platform's rule is that the response to a touch
begins on the touch. Nothing that the user's finger is touching may animate in a
way that lags the finger.

**4. No gratuitous motion.**
If an animation does not communicate hierarchy, origin, or state, it is deleted
rather than tuned. Two specific consequences in this codebase:
- the splash mark's breath is **bounded** — it is the mark's own `thinking`
  breath, and it stops when the mark settles to `idle` (`splash-screen.tsx`),
  so nothing on the launch screen loops for the life of the screen;
- `SumaiyaMark` is `static` on inactive tabs — a per-frame callback on five
  invisible marks is motion nobody can see and the battery still pays for.

**5. Motion communicates hierarchy.**
A short stagger is a hierarchy statement: the header arrives, then the body,
then the action. That is why the empty state's action button lands *after* its
title (`empty-state.tsx`: `delayMs={MOTION.dur.fast}`) — the user should read
the situation before being offered the way out of it.

**6. Sized for a Redmi-class device, not a Pixel.**
The budget is 16.7ms per frame, and the target device has roughly a third of
this Pixel 8 Pro's single-core throughput. Therefore:
- **Timing curves, not springs, for anything that repeats per item.** A spring
  is an integrator that runs every frame per item; a `withTiming` on a cubic
  curve is a closed-form lookup. A 20-row list is 20 integrators versus 20
  lookups.
- **Stagger is capped at 6 items** (270ms worst case). Beyond that the
  animation cost grows while the perceived benefit does not.
- **Nothing animates a property that triggers layout.** `transform` and `opacity`
  only, except where the standard explicitly calls for `layout` (expand/collapse,
  where the sibling reflow *is* the information).
- **A janky animation is worse than no animation.** If a surface cannot hold the
  frame budget, it gets the instant treatment, and that is recorded rather than
  hidden.

## 3. Tokens

These are the values, and they are the only values. No ad-hoc `duration: 137`.

### 3.1 Durations (ms)

| Token | Value | Used for | Rationale |
| --- | --- | --- | --- |
| `dur.instant` | **1** | the Reduce-Motion form of everything below | Non-zero on purpose — a 0ms animation can skip its finished callback and hang a caller. 1ms is too fast to read as movement. |
| `dur.micro` | 90 | tap acknowledgement, chevron turn, chip state | Under the threshold where a change reads as a *transition* rather than a change. |
| `dur.fast` | 140 | **everything leaving** | Leaving is never as interesting as arriving. |
| `dur.base` | 220 | in-place change: label ↔ spinner, a value updating | |
| `dur.slow` | 300 | **everything entering** (elements, rows, reveals) | |
| `dur.screen` | 260 | a push/pop between screens | `stackScreenOptions` in `apps/native/src/navigation/nav-config.ts`. |
| `dur.field` | 340 | a full-screen colour field dissolving into a page | The root cross-fade in `rootScreenOptions`; the extra 80ms is what makes a saturated colour dissolve instead of blink. |

**Invariant:** `dur.fast < dur.base < dur.slow < dur.field`. Exit is always
shorter than the matching entry. `dur.instant` is the only duration below 90ms.

### 3.2 Easing

| Token | Native | CSS | Used for |
| --- | --- | --- | --- |
| `ease.out` | `Easing.out(Easing.cubic)` | `cubic-bezier(0.33, 1, 0.68, 1)` | **default for anything entering** — decelerate into place |
| `ease.in` | `Easing.in(Easing.cubic)` | `cubic-bezier(0.32, 0, 0.67, 0)` | **anything leaving** — accelerate away, clear the frame |
| `ease.inOut` | `Easing.inOut(Easing.cubic)` | `cubic-bezier(0.65, 0, 0.35, 1)` | a value that changes in place (chevron 0° → 180°) |
| `ease.emphasized` | `Easing.bezier(0.16, 1, 0.3, 1)` | `cubic-bezier(0.16, 1, 0.3, 1)` | the longer settle on the last 10% — hero/brand moments only |

**No overshoot, anywhere.** A list row that bounces has told the user something
false about where it will land, and a container that overshoots its own size has
done the same to the brand mark. The splash mark's `Easing.back(1.6)` was the
app's one sanctioned exception; it was removed when the welcoming path was made
one continuous effect, because an overshoot is a *size change*, and the whole
point of that path is that the mark is the one object whose size and container
never change — the launch, the language stage and the slides all put the same
mark in the same well at the same scale, arriving by opacity and a `rise`.
`mark-well-tokens.test.ts` fails if a second size or container comes back.

### 3.3 Springs

Reserved for (a) presentation/dismissal of a dialog or sheet, and (b) a
container resizing because its content changed — the two cases where
interruptibility matters more than a predictable curve.

| Token | Config | Used for |
| --- | --- | --- |
| `spring.gentle` | `{ damping: 20, stiffness: 180, mass: 0.9 }` | dialog / sheet present |
| `spring.snappy` | `{ damping: 22, stiffness: 260, mass: 0.8 }` | container reflow (`layout={LinearTransition...}`) |

Damping ≥ 20 everywhere, so no functional surface visibly bounces. The dialog
layer (`apps/native/src/components/ui/dialog.tsx`) already uses
`{ damping: 20, stiffness: 240, mass: 0.8 }`; that is `spring.gentle` in spirit
and is within the standard.

### 3.4 Stagger

| Token | Value |
| --- | --- |
| `stagger.base` | 30ms |
| `stagger.step` | 40ms |
| `stagger.cap` | 6 items |
| **`MAX_STAGGER_MS`** | **270ms** |

```ts
staggerDelayMs(index) = 30 + min(index, 6) * 40     // 30, 70, 110, 150, 190, 230, 270, 270, 270…
staggerDelayMs(index, { reduceMotion: true }) = 0
```

The invariant is the cap: **the last item of any group starts within 270ms of
the first.** A 40-row list must not still be appearing two seconds after the
screen is usable. This was the defect in the original `Stagger`
(`base + index * step`, uncapped): item 20 waited 1130ms and item 40 waited
2230ms.

`rise` = 12px: the distance a row travels on entry. Small on purpose — the
element is establishing presence, not travelling.

### 3.5 Composites (what the framework supplies)

| Behaviour | Entry | Exit |
| --- | --- | --- |
| Push/pop between screens | `slide_from_right`, 260ms | reverse |
| Root mode switch (onboarding ↔ auth ↔ app) | `fade`, 340ms | reverse |
| Tab switch | `animation: "shift"` (react-navigation v7) | — |
| List row / card | `FadeInDown`, 300ms, `ease.out`, capped stagger, 12px rise | — |
| Dialog | backdrop opacity + card `scale 0.94→1`, `spring.gentle` | `withTiming` 140ms `ease.in` |
| Sheet (bottom) | backdrop opacity + `translateY 360→0`, 220ms `ease.out` | 160ms `ease.in` |
| Expand / collapse | content `FadeIn` 220ms `ease.out` + `layout={LinearTransition.springify()}` on the container | — |
| Loading → content | placeholder `FadeOut` 140ms **while** content enters | — |
| Empty state | `Reveal` (opacity + 12px rise), title/body at 0ms, action at 140ms | — |
| Error inline | `Reveal` — same as empty state | — |
| Success toast | `FadeIn` 220ms `ease.out` | `FadeOut` 140ms `ease.in` |
| Button label ↔ spinner | `FadeIn` 220ms, one over the other | — |

## 4. What must stay INSTANT

Apple-grade is not "everything moves". The following are **not** animated, and
adding motion to any of them is a regression:

| Surface | Rule |
| --- | --- |
| **Typing** | A keystroke must produce its glyph on the next frame. No animation may wrap a `TextInput`'s `onChangeText` path. |
| **Taps** | The *response* to a tap is immediate. Press feedback is a static state change plus a haptic; the visible consequence may animate, the acknowledgement may not. |
| **Scrolling** | Never animate a scroll offset. No scroll-linked reveals on a phone. `Screen` uses the platform `ScrollView` untouched. |
| **Selection state** | A selected chip/tab/radio is correct on the frame it is tapped. Only its *decoration* (the tab pill, the chevron) eases. |
| **Numbers the user is comparing** | A score that animates is a score the user cannot read. Count-ups are allowed only where the number is a headline and not a comparison (the web `/snap` score). |
| **Text in a list that is already on screen** | A row whose data changes updates the text; it does not replay its entrance. Entrances are a property of *arriving*, not of *existing*. |
| **Keyboard avoidance** | The keyboard offset follows the keyboard exactly. |
| **Reduced Motion** | Collapses to `dur.instant` (1ms) — **never removed**. See §5. |

## 5. Accessibility — Reduce Motion

Requirement: **when the OS reports reduced motion, animations collapse to
near-instant; they are not removed, and no animation may be the only way to
understand a change.**

- **Native:** `useMotionReduced()` (`apps/native/src/components/ui/motion.tsx`,
  re-exporting Reanimated's `useReducedMotion`, which reads the OS setting).
  Every token has a reduced form: `enterDurationMs(true, x) === 1`,
  `staggerDelayMs(i, { reduceMotion: true }) === 0`, and the shimmer and the
  splash land at their resting state instead of pulsing.
- **Never zero.** 1ms, not 0ms, so `withTiming`'s finished callback still fires
  and no caller hangs waiting for an animation that never reports completion.
- **Nothing is motion-only.** Each transition is a *transition between two
  readable states*: the empty state is legible as static text, the error is
  legible as static text, the expanded answer is legible when expanded. A user
  with motion off loses the *pleasure* of the hand-off, never the information.
- **Web:** `apps/web/app/globals.css` carries the app-wide net —
  `@media (prefers-reduced-motion: reduce) { *, *::before, *::after {
  animation-duration: .01ms !important; transition-duration: .01ms !important } }`
  — which is the same contract (collapse, not remove). Individual components
  additionally `animation: none` where an animation is decorative (the marquee,
  the mark's blades).

**Where each is implemented (native):** `apps/native/src/components/ui/motion.tsx` (`useMotionReduced`, `enterDurationMs`, `exitDurationMs`, `staggerDelayMs`), `apps/native/src/components/ui/skeleton.tsx`, `apps/native/src/components/ui/empty-state.tsx`, `apps/native/src/components/ui/button.tsx`, `apps/native/src/screens/splash-screen.tsx`, `apps/native/src/screens/app/help-faq-screen.tsx`, `apps/native/src/components/sumaiya-mark.tsx` (already had it).

## 6. The mounting-layer rule (why `Reveal` exists)

`apps/native/src/components/ui/reveal` (exported as `Reveal`) animates with a
`useAnimatedStyle` driven by a shared value — **not** an `entering` layout
animation.

This is not a style preference. `apps/native/src/components/ui/empty-state.tsx`
records that an `entering` wrapper left the action `Button` non-interactive on
Fabric, and the fix at the time was to delete the animation entirely. A layout
animation registers an intercept with the mounting layer; a shared-value style
does not.

So the rule is:

> **Decorative entrance on a container with interactive children → `Reveal`.**
> `entering` is fine for leaf rows and wrappers with no `Pressable`/`Button`
> inside. When in doubt, `Reveal`.

Related: an animation that outlives its component is a defect.
`RetryableMountingLayerException: Unable to find SurfaceMountingManager` in
logcat is the symptom — Reanimated keeps a `withRepeat` running after the
component unmounts, the ticks queue against a dead node, and they are flushed
during an *unrelated* UI event dispatch (a screen transition), which is why they
appear during navigation. Fix: `cancelAnimation(...)` in the effect's cleanup.
See §8.

## 7. How to verify (this is not optional)

Motion is verified on the device, never by eye.

**Frame sequence (does it interpolate, or is it a two-frame pop?)**
```bash
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"   # adb is NOT on PATH in every shell
"$ADB" -s <serial> shell svc power stayon true                   # screenrecord captures nothing while dozing
"$ADB" -s <serial> shell input keyevent KEYCODE_WAKEUP
"$ADB" -s <serial> shell 'rm -f /sdcard/clip.mp4; screenrecord --time-limit 4 /sdcard/clip.mp4 & sleep 1.8; input tap <x> <y>; sleep 1.6; ls -l /sdcard/clip.mp4'
# 0 bytes => the recording never started; do not pull it.
"$ADB" -s <serial> pull /sdcard/clip.mp4 "$LOCALAPPDATA/Temp/motion-qa/"
python scripts/motion-frames.py "$LOCALAPPDATA/Temp/motion-qa/clip.mp4" --tag clip --from 1700
```
`scripts/motion-frames.py` decodes at ¼ scale using the container's real
per-frame timestamps and prints, per frame, changed pixels vs the previous frame
and distance-to-final. **Interpolated** = many consecutive frames with moderate
activity and a shrinking distance-to-final. **Pop** = zeros, one huge jump,
zeros. The script prints the verdict.

**Frame timing / jank**
```bash
"$ADB" -s <serial> shell dumpsys gfxinfo pro.sumaiya.app reset
# ...drive the screen...
"$ADB" -s <serial> shell dumpsys gfxinfo pro.sumaiya.app
```
Read `Janky frames: N (x%)`, `99th percentile`, `Number Slow UI thread`.

**Reanimated mounting failures**
```bash
"$ADB" -s <serial> logcat -c; "$ADB" -s <serial> shell am start -n pro.sumaiya.app/.MainActivity
sleep 16; "$ADB" -s <serial> logcat -d > "$LOCALAPPDATA/Temp/logcat.csv"
grep -c RetryableMountingLayerException "$LOCALAPPDATA/Temp/logcat.csv"
```

**Tooling that ships with this standard** (both under `scripts/`):
- `scripts/motion-frames.py` — the frame-sequence analyser above.
- `scripts/motion-qa-map.py` — one a11y dump per screen into a JSON coordinate
  map, so a screen is mapped once and then driven by coordinate.

## 8. The audit — every "boom" found on 2026-09-20

Severity: **H** = a state change the user is actively watching; **M** = visible
but not load-bearing; **L** = only noticeable if you look for it.

### Native

| # | Screen / component | Where the state changed | What the user saw | Sev |
| --- | --- | --- | --- | --- |
| N1 | Splash → first screen | `src/screens/splash-screen.tsx` `pulse.value = withDelay(900, withRepeat(..., -1))` (unbounded, no cleanup); same class in `src/components/sumaiya-mark.tsx` `breath` | Not a visual pop — the *opposite* problem: 291 `RetryableMountingLayerException` in one cold start, ~3 per frame for the whole 340ms root cross-fade. Reanimated kept driving props into torn-down views during the transition, stealing UI-thread time from the transition itself on the device where it matters most. | **H** |
| N2 | Empty state (6 screens) | `src/components/ui/empty-state.tsx` — deliberately no entrance, with a comment explaining an `entering` wrapper had broken the action button on Fabric | The loading skeletons vanish and the empty state is simply *there*, in the same commit. No hand-off. | **H** |
| N3 | `applications-screen.tsx:58` | `{loading ? <><SkeletonCard/>×3</> : …}` | Skeleton block unmounts and the list mounts on one frame; the watched slot blanks and rows pop into it. | **H** |
| N4 | `jobs-screen.tsx:120` | `{loading ? <View gap={10}><SkeletonCard/>×3</View> : …}` | same | **H** |
| N5 | `cv-list-screen.tsx:117` | `{loading && cvs.length===0 ? <><SkeletonCard/>×3</> : …}` | same | **H** |
| N6 | `home-screen.tsx:462` (Recent CVs) | `{loading && cvs.length===0 ? SkeletonCards : error ? <View/> : …}` | same, plus the error card appears instantly where the skeletons were | **H** |
| N7 | `learning-hub-screen.tsx:358` | `{loading ? <View><SkeletonCard/>×2</View> : …}` | same | **M** |
| N8 | `ats-checker-screen.tsx:125` | `{loading && cvs.length===0 ? <Text>Loading your CVs…</Text> : …}` | Bare text then the whole analysis appears at once. The worst loading state in the app, in both senses. | **H** |
| N9 | `help-faq-screen.tsx:96-113` (pre-fix) | `{open ? <View><Text/></View> : null}` on a container with **no `layout`** | The answer appears in one frame and pushes every card below it down instantly — and the chevron swapped `chevron-down`→`chevron-up` with no in-between. `cv-editor-screen.tsx:39-71` already did this correctly, so it was an inconsistency, not a missing capability. | **H** |
| N10 | `components/ui/motion.tsx` `Stagger` (pre-fix) | `FadeInDown.springify().damping(18).delay(base + index * step)` | Two defects: (a) the delay was **uncapped** — item 20 entered at 1130ms, item 40 at 2230ms, so long lists were still appearing after the screen was usable; (b) a per-row spring integrator for 40 rows on a low-end GPU. | **H** |
| N11 | `components/ui/button.tsx:113` | `{loading ? <ActivityIndicator/> : <>…label…</>}` | Every async action in the app swapped its label for a spinner on one frame — the button visibly changed identity mid-tap. | **M** |
| N12 | `learning-hub-screen.tsx:350` | `{toast ? <Animated.View entering={FadeIn}> : null}` with **no `exiting`** | The success toast entered gracefully and vanished instantly. | **L** |
| N13 | `job-apply-screen.tsx:294-299` | `{error ? <Text error/> : <Text count/>}` | two inline texts swapping in place, no transition | **L** |
| N14 | `invite-screen.tsx:84` | `{loading ? <ActivityIndicator/> : !data ? <Text/> : <content/>}` | spinner → text → content, all hard swaps (content itself has `entering`, the two before it do not) | **L** |
| N15 | `skeleton.tsx` shimmer | `withRepeat(…, -1, true)` with no cleanup | Same class as N1: an infinite loop that outlives its node, driving props at 60fps into anything that mounts during a transition. | **M** |

**Checked and already correct** (so they are the reference, not the defect):
screen push/pop (`nav-config.ts`), tab switch (`app-tabs.tsx`), `dialog.tsx`
(spring in / 140ms out), `prompt-modal.tsx`, `premium-sheet.tsx`,
`lesson-sheet.tsx`, `attachment-preview-sheet.tsx`, `auth-error-banner.tsx`,
`connectivity-gate.tsx`, `chat-composer.tsx` (`entering` **and** `exiting`),
`cv-editor-screen.tsx` Sections (`layout` + `entering`), `SumaiyaMark`
(reduce-motion aware), `AnimatedTabBar` (spring shade, interpolated label colour).

### Web

| # | Surface | Where | What the user saw | Sev |
| --- | --- | --- | --- | --- |
| W1 | `lib/motion.ts` `riseClass` (pre-fix) | `if (index <= 3) rise-${index+1}; return "rise-4"` | The language capped at 4 steps but nothing enforced a maximum wait; `staggerDelay` (a second, unconnected helper) offered `index * 50ms` with no cap at all. Two helpers, two answers. | **M** |
| W2 | `components/editor/template-selection-modal.tsx:132` | `{loading ? <Loader2/> : <grid>}` | Spinner vanishes, 3-column grid of template cards appears whole. | **M** |
| W3 | `components/editor/template-picker.tsx:125` | same shape | same | **M** |
| W4 | `components/settings/career-profile-card.tsx:139` | `{loading ? <p animate-pulse/> : <div space-y-3>}` | pulsing text → chips, one frame | **M** |
| W5 | `components/jobs/targeted-cv-drawer.tsx:274` | `{loading ? <Icon animate-pulse/> : error ? … : result ? …}` | every branch an instant swap inside a drawer | **M** |
| W6 | `components/editor/shared-profile-panel.tsx:140` | `{loading ? <div animate-pulse/> : editing ? … : …}` | same | **L** |

### What was NOT verified

- Whether the frame-timing improvement is measurable on this device: see the
  verification section of the hand-off. Where a number could not be obtained it
  is reported as unmeasured rather than estimated.
- The web changes were not driven in a browser; they are CSS-only class
  additions verified by type-check and unit test, not by observation.

## 9. Adding motion to something new

1. Is the change one of the seven in §3.5? Use that composite. Do not invent.
2. Is it in the §4 "stays instant" list? Then it does not animate. Stop.
3. Otherwise: choose `dur.slow`/`ease.out` to enter, `dur.fast`/`ease.in` to
   leave, and use `Reveal` if the container has interactive children.
4. Cap any stagger with `staggerDelayMs`.
5. Pass `useMotionReduced()` through `enterDurationMs`/`exitDurationMs`.
6. Add a line to §3.5 in this document. A composite that is not written down
   here is not part of the system.
7. Verify with `scripts/motion-frames.py`. Report the verdict, or report that
   you could not measure it.
