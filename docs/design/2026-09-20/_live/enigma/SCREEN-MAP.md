# Enigma screen map — for navigating by measurement, not by guessing

**Device:** Hisense Enigma (HLTE272E) · Android 15 / SDK 35 · Android Go · 2.7 GB RAM
**Serial:** `CTKS340F25102000240`
**Geometry:** `720x1560` physical · density **320 overridden to 272**

Measured by `uiautomator dump` on the installed **1.6.25**, then **dumped twice and compared**
(identical output, same md5 — a stale dump is the classic trap on this tool, so a single
dump is not evidence). Coordinates are **physical pixels**, which is what
`adb shell input tap X Y` takes.

> A previous run on the Pixel (1080x2400) burnt its budget tapping four guessed coordinates
> and hit the composer, the wrong screen and twice nothing. Every number below is measured.
> **Re-read the bounds if the layout changes** — this map is a starting point, not a constant.

---

## The bottom tab bar — the primary navigation

Five evenly-spaced targets, each **140x97 px**, centred on **y = 1429**.

| Tab | What it is | Tap |
|---|---|---|
| **Nyumbani** | Home | `input tap 80 1429` |
| **CV zako** | Your CVs | `input tap 220 1429` |
| **Sumaiya** | the chat | `input tap 360 1429` |
| **Pakia** | upload / scan | `input tap 500 1429` |
| **Wasifu** | Profile | `input tap 640 1429` |

Even spacing means you can navigate blind to any tab with a single tap — this is the
cheapest, most reliable way to move around the app in a QA run.

## The CV editor form (the screen this was captured on)

| Control | Label | Tap |
|---|---|---|
| Profile photo | `Ongeza picha ya wasifu` | `116 16` |
| Full name field | `Jina kamili` | `361 134` |
| Job title field | `Kichwa cha kazi` | `361 275` |
| Email field | `Barua pepe` | `361 416` |
| Phone field | `Simu` | `361 559` |
| Location field | `Eneo` | `361 700` |
| Save | `Hifadhi` | `191 796` |
| Download PDF | `Pakua PDF` | `529 796` |

Fields are 546x75 px with the label 25 px above them — so a field's tap point is the label's
`y + 77`.

---

## How to drive this device

```bash
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"
S=CTKS340F25102000240

# wake only when about to read (screen hygiene: the owner's panel is dimmed to 12/255
# and NOT pinned on, deliberately — do not set stayon true)
"$ADB" -s $S shell input keyevent 224
"$ADB" -s $S shell input keyevent 82          # dismiss keyguard if up

"$ADB" -s $S shell input tap 360 1429         # e.g. open the chat
"$ADB" -s $S shell uiautomator dump /sdcard/ui.xml && "$ADB" -s $S pull /sdcard/ui.xml .

"$ADB" -s $S shell input keyevent 26          # let it sleep again
```

**Restore the owner's display settings when the session ends** — originals are saved at
`%LOCALAPPDATA%\Temp\enigma-display-original.txt` (`screen_brightness=206`,
`screen_brightness_mode=0`, `screen_off_timeout=60000`).

## Machine-readable copy

`enigma-screen-map.json` in this directory holds every node with text or a tap target:
bounds, centre, size, label, and whether it is clickable — so a run can re-derive a target
instead of trusting this table after a layout change.

---

## Measured additions — 1.6.25 QA pass, 2026-09-21 09:46–10:05

Appended by the low-end QA run. All values are real `bounds="[l,t][r,b]"` from a pulled
`uiautomator dump` **corroborated against a screencap** — see the dump-vs-screen warning below.

### Confirmed: the tab bar table above is correct
Every tab tap I made at **y = 1429** worked. The clickable nodes measure
`[10,1381][150,1478]`, `[150,1381][290,1478]`, `[290,1381][430,1478]`, `[430,1381][570,1478]`,
`[570,1381][710,1478]` → centres **80 / 220 / 360 / 500 / 640, y 1429**. Labels sit at y 1447–1468.

### The CV editor — Save/Download row moves with scroll
The map's `Hifadhi 191 796` / `Pakua PDF 529 796` are correct **only while the editor is at the top**.
Once scrolled, the row is at the bottom of the scroll view instead. Measured at the scrolled position:
| Control | Bounds | Tap |
|---|---|---|
| `Hifadhi` button | `[34,1196][348,1274]` | `191 1235` |
| `Pakua PDF` button | `[372,1196][686,1274]` | `529 1235` |
Field rows in that same scrolled capture: `[88,96][634,172]`, `[88,238][634,313]`, `[88,379][634,454]`, `[88,521][634,597]`, `[88,663][634,738]` — each 546x75, label 25 px above.

### The sign-in screen (`Ingia Sumaiya`)
| Control | Text bounds | Tap |
|---|---|---|
| `Endelea na Google` button | text `[295,870][471,899]`; button `[34,543][686,632]` when the email field is showing | `360 880` (text centre) — **but tapping y 993 opened the picker instead**, so use the button's own box |
| `Tumia barua pepe badala yake` | `[230,980][490,1007]` | `360 993` |
| `Barua pepe` field (email step) | `[90,912][660,987]` | `360 950` |
| `Nitumie msimbo` button | keyboard **down** `[34,1020][686,1111]` | `360 1066` |
| `Nitumie msimbo` label | keyboard **down** `[277,1051][443,1081]` | — |
| `Badili barua pepe` (back to email) | `[71,401][227,429]` | `149 415` |
| Footer `Ni mara ya kwanza? …` | `[34,1439][686,1464]` | — |
**Keyboard-up trap:** with the soft keyboard open the `Nitumie msimbo` button is clamped at the window
edge — it reports `[34,814][686,791]` (bottom above top) and is **not tappable**. Dismiss the keyboard
(`input keyevent 4`) before tapping it, or use the IME's Go key.

### The offline PDF export — Android SAF picker (system UI, not the app)
| Control | Bounds | Tap |
|---|---|---|
| Folder row `Documents` (root list) | label `[447,798][532,825]` for `Download`; `Documents` at `[121,798][218,825]` | `164 811` |
| `USE THIS FOLDER` | `[24,1396][696,1478]` | `360 1437` |
| `ALLOW` (grant dialog) | `[538,838][647,920]` | `592 879` |
| `CANCEL` (grant dialog) | `[415,838][524,920]` | `469 879` |
**`Download` and the volume root are refused** (`USE THIS FOLDER` disabled); `Documents` is accepted.

### The export confirmation (in-app)
| Control | Bounds | Tap |
|---|---|---|
| `Sambaza sasa` | `[150,843][287,872]` | `218 857` |
| `Sawa` | `[477,842][528,871]` | `502 857` |

### ⚠ Two traps this run hit
1. **A dump is not the screen.** After a failed sign-in send, `uiautomator dump` contained **no error
   text at all**, while the screencap showed a full red banner `Email address "…" is invalid`.
   Always corroborate a "nothing is shown" conclusion with a screencap.
2. **The keyguard re-arms constantly** (`stayon=false`, `screen_off_timeout=60000`). A tap issued into a
   sleeping/locked panel lands on the lockscreen. Wake (`224`) → confirm with a dump → **then** tap.
   After `stayon` was turned off, `input keyevent 82` and `wm dismiss-keyguard` stopped clearing the
   keyguard; a swipe-up did not either. Budget for this.

