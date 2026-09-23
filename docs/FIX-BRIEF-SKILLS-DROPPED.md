# Fix brief: `/api/ai/build-cv` silently deletes the skills section

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS only. ONE item. Do not bump the
version, do not switch branches, do not upgrade a dependency.

## The defect, measured end to end

I called the live production endpoint with a six-line human seed:

```
POST /api/ai/build-cv { text: "<seed>", lang: "en" }   -> 200
the model returned:  "skills": ["Customer Service","Point of Sale (POS)","Stock Taking",
                                "Microsoft Excel","Sales Reporting","Team Supervision","Inventory Management"]
POST /api/cv { data: <that payload> }                  -> 201
the STORED cv.data has:   skills: []      <- all seven gone
```

The consequence is user-visible and measurable: the app's own ATS engine
(`lib/ats-score.ts`, `analyzeCv` + `atsScore`) scores that CV **58/100**, and its
"Job Relevance" pillar is **25** because it fails its own **"8+ skills listed"** check — on a CV where
the model listed seven. Every web/assistant-built CV loses a whole section.

## The cause — two prompts disagree, and the boundary is the arbiter

- `lib/api/routes/ai.ts` (the WEB generator, the one I called): asks the model for
  `"skills":[""]` — an array of **plain strings** (see the JSON shape in the prompt, around the
  `"skills":[""]` fragment).
- `lib/api/routes/mobile.ts` (the PHONE generator): asks for
  `"skills":[{"name":"","level":"intermediate"}]` — **objects**, which is the shape that survives.
- `apps/web/types/index.ts:157-190` documents the write boundary: *"ONE rule, applied to every array
  section (skills, experience, education, …) … the row is not a plain object -> DROPPED (a string, a
  number, null: not a row at all)"*, and records the measurement: *"9 skills in, 9 out with `level: 3`;
  0 out without `level`"*. The required field map is `skills: ["name"]`.

So the web prompt asks for a shape the boundary is designed to discard. `mobile.ts` got it right;
`ai.ts` did not.

## What to do

1. **Align the web prompt to the shape the boundary accepts** — the same `{"name","level"}` object
   shape `mobile.ts` requests, for EVERY array section in that prompt, not only skills. Audit the
   whole JSON fragment in `ai.ts`: the same mismatch may exist for `languages`, `certifications`,
   `projects` and `referees` (check each against the `FIELDS`/required-field map in
   `types/index.ts`). Report which sections were wrong; do not fix only skills if others are wrong
   too.
2. **Decide and state the defence-in-depth position on the boundary.** The boundary is right to drop
   unreadable rows (its own comment explains the blank-bullet bug that motivated it). Do NOT weaken
   it to accept bare strings unless you can show it cannot reintroduce blank bullets. If you judge a
   lenient coercion (`"Excel"` -> `{name:"Excel"}`) is safe and clearly better, implement it WITH the
   reason in the comment, and say why the blank-bullet case cannot come back.
3. **Add a test that would have caught this**: feed the generator's documented output shape (as the
   prompt requests it) through the same write boundary the API uses, and assert the skills survive.
   Put it where the boundary tests already live (`lib/cv-shape-boundary.test.ts` is the established
   file) — vite/VITEST in `apps/web`, unlike the native app.
4. If you find the model simply ignores the requested shape rather than the prompt requesting the
   wrong one, say so plainly — that is a different fix and I want to know which it is.

## Gates and report

`cd apps/web && npx tsc --noEmit && npx vitest run` (VITEST in this app — never jest). Commit NAMED
PATHS ONLY; this clone is shared with another agent. Report: files changed, exact commands, pass/fail
counts, commit sha, and — explicitly — whether the prompt was wrong or the model ignored it.

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or any secret.
