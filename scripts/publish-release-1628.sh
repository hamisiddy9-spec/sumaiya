#!/usr/bin/env bash
# Publish Sumaiya 1.6.28 to the public releases repo.
#
# The order is not negotiable (apps/web/lib/app-release.ts states it): the APK asset
# must EXIST and be reachable before anything advertises the version. Advertise first
# and every installed app is told to update to a file that is not there yet.
#
# Two traps this script is written around, both documented in apps/web/lib/app-update.ts:
#   1. versionFromTag only accepts /^mobile-v(\d+\.\d+\.\d+)$/ — so the tag must be mobile-v1.6.28.
#   2. `gh release create file#label` names the asset after the FILE, not the label. A release
#      once went out as app-release.apk and was skipped, silently pinning everyone to the
#      previous build. So the APK is copied to a file literally named sumaiya.apk before upload.
# The update modal's notes come from the release BODY, parsed as lines starting "sw:" / "en:":
# anything after the "en:" line becomes part of the English notes, so nothing follows it.
set -euo pipefail

REPO_HOME="$(cd "$(dirname "$0")/.." && pwd)"
APK="$REPO_HOME/apps/native/android/app/build/outputs/apk/release/app-release.apk"
GH="$HOME/AppData/Local/copilot-desktop-gh-2.98.0/gh.exe"
REL_REPO="hamisiddy9-spec/sumaiya-releases"
TAG="mobile-v1.6.28"
STAGE_DIR="C:/Users/hamis/AppData/Local/Temp/sumaiya-release"
mkdir -p "$STAGE_DIR"
STAGE="$STAGE_DIR/sumaiya.apk"

[ -f "$APK" ] || { echo "  ✗ no APK at $APK"; exit 1; }
cp "$APK" "$STAGE"
SZ=$(stat -c %s "$STAGE")
echo "  staged sumaiya.apk  $SZ bytes  sha256 $(sha256sum "$STAGE" | cut -c1-32)…"

SW="CV yako sasa inatoka kama A4 — ukubwa ambao waajiri wanatarajia — na kurasa zinaonekana vizuri, maandishi madogo yanasomeka. Orodha ya miundo inaonyesha kila muundo jinsi unavyoonekana kweli, na unaweza kuhifadhi kazi bila kuingia, ukaweka CV na barua ulizoandaa kwa kazi hiyo, na kufuatilia kutoka imehifadhiwa hadi ofa."
EN="Your CV now comes out A4 — the size employers here expect — and pages render sharp, with the small print readable. The gallery shows each design's real look, and you can save a job without signing in, keep the CV and letter you tailored for it, and track it from saved to offer."

echo "  creating $TAG …"
"$GH" release create "$TAG" "$STAGE" --repo "$REL_REPO" --latest \
  --title "Sumaiya v1.6.28 — A4 documents, sharper pages, real previews, and maombi without an account" \
  --notes "sw: $SW
en: $EN"

echo
echo "  ── verify: does 'latest' now serve the new asset?"
curl -sIL -m 40 -o /dev/null -w "     /downloads/sumaiya.apk -> %{http_code}  %{size_download} bytes  (content-length: %{size_upload} up)\n" \
  "https://github.com/$REL_REPO/releases/latest/download/sumaiya.apk" || true
CL=$(curl -sIL -m 40 "https://github.com/$REL_REPO/releases/latest/download/sumaiya.apk" | grep -i "^content-length" | tail -1 | tr -d '\r' | awk '{print $2}')
echo "     latest asset content-length: ${CL:-<none>}   (local staged: $SZ)"
[ "${CL:-0}" = "$SZ" ] && echo "     ✓ asset live and matching" || echo "     ⚠️  mismatch — do NOT bump the manifest yet"
