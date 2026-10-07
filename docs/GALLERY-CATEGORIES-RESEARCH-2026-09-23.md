# The template gallery: categories, screen, and language
*2026-09-23. Prompted by the owner: "the categories names in templates gallery need working on — research the design for the
whole screen and language i dont understand". Two free models consulted; one is rejected below with its reason.*

---

## 1. What is actually wrong (measured, not guessed)

`src/components/cv/template-gallery.tsx:40-44` — the five chips are:

```ts
{ key: "sidebar",  en: "Sidebar",  sw: "Pembeni" }   // pembeni = "beside"  — a LAYOUT
{ key: "header",   en: "Header",   sw: "Kichwa" }    // kichwa  = "head"    — a LAYOUT
{ key: "minimal",  en: "Minimal",  sw: "Sahili" }    // simpler            — a STYLE
{ key: "creative", en: "Creative", sw: "Ubunifu" }   // creative           — a STYLE
{ key: "classic",  en: "Classic",  sw: "Rasmi" }     // formal             — a STYLE
```

Those five keys are **the render engine's internal layout names**. They are implementation structure shown to
users as if it were a taxonomy, and two of them are their layout words translated literally — *"beside"* and
*"head"* tell a job-seeker nothing about whether a design helps them get a job.

And there is no hidden taxonomy to reveal. `src/data/templates.json`, all 267 entries, identical:

```
category = "general"     career_stage = "mid"     industry = "tech"
```

So "categories" here were never real: they are the engine's five layouts, and the only chip that describes
anything a user can see is the style group.

## 2. The axis question — and the industry trap

**Free model 1 (nemotron-3-ultra) proposed an industry axis**: *Biashara na Mauzo, Ufundi na Teknolojia,
Ofisi na Utumishi, Elimu na Ualimu, Afya na Huduma, Ujasiriamali.* Coherent and attractive — the user does
think in terms of their job.

**Rejected, on the data above.** The 267 designs are generic: any of them suits any profession, and the
`industry` field is the literal placeholder `"tech"` for every one of them. Labelling them into Afya/Elimu/
Ufundi would **fabricate a design↔profession claim** — the same class of untrue claim we have spent this
week deleting from the landing pages. If an industry axis is wanted later, it needs real curation of 267
designs: a project, not a rename.

**Free model 2 (nemotron-3-super), asked the honest version of the question, chose the visual-style axis**
precisely because an industry axis would mean *"selecting data that does not exist"*. Two independent models,
one right answer once the data was in the prompt.

## 3. The recommendation

### 3a. Categories: replace the five with four that describe what the user can SEE

| Swahili | English | What it means, in the user's words | the designs it holds |
|---|---|---|---|
| **Rahisi** | Simple | Plain, no colour, lots of white space | the current "minimal" set |
| **Rasmi** | Formal | Traditional and conservative — for a bank, a school, a government office | the current "classic" set |
| **Ubunifu** | Creative | Bold, unusual, stands out | the current "creative" set |
| **Ya rangi** | Colourful | A coloured band or side panel | the layout designs, renamed by what you see |

**Delete "Pembeni" and "Kichwa" entirely.** They are the two the owner could not understand, and they are
the two that describe the engine instead of the document. A layout is not a category; it is the thing the
design does to look like that, and the user is choosing with their eyes.

Free/Premium stays as it is (a lock on the tile) — it is the one distinction that needs no explanation.

### 3b. The screen: stop selling a catalogue to someone who wants one good CV

1. **Cut the count.** "Miundo 224" is a catalogue number, and the visitor's question is not "how many". (It is
   also inconsistent with the data: the picker computes 224 from the array while `templates.json` holds 267.)
2. **Lead with the matched designs, not the grid.** The sheet already has the right idea — "Kwa kazi yako ·
   Mauzo na rejareja". It should be the *first* thing under the search box, and it should be the biggest thing
   on the screen: 2–3 designs I can pick now. For a fresh install with no profession known yet, that section
   says what it is instead of showing a generic pair.
3. **Then the four style chips, then the grid.**
4. **Collapse the tail.** 224 tiles in one infinite scroll is a decision cost and a data cost on a metered
   phone. Show the recommended row plus the free set, and let search (and a "see more") reach the rest.
5. **Keep the single tap-for-a-real-preview behaviour** — that is already working, and it is what makes the
   choice safe.

### 3c. The one-line lesson to carry into any future screen
Name the category after what the person **sees in their hand**, never after what the engine **did** to make
it. "Pembeni" was the engine's word leaking into the UI; "Rasmi" is the candidate's word.

## 4. If only two things ship
1. **Delete the two layout chips** and rename the set to the four seeing-words above (a copy change, no new
   data needed).
2. **Cut "Miundo 224"** and let the matched-for-your-job row lead the screen.

## 5. Not established
- Whether the four style chips actually partition the 267 designs cleanly — that needs reading each design's
  engine layout, which I did not map per design.
- Whether the "recommended for your job" row can populate for a **guest** with no profession set: I did not
  trace where its input comes from on a fresh install.
- Whether an industry axis is worth curating later. That is a content decision for the owner, not a rename.
