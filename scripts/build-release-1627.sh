#!/usr/bin/env bash
# One-shot release build for Sumaiya 1.6.27. Hand this to the background runner:
# a gradle run outlives the terminal tool's ~420s ceiling, and restarting it
# collides a second gradlew on the same build/ directory.
#
# Preconditions (checked by the caller, not here):
#   - apps/native is COMMITTED and frozen (no other agent editing it)
#   - version bumped in BOTH app.json and android/app/build.gradle
set -o pipefail
cd /c/Users/hamis/projects/sumaiya/apps/native/android || exit 1

export JAVA_HOME="C:\\Users\\hamis\\tools\\jdk-17.0.20.1+1"
export ANDROID_HOME="C:\\Users\\hamis\\tools\\android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="/c/Users/hamis/tools/jdk-17.0.20.1+1/bin:$ANDROID_HOME/platform-tools:$PATH"

# The release keystore. The signing block refuses to fall back to the debug
# keystore, so a missing/mismatched copy fails the build on purpose.
KEYDIR="/c/Users/hamis/projects/_hdd-data/sumaiya-transfer/keys"
cp "$KEYDIR/sumaiya-release.jks" app/sumaiya-release.keystore || exit 9
cp "$KEYDIR/keystore.properties" . || exit 9

echo "=== build starting $(date '+%H:%M:%S') ==="
./gradlew assembleRelease --no-daemon --console=plain
RC=$?
echo "=== gradle rc=$RC at $(date '+%H:%M:%S') ==="
ls -l app/build/outputs/apk/release/app-release.apk 2>&1
exit $RC
