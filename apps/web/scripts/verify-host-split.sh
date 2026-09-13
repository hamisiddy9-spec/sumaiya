#!/usr/bin/env bash
# Host-split verification against a RUNNING server. Asserts, does not eyeball.
# Usage: bash /tmp/verify-hostsplit.sh [base-url]
B="${1:-http://127.0.0.1:3112}"
pass=0; fail=0

# get <host> <path> -> sets CODE, LOC, TITLE
get() {
  CODE=$(curl -s -o /tmp/v.html -D /tmp/v.h -w '%{http_code}' -H "Host: $1" "$B$2")
  LOC=$(grep -i '^location:' /tmp/v.h | tr -d '\r' | sed 's/^[Ll]ocation: //')
  TITLE=$(python3 -c "
import re
h=open('/tmp/v.html',encoding='utf-8',errors='ignore').read()
m=re.search(r'<title[^>]*>(.*?)</title>',h,re.S)
print(m.group(1).strip() if m else '')
")
}

check() { # desc, actual, expected-substring-or-equals
  if [[ "$2" == *"$3"* ]]; then printf '  PASS  %s\n' "$1"; pass=$((pass+1));
  else printf '  FAIL  %s\n        expected to contain: %s\n        got: %s\n' "$1" "$3" "$2"; fail=$((fail+1)); fi
}

echo "== the front door =="
get templatehub.pro /            ; check "templatehub.pro/ is 200"            "$CODE" "200"
                                   check "templatehub.pro/ is TemplateHub"    "$TITLE" "TemplateHub Pro"
get www.templatehub.pro /        ; check "www.templatehub.pro/ is TemplateHub" "$TITLE" "TemplateHub Pro"
get sumaiya.app /                ; check "sumaiya.app/ is still Sumaiya"     "$TITLE" "Sumaiya"
get localhost:3112 /             ; check "an unknown host gets the full app" "$TITLE" "Sumaiya"
get templatehub.pro /pro         ; check "/pro does not loop"                "$CODE" "200"
                                   check "/pro is the same landing"          "$TITLE" "TemplateHub Pro"

echo "== the assistant lives on sumaiya.app =="
for p in /assistant /assistant/history /studio /voice /dashboard /snap /applications; do
  get templatehub.pro "$p"; check "templatehub.pro$p -> 302"        "$CODE" "302"
                            check "templatehub.pro$p -> sumaiya.app" "$LOC" "https://sumaiya.app$p"
  # On sumaiya.app the invariant is NOT "200" — several of these are auth-gated
  # (307 -> /sign-in?callbackUrl=...) or have no such sub-route (404) and did so
  # long before this change. What must hold is that the Sumaiya host never
  # cross-host-redirects to itself: the host split only ever fires for
  # templatehub.pro.
  get sumaiya.app "$p"
  if [[ "$CODE" == "302" && "$LOC" == "https://sumaiya.app$p" ]]; then
    printf '  FAIL  sumaiya.app%s cross-host redirects to itself\n' "$p"; fail=$((fail+1));
  else printf '  PASS  sumaiya.app%s not self-redirected (%s%s)\n' "$p" "$CODE" "${LOC:+ -> $LOC}"; pass=$((pass+1)); fi
done

echo "== the shared half stays on both =="
for p in /templates /templates/rift-cl /tools /snap-to-apply /terms /sign-in; do
  get templatehub.pro "$p"; check "templatehub.pro$p serves" "$CODE" "200"
done

echo "== the shipped APK's surface never moves =="
get templatehub.pro /api/health                ; check "/api/health 200"       "$CODE" "200"
get templatehub.pro /api/app/update            ; check "/api/app/update 200"   "$CODE" "200"
get templatehub.pro /.well-known/assetlinks.json; check "assetlinks 200"       "$CODE" "200"
get templatehub.pro /downloads/sumaiya.apk     ; check "apk still resolves"    "$CODE" "308"
                                                 check "apk -> github release"  "$LOC" "github.com/hamisiddy9-spec/sumaiya-releases"

echo "== nothing 500s =="
get templatehub.pro /nope-xyz-123 ; check "templatehub.pro unknown -> 404" "$CODE" "404"
get sumaiya.app /nope-xyz-123     ; check "sumaiya.app unknown -> 404"     "$CODE" "404"

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
