# free-panel 20260921-162642
scope=copy style=digest
QUESTION: A first-time user with no account meets this surface. Copy panel run of 2026-09-21.

- apps\native\src\components\account-gate.tsx  [1 nemotron-3-ultra-550b-a55b]  The Swahili copy in this file is minimal and mostly delegated to an external module I cannot see, but the one visible string "Inahitaji akaunti" is grammatically correct yet contextually cold for a gate screen.
    ACTION: Open `lib/guest-invite.ts` and audit every Swahili value in `GUEST_GATE_COPY`, `GUEST_GATE_ACCEPT`, `GUEST_GATE_CONTINUE`, `GUEST_DELIVERABLE_INVITE`.
    ACTION: Change the fallback title to "Unahitaji akaunti" or "Hii inahitaji akaunti" for human address.
    ACTION: Ensure every `guestText()` call receives a Swahili string that uses second-person address ("wewe/uko") not third-person.
- apps\native\src\components\account-gate.tsx  [2 nemotron-3-ultra-550b-a55b]  The only user-facing copy in this file is the fallback title "Account needed / Inahitaji akaunti" — the real gate messages live in an unprovided module, so a full judgment is impossible.
    ACTION: Provide the guest-invite.ts file for a complete copy review
    ACTION: Change the fallback title to "Unahitaji akaunti" (You need an account) or "Akaunti inahitajika" (Account required)
    ACTION: Ensure all imported copy keys are audited for second-language Swahili clarity
- apps\native\src\components\chat\attach-sheet.tsx  [1 nemotron-3-ultra-550b-a55b]  The Swahili copy assumes an existing account with saved CVs and uses loanwords
- apps\native\src\components\chat\attach-sheet.tsx  [2 nemotron-3-ultra-550b-a55b]  The copy assumes the user already has CVs and knows what "targeting a job" means, while the Swahili leans on loanwords and colloquialisms a second-language speaker will pause on.
    ACTION: Replace "One of my CVs" with "Use a saved CV" / "Tumia CV uliyoihifadhi" and gate the row until one exists.
    ACTION: Rename "Target a job" to "Search live jobs" / "Tafuta kazi za sasa" so the action is clear.
    ACTION: Swap "Bandika kiungo" → "Nyonya kiungo", "Pakia faili" → "Chagua faili", "muktadha" → "maelezo" in hints.
