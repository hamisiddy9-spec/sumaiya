# apps\native\src\components\chat\attach-sheet.tsx — role 2
model: nvidia/nemotron-3-ultra-550b-a55b:free (rotated from ling-3.0-flash-vl:free)
role: a tired reader on a cheap phone who reads Swahili as a second language

VERDICT: The copy assumes the user already has CVs and knows what "targeting a job" means, while the Swahili leans on loanwords and colloquialisms a second-language speaker will pause on.

WHY:
- "Moja ya CV zako" / "One of my CVs" lies to a first-time user with no account — they have zero CVs.
- "Lenga kwenye kazi" / "Target a job" is vague; "lenga" means "aim at" but gives no clue what happens next (search? filter? paste?).
- "Bandika kiungo", "Pakia faili", "muktadha" are loanwords or formal register ("muktadha" = academic "context") that a tired L2 reader will reread.

ACTION: Replace "One of my CVs" with "Use a saved CV" / "Tumia CV uliyoihifadhi" and gate the row until one exists.
ACTION: Rename "Target a job" to "Search live jobs" / "Tafuta kazi za sasa" so the action is clear.
ACTION: Swap "Bandika kiungo" → "Nyonya kiungo", "Pakia faili" → "Chagua faili", "muktadha" → "maelezo" in hints.

RISK: If the product actually lets brand-new users create a CV inline, "One of my CVs" might be intentional onboarding — but the code shows no such flow.

DOUBT: Cannot see whether "jobTarget" opens a search screen or a paste-field; the copy judgment hinges on that behavior.
