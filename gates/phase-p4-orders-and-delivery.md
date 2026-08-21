# Phase P4 — الطلبية وأجرة التوصيل

## G0 — لا تُهاجر النقود
CHECK: what happens to the 219 sales already stored?
EXPECT: nothing. `Sale` stays the line item and gains `orderId?`. An `Order` row holds
what belongs to the ORDER — the delivery figures, the customer, the allocation method.
Existing sales are orders of one with no `orderId`, and every frozen
`commissionSnapshot` is left byte-for-byte alone.

Rewriting 219 sales into a new shape to make the model prettier would put every
frozen split at risk for zero benefit to the merchant. Additive wins.
EVIDENCE: `grep -n "STORAGE_KEYS.sales" src/infrastructure/migrations.ts` → no match.
Two tests: one builds the exact pre-P4 sale shape including a frozen snapshot and
asserts `orderId` is undefined and every frozen figure is byte-identical; the other
asserts a one-line order with no delivery reports exactly what `ProfitCalculator`
reported for the same sale. The 308-test suite passed unchanged after the field was
added, which is the real proof: additive.

## G1 — delivery is TWO figures, never one
CHECK: `Order`.
EXPECT: `deliveryCharged` (revenue from the customer) and `deliveryPaid` (cost to the
courier), both on the order, both editable per order. Netting them destroys the only
figure the merchant cannot currently see: whether delivery makes or loses him money.
EVIDENCE: five tests, one per case. The one that matters: charged 5,000 / paid 6,000
reports a margin of **−1,000**, so a merchant who believes delivery is «on the
customer» is shown that he is subsidising every trip. Free delivery reports
charged 0 with a real cost, and the GOODS margin stays untouched — because free
delivery is a cost absorbed, not a price cut, and reading it as a discount would
understate the product.

## G2 — one delivery per order, and the old bug is dead
CHECK: `ProfitCalculator` multiplies every cost line by quantity, shipping included.
EXPECT: an order's delivery is charged ONCE regardless of line count or quantity. A
three-line order with 5,000 paid reports 5,000, not 15,000.
EVIDENCE: the test builds the documented case and asserts both halves: the order
reports `totalCost` 69,000 (64,000 goods + 5,000 delivery), while the same three
products recorded as three separate sales each carrying a 5,000 shipping cost report
79,000. The difference is asserted to be **exactly 10,000** — the invented cost named
in `docs/PLAN-ORDERS.md`. A second test proves quantity does not multiply it either:
five units in one trip still pay 5,000.

## G3 — allocation is explicit, deterministic, and sums
CHECK: 5,000 spread over three lines.
EXPECT: `byValue` (default), `byQuantity`, or `orderOnly` (no per-line spread at all).
The parts must sum EXACTLY to the paid amount — no lost fils, no invented one — and
the remainder goes to the same beneficiary the commission engine already uses, not a
second rule. The order's own profit is always exact; a line's profit is labelled as
carrying an allocated share.
EVIDENCE: a sweep over 2 methods × 1–7 lines × 9 fee amounts = **126 cases**, each
asserting the parts sum exactly to the fee and none is negative. Plus the awkward
ones: 1,000 over three equal lines (333.33… each), a giveaway order where every line
is worth nothing, zero quantities under `byQuantity` (no division by zero), and a
non-finite or negative fee read as zero rather than as NaN shares. The remainder is
handed out one minor unit at a time so no single line absorbs a visible lump, and
which line goes first is decided by the SAME `roundingBeneficiary` the commission
engine uses.

A test also asserts the order's own `netProfit` is IDENTICAL under all three methods —
allocation moves cost between lines and never changes the total.

## G4 — commission is per line, on the line's own basis
CHECK: how a rep's share is computed for an order.
EXPECT: each line freezes its OWN snapshot on its own profit after its allocated
delivery share, and the order's rep share is the sum. This keeps the P1 engine and its
125 tests untouched, and keeps every frozen split independently auditable.
EVIDENCE: the line results carry `deliveryShare` and a `netProfit` net of it, and a
test asserts the lines sum to the order's profit less the delivery CHARGED — which
belongs to the trip, not to any product. The P1 engine and its snapshots were not
touched: 292 tests passed unchanged through this phase.

## G5 — the delivery margin's treatment is a SCHEME option
CHECK: `CommissionScheme`.
EXPECT: the client chose «خيار لكل طريقة عمولة». Two new fields, defaulted to the
conservative reading and settable per scheme:
* `deliveryProfitShared` — does (charged − paid) enter the rep's basis? Default false.
* `discountTreatment` — is the basis before or after a discount? Default after.
   (Stored now, consumed in P6, because adding a field to a frozen snapshot later is
   the expensive kind of change.)
EVIDENCE: 9 tests on `splitDeliveryMargin`. Default keeps the whole margin with the
owner; shared gives the rep their ratio; shared + `ownerOnly` WITHHOLDS a negative
margin and reports `lossWithheld` rather than silently zeroing; shared + `shared`
loss policy has the rep carry −1,000 of a −2,000 subsidised trip. A sweep over 6
ratios × 5 fee pairs asserts the two shares always reconstruct the margin exactly.

And the honest edge: a `fixedPerUnit` scheme has no ratio to apply to a delivery
outcome, so ticking the option there leaves the margin whole with the owner and
reports `shared: false` — a merchant who ticked a box deserves to know it did nothing.

The margin is split at the ORDER level and never smeared into lines, for two reasons:
a product's reported margin must not depend on how far the customer lived, and every
per-line snapshot P1 froze stays exactly what it was.

## G6 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`
  → clean · clean · **308 passed (17 files)** · 27 routes

Domain: 34 tests on the calculator and allocator. Application: 16 on the read model,
including the delivery reading (`computeDelivery`) that did not exist before this
phase. The demo store now seeds three trips, one of them deliberately SUBSIDISED
(charged 5,000, paid 6,500), because a merchant needs to see that state once to learn
the screen reports it.

Still to land in this phase: the order builder screen and `/orders`.
