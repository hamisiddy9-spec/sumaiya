# role 1
model: inclusionai/ling-3.0-flash-vl:free (rotated)
role: a product designer who judges legibility and hierarchy on cheap Android screens

VERDICT: Wire the floor selectively — option (B) — because deleting forfeits the legibility fix and a floor applied uniformly to all 47 will compound horizontal overflow on three templates already at usedFraction 1.254.
WHY: 707 sub-floor literals prove the problem is real and widespread enough to justify intervention, not deletion.
The worst sizes (7.5px dates, 8px contact lines) are unambiguously illegible at 0.48 gallery scale and need raising.
Three templates already overflow horizontally, so a blanket raise risks pushing them past any recoverable margin.
ACTION: ACTION: wire clampFontPx into templates whose smallest inline literal is below 9px, starting with the 16 templates measured at 7.5px minimum.
ACTION: on meridian, grid, and mono-cv, raise only the sub-9px literals and measure usedFraction before and after — do not raise anything that isn't below 9px on those three.
ACTION: after wiring, gallery-test every affected template at 0.48 scale on a cheap Android screen to confirm text is legible and nothing new runs off the page.
RISK: raising even a small floor on the three already-overflowing templates pushes usedFraction past ~1.4, at which point content clips or wraps into unreadable blocks and the legibility fix becomes a readability loss.
DOUBT: I cannot see the actual layout margins, column widths, or content density of the three overflowing templates, so I don't know how much vertical reflow a font raise would trigger or whether those templates need a structural change rather than a type-size one.
