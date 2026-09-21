# apps\native\src\components\account-gate.tsx — role 2
model: nvidia/nemotron-3-ultra-550b-a55b:free (rotated from ling-3.0-flash-vl:free)
role: a tired reader on a cheap phone who reads Swahili as a second language

VERDICT: The only user-facing copy in this file is the fallback title "Account needed / Inahitaji akaunti" — the real gate messages live in an unprovided module, so a full judgment is impossible.

WHY:
- "Inahitaji akaunti" reads as "It needs an account" (impersonal, ambiguous subject) rather than "You need an account" or "An account is required"
- All substantive copy (gate titles, bodies, button labels) is imported from `../lib/guest-invite` which is not in the material
- The Swahili strings for accept/continue/later actions are also external

ACTION: Provide the guest-invite.ts file for a complete copy review
ACTION: Change the fallback title to "Unahitaji akaunti" (You need an account) or "Akaunti inahitajika" (Account required)
ACTION: Ensure all imported copy keys are audited for second-language Swahili clarity

RISK: If the external copy already uses natural "Unahitaji" / "Inahitajika" forms, this ruling overstates the problem.

DOUBT: Cannot judge the actual gate messages, deliverable invite, or button labels — they are not in this file.
