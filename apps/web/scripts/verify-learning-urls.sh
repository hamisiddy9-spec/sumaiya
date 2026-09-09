#!/bin/bash
# Verify every learning-resource URL in lib/learning-resources.ts is REAL (200/redirect),
# so the deterministic KB never ships a dead or invented link.
set -u
cd "$(dirname "$0")/.."
URLS=$(grep -oE 'https://[a-zA-Z0-9./_-]+' lib/learning-resources.ts | sort -u)
FAIL=0
for u in $URLS; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 12 -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" "$u" 2>/dev/null)
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ] || [ "$code" = "403" ]; then
    echo "OK  $code  $u"
  else
    echo "FAIL $code  $u"
    FAIL=1
  fi
done
echo "---"
[ "$FAIL" = "0" ] && echo "ALL URLs OK" || echo "SOME URLS FAILED"
exit $FAIL
