# TemplateHub — get it unblocked, then hand off

From: Hermes. 2026-09-16. Diagnosis is verified against the Vercel API and the GitHub API —
not inferred.

## What is actually wrong (verified)

| Fact | Evidence |
|---|---|
| **Production is 9 days stale** | `master` last deployed **07 Sep 17:18**, READY |
| **Your branch has never deployed** | `claude/admiring-turing-b5ghd1` appears in **zero** deployments |
| An earlier Claude branch failed | `claude/templatehub-continuation-…-local20260915` → **ERROR** |
| 5 of 8 recent deploys failed | every one from a `stash/*` branch |

So the real situation: the invitation editor, the adapter and the API endpoints are committed
and pushed, but **none of it has ever run anywhere**. There is nothing to verify against, which
is why this feels stuck — not because the code is failing, but because there is no deploy to
point at.

## The stash failures — root cause (this one is precise)

```
Failed to compile.
Module not found: Can't resolve '@/lib/smartfit'
./components/assistant/cv-assistant-client.tsx
```

`lib/smartfit.ts` **exists on `master` and on your branch (HTTP 200) but 404s on every
`stash/*` branch.**

Cause: **`git stash` without `-u` does not capture untracked files.** Each stash recorded the
*edited* `cv-assistant-client.tsx` — which imports `@/lib/smartfit` — and left the **new,
untracked** `lib/smartfit.ts` behind. The branch has the import and not the file. Webpack fails.
And because the stashes were taken in sequence on one working tree, every stash after the
smartfit work inherited the same broken import — `s7:doc-intel` fails on a *smartfit* error.

**Fixed already, by me:** the TemplateHub Vercel project now skips builds for `stash/*`
(`commandForIgnoringBuildStep`), verified: `stash/*` → skip, `master` and `claude/*` → build.
I did not touch the repo.

## What to do, in order

1. **Stop pushing stash branches.** If WIP must be preserved, `git stash -u` — untracked files
   included — or commit it on a real branch. A stash pushed to a branch is a deploy with a hole
   in it.
2. **Run `npm run build` locally before pushing.** Vercel only showed lint warnings before the
   failure, so the real error is further down the build. Local gives it to you in seconds
   instead of a round trip. This is the step that is costing you the most time.
3. **Get one green deploy on `claude/admiring-turing-b5ghd1`.** Until that exists, nothing is
   proven — not the invitation editor, not the adapter, not the API routes.
4. **Then walk it as a user**, not as a build: open the invitation editor, fill the form, pick a
   template, export a PDF. Build-passing has never meant working in this project.

## What I need at handoff

Not a summary — the verifiable state:

1. **A green deploy URL** for the branch. That is the starting line.
2. **What is real vs mocked.** The last audit found 5 templates where the docs claimed 224, and
   no database. I will re-verify, but tell me where the bodies are buried so I do not rebuild
   something that exists or trust something that does not.
3. **The stashes recovered** (`git stash -u`) or explicitly abandoned. I will not build on a
   tree with invisible gaps.
4. **Which things are wired to what** — auth, DB, AI provider, and what is stubbed.

## The line that has to be drawn

Once I take TemplateHub, **Claude stops writing to it.** Not "works on a branch" — stops.
Today I was editing Sumaiya and my own tooling flagged that two files I was patching had been
modified by another agent. Two writers in one tree is the reason this feels slow; the stash pile
is the same disease with a different name.

Give me the repo, not a share of it, and this moves at the pace you expected.
