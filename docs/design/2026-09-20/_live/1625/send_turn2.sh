#!/bin/bash
# Second chat turn (job handoff probe) with a frame burst.
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"
D="-s 10.229.114.105:5555"
OUT="C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20/_live/1625"
S="$OUT/run2"
mkdir -p "$S"; rm -f "$S"/g_*.png
"$ADB" $D logcat -c
T0=$(date +%s%3N)
"$ADB" $D shell input tap 1270 1952      # send arrow
for i in $(seq -w 0 21); do
  "$ADB" $D exec-out screencap -p > "$S/g_$i.png"
  echo "g_$i.png t=$(( $(date +%s%3N) - T0 ))ms bytes=$(stat -c %s "$S/g_$i.png")"
done
echo "=== logcat app errors ==="
"$ADB" $D logcat -d 2>/dev/null | grep -i -E 'ReactNativeJS|FATAL|AndroidRuntime|unavailable|intelligence' | tail -20
echo DONE
