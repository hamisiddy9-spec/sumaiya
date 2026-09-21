#!/usr/bin/env bash
# Sequential Claude research passes for the rebrand/positioning brief.
# NEVER run these in parallel: parallel invocations race the OAuth credential lock
# and die (recorded in docs/BRAND-AND-MESSAGE-2026-09-20.md §Method).
set -u
cd /c/Users/hamis/projects/sumaiya/docs/research/rebrand-2026-09-20 || exit 1
CLAUDE=C:/Users/hamis/.local/bin/claude
LOG=RUNLOG.txt
: > "$LOG"

run_pass () {
  local name="$1" prompt="$2" out="$3"
  echo "START $name $(date +%H:%M:%S)" >> "$LOG"
  "$CLAUDE" --dangerously-skip-permissions -p "$(cat "$prompt")" > "$out" 2> "$name.err"
  local code=$?
  echo "PASS $name exit=$code bytes=$(wc -c < "$out") $(date +%H:%M:%S)" >> "$LOG"
}

run_pass 1-category prompt-1-category-strategist.md pass-1-category-strategist.out.md
run_pass 2-jobseeker prompt-2-jobseeker-mwanza.md pass-2-jobseeker-mwanza.out.md
run_pass 3-hiring-manager prompt-3-hiring-manager.md pass-3-hiring-manager.out.md
run_pass 4-competitor-growth prompt-4-competitor-growth.md pass-4-competitor-growth.out.md
run_pass 5-voice-critic prompt-5-voice-critic.md pass-5-voice-critic.out.md

echo "ALLDONE $(date +%H:%M:%S)" >> "$LOG"
echo "ALLDONE"
