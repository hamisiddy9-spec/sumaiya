#!/usr/bin/env bash
# Smoke-test a Sumaiya APK on a USB-connected Android phone.
#
#   scripts/adb-smoke.sh path/to/sumaiya.apk [seconds-to-watch]
#
# Needs: adb on PATH, USB debugging on, the phone authorised for this computer.
# Writes screenshots, an optional screen recording and the filtered log to ./adb-smoke-out/.
# It installs over the top of any existing copy (-r), which keeps app data.
set -euo pipefail

APK="${1:?usage: adb-smoke.sh path/to/sumaiya.apk [seconds]}"
WATCH="${2:-20}"
PKG="pro.sumaiya.app"
OUT="adb-smoke-out"

[ -f "$APK" ] || { echo "APK not found: $APK" >&2; exit 2; }
command -v adb >/dev/null || { echo "adb is not installed" >&2; exit 2; }

mkdir -p "$OUT"

echo "== devices"
adb devices -l
COUNT=$(adb devices | awk 'NR>1 && $2=="device"' | wc -l)
if [ "$COUNT" -ne 1 ]; then
  echo "Expected exactly one authorised device, found $COUNT. Unplug others or set ANDROID_SERIAL." >&2
  exit 2
fi

echo "== device"
adb shell getprop ro.product.model
echo "Android $(adb shell getprop ro.build.version.release) (API $(adb shell getprop ro.build.version.sdk))"

echo "== install"
adb install -r "$APK"

echo "== launch"
adb logcat -c
adb shell am force-stop "$PKG"
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 4
adb exec-out screencap -p > "$OUT/01-launch.png"

echo "== watching ${WATCH}s for crashes"
sleep "$WATCH"
adb exec-out screencap -p > "$OUT/02-after-${WATCH}s.png"

adb logcat -d > "$OUT/full.log"
grep -E "FATAL EXCEPTION|ReactNativeJS.*(Error|ERROR)|AndroidRuntime|Invalid API key|Process: ${PKG}.*died" \
  "$OUT/full.log" > "$OUT/problems.log" || true

echo "== result"
if adb shell pidof "$PKG" >/dev/null 2>&1; then
  echo "app process: running"
else
  echo "app process: NOT running (crashed or exited)"
fi
if [ -s "$OUT/problems.log" ]; then
  echo "problems found ($(wc -l < "$OUT/problems.log") lines), first 20:"
  head -20 "$OUT/problems.log"
  exit 1
fi
echo "no crash or API-key errors in the log"
echo "screenshots and logs are in $OUT/"
