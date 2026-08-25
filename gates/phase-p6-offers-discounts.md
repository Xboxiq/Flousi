# Phase P6 — العروض والخصومات

From the client's brief: «واحيانا تصير عروض». Four shapes from the research plan
(PLAN-ORDERS §5): a percentage on the order, a fixed amount on the order, a discount on
ONE line, and free delivery. The commission question was put to the client and answered:
«خيار لكل طريقة عمولة» — so `discountTreatment`, stored on the scheme since P4, is
consumed here.

## G1 — a discount reduces what was collected, exactly
CHECK: the order's arithmetic under each discount shape.
EXPECT: `listRevenue − discountTotal = goodsRevenue`, an exact identity in every
currency's payable unit — parts summing to the whole is the same law the delivery
allocation already obeys (P4/G3). `collected` is what the customer actually handed
over, so every downstream figure (net profit, margin, cash, the rep's basis) moves
with the discount without any screen doing its own subtraction.
EVIDENCE: tests per shape, plus a sweep asserting the identity holds across amounts
that do not divide evenly.

## G2 — free delivery is a cost absorbed, not a price cut
CHECK: a trip with `deliveryCharged = 0` and `deliveryPaid > 0`.
EXPECT: the goods keep their price and their margin; the delivery margin is negative
by exactly the courier's fee. Reading it as a discount on the goods would show the
product weaker than it is — the product did nothing wrong; the merchant absorbed a
trip. The screen names it «توصيل مجاني», distinct from a subsidised trip where the
merchant charged and lost.
EVIDENCE: a test asserting goods profit is unchanged and delivery margin = −paid;
the reading on /orders.

## G3 — the commission treatment is the scheme's, frozen at record time
CHECK: the same discounted order under two schemes.
EXPECT: `afterDiscount` (the default) shrinks the rep's basis by the line's share of
the discount — the rep shares the cost of the discount, which is what stops a rep
discounting freely. `beforeDiscount` leaves the basis whole — the merchant carries
the offer alone. The choice is per scheme (the client's answer), and it is FROZEN
into the snapshot like every other term, so a later change of heart cannot rewrite
what a rep already earned.
EVIDENCE: tests splitting one discounted sale under both treatments; a frozen
snapshot whose figures differ accordingly.

## G4 — a discount can never exceed what it discounts
CHECK: hostile inputs.
EXPECT: a fixed discount larger than the goods is capped at the goods; a percentage
is clamped to 0..100; a discount on a line that does not exist discounts nothing.
Negative revenue invented by an offer is not a state the store can hold.
EVIDENCE: tests at and past every boundary.

## G5 — order lines freeze their splits like every other sale
CHECK: the «8 بلا نظام قسمة» badge on the seeded team screen.
EXPECT: it names a real P4 gap — the order builder records its lines WITHOUT freezing
commission snapshots, so a trip's sales resolve live forever: they create no debt in
the balance, and a later scheme edit rewrites their history. P6 must close this,
because `discountTreatment` only exists at freeze time. The builder freezes each
line's split at record time exactly as the single-sale dialog does — including the
line's discount share under the scheme's treatment.
EVIDENCE: a recorded order whose lines carry snapshots; the badge gone from the
seeded team screen; the trips' shares now inside the balance.

## G6 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`, the
overflow sweep, and the cost-leak sweep under a rep session.

## Closing evidence

`npm run typecheck && npm run lint && npm test && npm run build` → clean. **412 tests**
in 19 files, up from 384.

### G1 — a discount reduces what was collected, exactly
`allocateDiscount` spreads the offer over its targeted lines in the currency's PAYABLE
unit with the same one-unit-at-a-time remainder hand-out as the delivery allocation, so
`listRevenue − discountTotal = goodsRevenue` is an exact integer identity. The seeded
«ط-1046» (10% on 155,000 of goods) renders:

    الأصناف قبل العرض   155,000
    الخصم                15,500
    أصناف بعد العرض     139,500
    المحصّل             144,500

`design-system/proofs/p6/orders-offer-{light,dark}-{1440,390}.png`. The sale's own
share is DENORMALISED onto `Sale.discount` at record time by the same allocation, and
`profitForSale` subtracts it once at the boundary every reader goes through — the
ledger, the dashboard, the cash till and the commission engine all moved without any
of them doing their own subtraction. Tests: ten on the allocation (including a sweep
of awkward amounts), two on `calculateOrder`, three on `profitForSale`.

### G2 — free delivery is a cost absorbed, not a price cut
`isFreeDelivery` = fee waived while the courier was still paid. The goods keep their
price and margin (a test pins goodsProfit unchanged and deliveryMargin = −paid), and
`computeDelivery` counts these trips `freeTrips`, NOT `subsidised` — a warning that
scolds a deliberate offer as a mistake teaches the merchant to ignore warnings. The
seeded «ط-1047» wears a «توصيل مجاني» badge, and the delivery band says «توصيل مجاني
تحمّلت أجرته في طلبية واحدة. هذا عرض اخترته، لا خسارة.» while the subsidised warning
counts only the real mistakes.

### G3 — the commission treatment is the scheme's, frozen at record time
`CommissionCalculator.split` gates the discount on `params.discountTreatment`:
afterDiscount (and absent, the stored default) shrinks the basis by the line's share;
beforeDiscount leaves it whole. Eight tests, including: the two treatments differ by
exactly the rep's share of the discount; a discount deep enough to turn the sale into
a loss meets the loss policy like any other loss; and the snapshot freezes the
discounted figures (`revenueMinor` 9,000 on a 100-with-10-off sale).

The choice is ON THE SCREEN, or it would not be a choice: the bench gained «لو كان على
الطلبية عرض» beside the loss policy, with the helper text stating each side's meaning
(`proofs/p6/bench-light-1440.png`).

### G4 — a discount can never exceed what it discounts
Fixed is capped at the targeted goods; percent is clamped to 0..100; a `lineId` that
matches nothing discounts NOTHING rather than silently widening to the whole order;
NaN/negative/Infinity are no discount, never a bonus — in the allocator, in the basis,
and in `profitForSale`. Tests at and past every boundary.

### G5 — order lines freeze their splits like every other sale
The real P4 gap this phase surfaced: the order builder recorded lines WITHOUT
commission snapshots, so a trip's sales resolved live forever — no debt in the
balance, history rewritable by a later scheme edit. That was exactly what the «8 بلا
نظام قسمة» badge on the seeded team screen was counting. The builder now freezes each
line at record time with its discount share (the same `CommissionCalculator.snapshot`
path the single-sale dialog has always used), and the seed does the same. Verified in
the browser: the badge is GONE from `/reps`, and the team balance now includes the
trips' shares. Pre-P6 order lines in a real store stay live-resolved and surface as
fixable — the designed recovery path — rather than being retro-frozen by a migration
that would invent debt the merchant never saw.

### What the eye caught that the types did not
1. The panel's offer rows silently failed to land on the first pass (the patch
   anchored on pre-P5 markup and matched nothing). The render showed a discounted
   trip with no «قبل العرض» line; fixed and re-shot.
2. I wrote «تدفع الزبونة» in the builder preview while the app's one word for that
   object is «الزبون» — replaced with the panel's own noun («الأصناف بعد العرض»).
3. An em dash in fresh Arabic copy («توصيل مجاني... — عرض اخترته») — the recurring
   personal failure, caught before commit this time.
4. The overflow sweep was pointing at a dead port and passing vacuously; re-pointed
   and re-run for real: 15 routes × 5 widths, none overflow.

### G6 — nothing regressed
    npm run typecheck   clean
    npm run lint        clean
    npm test            412 passed (19 files)
    npm run build       Compiled successfully

Cost-leak sweep under a rep session, 13 routes: nothing leaked. The offer figures on
an order panel are revenue-side facts (the rep granted the offer) and stay visible;
every cost row stays gated.
