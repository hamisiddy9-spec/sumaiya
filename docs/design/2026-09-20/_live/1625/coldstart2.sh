#!/bin/bash
# Clean cold-start capture: collapse shade, force-stop, launch, capture at 1s/3s/8s with ms timestamps.
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"
D="-s 10.229.114.105:5555"
OUT="C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20/_live/1625"
PKG="pro.sumaiya.app"

# dismiss any lingering shade and go home
"$ADB" $D shell cmd statusbar collapse >/dev/null 2>&1
"$ADB" $D shell input keyevent KEYCODE_HOME >/dev/null 2>&1
sleep 1

"$ADB" $D logcat -c
"$ADB" $D shell am force-stop $PKG
sleep 2

for f in 1 3 8; do rm -f "$OUT/coldstart_${f}s.png"; done

T0=$(date +%s%3N)
"$ADB" $D shell am start -W -n $PKG/.MainActivity > /tmp/amstart2.txt 2>&1
echo "--- am start -W ---"; cat /tmp/amstart2.txt

snap() {
  local label="$1"; local target="$2"
  local now=$(date +%s%3N); local el=$(( now - T0 ))
  while [ $el -lt $target ]; do sleep 0.05; now=$(date +%s%3N); el=$(( now - T0 )); done
  "$ADB" $D exec-out screencap -p > "$OUT/coldstart_${label}s.png"
  local after=$(date +%s%3N)
  echo "CAPTURE ${label}s requested_at=${el}ms captured_at=$((after-T0))ms bytes=$(stat -c %s "$OUT/coldstart_${label}s.png")"
}

snap 1 1000
snap 3 3000
snap 8 8000
echo "--- foreground activity ---"
"$ADB" $D shell dumpsys activity activities | grep -E 'topResumedActivity|ResumedActivity' | head -3
echo "DONE"
