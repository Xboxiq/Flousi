# D1 (cont.) — Moulded controls + reading refinements, from the 3rd feedback batch

Batch read: black-surface/white-tile pickers · selection tiles with corner dot
clusters (selected = filled accent) · a glass window with rails whose % badge rides
the fill's leading edge · matched light/dark card pairs with a 3D squircle icon on a
tinted stage · a chart whose active point is a big coloured disc with the value inside
and a dashed drop line to the axis · a green grainy card with thin large numerals and
a dot matrix · neumorphic pill docks · **extruded pill buttons with a lighter rim and
a drop shadow** · balances whose decimals are set quieter · patterned (dot/hatch) bar
fills · a tick-ruler distribution bar · concentric-circle magnitude charts · an
outline/filled icon pair language.

Implemented the four that touch every screen, then compared against the references
and refined three times.

- [x] G1: buttons are moulded bodies, not filled rectangles
  CHECK: grep -c "molded" src/presentation/components/ui/button.tsx src/app/materials.css | tr '\n' ' '
  EXPECT: both ≥ 3
  EVIDENCE: button.tsx ×4, materials.css ×14. Each pressable now carries a lighter
  RIM (`0 0 0 1.5px` in a whiter mix of its own hue), a lit top edge inside it, a
  shaded lower lip, a hard `0 3px 0` base and a body-sized soft shadow. Pressing
  translates the body 2px down and swaps the stack for an inset — the finger feels
  travel instead of a scale tween. Ghost/outline stay flat by design: they are text
  with a hit area, not objects.

- [x] G2: figures set their fraction and currency mark one step quieter
  CHECK: grep -c "opacity-55\|opacity-60" src/presentation/components/ui/money.tsx
  EXPECT: ≥ 2
  EVIDENCE: 2 — `Money` now splits "25,000.75 د.ع." into whole / fraction / mark and
  dims the last two, so the eye lands on the figure that matters. Falls back to the
  raw child when the string does not parse, and keeps the LTR `<bdi>` island.

- [x] G3: rails report their own value — the badge rides the fill's leading edge
  CHECK: grep -c "rail-badge" src/app/materials.css src/presentation/features/dashboard/dashboard-view.tsx | tr '\n' ' '
  EXPECT: both ≥ 1
  EVIDENCE: top-product rails are now 24px tracks with the hatched remainder behind
  and a white share badge sitting at the fill's edge, positioned with
  `insetInlineStart` so it rides correctly in both directions.

- [x] G4: the chart marks a reading — active disc with a collar + dashed drop line
  CHECK: grep -c "activeDot" src/presentation/components/charts/profit-area-chart.tsx
  EXPECT: 2
  EVIDENCE: 2 (one per series, each in its own semantic colour) with a
  `strokeDasharray` cursor dropping to the axis, and a tooltip on the elevation
  token. Still mount-only animation — the chart law is untouched.

- [x] G5: refinements found by comparing the render to the references
  CHECK: visual — design-system/proofs/dashboard/*.png
  EXPECT: defects fixed, not merely noted
  EVIDENCE: three real defects caught in comparison and fixed:
  (1) **Y-axis labels were drawn over the plot** — the ticks carried the full
  currency string and overflowed their 56px gutter; they now carry magnitude only
  ("6م", "4.5م") in a 46px gutter, since the card title already says these are money.
  (2) **The ring dial's hatched remainder was invisible** — pitch tightened to 4px
  and the stroke moved to `--subtle` at full opacity, and the dial grew to 92px so
  the figure and its caption stop colliding.
  (3) **Ink text failed contrast on the saturated hero** — the first attempt pushed
  saturation up and put dark ink over mid-blue; the colour is now thrown to the
  corners with a pale reading zone in the middle, keeping the material vivid while
  the label, the counter and the delta chip all sit on light ground.

- [x] G6: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EXPECT: all pass
  EVIDENCE: TYPECHECK_OK · LINT_OK · 25/25 · BUILD_OK

- [x] G7: proofs re-shot for both surfaces after every refinement
  CHECK: ls design-system/proofs/dashboard design-system/proofs/d0-calculator | wc -l
  EXPECT: ≥ 11
  EVIDENCE: 4 dashboard + 7 calculator renders, re-shot three times through the
  refine loop.

- [x] G8: slop scan accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src 2>&1 | grep groups
  EXPECT: hits accounted for
  EVIDENCE: 98 → 99 (+1: the moulded button variants in `button.tsx`). Left visible
  outside the suppressed material file on purpose.

## Read but deliberately NOT adopted
- **Mono uppercase letterspaced kickers** over headings (ref: "WORKFLOW CREATOR").
  Our own law bans eyebrows and mono-as-voice; logged in the VISUAL-LAW rejection
  ledger rather than silently skipped.
- **Thin display numerals** on money (ref: the green bank card). Beautiful, but our
  figures are locked to tabular mono for scanability; the thin treatment is allowed
  only on marketing surfaces.

## Queued from this batch
Selection tiles with corner dot clusters → commission-scheme picker (P1) · patterned
bar fills + tick-ruler distribution → reports · concentric magnitude circles →
period summary · 3D squircle icon on a tinted stage → onboarding/empty states.
