#!/usr/bin/env bash
# Detached Claude Code launcher for the Sumaiya cross-brand brief.
# LOCAL commits only — the maintainer reviews and deploys.
set -u
cd /c/Users/hamis/projects/sumaiya || exit 1
BRIEF="docs/FIX-BRIEF-CROSS-BRAND-LEAKS.md"
LOG="$LOCALAPPDATA/Temp/claude-cross-brand.log"
{
  echo "=== start $(date '+%Y-%m-%d %H:%M:%S') pid=$$ ==="
  echo "=== brief: $BRIEF ($(wc -l < "$BRIEF") lines) branch=$(git rev-parse --abbrev-ref HEAD) ==="
} > "$LOG"
/c/Users/hamis/.local/bin/claude -p "$(cat "$BRIEF")" \
  --dangerously-skip-permissions --max-budget-usd 10 --max-turns 150 >> "$LOG" 2>&1
echo "=== exited rc=$? at $(date '+%H:%M:%S') ===" >> "$LOG"
