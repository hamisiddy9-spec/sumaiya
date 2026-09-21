#!/bin/bash
# Burst capture right after launch (no -W) to look for a splash/white frame before RN mounts.
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"
D="-s 10.229.114.105:5555"
OUT="C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20/_live/1625"
PKG="pro.sumaiya.app"

"$ADB" $D shell input keyevent KEYCODE_HOME >/dev/null 2>&1
"$ADB" $D shell am force-stop $PKG
sleep 2
for i in 0 1 2 3 4; do rm -f "$OUT/burst_$i.png"; done

T0=$(date +%s%3N)
"$ADB" $D shell am start -n $PKG/.MainActivity >/dev/null 2>&1
for i in 0 1 2 3 4; do
  "$ADB" $D exec-out screencap -p > "$OUT/burst_$i.png"
  echo "burst_$i.png captured_at=$(( $(date +%s%3N) - T0 ))ms bytes=$(stat -c %s "$OUT/burst_$i.png")"
done
echo DONE
