#!/bin/bash
# Send the chat turn and capture a frame burst to catch the progress rail.
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"
D="-s 10.229.114.105:5555"
OUT="C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20/_live/1625"
S="$OUT/run"

mkdir -p "$S"
rm -f "$S"/f_*.png
"$ADB" $D logcat -c
T0=$(date +%s%3N)
"$ADB" $D shell input tap 1265 1886      # send arrow
for i in $(seq -w 0 29); do
  "$ADB" $D exec-out screencap -p > "$S/f_$i.png"
  echo "f_$i.png t=$(( $(date +%s%3N) - T0 ))ms bytes=$(stat -c %s "$S/f_$i.png")"
done
echo "=== logcat ReactNativeJS / errors ==="
"$ADB" $D logcat -d 2>/dev/null | grep -i -E 'ReactNativeJS|FATAL|AndroidRuntime' | tail -40
echo DONE
