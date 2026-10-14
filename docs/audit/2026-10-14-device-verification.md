# DEVICE VERIFICATION — 1.8.1 on hardware, 2026-10-14

**Device:** Pixel 8 Pro (`3B091FDJG000GQ`), wireless adb.
**Build under test:** `pro.sumaiya.app` **1.8.1 / versionCode 10801**, installed from the
release APK over the air, verified on-device (`dumpsys package`).
**Method:** driven as a user with real data — every screen opened, `uiautomator` bounds read
for objective geometry, screenshots captured. Nothing here is inferred from source.

---

## 1. Defects the walk found, and what was done

Four real defects. All four were invisible to `tsc` and to 1684 passing tests, which is the
whole point of walking the build.

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | **Filter chips inflated into ~330px blobs** on any list whose results were empty | On-device `bounds`: chips measured ~330px tall | `flexGrow: 0` + `alignItems` at **all 10** horizontal rows in the app, not just the 7 the first sweep found |
| 2 | **A job saved from an advert was invisible everywhere** | Save → "Saved", but no surface listed it | "Applications" chip + `app` doc kind; "All" lists each document once |
| 3 | **Two tabs lit at once** — "My CVs" stayed ember under an active "Import" | Screenshot | Label colour taken off the animated spring and read from `focused`, like the icons |
| 4 | **Home and Profile disagreed on who the user is** — a photo on Home, initials "HI" on Profile | Both captured | One shared `identityFor()` in `lib/identity.ts`, used by both |

Also found by walking, and fixed: Support's device card printed **"OS android 37"** directly
above **"Device: Pixel 8 Pro · Android 17"** — the same fact, twice, the uglier one first.

## 2. Verified working on the device

Each entry was checked against the *live* app, and the law checks were read out of the app's
own view tree rather than the source.

| Screen | Verified |
|---|---|
| Home | Dark theme, honest *"No score yet"* state, quick actions |
| Jobs feed | Live Tanzanian listings; chips + search render; **no score badges** |
| Advert | Facts block with source + *"Added"*, honest match state |
| Save | Writes through, and the entry appears in the library (defect 2, fixed) |
| Import | *"Needs a connection to read"*, *"Photos and files are sent to be read; they are not kept."* |
| My CVs | Chips are 112px ≈ 44dp pills; saved application under *Recent documents*, *"Saved · Today"* |
| Profile | Renders the **same portrait** Home shows; account rows, theme, language, honest notification state |
| Invite (B3) | Real 7-day grant; code shown **verbatim lowercase**; *"Opens the share list — pick WhatsApp."*; stats card correctly hidden while `joined` is 0 |
| Premium (G1) | **No price anywhere** — checked against the live view tree. Claims only what Premium actually gates (Executive/Compact designs, 3 deep guides, written review); *"Paying isn't open yet."* |
| Support (F5) | Real diagnostics (`Sumaiya 1.8.1 (Build 10801)`), report path wired to the real endpoint |
| Memory (F4) | Toggle off → *"I am not keeping anything new"*; empty list says *"Nothing yet"* |
| Privacy (F3) | "Stays on your phone" card is correctly conditional — signed-in users also get *"…also synced to your account."* |
| CV check (B9) | Empty state says *"No CV to check yet… the check reads a real CV"* — **no invented score** |

**Honesty check against live production data.** The deployed API carries no `posted_at`, so
the advert screen prints *"Added"* and shows no salary rather than inventing either. The
degradation is real and was observed on the device, not simulated.

## 3. Open item, needs a decision (not a code fix)

**`support@templatehub.pro` is the support address inside the Sumaiya app** — on the Profile
row and on the Support screen. A Sumaiya user who writes to it lands in another brand's
mailbox. It needs a Sumaiya address or an honest removal; inventing a domain or a mailbox
would be worse than the leak. Also still present: `templatehub.pro` in `vercel.json`,
`.env.example`, `twa-manifest.json`, the `/pro/` marketing page, and the native gallery label
"TemplateHub Premium".

## 4. NOT verified, and why

- **Learning Hub, Guide, CV editor** — reachable (Learning Hub via the Sumaiya chat's skill
  action; Guide from Home tips; the editor from Home and the CV library), but the walk stopped
  when the handset left the network. `adb devices` empty, mdns empty, ping 100% loss.
- **Sign-in / first-run / signed-out paths** — these require signing the device out of the
  founder's own account. Not done deliberately: disturbing a live session to screenshot a
  form is not worth it. They remain unverified on hardware, and this note is the honest
  record of that rather than a claim of coverage.

## 5. The next cut

**1.8.2 / versionCode 10802** carries three fixes that are correct on the branch but absent
from the installed APK, because they were committed *after* 1.8.1's JS bundle was sealed:
the first-run name rule (a short token is junk only when it carries a digit — "Ali" is a real
name, and an earlier rule discarded names like it), three further pinned chip rows, and the
Support row above. Install blocked on the handset returning to the network.

## 6. Production state at the time of writing

- **GitHub:** `hamisiddy9-spec/sumaiya` is **public**, and `main` was fast-forwarded to the
  current work. Both the branch and `main` were pushed; no history was rewritten.
- **Live web (`sumaiya.app`): UP but running the OLD build.** `GET /api/jobs` returns
  `applicationDeadline, applyUrl, category, company, createdAt, description, employmentType,
  featured, id, location, sourceName, status, title` — no `postedAt`, no salary fields.
- **Migration `0024_job_posted_salary.sql` is NOT applied.** The new ingest writes those
  columns, so **the migration must run before the web deploy** — columns first, code second,
  otherwise every ingest insert fails on an undefined column.
