# D1e — The backlog sweep: every queued reference pattern lands on its screen

The client's instruction: use ALL the previously-given visual feedback. This phase
drains the queue that batches 1–5 built up, item by item, each onto the surface it
was queued for. Nothing is "used" until it renders real data on a real screen.

Queue → surface map (from RECIPES + earlier gates):
- R25 slide-to-commit (batch 2) → closing a period — the one irreversible daily act
- R27 sparkline row tile (batch 2) → the products table — each product's trend
- R47 concentric magnitude rings (batch 5) → period summaries
- R29 sheet with an art header (batch 2) → the close-period dialog
- R30 document folder (batch 2) → the reports hub's featured card
- 3D squircle icon on a tinted stage (batch 3) → EmptyState
- (patterned bars + tick ruler → the P2 reports rebuild — the DistributionBar
  already embodies it; deferred WITH ITS SCREEN, not silently)

- [x] G1: products rows carry their trend — a sparkline per product, real months
  CHECK: grep -c "Sparkline" src/presentation/features/products/products-list.tsx && npm run test
  EXPECT: object rendered from computeProductTrends, function unit-tested
  EVIDENCE: 2 — a new «آخر 6 أشهر» column (hidden below `md`, where the row
  count matters more than the trend). `computeProductTrends` seeds every month so
  rows stay comparable, and the unit test pins `[0,0,0,120,0,60]` against a fixture
  including an out-of-window sale. The line is code, not decor: the window's net
  sign picks success/danger, an all-zero history stays subtle, and the zero line is
  drawn ONLY when the series actually crosses it. Never animated — table data.
  28/28 tests.

- [x] G2: closing a period is a slide, not a click
  CHECK: grep -c "SlideToCommit" src/presentation/features/periods/periods-view.tsx
  EXPECT: the dialog's destructive action is the slide; keyboard + reduced-motion paths exist
  EVIDENCE: 2 — `interactive/slide-to-commit.tsx` + `.slide-*`. The thumb follows
  the pointer 1:1; only the snap-back is eased (justified inline against slop 26);
  release before 92% always snaps back — «لا يُغلق شهر بالخطأ» is printed under the
  channel. Keyboard: the thumb is a real slider-role button; Enter walks the fill
  then commits, reduced-motion commits directly. TWO real bugs were caught by
  driving it in the proofs, not by reading the code:
  (1) pointer capture was set on `e.target` (the icon inside the thumb), so a fast
  drag escaped the handlers and froze the thumb mid-track → capture moved to
  `e.currentTarget`;
  (2) committing swapped the store's active period UNDER the open dialog, which
  re-targeted mid-close to «إغلاق سبتمبر؟» with zero figures → the dialog now pins
  a snapshot of the month it is closing, and the landed green state is left visible
  for 900ms before the sheet leaves.

- [x] G3: a period summary shows its magnitudes as nested rings
  CHECK: grep -c "MagnitudeRings" src/presentation/features/periods/periods-view.tsx
  EXPECT: revenue ⊃ costs ⊃ profit as areas (√value radii); loss months stay honest
  EVIDENCE: 3 — the closed-period cards and the close dialog. Bottom-tangent
  nesting (every circle stands on the same floor) keeps each ring's top band
  exposed; radius ∝ √value so AREA carries the value; a negative profit is never
  drawn as an area — the rings fall back to the true containment and the figures
  carry the loss. Documented in the component: rings are legitimate only for
  quantities that genuinely contain one another; a partition takes the
  DistributionBar.

- [x] G4: the close dialog opens with an art header that is DATA
  CHECK: grep -c "art=" src/presentation/features/periods/periods-view.tsx
  EXPECT: the header band holds the month's rings, not a decorative icon on a wash
  EVIDENCE: 1 — `Dialog` gained an `art` slot rendered as a shallow scene band
  (close key floats on it; the title row drops its duplicate X when art is
  present). The art is the month being sealed: its own three rings with the legend.

- [x] G5: the reports hub's featured card is an object, not an icon on a gradient
  CHECK: grep -c "folder" src/app/materials.css
  EXPECT: a folder whose sheets are state-bound (closed-period count), replacing the mesh band
  EVIDENCE: 7 rules — back panel with a cut tab, sheets with print lines at three
  UNEQUAL angles none zero (§4), a front flap with a lit fold and an accent-mixed
  body, and a count chip riding the flap's corner. The sheets and the chip exist
  ONLY when closed periods exist (§8): the seed store honestly shows an empty
  folder with «أغلق أول شهر ليبدأ الأرشيف», and the end-to-end proof shows the
  folder gaining its first sheet + «1» after the slide closes أغسطس. Replaces the
  old `mesh-aurora` band — an icon on a wash, our own anti-pattern.

- [x] G6: empty states stand an object on a stage
  CHECK: grep -c "stage\|squircle" src/presentation/components/ui/empty-state.tsx
  EXPECT: squircle body + contact/cast shadows on a tinted pool — §1/§3 obeyed
  EVIDENCE: 4 — the icon now sits in a moulded `.squircle` body (lit top, shaded
  side rims) standing in a `.stage` (light pool + floor shadow pair). One
  refinement from looking: subjects with a base (the folder) floated at the pool's
  centre — `.stage-standing` grounds them ON the floor shadow.

- [x] G7: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EXPECT: all pass
  EVIDENCE: TYPECHECK_OK · LINT_OK (0 warnings; one react-hooks/refs error during
  development was fixed by replacing the render-written ref with an event-path
  latch) · 28/28 · BUILD_OK.

- [x] G8: proofs shot for every touched screen, compared, refined
  CHECK: design-system/proofs/{products,periods,reports}/*.png
  EXPECT: light/dark × 1440/360 where the screen changed; defects fixed not listed
  EVIDENCE: 19 renders across three new proof folders — products (light/dark 1440,
  light/dark 360), periods (light/dark 1440, 360, dialog light/dark, mid-drag,
  landed, after-close), reports (light/dark 1440, one-filed) — plus the styleguide
  set re-shot with the instrument case grown to 11 bays (Sparkline, MagnitudeRings,
  ReportFolder, SlideToCommit added). The close flow was DRIVEN, not staged: click →
  drag to the end → landed state → the closed card appears with its rings → the
  folder gains its sheet. Defects fixed from looking: the frozen thumb, the
  re-targeting dialog, the floating folder.

- [x] G9: slop scan accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src
  EXPECT: every new hit named
  EVIDENCE: 110 → 116 in two known false-positive families: 19 "max-radius" +3
  (the slide's circular thumb, a legend dot, the folder's print lines — same
  family as the 33 carried), 34 "mono for code" +3 (money figures in the new
  instruments — the house rule). The slide's settle transition was flagged (26)
  and suppressed WITH its justification on the line: position is the change.

## Deferred WITH its screen, not silently
- Patterned bars + tick ruler → the P2 reports rebuild (DistributionBar is the
  instrument; the report pages get scene treatment in P2).
- R46 swap-straddling-the-seam → settlements (P1) · dot-matrix → reps (P1) ·
  selection tiles with corner dots → commission picker (P1).
