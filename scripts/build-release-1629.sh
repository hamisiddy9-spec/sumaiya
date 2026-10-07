#!/usr/bin/env bash
# One-shot release build for Sumaiya 1.6.29. Hand this to the background runner: a gradle
# run outlives the terminal tool's ceiling, and restarting it collides a second gradlew on
# the same build/ directory.
#
# 1.6.29 is 1.6.28 plus one fix, cut as a NEW number because 1.6.28 was published and
# announced (the rule: never re-cut a published version in place):
#   - c86c362  an overlay clears only furniture that is on screen. On a fresh install with
#              an update pending, the download pill sat ON the onboarding language choices
#              — the first screen a new user sees — and, being pressable at zIndex 999,
#              swallowed the tap meant for the last language. The pill's bottom offset and
#              the language block both derived from the same 52dp tab-bar marker, but
#              onboarding renders OUTSIDE the tab navigator: no bar exists there to clear.
#              The store now tracks whether a bar is MOUNTED (published from a layout
#              effect, so it is known before first paint) as well as its measured height,
#              and clearanceFor() returns the safe inset alone when nothing is mounted.
#
# Preconditions (checked by the caller, not here):
#   - apps/native is COMMITTED and frozen (no other agent editing it)
#   - version bumped in BOTH app.json and android/app/build.gradle to 1.6.29 / 10629
set -o pipefail
cd /c/Users/hamis/projects/sumaiya/apps/native/android || exit 1

export JAVA_HOME="C:\\Users\\hamis\\tools\\jdk-17.0.20.1+1"
export ANDROID_HOME="C:\\Users\\hamis\\tools\\android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="/c/Users/hamis/tools/jdk-17.0.20.1+1/bin:$ANDROID_HOME/platform-tools:$PATH"

# The release keystore. The signing block refuses to fall back to the debug keystore, so a
# missing/mismatched copy fails the build on purpose.
KEYDIR="/c/Users/hamis/projects/_hdd-data/sumaiya-transfer/keys"
cp "$KEYDIR/sumaiya-release.jks" app/sumaiya-release.keystore || exit 9
cp "$KEYDIR/keystore.properties" . || exit 9

echo "=== 1.6.29 build starting $(date '+%H:%M:%S') ==="
./gradlew assembleRelease --no-daemon --console=plain
RC=$?
echo "=== gradle rc=$RC at $(date '+%H:%M:%S') ==="
ls -l app/build/outputs/apk/release/app-release.apk 2>&1
exit $RC
