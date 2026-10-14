#!/usr/bin/env bash
# One-shot release build for Sumaiya 1.8.0 — the completed design overhaul.
#
# Hand this to the background runner: a gradle run outlives the terminal tool's
# ceiling, and restarting it collides a second gradlew on the same build/ dir.
#
# Why the bump: 1.7.0 cut the Stitch interface but only part of it landed. This cut
# carries the rest of the designed screens (import, learning hub, invite, premium,
# support, guide, CV editor completeness, jobs with real dates and pay) plus the
# server-side job-data work. The rule that matters: never re-cut a published version
# in place — versionCode must be HIGHER than what's installed (10700) or Android
# refuses the upgrade and the phone keeps the old build.
#
# Preconditions (checked by the caller, not here):
#   - apps/native is COMMITTED and frozen (no other agent editing it)
#   - version bumped in BOTH app.json AND android/app/build.gradle to 1.8.0 / 10800
#     (app-hosts.test.ts enforces that agreement; it caught this exact omission on 1.7.0)
set -o pipefail
cd /c/Users/hamis/projects/sumaiya/apps/native/android || exit 1

export JAVA_HOME="C:\\Users\\hamis\\tools\\jdk-17.0.20.1+1"
export ANDROID_HOME="C:\\Users\\hamis\\tools\\android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
# node is NOT on this shell's PATH by default, and gradle needs it: expo's autolinking
# runs `node` while evaluating settings.gradle, and without it the build dies with
# "A problem occurred starting process 'command 'node''" — which reads like a gradle
# fault and is really a missing PATH entry.
export PATH="/c/Users/hamis/tools/jdk-17.0.20.1+1/bin:/c/Users/hamis/tools/node/node-v22.23.2-win-x64:$ANDROID_HOME/platform-tools:$PATH"

# Preflight: every one of these has failed a build in this project's history. Fail here,
# with the missing tool named, instead of 90 seconds into a gradle run.
for tool in node java keytool; do
  command -v "$tool" >/dev/null 2>&1 || { echo "preflight: $tool is not on PATH"; exit 8; }
done
[ -x "$JAVA_HOME/bin/java" ] || { echo "preflight: no java at $JAVA_HOME"; exit 8; }
[ -d "$ANDROID_HOME" ] || { echo "preflight: no Android SDK at $ANDROID_HOME"; exit 8; }

# The version the APK will actually carry — read from the files, not assumed, so a
# forgotten bump is caught here rather than after 8 minutes of gradle.
CODE=$(grep -oE 'versionCode [0-9]+' app/build.gradle | head -1 | grep -oE '[0-9]+')
NAME=$(grep -oE 'versionName "[^"]+"' app/build.gradle | head -1 | tr -d '"' | cut -d' ' -f2)
echo "   preflight ok — node $(node -v), $(java -version 2>&1 | head -1)"
echo "   cutting $NAME (versionCode $CODE)"
# Must EXCEED the build already on the phone (10800), or Android refuses the
# upgrade and keeps the old one — silently, which is the trap this catches.
if [ "$CODE" -le 10800 ]; then echo "preflight: gradle versionCode is $CODE, must be > 10800"; exit 8; fi

# The release keystore. The signing block refuses to fall back to the debug keystore, so a
# missing/mismatched copy fails the build on purpose — which is what we want: the whole
# point of this build is that it upgrades the installed app in place instead of wiping it.
KEYDIR="/c/Users/hamis/projects/_hdd-data/sumaiya-transfer/keys"
cp "$KEYDIR/sumaiya-release.jks" app/sumaiya-release.keystore || exit 9
cp "$KEYDIR/keystore.properties" . || exit 9

echo "=== 1.8.0 build starting $(date '+%H:%M:%S') ==="
./gradlew assembleRelease --no-daemon --console=plain
RC=$?
echo "=== gradle rc=$RC at $(date '+%H:%M:%S') ==="
ls -l app/build/outputs/apk/release/app-release.apk 2>&1
exit $RC
