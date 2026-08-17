# D1 (cont.) — Readings know their limits, from the 4th feedback batch

Batch read (recorded as RECIPES R35–R39): dark fintech dashboards carried by one
high-energy accent · a **dashed threshold line ending in a value chip** ·
tick-comb category charts · a **segmented distribution bar with a tick ruler and a
legend** · a dot-matrix magnitude chart · a **pill filter row with exactly one
filled chip** · circular actions with a raised accent primary · **patterned bars
with one solid active bar carrying its value** · outline-vs-filled icon pairs.

Four of these answer questions the merchant actually asked in the brief — «كم
استهدف» (the target line), «وين راح المال» (the distribution bar), «شنو صار
اليوم» (the marked day), and reading a different window — so those four are built
against real data, not mocked.

- [x] G1: the trend chart draws a threshold that means something, with its figure
  CHECK: grep -c "ReferenceLine\|threshold" src/presentation/components/charts/profit-area-chart.tsx
  EXPECT: ≥ 3
  EVIDENCE: 8. A dashed rule at the level, drawn in the PROFIT series' colour
  (the first attempt used neutral ink and read as if it bounded revenue), with a
  chip at the head of the line carrying the level's magnitude. The chip is filled
  `--success` only when the month actually reached the level; short of it, the chip
  is a neutral plate — green never appears for a miss (VISUAL-LAW §12 §13).

- [x] G2: the threshold is the merchant's own target and is editable
  CHECK: grep -rn "monthlyProfitTarget" src/domain src/infrastructure src/presentation | wc -l
  EXPECT: ≥ 5 (type, default, settings field, dashboard read, chart prop)
  EVIDENCE: 5 — `AppSettings.monthlyProfitTarget` (domain), `DEFAULT_SETTINGS`
  (2.5M IQD), an editable field in the new «الهدف» card in Settings, the dashboard
  read, the chart prop. `LocalSettingsRepository.get()` now merges over the
  defaults, so a browser holding an older settings object gains the key instead of
  returning `undefined`. Target 0 = "no target": the line falls back to
  `averageMonthProfit` and the legend says «معدّلك» instead of «الهدف».

- [x] G3: «وين راح المال» is one bar of real parts, not a pie
  CHECK: npm run test — analytics asserts the identity
  EXPECT: distribution segments + net profit === month revenue (±0.01)
  EVIDENCE: `analytics.test.ts` → "takes this month's revenue apart into cost
  lines that sum back to it": monthRevenue 200, monthTotalCost 106, monthProfit 94,
  lines `[purchase, shipping, paymentFees] = [80, 20, 6]` largest-first, and
  `spent + monthProfit === monthRevenue`. A second test pins
  `averageMonthProfit === 20` for the fallback threshold. 27/27 green.

- [x] G4: parts are told apart by texture, hue stays reserved for meaning
  CHECK: grep -c "seg-solid\|seg-dots\|seg-hatch\|seg-grid\|seg-dense" src/app/materials.css
  EXPECT: ≥ 4 patterns, and no per-part hue
  EVIDENCE: 5 textures over ONE metal ramp (`--plate-1..6` with its own
  `--plate-ink-N`, re-lit for dark so the plates read as metal in a dark room
  rather than glowing silver). The only coloured plate is the merchant's keep
  (`--success`); a losing month replaces it with the hatched overrun region in
  `--danger`. Texture order was changed after looking at the render: two diagonal
  hatches sat side by side and read as one striped block with a kink in it.

- [x] G5: the week marks its own reading; the header stops repeating it
  CHECK: grep -c "activeIndex" src/presentation/components/objects/week-bars.tsx
  EXPECT: ≥ 2, and the "اليوم …" duplicate is gone from the hero header
  EVIDENCE: 3. Today's capsule keeps the solid plunger and a firmer housing rim;
  the other six keep their hue but drop to a dot screen. The figure now rides a
  chip above the strip and the header carries only «آخر 7 أيام». The chip hugs the
  strip's outer edge so it cannot overflow the hero, and its **notch is a sibling
  element centred on the capsule** — the first version put the notch on the chip
  itself, which pointed at the neighbouring day.

- [x] G6: the filter row actually filters
  CHECK: grep -c "months\|window" src/presentation/features/dashboard/dashboard-view.tsx
  EXPECT: ≥ 3 — the pill row drives computeDashboard's window
  EVIDENCE: 7 — «3 أشهر / 6 أشهر / سنة» re-aggregates through
  `computeDashboard({ months })`, so the chart, the deltas and the average-based
  threshold all change with it. `Segmented`'s active chip is now a moulded accent
  body (R38): exactly one filled chip per row.

- [x] G7: analytics carries the new readings and is tested
  CHECK: npm run test
  EXPECT: cost-line aggregation asserted against a fixture
  EVIDENCE: `SaleProfit.costByLine` now travels out of the domain calculator,
  `DashboardMetrics` gained `monthTotalCost`, `monthCostLines` (largest first, with
  each line's share) and `averageMonthProfit`. 27/27.

- [x] G8: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EXPECT: all pass
  EVIDENCE: TYPECHECK_OK · LINT_OK (0 warnings — a stale eslint-disable in the
  chart was removed) · 27/27 · BUILD_OK (18 static routes)

- [x] G9: proofs re-shot, then compared against the references and refined
  CHECK: design-system/proofs/dashboard/*.png
  EXPECT: defects found in comparison are fixed, not merely listed
  EVIDENCE: 6 renders — light/dark × 1440/360, plus `light-1440-ltr` (mirror) and
  `light-1440-loss` (a month priced into a loss). Nine defects were caught by
  looking and fixed:
  (1) **The KPI pair was stretched to the hero's height**, leaving two tall cards
  with their content at the top and air below. The row is now 3 columns with the
  pair stacked in the last one, and `Stat` distributes (label on the top edge,
  reading on the floor) so a tall tile looks composed instead of padded.
  (2) **«إجمالي التكاليف» was an all-time total sitting beside a this-month
  revenue** — two periods side by side inviting a false comparison. It is now
  «تكاليف هذا الشهر» with «65% من الإيراد» under it.
  (3) **The ruler's share labels were off by their own width in RTL**:
  `translateX(-50%)` does not centre against a mirrored `inset-inline-start`. They
  now sit in zero-width centring boxes.
  (4) **The ruler ticks were invisible** (a gradient over a near-transparent
  colour); they are solid scribe lines with a lit lip.
  (5) **The overrun was appended as an extra plate**, pushing the bar to 121% so
  its own parts were clipped — now a hatched region laid across the plates revenue
  never covered, with a scribe line at the point it ran out (new law §11b).
  (6) **Six slivers of different texture read as stripes**: lines under 4% are one
  «بنود أخرى» plate that names its contents in the tooltip.
  (7) **The currency mark competed with the figure** on the hero counter — the
  Odometer now groups non-digit runs and strikes the unit at 0.56em/60% opacity,
  the same rule `Money` applies to a fraction.
  (8) **A losing month drew full blue rails**: the share divided two negatives, so
  every product filled its rail. Rails are measured against the largest magnitude
  and turn `--danger` when the value is negative.
  (9) **The margin dial left a floating dot at zero** (a round cap on a
  zero-length arc). At or below zero the dial has no arc at all, and the figure
  itself turns `--danger`.

- [x] G10: slop scan accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src
  EXPECT: every new hit named and justified
  EVIDENCE: 99 → 110, measured against the committed baseline, in exactly two
  groups: **34 "mono for code only" 28→36** (money figures are locked to mono
  tabular so columns align — the house rule, and the same false positive already
  carried 28 times) and **28 "card grid" 8→11** (the legend list and the KPI
  pair's wrapper are grids of readings, not feature cards). Nothing new was
  suppressed; `materials.css` remains the only file with a scoped ignore.

## Read but deliberately NOT adopted
- **Lime-on-black as our palette.** What the references actually teach is the
  *distribution*: a quiet field and ONE colour allowed to point. That is already our
  §6/§13 law, so the lesson is applied to our own accent instead of importing a hue.
  Logged in the VISUAL-LAW rejection ledger rather than skipped silently.
- **Dot-matrix magnitude chart.** Beautiful, but a grid of dots is a worse read than
  a rail for «which product earned most», and we already have the rails. Queued for
  the reps screen where the unit is a person, not an amount.
- **Dock FAB (R39).** The mobile dock already carries five keys at 360px; a raised
  circular primary in the middle would crowd it. Queued with the reps screen.
