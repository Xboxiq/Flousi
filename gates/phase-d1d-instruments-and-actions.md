# D1 (cont.) — Instruments, actions and a page that teaches them (5th batch)

Batch read and recorded as RECIPES R40–R48. Built the seven patterns that make the
whole product read better rather than decorating one card; the two that need a
screen we have not built yet are queued **with the screen named**.

- [x] G1: a share is an instrument you can count, not a smooth sweep
  CHECK: grep -c "comb-" src/app/materials.css && ls src/presentation/components/objects/tick-meter.tsx
  EXPECT: ≥ 4 comb rules, component exists, used on a real reading
  EVIDENCE: 10 rules + `objects/tick-meter.tsx`. Narrow ticks capped at 7px (the
  first pass let `flex-1` inflate them into blocks on a wide card — the same cap
  the week capsules needed), filled up to the value, the rest left as carved
  slots, and the tick the value lands on carries the edge detail. Live on the
  «تكاليف هذا الشهر» tile reporting its share of revenue, and turning `--danger`
  once costs pass 100% of it.

- [x] G2: every figure in the product has scale contrast (whole / fraction / unit)
  CHECK: grep -c "Money" src/presentation/components/ui/stat.tsx
  EXPECT: ≥ 2 — the KPI figure renders through the one figure primitive
  EVIDENCE: 3. `Stat` no longer prints its own `font-mono` string; it renders
  through `Money`, so a KPI figure now sets «د.ع.» quieter exactly like the hero
  counter and the tables. One rule, four surfaces — and one fewer hand-rolled
  mono class in the codebase.

- [x] G3: the action row is one labelled primary beside icon-only siblings
  CHECK: grep -c "aria-label\|title=" src/presentation/features/dashboard/quick-actions.tsx
  EXPECT: every icon-only action names itself
  EVIDENCE: `aria-label` + `title` are applied to each of the three siblings
  through the map, and each links somewhere that exists (الحاسبة · التقارير ·
  الفترات). The siblings wear a new **graphite** material — a neutral DARK
  pressable we did not have — and the icon size became a squircle key
  (`h-11 w-[54px] rounded-[18px]`) after comparing: the reference's icon actions
  are keys slightly wider than tall, not circles.

- [x] G4: deltas are chips on their own soft tint, with a caret
  CHECK: ls src/presentation/components/ui/delta.tsx && grep -c "Delta" src/presentation/components/ui/stat.tsx
  EXPECT: the chip is a primitive, used by Stat and the hero
  EVIDENCE: 2. `ui/delta.tsx` — a pill on `--success-soft`/`--danger-soft` with a
  caret (the second, non-colour signal) and the figure in mono; "against what"
  stays outside the chip because it is a sentence, not a value. The hero's own
  delta was a pill INSIDE a pill after the first pass; the wrapper is gone.

- [x] G5: the dock labels only where you are, and carries one raised primary
  CHECK: grep -c "sr-only\|aria-label\|weight={active" src/presentation/components/layout/mobile-dock.tsx
  EXPECT: inactive keys are icon-only but still named for assistive tech
  EVIDENCE: 4. Active = seated capsule + FILLED icon + label; inactive = outline
  icon with the name in `sr-only`. Three things came out of measuring instead of
  guessing: the dock was **366px wide — clipped at 320 and 360** (measured, not
  eyeballed), so the duplicate «المزيد» key was dropped since the topbar already
  opens the drawer → **298px, fits 320px with margins**; the active capsule gained
  a real rim (a lighter patch is not a body); and the active label went from accent
  to ink, because an accent state beside an accent primary made two claims on the
  eye — new law §6a.

- [x] G6: the specimen page teaches the instruments
  CHECK: grep -c "TickMeter\|RingGauge\|DistributionBar\|WeekBars\|Odometer\|PriceColumn" src/presentation/features/styleguide/instruments-study.tsx
  EXPECT: ≥ 5 — each shown with what it measures and the law it obeys
  EVIDENCE: 22 references across 7 bays — العدّاد · المشط · القرص · الأسبوع ·
  شريط التوزيع · عمود السعر · رقاقة التغيّر. Every bay states «يقيس …» and the
  clause it answers to. Seeing them side by side is what caught the PriceColumn
  defect below.

- [x] G7: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EXPECT: all pass
  EVIDENCE: TYPECHECK_OK · LINT_OK (0 warnings) · 27/27 · BUILD_OK

- [x] G8: proofs re-shot, compared against the references, refined
  CHECK: design-system/proofs/{dashboard,styleguide}/*.png
  EXPECT: defects found in comparison are fixed, not listed
  EVIDENCE: dashboard light/dark × 1440/360 + LTR + loss, and a new
  `proofs/styleguide/` set (full page + the instrument case, light and dark).
  Seven defects caught by looking and fixed:
  (1) comb ticks inflated into blocks on wide cards → capped at 7px with 3px gaps;
  (2) icon actions were circles, the reference's are squircle keys → reshaped;
  (3) the hero delta became a pill inside a pill → wrapper removed;
  (4) the dock overflowed 320/360px → measured, trimmed to 298px;
  (5) the active dock key competed with the accent FAB → inked, rim added;
  (6) **a thin cost plate printed its amount with no name** — visible only once the
  PriceColumn stood in the instrument case; short plates now set name + amount on
  one tight 9px line, because a number without its name is a riddle (§8);
  (7) recent sales were a five-column table **clipped on a phone** → phones get
  rows (tile · name · date + quantity · ranked figures), the table returns at `sm`.

- [x] G9: slop scan accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src
  EXPECT: every new hit named
  EVIDENCE: 110 → 110 against the batch-4 commit. Group 34 ("mono for code only")
  went **36 → 35**: routing the KPI figure through `Money` removed a hand-rolled
  mono class. Group 12 ("flat type hierarchy") 4 → 5: the instrument case's
  `<h2>` at `text-lg`, a specimen heading on a documentation page. Nothing new
  suppressed; `materials.css` remains the only scoped ignore.

## Read but deliberately NOT adopted
- **"Spend is neutral ink, only income is green."** True for a consumer wallet, where
  spending is normal. RITM exists to say when a sale LOST money, so a negative net
  profit keeps `--danger`. The lesson we did take: not every negative deserves the
  colour — quantities and revenue stay neutral ink; only profit carries polarity.
- **Pastel per-panel tints** (mint / lavender / coral). The composition lesson (a
  panel may be tinted by its role) is usable; the hues are not ours.
- **Thin display numerals and mono kickers** — already in the rejection ledger.

## Queued from this batch, with the screen named
- **R46 swap straddling the seam** → the settlements screen (P1), where reversing a
  pair is a real action. Faking an exchange today would be an object measuring nothing.
- **R47 concentric magnitude rings** → reports. Legitimate only because revenue ⊃
  costs ⊃ profit genuinely contain one another; for a partition the distribution bar
  is the right instrument, and it already exists.
- **3D object on a tinted stage** → empty states and onboarding, once the asset
  foundry (D1) produces the objects.
