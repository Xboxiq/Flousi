# Gate · RITM design system

**CHECK** every colour pair the system relies on clears WCAG AA in both modes.
**EXPECT** 43 measured pairs pass; the three the identity itself proves impossible
(sand as text on paper, sand as text on bone, the board's teal as body text on coal)
stay *below* the threshold as failing controls.
**EVIDENCE** `node design-system/ritm/audit.mjs` → all 43 `✓`; sand `2.08` and `1.82`,
teal `3.89`.

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


## Re-gated after the client's original artwork arrived

**CHECK** the mark in every artefact is the real one.
**EXPECT** no stepped-capsule mark survives anywhere.
**EVIDENCE** 36 occurrences replaced across `shell.js`, `d3-rhythm.html` and six brand
boards; `assets/original/reconstruction-proof.png` overlays the redrawn mark on the
source; `grep` for the old rect set returns nothing.

**CHECK** every token is the board's own value, or is marked as an extension.
**EXPECT** the six printed colours used unchanged; every derived value commented.
**EVIDENCE** `tokens.css` §1 — six marked "the board prints", the rest under "derived";
paper and the whole light set carry the sentence "THE LIGHT GROUND IS AN EXTENSION".

**CHECK** the boards that describe the mark's geometry describe the real one.
**EXPECT** the construction table, the rule, the clear space and the pattern all match.
**EVIDENCE** `Mark.dc.html` rebuilt on the 24 × 39 grid with the measured table;
`Rhythm.dc.html` rebuilt on vertical bars; `Wordmark.dc.html` clear space redefined as
3X where X is the bar width and drawn at exactly 3X.

**CHECK** the grid law follows the new mark rather than the old one.
**EXPECT** spans 3 / 6 / 9 / 12, and the vertical law stated.
**EVIDENCE** `system.css` §2 and `tokens.css` §4 rewritten; every `.span-2/-4/-8` in the
screens migrated; audit clean on all thirteen.
