# Pass 1 — Category Strategist: what Sumaiya can honestly call itself

**Question answered:** what category should Sumaiya lead with, given the real
capability set (CV builder + export, cover letters, business cards, formal
letters, a Tanzanian jobs feed, an on-device CV check, application tracking, a
career interview, and learning) and the current lead line, "CV inayokufikisha
kwa mwajiri" / "The CV that reaches the employer."

All judgement calls below are marked **JUDGEMENT**. Everything else is drawn
from `CONTEXT-BRIEF.md` and the two source docs it points to
(`FEATURE-INVENTORY.md`, `PRODUCT-DIRECTION-2026-09-20.md`), which measured the
code and the live site directly.

---

## 1. The honest categories on offer

**A. CV / document builder.** Occupied globally by Canva, Zety, Novoresume,
Resume.io; occupied locally by Mabumbe, a human CV-writing service priced at
TZS 30,000–180,000 per document (cited in `PRODUCT-DIRECTION-2026-09-20.md`
§1.5). The promise: *leave with a professional-looking document, fast.*
**Sumaiya can honour this fully.** It is the best-tested surface in the
product — the editor, PDF export, and the 47 offered templates are the parts
with real coverage — and it is the one part of the product a guest can reach
and finish without an account at all.

**B. Job application kit.** Not a single named incumbent; the closest analogs
are a fragmented tool stack (Canva for the CV + a separate ATS checker like
Jobscan + a separate cover-letter template). The promise: *everything you
physically send when you apply, made right, in one place — CV, cover letter,
business card, formal letters, and a check that it's good enough before you
send it.* **Sumaiya can honour this today.** Every one of those document types
is shipped and reachable (`FEATURE-INVENTORY.md` §4, rows 2–4, 16–17), and the
on-device ATS check has real, tested scoring logic (`lib/ats-score.ts`,
`lib/ats-explain.ts`). This is wider than "CV builder" without requiring
anything the product doesn't already do.

**C. Job-search operating system / application tracker.** Occupied by Huntr,
Teal, and Simplify globally, and — for almost everyone in this market — by a
notebook or a WhatsApp thread. The promise: *manage the whole hunt: track
every application, know what's overdue, know your odds.* Sumaiya has the
pieces — an application tracker, an outcome ledger schema, a signals engine —
but `PRODUCT-DIRECTION-2026-09-20.md` §1.2 measured, live, that this is not
true system-wide yet: the native and web trackers use different status
vocabularies and never sync (D8), so a phone user's outcomes are invisible to
the server; the jobs feed that would drive matches returned `{"data":[]}` on
2026-09-20 (D5); and the "hired" outcome cannot even be recorded as a legal
application status yet (§3.2). **Leading with this category today would be a
lie.** It is a credible target for two or three quarters out, contingent on
specific, named engineering (§2 below) — not a fact about the product as it
ships now.

**D. Career services / coaching platform.** Occupied by LinkedIn Learning,
Coursera's career tracks, and — locally — human career counsellors and
mentors. The promise: *expert guidance, curated curriculum, someone who knows
your field.* Sumaiya's career interview is a structured self-assessment that
builds a profile, and its learning hub surfaces short courses tied to a
detected skill gap. That is real, but it is self-serve and automated, not
curated or credentialed. **Claiming "career services" overclaims the depth** —
it borrows the trust a marketplace of real coaches has earned and applies it
to an unaccompanied self-assessment flow. This would be a lie, or would need
so much hedging it stops being a clean category claim.

**E. Jobs platform / job board.** Occupied by BrighterMonday, Fuzu, LinkedIn
Jobs, and JobWebTanzania — the very RSS source Sumaiya's own ingest reads from
(`PRODUCT-DIRECTION-2026-09-20.md` §3.1). The promise: *find real, current
openings here.* **This is the most dishonest category available right now.**
The feed was measured empty, live, on the day this brief was written. Leading
with "find jobs" when the jobs tab says "bado hakuna nafasi... rudi hivi
karibuni" ("no listings yet — come back soon") is the fastest way to teach a
first-time user, in their very first session, that the product doesn't have
what it just promised.

**F. Workforce platform / employment operating system.** The macro,
deck-friendly category — no clean incumbent serves this market at this altitude;
the nearest global reference is LinkedIn, which does not fit a Swahili-first,
cheap-Android, no-desktop audience. **JUDGEMENT: this is not a category a
first-time jobseeker on a cheap phone can picture at all**, and it is currently
false on the product's own evidence (empty jobs feed, unsynced tracking, an
AI that returns 401 to guests). It belongs in a pitch deck, not under the
product's name.

## 2. Which category to lead with

**Lead with B — the job application kit.** Not A (too narrow, see §3), not C,
D, E, or F (all either currently false or unpicturable to this buyer).

The trade-off, stated plainly: a wider category reaches more of the audience
and raises the ceiling, but it borrows credibility from incumbents who already
own that mental model at scale (LinkedIn owns "manage your career"; BrighterMonday
and Fuzu own "find a job" in this exact market) — and if the product cannot
back the claim on day one, the first session is the one where the user finds
out. A narrower category converts the person already in front of you
reliably, but caps what they come back for: **JUDGEMENT**, this is the same
failure the product's own retention research already names — a CV-only promise
produces a CV-only session, one document, then gone.

**The risk I would rather the owner take is the middle one, not the wide one.**
"Job application kit" is wider than "CV builder" in a way that is true today
— the cover letter, the business card, the formal letters, and the ATS check
are all shipped and reachable, so the category claim and the product match on
day one. It is narrower than "job-search operating system" in the one way
that matters: it makes no promise about jobs existing in the feed, about
tracking working the same way on the phone as on the web, or about the
product knowing whether the user got hired. Those are exactly the three things
measured broken or empty on 2026-09-20.

**What has to be true before the wider category (C) stops being aspirational:**
three specific, already-scoped fixes, all named in
`PRODUCT-DIRECTION-2026-09-20.md` §2.2 — job ingest repaired so the feed is
reliably non-empty (F2), native and server application tracking unified so a
phone user's outcome is visible to the product at all (F4), and the outcome
loop actually collecting answers at a volume past the aggregate layer's own
`SMALL_SAMPLE_N = 10` floor (F3) before the product can honestly say it knows
anything about response rates. **JUDGEMENT:** until those three ship and hold
for a full measurement cycle, "job-search operating system" is a category the
marketing would be writing checks the product can't cash — exactly the
failure mode item E already commits today with an empty jobs feed.

## 3. Where the current framing loses

"CV inayokufikisha kwa mwajiri" / "The CV that reaches the employer" is not
wrong — it is an honest, outcome-framed claim about the one thing it names.
The failure is not in what it says; it is in what it silently rules out.

**Concretely:** the product's own CTA architecture has exactly one call to
action — "Anza CV yako" ("Start your CV") — and the guest's entire first-paint
experience, per `PRODUCT-DIRECTION-2026-09-20.md` §1.1, is built around a
single document. A user who finishes and downloads that CV has been given, by
the headline itself, zero reason coded into the page to stay for a cover
letter, a business card, or the ATS check that would tell them if the CV they
just made is actually good. The headline *is* the session-length design: it
promises one document, so the funnel delivers one document, and the person
leaves. This matches the product's own retention finding almost exactly — the
"aha moment" and the exit are the same screen, because nothing after it was
promised.

A second, smaller loss: "reaches the employer" is close enough to an outcome
claim (gets seen, gets you in) that it invites the reader to expect
follow-through — did it work? — and the current line has no answer to that
question anywhere in the copy, even though the outcome-tracking pieces exist
in the code. The headline spends the product's best future differentiator
(knowing what happened after you applied) on a promise about the document
alone.

## 4. The line

**Swahili:** *Nyaraka zote za kuomba kazi — tayari kutuma.*
**English:** *Everything you send to apply — done right, ready to send.*

This names the kit (plural documents, not one CV), is picturable by someone
who has never used the product — they can see the stack of things they'd
otherwise need three different services for — and makes no claim the product
can't back: it does not promise a job, an interview, or a hire; it promises
that what you send is complete and correctly made, which is the one thing
every shipped, tested part of the product (CV, cover letter, business card,
formal letters, the on-device check) already does today. It says nothing
about AI, names no mechanism, and touches neither the name nor the colours.
