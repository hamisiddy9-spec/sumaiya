# C:\Users\hamis\AppData\Local/Temp/panel-a — role 2
model: poolside/laguna-s-2.1:free (rotated from ling-3.0-flash-vl:free)
role: a tired reader on a cheap phone who reads Swahili as a second language

**Rule 1: Guest must finish and download before being asked for an account.**

- **`GUEST_GATE_COPY.import.body.en`**:  
  > "I read photos, PDFs and Word files on my servers so I can rebuild them as a CV. Create a free account to send one over — or build your CV by hand on this phone, no account needed."  
  This sentence says the guest can still build by hand without an account, which is fine, but it implies that sending a file requires an account before they’ve finished or downloaded anything. That breaks the rule — the guest hasn’t even started a CV yet, let alone finished or downloaded one.

- **`GUEST_GATE_COPY.atsVerdict.body.en`**:  
  > "Written advice on your CV is written on my servers, for your account. Create a free account to read it — the score and the checks here are already on this phone."  
  This one is borderline acceptable since the guest has already received a score/check, but the phrasing "for your account" suggests the advice is locked behind an account, not just stored server-side. Still, it doesn’t clearly violate the finish/download rule.

**Rule 2: Premium gates unlock by SHARING, not by paying.**

- **`GUEST_DELIVERABLE_INVITE.body.en`**:  
  > "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks."  
  This copy frames the account as a backup/sync tool, not a sharing mechanism. There’s no mention of unlocking features by inviting friends. If the intent is that sharing unlocks premium features, this copy misses the mark entirely.

- **`GUEST_GATE_COPY.invite.body.en`**:  
  > "The link is tied to your account so I can credit the people you bring. Create a free account to get yours."  
  This is the closest to the sharing rule, but it’s vague. "Credit the people you bring" is unclear — credit how? What do they get? And "get yours" assumes the reader knows what "yours" refers to (an invite link). Needs more clarity.

---

**Swahili wording issues:**

- **`GUEST_GATE_COPY.jobs.body.sw`**:  
  > "Natafuta kazi na kuzilinganisha na wasifu wako kwenye seva zangu."  
  "kwa wasifu wako" should be "na kuzilinganisha na wasifu wako" — the preposition is wrong. "kwa" means "by/with," which doesn’t fit here.

- **`GUEST_GATE_COPY.courses.body.sw`**:  
  > "Kozi, na kiwango ulichofikia, ziko kwenye akaunti yako ili zikufuate kwenye simu yoyote."  
  "zikufuate" is a calque from English "follow you." In Swahili, the correct term would be "zitakazokuwa nawe" or "zinazokufuata," but "zikufuate" is not standard Swahili.

- **`GUEST_KEEP_CARD.body.sw`**:  
  > "CV zako hizi ziko kwenye simu hii pekee."  
  "pekee" here means "only," but in context, it should be "tu" to mean "only on this phone." "Peeka" can also mean "alone," which might confuse the reader.

- **`GUEST_DELIVERABLE_INVITE.body.sw`**:  
  > "...utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."  
  "haitapotea" is correct, but "itaharibika" is overly formal. A simpler word like "ichafukwe" or "ichezwe" would be more natural.

---

**Ambiguities / non-native traps:**

- **`GUEST_GATE_COPY.chat.body.en`**:  
  > "Our conversation runs on my servers, against your account."  
  "Against your account" is a strange prepositional phrase. It should be "in your account" or "linked to your account."

- **`GUEST_GATE_COPY.applications.body.en`**:  
  > "The applications you send, their status and the letters you write all live in your account."  
  "Applications you send" is ambiguous — does it mean job applications or app submissions? In context, it’s job applications, but the word "send" is odd. "Applications you submit" would be clearer.

- **`GUEST_GATE_COPY.atsVerdict.body.en`**:  
  > "...the score and the checks here are already on this phone."  
  "Checks" is vague. Are these spelling checks? Grammar checks? ATS compatibility checks? Needs specificity.

---

**Final thought:** The English copy is mostly functional but leans too heavily on "my servers" and "your account" without explaining *why* that matters to the guest. The Swahili has several grammar errors and unnatural phrasings that would trip up a second-language reader. The sharing-based unlock mechanic is barely present in the copy, which contradicts the stated product rule.
