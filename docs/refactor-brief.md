# BRIEF — Sumaiya independence + feature inventory (for Claude)

**Authority:** delegated. Decide and implement; don't ask. Where a choice is knowable by
research or best practice, make it, and say what you chose and why. Escalate only money,
legal, or product identity.

**Read first — ABSOLUTE paths (these live BESIDE the repo, not inside it):**

```
C:\Users\hamis\projects\_hdd-data\DECISIONS.md        ← binding decisions
C:\Users\hamis\projects\_hdd-data\INFRASTRUCTURE.md   ← what is actually true
C:\Users\hamis\projects\_hdd-data\FRESH-START.md      ← where this is going
```

`_hdd-data` is NOT part of the repository and must never be committed to one. It holds the
keystore, secrets and env files. A relative path like `_hdd-data/DECISIONS.md` will not resolve;
use the absolute paths above.

---

## TASK 1 — Make Sumaiya independent of TemplateHub

**Decision D1, already made, not up for debate:** Sumaiya owns its templates, database and auth.
**An offline-first app cannot fetch templates from a remote service.** That's the whole reason.

**Files — verified by reading them, accurate as of now:**

| File | Change |
|---|---|
| `apps/web/lib/templates/templatehub-provider.ts` | **delete** (295 lines, self-labelled stub) |
| `apps/web/lib/templates/index.ts` | strip the `templatehub`/`remote` branch from `selectProvider()` — 5 references |
| `apps/web/lib/templates/provider-select.test.ts` | update — it currently pins remote-selection behaviour that will no longer exist |
| `apps/web/lib/templates/schema.ts` | remove fields only the remote path used |
| `apps/web/lib/templates/native-provider.ts` | **also imports it** — I missed this on my first pass |
| `apps/web/lib/templates/provider.ts` | **also imports it** — same |
| `.env.example` | confirm no `NEXT_PUBLIC_TEMPLATE_PROVIDER`, `TEMPLATE_HUB_API_URL`, `TEMPLATE_HUB_API_KEY` |
| both `CLAUDE.md` files | drop "Remote TemplateHub serving" from Plans |

**Name the test before you start, then run it:**
`npx tsc --noEmit` · `npx vitest run` · `npm run build`, **then open the editor and select a
template with no `TEMPLATE_HUB_*` variables set.** The picker must render and select. Quote the
output. A passing suite is not this test.

---

## TASK 2 — The feature inventory, measured from code

For every feature in Sumaiya: **what it does, whether it actually works, and where it lives.**
Three states only: **works / broken / not implemented.**

**This is the input to a rebuild, so honesty outranks tidiness.** The last CLAUDE.md files
described a `mobile/` directory, 273 templates and `npm run build:android` — **none of which
exist.** A rebuild built on those assumptions rebuilds the wrong product.

Cover at least: CV editor + export (PDF/DOCX/text), templates + picker, ATS checker, tailor-to-job,
the jobs feed, applications tracking, cover letters, assistant/AI, interview prep, import CV,
snap-to-apply, the PDF tools, the native app's screens, guest mode, and payments (state:
`PAYMENTS_ENABLED=false`).

**Report as a table. If something can't be confirmed, mark it unverified — don't guess.**

---

## TASK 3 — The three items you never reported on Phase 1

Your branch has 14 commits and 57 files ahead of main. Three changes were not in your summary:

1. **`/jobs` moved from public to signed-in only** — you then restored it as a read-only public
   page, which is the right call. Confirm it's done and that it renders signed-out.
2. **Two job matchers** — `lib/job-match.ts` and `lib/jobs/job-matcher.ts`. You decided to keep
   both. Say in one line each what distinguishes them, so the next person doesn't merge them by
   accident.
3. **Seven new UI primitives** beside the existing design system. Keep them, but say why they
   aren't in `@sumaiya/design-tokens`.

---

## STANDING RULES

- **Name the test before you start. Run it. Quote the output.** If you can't run it, write
  **unverified** — never a proxy, never a different test's result even when it looks better.
- **Never `git add -A`.** Stage named paths only; uncommitted work from another writer sits in
  that tree.
- **Don't touch `_hdd-data`** — keystore, secrets, env files.
- **Report bad news.** "I couldn't find a way" is not "there is no way".
- **The tailor endpoint** (`POST /api/ai/tailor`) returned a bare 400 with an empty body for every
  payload including the client's exact shape — your `safeParse` fix should now surface the real
  message. **Verify it against the live endpoint and report the actual response.**
