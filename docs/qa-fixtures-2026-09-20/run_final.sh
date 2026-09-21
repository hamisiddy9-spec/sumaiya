#!/usr/bin/env bash
# FINAL consolidated live pass. ONE process, strictly sequential — several of
# these PATCH the same CV row, so concurrency silently corrupts attribution.
set -u
cd "$(dirname "$0")"
export NODE_PATH="C:/Users/hamis/projects/sumaiya/node_modules"
LOG="final.log"
: > "$LOG"
run () {
  echo "" >> "$LOG"; echo "==================== $1 ====================" >> "$LOG"
  local t0=$SECONDS
  node "$1" >> "$LOG" 2>&1
  echo "---- $1 exit=$? elapsed=$((SECONDS-t0))s ----" >> "$LOG"
}
run probe_client_uploads.cjs
run probe_server_extra.cjs
run probe_other_outputs.cjs
run probe_photo_limits.cjs
run probe_ai_limit.cjs
run run_controlled.cjs
run probe_paste.cjs
echo "ALL DONE" >> "$LOG"
