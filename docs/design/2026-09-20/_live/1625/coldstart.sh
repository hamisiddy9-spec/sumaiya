#!/bin/bash
# Cold-start capture: force-stop, launch, screencap at ~1s/3s/8s with real timestamps.
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"
D="-s 10.229.114.105:5555"
OUT="C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20/_live/1625"
PKG="pro.sumaiya.app"

"$ADB" $D logcat -c
"$ADB" $D shell am force-stop $PKG
sleep 1
"$ADB" $D shell dumpsys activity activities | grep -c "pro.sumaiya.app" | sed 's/^/procs_after_force_stop_hits=/'

T0=$(date +%s.%N)
"$ADB" $D shell am start -W -n $PKG/.MainActivity > /tmp/amstart.txt 2>&1
echo "--- am start -W ---"
cat /tmp/amstart.txt

snap() {
  local label="$1"
  local now=$(date +%s.%N)
  local el=$(echo "$now - $T0" | bc)
  "$ADB" $D exec-out screencap -p > "$OUT/coldstart_${label}s.png"
  local sz=$(stat -c %s "$OUT/coldstart_${label}s.png")
  echo "CAPTURE $label at t=${el}s bytes=$sz"
}

sleep 1; snap 1
sleep 2; snap 3
sleep 5; snap 8
echo "DONE"
