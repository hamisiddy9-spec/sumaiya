#!/usr/bin/env bash
# Run every remaining live probe STRICTLY SEQUENTIALLY.
# Nothing here may run concurrently: several probes PATCH the same CV row, and
# concurrent writers silently produce wrong attributions (learned the hard way).
set -u
cd "$(dirname "$0")"
export NODE_PATH="C:/Users/hamis/projects/sumaiya/node_modules"
LOG="probes.log"
: > "$LOG"

run () {
  echo "" | tee -a "$LOG"
  echo "==================== $1 ====================" | tee -a "$LOG"
  local t0=$SECONDS
  node "$1" >> "$LOG" 2>&1
  echo "---- exit=$? elapsed=$((SECONDS-t0))s ----" | tee -a "$LOG"
}

run probe_client_uploads.cjs
run probe_paste.cjs
run probe_other_outputs.cjs
run probe_photo_limits.cjs
run probe_ai_limit.cjs
run probe_server_extra.cjs

echo "" | tee -a "$LOG"
echo "ALL PROBES DONE" | tee -a "$LOG"
