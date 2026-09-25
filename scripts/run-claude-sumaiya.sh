#!/usr/bin/env bash
# Generic detached Claude Code launcher for the SUMAIYA repo.
#   usage: run-claude-sumaiya.sh <brief-path> <log-name> [budget]
#
# LOCAL COMMITS ONLY — the owner reviews and releases; nothing here pushes, and no APK
# release happens without him. The chat harness rejects nohup/disown/setsid, so the
# harness's own background runner starts this. A start marker is written first, because an
# empty log must be distinguishable from a run that never began (learned the hard way:
# two runs were lost that way, one of them masked by a bare `ps` count).
set -u
cd /c/Users/hamis/projects/sumaiya || exit 1
BRIEF="${1:?brief path required}"
NAME="${2:?log name required}"
BUDGET="${3:-12}"
LOG="$LOCALAPPDATA/Temp/claude-sumaiya-${NAME}.log"
{
  echo "=== start $(date '+%Y-%m-%d %H:%M:%S') pid=$$ ==="
  echo "=== brief: $BRIEF ($(wc -l < "$BRIEF") lines) branch=$(git rev-parse --abbrev-ref HEAD) ==="
  echo "=== baseline: native tsc $(cd apps/native && npx tsc --noEmit 2>&1 | grep -c 'error TS') · HEAD $(git rev-parse --short HEAD) ==="
} > "$LOG"
/c/Users/hamis/.local/bin/claude -p "$(cat "$BRIEF")" \
  --dangerously-skip-permissions --max-budget-usd "$BUDGET" --max-turns 180 >> "$LOG" 2>&1
echo "=== claude exited rc=$? at $(date '+%H:%M:%S') ===" >> "$LOG"
