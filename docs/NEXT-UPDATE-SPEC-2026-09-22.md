# NEXT UPDATE — the spec, grounded in production evidence and published practice

2026-09-22. Built from: the production funnel (telemetry + database), a two-model panel on the
product decision, and external research on first-session activation that was briefed to *test*
the proposal rather than agree with it.

## The evidence that started this

```
9 installs · 4 accounts · 2 CVs · 0 cover letters · 0 applications (ever)

FOUR separate installs completed onboarding and emitted NO further event:
  Pixel 6a   10:30 -> 10:30    4 slides, onboarding.done, nothing
  SM-A346E   13:10 -> 13:11    same
  Pixel 7    06:15 -> 06:15    same
  SM-A165F   08:15 -> 08:16    same
  None started the profile wizard. None opened chat. None made a CV. None errored.

The one that converted: SM-A175F, 04:49 onboarded -> 05:03 signed up -> 05:03 CV in her own name.
```

What sits after onboarding (read from `navigation/root-navigator.tsx`): the app tabs, rendered as
a **guest**. A guest sees only **three** actions — the assistant, the on-device CV check, and
TemplateHub. Job matches, applications and cover letters are hidden because they need an account.
So the differentiated flow is unreachable, and the only thing a new guest *can* do is build a
plain CV — the commodity Careergo (TZ) and CV King (UG) already sell.

## Verdict from the research: CORRECT IN DIRECTION, INCOMPLETE AS AN UPDATE

The proposed change — make the post-onboarding first screen the differentiated flow and gate only
save/download — matches established practice: deferred registration at the moment of loss, one
critical path, avoid the empty dashboard, keep the promise the poster made. **But shipping it alone
risks moving the void rather than closing it**, because the same evidence equally fits a second
explanation: **the onboarding slides consumed the only session.** With 9 installs you cannot
separate those two hypotheses, so the update has to cover both.

## The update, in order

1. **Instrument activation FIRST.** Emit an explicit event for *advert pasted → package generated*.
   Replace slide-completion as the success metric with time-to-first-value and D1. Without this the
   change cannot be evaluated at all — and right now onboarding is measured by events that "move on
   a dashboard while the cohort quietly empties".
2. **Let the differentiated flow complete as a guest.** Paste an advert → tailored CV + cover letter
   + checklist, visible on device. Gate **only** save / download / submit. This is the specific
   supported pattern: lazy signup at the point of loss.
3. **Make the post-onboarding landing that flow**, in a **filled** state — a pre-loaded example, or
   the job from the poster that sent them — not the guest Home menu. One primary CTA; the commodity
   CV builder stays reachable but demoted from the headline.
4. **Make the onboarding slides skippable or deferred**, so they cannot eat a single-session user's
   only visit. Four installs is exactly the shape of that failure.
5. **Deferred deep link / QR token.** Without it, poster and QR arrivals "land on the default home
   screen and the context from the QR code is lost entirely" — 60–80% of out-of-home scans are
   non-installers. The poster promises one thing; the app must open on that thing.
6. **The account ask carries its reason and a real channel back.** At save, say what is being kept,
   and offer SMS/WhatsApp delivery — contactability is worth roughly 2x retention, and a user on
   borrowed data may never reopen the app.
7. **First screen works offline within a small byte budget.** ~95% of emerging-market users are on
   prepaid data, many at ~250MB/month. One session may be all there is.

## The counter-argument, stated rather than buried

Going fully anonymous is **not** free: an account is the only re-contact channel, opted-in users
retain at roughly 2x, and any push within 90 days is associated with much higher retention. The
resolution is not "no wall" — it is **the wall at the moment of loss, plus a channel the user
actually uses (SMS/WhatsApp)**. Separately: **no evidence was found that an early account wall
builds trust or improves conversion in a low-trust market** — the claim is asserted, and the
adjacent fraud literature argues for progressive friction instead.

## Where the evidence is thin — do not bet the product on it

- **No published measurement** of "differentiated first action vs a commodity-action menu".
  That part rests on practitioner doctrine (one critical path, singular CTA, Fogg B=MAP, empty-state
  evidence), not a study with numbers.
- **The "completed onboarding then vanished means the wrong destination" inference has no
  experimental evidence.** It is consensus plus Amplitude's triage practice, and it fits the
  slides-ate-the-session explanation just as well.
- The headline figures are **vendor benchmarks, several second-hand** (activation within 3 min →
  ~2x retention; one developer's self-reported auth-deferral case: D1 36→71%).
- **No Tanzania or East-Africa-specific activation data was found at all.**
- **9 installs cannot distinguish any hypothesis.** This recommendation stands on practice and
  mechanism — not on our data. The only honest way to know is to instrument (item 1) and then watch.
