#!/usr/bin/env bash
# npm run verify — the one-command gate.
#   build + tsc + lint + vitest + evals + cross-browser E2E + Lighthouse + DB
# Paste this output in every PR body. Exit non-zero on any failure.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/e2e/reports/verify.log"
mkdir -p e2e/reports
FAIL=0

run() {
  echo ""
  echo "════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════"
  shift
  "$@" || { echo "❌ $1 FAILED"; FAIL=1; }
}

{
run "1/7  TypeScript (tsc --noEmit)" npx tsc --noEmit
run "2/7  Lint (next lint)" npm run lint
run "3/7  Unit tests (vitest)" npm test
run "4/7  Eval harness (merge gate)" npm run evals
run "5/7  Production build (next build)" npm run build
} 2>&1 | tee -a "$LOG"

# 6/7  Cross-browser E2E against a local production build.
echo ""
echo "════════════════════════════════════════════"
echo "  6/7  Cross-browser E2E (chromium + webkit + firefox)"
echo "════════════════════════════════════════════"
pkill -f "next-server" 2>/dev/null || true
sleep 1
npm start > /tmp/verify-next.log 2>&1 &
SERVER_PID=$!
READY=0
for i in $(seq 1 45); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q 200; then READY=1; break; fi
  sleep 2
done
if [ "$READY" -ne 1 ]; then echo "❌ server did not come up"; FAIL=1; else
  npx playwright test 2>&1 | tee -a "$LOG" || FAIL=1
  run "Lighthouse ratchet" node scripts/lighthouse-audit.cjs
fi
kill $SERVER_PID 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

# 7/7  Local Postgres migration check.
echo ""
echo "════════════════════════════════════════════"
echo "  7/7  DB migrations (local Postgres)"
echo "════════════════════════════════════════════"
bash scripts/verify-db.sh 2>&1 | tee -a "$LOG" || FAIL=1

echo ""
if [ $FAIL -eq 0 ]; then
  echo "✅ VERIFY PASSED — full log: $LOG"
else
  echo "❌ VERIFY FAILED — full log: $LOG"
fi
exit $FAIL
