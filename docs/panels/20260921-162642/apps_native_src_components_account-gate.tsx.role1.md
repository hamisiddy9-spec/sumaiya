# apps\native\src\components\account-gate.tsx — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

VERDICT: The Swahili copy in this file is minimal and mostly delegated to an external module I cannot see, but the one visible string "Inahitaji akaunti" is grammatically correct yet contextually cold for a gate screen.

WHY:
- "Inahitaji akaunti" (It needs an account) uses impersonal subject "it" — a screen does not need an account; the *user* does. A Tanzanian user expects "Unahitaji akaunti" (You need an account) or "Hii inahitaji akaunti" (This requires an account).
- All persuasive copy (titles, bodies, button labels) lives in `../lib/guest-invite` which is not provided — I cannot judge the actual guest-facing Swahili.
- The comment cites "Jenga CV yako kwanza" as the continue label; that phrasing is strong, active, and correctly Swahili.

ACTION: Open `lib/guest-invite.ts` and audit every Swahili value in `GUEST_GATE_COPY`, `GUEST_GATE_ACCEPT`, `GUEST_GATE_CONTINUE`, `GUEST_DELIVERABLE_INVITE`.
ACTION: Change the fallback title to "Unahitaji akaunti" or "Hii inahitaji akaunti" for human address.
ACTION: Ensure every `guestText()` call receives a Swahili string that uses second-person address ("wewe/uko") not third-person.

RISK: If the external module already uses proper second-person Swahili, my ruling on the fallback is a minor inconsistency, not a systemic flaw.

DOUBT: Cannot judge 90% of the guest-facing Swahili because it resides in `lib/guest-invite.ts`, which was not supplied.
