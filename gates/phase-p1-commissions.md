# P1 — محرك القسمة والفريق (the commission engine + the team)

The client's own words define this phase: «عندي مندوبين يشتغلون عندي ومثلا مايعطي
للمندوب راتب إنما يعطي نصف ربح المنتج — مثلا منتج ب عشره يبيعه المندوب ب عشرين
يربح عشره تكون نصف له ونصف لصاحب البيج». Plus: «تكون هناك مرونة في التخصيص وان
يكون هناك تنظيم وتضبيط متكامل».

Locked decisions (PRODUCT-PLAN §7): profit basis per scheme and editable · 50%
default · loss sharing an option · settlement currency present and editable.

- [x] G1: the client's example is a verbatim green test
  CHECK: npx vitest run src/domain/services/commission-calculator.test.ts --reporter=verbose
  EXPECT: cost 10 → sold 20 → 5 rep / 5 owner, asserted literally, FIRST in the file
  EVIDENCE: the first three tests in the file are the client's sentence and both of
  its variants, named in his own terms:
  «T01 مثال العميل الحرفي: تكلفة 10، بيع 20، حصة 50٪ ← 5 للمندوب و5 للتاجر» ✓
  «T02 الشحن على أساس صافي الربح: 8 مقسومة 4/4» ✓
  «T03 الشحن على أساس ما بعد الشراء: 10 مقسومة 5/5 والشحن كله على التاجر» ✓
  60 engine tests + 33 application tests; 125 across the suite.

- [x] G2: no floating-point money anywhere in the split
  CHECK: read commission-calculator.ts; execute the engine on adversarial inputs
  EXPECT: repShare + ownerShare === basis EXACTLY, proven by execution not reasoning
  EVIDENCE: exactly ONE share is computed and the other is a single subtraction, so
  the identity is structural. Ratios are integer basis points; fees are integer
  minor units. Every row of the 60-test table asserts the identity, integrality and
  positive-zero through one shared `run()` helper, and a property test sweeps
  432,432 combinations. An adversarial auditor executed the engine on odd minor
  units, quantity 3 with a one-third ratio, negative profit under both policies, a
  fee larger than the profit and a zero price: reconciliation exact in every case.
  Four defects it found by executing (not reading) are fixed with regression
  guards T41–T44: a non-finite fee producing Infinity/NaN, a resolver that threw on
  storage missing timestamps, -0 reaching four rendered figures, and the ownerOnly
  cliff below.

- [x] G3: the snapshot freezes history
  CHECK: a test that edits a scheme after a sale and asserts the old split unchanged
  EXPECT: green
  EVIDENCE: `describe("CommissionCalculator.snapshot — التجميد")` mutates the live
  scheme object in place after the freeze (repRatio 0.5→0.9, basis flipped) and
  asserts the frozen split is byte-identical; `schemeParams` copies by value and the
  snapshot holds no id-only reference, so it still renders after the scheme is
  archived, the rep is archived and the account currency changes.

- [x] G4: the flexibility the client asked for is real and visible
  CHECK: /reps/schemes — kind, repRatio, profitBasis, lossPolicy, roundingBeneficiary
  EXPECT: the choice is explained by showing numbers, never by prose alone
  EVIDENCE: `light-1440-bench.png`. The bench renders the client's own example live
  (سعر 20 · شراء 10 · توصيل 2 → «هذا لك 4 · هذا له 4») and every switch changes the
  figures beneath it: the PriceColumn's own plates show which costs are inside the
  basis, so choosing «الربح بعد الشراء» visibly lifts the delivery plate out of the
  divided column; both loss policies are printed side by side on an editable losing
  price (ownerOnly 0/-2 · shared -1/-1); and the rounding beneficiary is shown in
  the currency's smallest payable unit with an explicit sentence when the basis
  divides exactly and there is no residual at all.

- [x] G5: resolution is most-specific-wins
  CHECK: a test covering product×rep → product → rep → account default
  EXPECT: green, each level asserted
  EVIDENCE: `describe("CommissionCalculator.resolveScheme — الأخصّ يفوز")` asserts
  each tier beating the next, a decoy binding at a more specific tier for a
  DIFFERENT pair not being matched, a dangling scheme id falling through, an
  archived binding winning nothing, and a sale with no rep resolving to "none"
  rather than a zero-share row against nobody. Live proof: the split preview
  resolved «مناصفة الربح الأولي · المندوب» — a rep-tier override at 40% on an
  afterPurchaseCost basis — instead of the account default.

- [x] G6: balance is always derived, never stored
  CHECK: a test interleaving sale → partial settlement → sale → settlement
  EXPECT: green
  EVIDENCE: `describe("RepBalanceCalculator — الرصيد مشتق دائماً")`, including the
  interleaved sequence and an order-independence check (reversing both lists gives
  byte-identical output). No `balance` field exists on Rep to drift. Live proof on
  /reps: الحصص المجمّدة 3,938,866 − المدفوع 2,700,000 = المستحق 1,238,866, exact.

- [x] G7: the split preview is the ritual of recording a sale
  CHECK: driven in a browser — type into the price and read the preview before/after
  EXPECT: it changes; it is absent when no rep is chosen
  EVIDENCE: driven end to end (`light-sale-norep.png`, `light-sale-split.png`,
  `light-sale-split-changed.png`, `light-sale-split-zero.png`):
  · no rep → no preview at all, not a greyed placeholder (state-bound, §8);
  · rep chosen at 60,000 → «هذا لك 10,160 · هذا له 16,000»;
  · price typed to 140,000 → «هذا لك 49,440 · هذا له 48,000» — PREVIEW_CHANGED: true;
  · price typed to 0 (a giveaway) → «هذا لك -27,300 · هذا له 0»: the true loss, and
    the rep is not paid on it. Before this batch a typed 0 silently became the list
    price and paid a commission on revenue that never arrived.
  · the accessibility tree carries «القسمة: لك … وللمندوب … » as ONE settled
    sentence — not the animation's intermediate frames.

- [x] G8: the team screens carry real readings, in the v4 language
  CHECK: /reps and /reps/view render seeded data through existing objects
  EXPECT: no invented stat, no decorative medal, law-clean
  EVIDENCE: `light-1440.png`, `dark-1440.png`, `light-1440-profile.png`. Not one new
  object was added: the payable is a device with a recessed display and an Odometer
  (its lamp and edge-leak handed transparent when nothing is owed), the month's
  split is one DistributionBar whose parts sum to the basis as an integer identity,
  each rep's standing is a rail measured against the largest MAGNITUDE (so a losing
  window cannot fill every rail), the leader is marked inside the chart per R37
  rather than by a medal, and the profile states revenue ⊃ net profit ⊃ his share as
  nested MagnitudeRings. No per-rep hue anywhere; reps are told apart by the plate
  ramp and texture. A rep with no resolvable rule gets a stated, fixable notice —
  never a fabricated 50/50.

- [x] G9: health suite green
  CHECK: npm run typecheck && npm run lint && npm run test && npm run build
  EVIDENCE: TYPECHECK_OK · LINT_OK (0 warnings) · 125/125 · BUILD_OK, 21 static
  routes including /reps, /reps/view and /reps/schemes. Driven regression sweep over
  every existing route: no console errors, no page errors anywhere.

- [x] G10: proofs shot, compared, refined
  CHECK: design-system/proofs/reps/*.png
  EXPECT: defects found by looking are fixed, not listed
  EVIDENCE: 14 renders (light/dark × 1440, the profile, the bench, the settle sheet
  in both themes, 360 for team and bench, and four dialog states). Five defects my
  own eye caught and fixed:
  (1) the profile rendered ALL 176 operations in one 6,716px page, putting the
      settlement section out of practical reach → newest twelve with «ظهر 12 من 88
      عملية» and expand on request (2,163px);
  (2) an archived rep with real older sales was told «لا مبيعات بعد» because the
      last-sale date came from the window → it is a fact about the rep, like the
      balance, so it comes from all history (she now reads «آخر بيع 18 أيار»);
  (3) «مِسطرة القسمة» in a card header read as an orphan heading → a glyph is what
      makes a ghost label somewhere to go;
  (4) «افتراض البيت» is not Arabic anyone says → «الافتراضي»;
  (5) the settlement amount pre-filled 659881.4 — a fraction of a dinar nobody can
      hand over, in a currency this app prints with zero decimals. Fixed at the
      SOURCE: see the decision below.
  No horizontal overflow at 360 on either screen (measured: 0px).

- [x] G11: slop scan accounted for
  CHECK: node .claude/skills/kill-ai-slop/scripts/scan.mjs src
  EVIDENCE: 116 → 117 over a feature of 22 new files. The single new hit is
  reps-list.tsx group 12 ("flat type hierarchy") on a section label that matches the
  existing `text-sm font-medium text-subtle` convention — the same false positive
  already carried four times. Nothing new suppressed.

## Decisions taken on the client's behalf — both reversible with one word
1. **«على التاجر وحده» now also caps a fee at the basis it is paid from.** The
   uncapped version let a flat fee CREATE a loss: 500 against a basis of 300 paid
   the rep 500 and put the owner at -200, while one fils less paid the rep nothing —
   the owner was 4.99 better off selling worse. Since «ownerOnly» means the rep does
   not carry the downside, a commission may not manufacture one. «مشتركة مع
   المندوب» keeps the uncapped figure, because there the rep genuinely shares it,
   and the new `feeCapped` flag makes the surface say when a fee was cut down.
2. **A share is snapped to the currency's payable unit.** IQD circulates no
   sub-unit, so «2,009,881.4 د.ع.» is unpayable and invisible in an app that prints
   IQD with zero decimals. Shares now snap to whole dinars, toward whoever holds the
   residual, and the settlement default FLOORS rather than rounds up — money
   leaving the till never rounds against the merchant.

## Still owed for P2, named with its screen
- Settlements list `/settlements` and the ledger `/ledger` (the settle sheet exists
  and writes real settlements; the standalone history screens are P2).
- Targets `/targets` — no rep target exists in the domain yet, which is exactly why
  the team screen shows no per-rep target gauge: it would be an invented stat.
- R46 swap-straddling-the-seam belongs to the multi-currency settlement flow, once
  an FX rate exists to reverse a pair against.
