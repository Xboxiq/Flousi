# Gate · RITM design system

**CHECK** every colour pair the system relies on clears WCAG AA in both modes.
**EXPECT** 37 measured pairs pass; the two the brand proved impossible (sand as text on
paper, teal as text on paper) stay *below* the threshold as failing controls.
**EVIDENCE** `node design-system/ritm/audit.mjs` → all 37 `✓`, sand `1.98`, teal `2.74`.

**CHECK** no screen loses content off its plane.
**EXPECT** nothing outside 1440×900 (or the device frame) on all thirteen screens.
**EVIDENCE** audit `── screens` block, thirteen `✓`, no `clip` findings.

**CHECK** the type scale is closed: ten steps, floor 10px.
**EXPECT** no rendered interface text at a size that is not a step.
**EVIDENCE** audit `scale` findings empty. Two were caught and fixed: a 30px figure on
d9 and a 20px wordmark in the sidebar.

**CHECK** the 4px lattice holds for every gap and padding.
**EXPECT** no `lattice` finding.
**EVIDENCE** audit `lattice` findings empty across thirteen screens.

**CHECK** the ghost card (border AND shadow on one element) does not exist.
**EXPECT** no `ghost` finding.
**EVIDENCE** audit `ghost` findings empty.

**CHECK** Arabic is never laid out in the Latin face, and every LTR run is isolated.
**EXPECT** no `mono` or `bidi` finding.
**EVIDENCE** ten `bidi` findings on the first run (`.navitem .count`, `.splitbar > span`,
`.grid-demo`, `.hbar .v`, `.chart .axis` …), all fixed by adding `unicode-bidi: isolate`
wherever `direction: ltr` appears. Re-run clean.

**CHECK** every figure on every screen reconciles.
**EXPECT** `5,164,500 − 2,334,920 − 769,200 − 284,580 = 1,775,800`, and rep shares
`331,200 + 298,800 + 139,200 = 769,200`, on d6, d7, p1, p2, p3 and p4.
**EVIDENCE** one source in `shell.js` (`MONTH`); the settlement's paid/outstanding split
`357,200 + 412,000 = 769,200` is derived, not typed.

**CHECK** the brand boards the system builds on are themselves correct.
**EXPECT** eleven artboards fit their plane, no interface text under 10px, and every
printed ratio true for the ground it sits on.
**EVIDENCE** `node design-system/brand/audit.mjs` → eleven `✓`. Twenty-one review
findings fixed in commit `96b782a`, including four contrast ratios measured against the
wrong ground and an AA badge that failed AA.
