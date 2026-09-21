# free-panel 20260921-155927

QUESTION: This legibility floor is written, correct, and imported by NOTHING (0 call sites). Facts: 707 inline pixel literals across 47 hand-written templates sit BELOW the floor; the worst templates put dates at 7.5px and contact lines at 8px; at the gallery's 0.48 preview scale 7.5px paints at 3.6px. Three templates (meridian, grid, mono-cv) ALREADY overflow horizontally with usedFraction 1.254. Design judgement found that template 'rift' compresses 7 of its 8 type sizes into a 9.5-12.5px band, so its lower half reads as one grey texture. Options: (A) wire the floor into all 47 templates, (B) wire it only where text is below 9px, (C) delete the unused file. Which, and what is the risk of raising a floor on pages that already overflow?
TASK: design  ROLES: 2

[1 inclusionai/ling-3.0-flash-vl:free (rotated)]  Wire the floor selectively — option (B) — because deleting forfeits the legibility fix and a floor applied uniformly to all 47 will compound horizontal overflow on three templates already at usedFraction 1.254.
[2 inclusionai/ling-3.0-flash-vl:free]  Wire the floor into all 47 templates (option A), because 7.5px text is not typography but noise, and the floor's raise-only semantics make this a safe, idempotent legibility fix — but it must be paired with horizontal-fit remediation on the three already-overflowing templates.

--- actions ---
- ACTION: wire clampFontPx into templates whose smallest inline literal is below 9px, starting with the 16 templates measured at 7.5px minimum.
- on meridian, grid, and mono-cv, raise only the sub-9px literals and measure usedFraction before and after — do not raise anything that isn't below 9px on those three.
- after wiring, gallery-test every affected template at 0.48 scale on a cheap Android screen to confirm text is legible and nothing new runs off the page.
- ACTION: Apply clampFontPx as a final pass over every inline size literal in all 47 templates, raising anything below 10.7px to the floor.
- Fix horizontal overflow on meridian, grid, and mono-cv first or simultaneously — raising type on pages at usedFraction 1.254 will worsen overflow unless content or layout absorbs the increase.
- Audit rift's 9.5–12.5px compressed band separately; a floor at 10.7px will split it but not resolve the underlying type-density problem.
