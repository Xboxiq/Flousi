# Phase P5 — الحالة والرجيع والتحصيل

The client confirmed this outranks offers: «نعم، وهو أهم من العروض».

## G1 — a returned order does NOT cost the purchase price
CHECK: what a return actually costs.
EXPECT: the goods came BACK. The merchant still owns them, so the purchase cost was
not consumed and must not be counted as a loss. What a return really costs is the
delivery — out and back — against nothing collected.

This is the opposite of the naive reading («I lost the whole order»), and getting it
wrong in either direction misstates the month: counting the goods cost invents a loss
the merchant did not take, and counting nothing at all hides the shipping he did pay.
EVIDENCE: a test asserts a returned order reports `goodsCost: 0`, `collected: 0`, and a
net loss of exactly the delivery paid out and back.

## G2 — commission reverses, and the frozen snapshot still stands
CHECK: a rep's balance after one of their orders is returned.
EXPECT: the rep is no longer owed that share. Paying commission on money that never
arrived is money leaving the merchant's pocket for nothing, and it is the single most
expensive thing this app currently does.

The frozen `commissionSnapshot` is NOT rewritten or deleted — it stays as the record of
what was agreed at sale time. What changes is whether the BALANCE counts it. A void
order's shares are excluded at the read model, so the history stays auditable and the
balance stays true.
EVIDENCE: tests assert the balance drops by exactly the returned order's rep share,
that the snapshot on the sale is unchanged, and that restoring the order to delivered
restores the balance.

## G3 — «ربحت» is not «بيدي»
CHECK: three different questions the app conflated into one.
EXPECT: four states, not one total:
* **في الطريق** — pending. Goods are out; there is no revenue yet.
* **عند التوصيل** — delivered, money still with the courier. Earned, not in hand.
* **بيدك** — delivered and collected. The only figure that is actually spendable.
* **راجعة / ملغاة** — void. No revenue, and the delivery paid is a real loss.

COD money sits with the courier for days or weeks in this market, so «كم ربحت» and «كم
عندي» are different numbers and the app must say both.
EVIDENCE: a test builds one order of each state and asserts the four figures are
computed separately and never summed into one.

## G4 — a status change is reversible and never rewrites history
CHECK: marking an order returned, then delivered again.
EXPECT: status is a field on the order, not a destructive edit. Nothing is deleted, no
sale is removed, no snapshot is touched, and the reading returns to what it was.
EVIDENCE: a test round-trips every status transition and asserts the figures return.

## G5 — the return's cost is entered, not guessed
CHECK: what the return leg cost.
EXPECT: `returnCost` defaults to the same as `deliveryPaid` (a round trip usually costs
what the trip cost) but is EDITABLE, because some couriers charge half for a return and
some charge nothing. A guessed figure presented as fact is worse than an asked one.
EVIDENCE: the field's doc comment; tests for a return that cost nothing, the same, and
more than the outbound leg.

## G6 — a legacy sale with no order still reads as money in hand
CHECK: the 216 sales recorded before P4.
EXPECT: they have no order and therefore no status. They are treated as delivered and
collected, because that is what they were. Anything else would erase the store's
history behind a state it never had.
EVIDENCE: a test asserts a sale with no `orderId` counts toward «بيدك» in full.

## G7 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`

## Closing evidence

`npm run typecheck && npm run lint && npm test && npm run build` → clean. **384 tests**
in 19 files, up from 377 in 18.

### G1 — a returned order does NOT cost the purchase price
`orderOutcome` reports, for the seeded return «ط-1045» (one 50,000 item whose purchase
price is 19,000, delivery charged 5,000 / paid 4,000 / return leg 4,000):

    المحصّل        0
    توصيل مدفوع    4,000
    أجرة الرجوع    4,000
    خسارة الطلبية  8,000

The purchase price is absent, and the panel says why: «قيمة شراء الأصناف ليست خسارة:
الأصناف عندك. لو سُلّمت هذه الطلبية لكانت حصّلت 55,000.» Rendered at
`design-system/proofs/p5/panels-{light,dark}-{1440,390}.png`. Tests: three in
"a return does not cost the purchase price" plus four in the `returnCost` block.

`computeDelivery` was corrected in the same pass: it was reading the order's stored
fee whatever the state, so a returned trip credited the merchant with a 5,000 fee he
never collected. It is now a REALISED reading (returned → charged 0, paid both legs;
cancelled → neither; pending → excluded and reported as `inFlight`). Six tests.

### G2 — commission reverses, and the frozen snapshot still stands
`frozenSnapshots(sales, voidOrders)` drops the splits of void trips from the READING;
nothing is written. Twelve tests assert it: the balance falls by exactly the returned
share, `computeSaleCommissions` still returns the row with `frozen: true`,
`voided: true` and its original `repShareMinor: 500`, and `JSON.stringify` of the
snapshot is byte-identical before and after.

The reversal is VISIBLE, not silent — a balance that drops without a reason is a
balance the rep will dispute. On `/reps`: «سقط بالرجيع: 12,400 د.ع. من طلبية واحدة
رجعت أو أُلغيت. ما اتُّفق عليه محفوظ في السجل.» (`proofs/p5/reps-light-1440.png`), and
in the rep's own balance caption (`rep-detail-light-1440.png`). A payment already made
against a returned trip surfaces as a NEGATIVE outstanding rather than being absorbed.

### G3 — «ربحت» is not «بيدي»
`computeCash` returns four buckets that are never summed, and each carries `collected`
/`netProfit` (REALISED) separately from `expected` (what the trips would collect). On
the seeded store, `/orders` opens on:

    بيدك · أغسطس 2026   4,694,000
    عند التوصيل           195,000   ← طلبية واحدة سُلّمت ولم يوصلك مالها بعد
    في الطريق                   0
    رجعت أو أُلغيت طلبية واحدة، والذي خسرته فعلاً هو أجرة التوصيل: 8,000

The object is `CashTill`: one drawer for what is spendable, a milled front lip, and
two SUNK bays behind it for money that exists and is not his — hatched for the
remainder he has not got, dotted for the provisional in-flight reading (§11a). Nothing
in it is scaled, because the four figures do not divide one whole (§11b); the one
proportion worth stating is stated in words: «4% من مالك ما زال خارج يدك».

Fifteen tests in `src/application/cash.test.ts`, including one trip in each state at
once asserting all four figures land separately.

### G4 — a status change is reversible and never rewrites history
`status` is a field patched through the existing `updateOrder`. Tests round-trip every
status and assert `orderOutcome` mutates neither the order nor the calculated result,
and that returning an order to `delivered` restores the balance to the exact figure it
had. The control is the four-state group on the opened row.

### G5 — the return's cost is entered, not guessed
`returnCost` is seeded from `deliveryPaid` by the FORM when the status first becomes
`returned`, and stays editable; the calculator never invents it (an absent value reads
as zero). Four tests: a return that cost nothing, half the outbound leg, more than it,
and an absent value that is read as zero rather than guessed.

### G6 — a legacy sale with no order still reads as money in hand
`orderStatus` reads an absent status as `delivered` and `orderCollection` reads an
absent collection as `collected`, so every pre-P5 row keeps meaning what it meant. A
sale with no `orderId` is never void whatever else came back, and counts toward «بيدك»
in full. Asserted in all five test files.

The till is scoped to the OPEN PERIOD and says so. The first build read the whole
store: «بيدك الآن 26,163,000», which counted 216 sales the merchant has been spending
for months, made the trips' 195,000 read as 1% of nothing, and was a false claim about
today. The app already had a window of its own, so the reading uses it.

### What the eye caught that the types did not
1. **«بيدك» over all history** — the 26,000,000 above. Scoped to the open period.
2. **«بيدك» shown to a REP** — every figure was one they may see, but the word claims
   the merchant's cash is theirs. `CashTill` now takes an `audience`, and a rep reads
   «حُصّل من طلبياتك» with «11% من قيمة طلبياتك لم تُحصّل بعد». Their row badge says
   «محصّلة», not «بيدك» (`proofs/p5/orders-rep-light-1440.png`).
3. **«توصيل بالخسارة: 1» in the page header, ungated** — a cost fact reaching a
   session without `viewCosts`, while the row's own badge was already gated. Fixed.
4. **A four-state group in an 18rem column** wrapped into a 2×2 block that read as a
   keypad. The control now spans the row, label and group on one line.
5. **«في الطريق» broken in half INSIDE its own pill** at 390px. The Segmented GROUP
   now wraps between options and its labels never wrap — which then overflowed
   `/reps/schemes/` by 108px until the group itself was made `flex-wrap`.
6. **«1 طلبية» / «3 قطعة» / «2 من 5 طلبية»** — the Arabic agreement trap the project
   forbids, written by me and also present in P4 copy. Added `countedNoun` on
   `Intl.PluralRules` («قطعة واحدة» · «قطعتان» · «3 قطع» · «11 قطعة») with seven tests,
   and used the colon form where the dual declines after a preposition.

### G7 — nothing regressed
    npm run typecheck   clean
    npm run lint        clean
    npm test            384 passed (19 files)
    npm run build       Compiled successfully, 24 static routes

Horizontal-overflow sweep, 15 routes × 5 widths (1440/1024/768/390/360): none.
Cost-leak sweep under a rep session, 13 routes including `/orders`: no forbidden
figure outside a refusal screen.
