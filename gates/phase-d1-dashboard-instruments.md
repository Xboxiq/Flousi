# D1 (partial) — Dashboard instruments, from the client's 2nd feedback batch

Ten patterns read out of the batch and recorded as RECIPES R21–R30; the five that
serve real data on the most-visited screen were built now, the rest are queued
against the surfaces where they belong.

- [x] G1: halftone hero material exists with a COMPOSED dark variant (not inverted)
  CHECK: grep -c "halftone" src/app/materials.css
  EXPECT: ≥ 4
  EVIDENCE: 6 refs — light is a pale ink wash, dark is a deep ink (its own colour
  mix, not the light card flipped), and the 4px dot screen switches from `overlay`
  to `soft-light` so the dots read on both. Text on the card moved from the static
  `--ink` token to `--fg`, which is what made the dark variant legible.

- [x] G2: the month figure is a counter, the margin is a dial, the week is capsules
  CHECK: grep -c "Odometer\|RingGauge\|WeekBars" src/presentation/features/dashboard/dashboard-view.tsx
  EXPECT: ≥ 6
  EVIDENCE: 6 — `Odometer` (R17) on drums, `RingGauge` (R23, SVG dial with a
  hatched remainder + round-capped arc), `WeekBars` (R22, seven carved capsules
  where an empty day still shows its track). The old CountUp hero and the mesh
  tile are gone.

- [x] G3: the weekly series is real domain data with a runnable check
  CHECK: npm run test 2>&1 | grep -E "Tests .*passed"
  EXPECT: 25 passed
  EVIDENCE: "Tests 25 passed (25)" — new `DayPoint[]` series in
  `application/analytics.ts` (trailing 7 days seeded so empty days keep their
  slot, Arabic weekday marks, latn day keys) with a test asserting length 7, the
  correct day's profit (60), six zero days present, and a mark on every day.
  First run failed on a wrong fixture date — fixed, not deleted.

- [x] G4: capsules stay capsules (taller than wide) at every width
  CHECK: grep -c "max-w-\[20px\]" src/presentation/components/objects/week-bars.tsx
  EXPECT: 1
  EVIDENCE: 1 — the first render showed seven discs because the track filled the
  card width; the track is now capped at 20px against a 68px height.

- [x] G5: floating dock shipped for phones with reserved space
  CHECK: grep -c "dock" src/presentation/components/layout/mobile-dock.tsx; grep -c "pb-28" src/presentation/components/layout/app-shell.tsx
  EXPECT: both ≥ 1
  EVIDENCE: dock ×3, pb-28 ×1 — the active destination sits in its own lifted
  capsule (`.dock-active`), items are ≥44px touch targets, `aria-current` marks
  the page, the fifth key opens the full drawer, and the content column reserves
  the dock's height so the last row is never trapped underneath. Hidden from `lg`.

- [x] G6: hero survives 360px (the first render overflowed)
  CHECK: visual — inspect design-system/proofs/dashboard/*-360.png
  EXPECT: no clipping, dial and counter both fully visible
  EVIDENCE: the 84px dial + the 30px counter overflowed a 360px card; the row now
  wraps (`flex-wrap`, `min-w-0`), the counter steps down to 26px and the dial to
  76px. Re-shot and eye-checked in both themes.

- [x] G7: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EXPECT: all pass
  EVIDENCE: TYPECHECK_OK · LINT_OK · 25/25 · BUILD_OK

- [x] G8: proofs saved and eye-verified (light/dark × 1440/360, RTL)
  CHECK: ls design-system/proofs/dashboard | wc -l
  EXPECT: 4
  EVIDENCE: 4 renders re-shot after each fix.

- [x] G9: slop scan — every new hit accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src 2>&1 | grep groups
  EXPECT: hits accounted for
  EVIDENCE: 92 → 98. The +6 are the new instrument components (gauge drop-shadow,
  capsule gradients, dock elevation) sitting in `src/presentation`, outside the
  suppressed material file — deliberately left visible so future changes to them
  keep showing up. Each obeys the overhead-light law and carries data.

## Queued, not built (recorded against their surface)
R25 slide-to-commit → periods (closing a month) · R26 quick-action circles →
dashboard · R27 sparkline row tile → products/reps · R28 range slider with a usual
band → pricing · R29 sheet with an art header → dialogs · R30 document folder →
reports export.
