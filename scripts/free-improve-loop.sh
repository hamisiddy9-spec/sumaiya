#!/usr/bin/env bash
# free-improve-loop — the owner's standing order, run unattended.
#
#   "push it more keep doing free style improvements set cron but you dont touch a single
#    thing use free models and claude only"
#
# So: DISCOVERY and JUDGEMENT go to OpenRouter :free models (cost: nothing). HANDS go to
# Claude Code (cost: real money, so it is capped and rate-limited). The assistant that set
# this up edits no product code itself.
#
# What one run does:
#   1. refuses to start if any TRACKED file is dirty — it must never entangle in-flight work
#   2. picks the next target from a rotation (state: .loop/index)
#   3. runs the free panel on it and appends the digest to .loop/QUEUE.md
#   4. every CLAUDE_EVERY_HOURS, and only if .loop/claude-enabled exists, hands the queue's
#      top item to Claude Code with a hard boundary and a budget cap
#
# What it will NEVER do: push, build, deploy, touch the database, `git add -A`, or commit a
# path it was not told to.
set -uo pipefail

REPO="/c/Users/hamis/projects/sumaiya"
cd "$REPO" || exit 1
LOOP="$REPO/docs/panels/.loop"
mkdir -p "$LOOP"
STAMP="$(date '+%Y-%m-%d %H:%M')"
CLAUDE_BIN="/c/Users/hamis/.local/bin/claude"
CLAUDE_EVERY_HOURS=6
CLAUDE_BUDGET_USD=2
CLAUDE_TURNS=40
LOG="$LOOP/run.log"

log() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*" >> "$LOG"; }

# ── 0. branch guard: self-anchoring, so a silent branch switch can never be followed ────
BRANCH_FILE="$LOOP/branch"
BRANCH="$(git branch --show-current)"
if [ -f "$BRANCH_FILE" ]; then
  WANT="$(cat "$BRANCH_FILE" 2>/dev/null)"
  if [ "$BRANCH" != "$WANT" ]; then
    log "SKIP: branch is '$BRANCH' but this loop was pinned to '$WANT' — refusing to follow a switch"
    exit 0
  fi
else
  printf '%s' "$BRANCH" > "$BRANCH_FILE"
  log "pinned to branch '$BRANCH' (delete $BRANCH_FILE to re-pin)"
fi

# ── 1. guard: never run over someone else's in-flight work ──────────────────────────────
DIRTY_TRACKED="$(git status --porcelain | grep -v '^??' | wc -l)"
if [ "$DIRTY_TRACKED" -gt 0 ]; then
  log "SKIP: $DIRTY_TRACKED tracked file(s) modified — refusing to entangle"
  exit 0
fi

# ── 2. the rotation. One line per target: <label>|<scope>|<payload>|<question> ───────────
TARGETS=(
"guest-gate|copy|apps/native/src/lib/guest-invite.ts|A first-time user with no account meets these strings. Owner rule: a guest must be able to FINISH and DOWNLOAD before being asked for an account. Where does the copy break that, and does the same button read the same way every time? Quote exact strings."
"premium-invite|copy|apps/native/src/components/premium-sheet.tsx|Premium here is earned by INVITING FRIENDS, not by paying - payments are not open. Does any string promise something that does not exist, and does Premium read as a reward or as a toll gate?"
"fit-engine|product|apps/web/components/templates/engine/fit.tsx|The page is A4. The engine will not shrink below scale 0.92 and the page clips with overflow:hidden, so long content is silently lost at export. What is the smallest correct change that stops a user exporting a cut-off CV, WITHOUT changing the A4 page size?"
"onboarding|copy|apps/native/src/screens/onboarding-screen.tsx|This is the welcome sequence a brand-new user sees on a cheap Android phone. Does it explain what Sumaiya does, in plain Swahili, within the first two screens? Quote the weakest string and give a better one."
"templates-legibility|design|apps/web/components/templates/engine/typography.ts|This legibility floor exists and is imported by nothing. 707 inline sizes across 47 templates sit below it; the smallest renders at 7.7px and shows at 3.6px on a phone. Should it be applied, narrowed, or deleted - and in what order relative to fixing overflow?"
"home-screen|product|apps/native/src/screens/app/home-screen.tsx|This is what a returning user sees first. Does the first screen lead with the thing that earns a returning visit, or with secondary material? What should move, and what should be removed?"
"web-landing|copy|apps/web/app/[locale]/(marketing)/page.tsx|A Tanzanian job-seeker lands here on a cheap phone. Does the page promise the outcome (a finished application for one advertised job) or describe the mechanism? Quote the weakest line."
"error-copy|copy|apps/native/src/lib/auth-errors.ts|These strings appear when something has gone wrong and the user is already frustrated. Is each one actionable in Swahili, does it avoid blaming the user, and does it say what to do next?"
)

IDX_FILE="$LOOP/index"
IDX=0; [ -f "$IDX_FILE" ] && IDX=$(cat "$IDX_FILE" 2>/dev/null || echo 0)
case "$IDX" in ''|*[!0-9]*) IDX=0 ;; esac
ENTRY="${TARGETS[$((IDX % ${#TARGETS[@]}))]}"
echo $(( (IDX + 1) % ${#TARGETS[@]} )) > "$IDX_FILE"

LABEL="${ENTRY%%|*}"; REST="${ENTRY#*|}"
SCOPE="${REST%%|*}"; REST="${REST#*|}"
PAYLOAD="${REST%%|*}"; QUESTION="${REST#*|}"

if [ ! -e "$PAYLOAD" ]; then
  log "SKIP $LABEL: payload $PAYLOAD not found"
  exit 0
fi
log "RUN $LABEL (scope=$SCOPE)"

# ── 3. the free panel ───────────────────────────────────────────────────────────────────
OUT="$(python scripts/free-panel.py --payload "$PAYLOAD" --scope "$SCOPE" --style digest \
        --concurrency 2 --roles 2 --ask "$QUESTION" 2>&1)"
CODE=$?
BODY="$(printf '%s' "$OUT" | tail -n +3)"

{
  printf '\n## %s — %s (scope %s, exit %s)\n' "$STAMP" "$LABEL" "$SCOPE" "$CODE"
  printf 'payload: `%s`\n\n' "$PAYLOAD"
  printf '%s\n' "$BODY"
  printf '\n<details><summary>question</summary>\n\n%s\n\n</details>\n' "$QUESTION"
} >> "$LOOP/QUEUE.md"

log "panel done exit=$CODE"

# what the scheduler delivers: label, outcome, and the panel's own verdict lines
printf 'free-improve-loop — %s | %s (scope %s) | panel exit=%s
' "$STAMP" "$LABEL" "$SCOPE" "$CODE"
printf '%s
' "$BODY" | grep -E "^ +\[" | head -3
printf 'queue: %s/QUEUE.md
' "$LOOP"

# ── 4. hands, rate-limited and capped ───────────────────────────────────────────────────
if [ ! -f "$LOOP/claude-enabled" ]; then
  log "claude disabled (no .loop/claude-enabled) — discovery only"
  printf 'claude: disabled (create %s/claude-enabled to allow hands work)
' "$LOOP"
  exit 0
fi
LAST=0; [ -f "$LOOP/last-claude" ] && LAST=$(cat "$LOOP/last-claude" 2>/dev/null || echo 0)
NOW=$(date +%s)
if [ $(( (NOW - LAST) / 3600 )) -lt "$CLAUDE_EVERY_HOURS" ]; then
  log "claude rate-limited (last run $(( (NOW - LAST) / 60 ))m ago)"
  printf 'claude: rate-limited (every %sh, budget $%s/run)
' "$CLAUDE_EVERY_HOURS" "$CLAUDE_BUDGET_USD"
  exit 0
fi

TASK="$LOOP/claude-task.md"
{
  printf '# Unattended improvement task — %s\n\n' "$LABEL"
  printf 'A free-model panel was asked this, about `%s`:\n\n> %s\n\n' "$PAYLOAD" "$QUESTION"
  printf 'The panel said:\n\n%s\n\n' "$BODY"
  cat <<'BOUNDARY'
## Your boundary — read this before anything else

You are running unattended on the owner's repo. Abide exactly:

1. **Verify before you change.** Treat every line above as an OPINION from a free model, not a
   finding. Open the code. If a claim is wrong, say so and stop — do not "fix" something that
   is not broken.
2. **Change as little as possible.** Text/copy strings, or a constant that is provably wrong.
   No refactors, no new dependencies, no new files except a test.
3. **Never** push, never build an APK, never deploy, never run a migration, never touch a
   database. The owner pays for builds and deploys; that decision is his alone.
4. **Commit named paths only.** Never `git add -A`, never a bare `git commit`. Other agents
   share this clone.
5. Run `npx tsc --noEmit` in the app you touched plus that app's own test runner
   (**web = vitest, native = jest** — they are different and running the wrong one reports
   bogus failures). Report the real numbers.
6. If Swahili wording is involved: do not rewrite grammar on your own authority. Flag it in
   your summary for the owner, who is a native speaker.
7. Finish with a short report: what you verified, what you changed, what you refused, the
   exact test output, and the commit sha.
BOUNDARY
} > "$TASK"

log "claude start (budget \$$CLAUDE_BUDGET_USD, turns $CLAUDE_TURNS)"
timeout 3600 "$CLAUDE_BIN" -p "$(cat "$TASK")" \
  --dangerously-skip-permissions \
  --max-budget-usd "$CLAUDE_BUDGET_USD" \
  --max-turns "$CLAUDE_TURNS" >> "$LOOP/claude.log" 2>&1
log "claude exit=$?"
printf 'claude: ran (see %s/claude.log)
' "$LOOP"
echo "$NOW" > "$LOOP/last-claude"

# record what it left behind, so a human can review without reading the whole log
{
  printf '\n### Claude run %s\n\n' "$STAMP"
  printf 'commits since: '; git log --oneline -3 | tr '\n' ' '; printf '\n'
  printf 'dirty tracked: %s\n' "$(git status --porcelain | grep -v '^??' | wc -l)"
} >> "$LOOP/QUEUE.md"
exit 0
