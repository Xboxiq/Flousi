# Phase P10 — قيادة كل مسار كتابة، والعلل التي كشفتها

P9 ended on a lesson worth building on: its dialog focus thief broke every dialog in
the app since P1 and was invisible to the typechecker, the linter, the tests AND the
screenshots. It surfaced only when a script TYPED into a field. So this phase drives
the app instead of reading it.

## G1 — every user-reachable write path actually writes
CHECK: all twelve write paths a merchant can reach, driven through their real UI in
the exported build, asserting the STORE changed — not that a toast appeared.
EXPECT: product create/delete, sale, order (with an offer), order status, target, rep,
role, scheme, settings, settlement, period close. And the things a screenshot cannot
see: that an order's lines froze their commission snapshots, that the offer reached
each line, that a status change is reversible, that editing a target updates its scope
in place instead of duplicating it.
EVIDENCE: `12/12 write paths drove clean`.

    ✓ createProduct           products 6 → 7, price 40000
    ✓ createSale              sales 227 → 228
    ✓ createOrder             order + 2 lines, 2 frozen, 2 discounted
    ✓ updateOrder             returned (cost 4000) → delivered, reversible
    ✓ create/updateTarget     updated in place (count held at 5)
    ✓ createRep               reps 3 → 4
    ✓ createRole              roles 2 → 3
    ✓ updateCommissionScheme  basis → afterPurchaseCost
    ✓ saveSettings            settings persisted
    ✓ createSettlement        settlements 4 → 5
    ✓ closePeriod             closed periods 0 → 1
    ✓ deleteProduct           products 6 → 5

The order case is the one worth reading twice, because it exercises P4 through P6 at
once. On a 10% offer over two lines the store held: `order.discount {percent, 10}`,
line shares `3,200 + 6,000` (exactly 10% of 92,000), both lines frozen, and the
snapshots carrying the DISCOUNTED revenue (`2,880,000` and `5,400,000` minor =
32,000−3,200 and 60,000−6,000). P6/G1 and P6/G3 confirmed on real stored rows rather
than in a unit test's fixture.

## G2 — anything clickable is reachable by keyboard
CHECK: elements that respond to a pointer but have no keyboard road.
EXPECT: none. The rule is the one the reps cards already state: the whole card is
clickable for the mouse and the name is a real link, so the keyboard has the same road.
EVIDENCE: the sweep found the product rows were pointer-ONLY — a `<tr>` with an
`onClick` and no focusable child anywhere inside. No tab stop, no Enter, no
open-in-a-new-tab, and nothing for a screen reader to announce as a destination, on the
app's most-used list. Fixed by giving the product name a real link (the row keeps its
mouse handler; the link stops the bubble so one click never navigates twice). Verified
by REAL tab traversal, not a programmatic focus:

    reached in 21 tabs · :focus-visible matches · ring oklab(…/0.6) 0 0 0 2px
    Enter from that tab stop navigated to /products/view/?id=…
    the row click still navigates (the mouse road is intact)

Then: `every clickable is keyboard reachable` across all 13 screens.

## G3 — a mangled store must not brick a local-first app
CHECK: five corruption shapes × the four load-bearing collections × the four
heaviest-reading screens, failing on a thrown error OR a blank screen.
EXPECT: every screen still renders. This matters more here than in a served app: with
no server there is no fallback, so a blank screen means the merchant cannot reach ANY
screen — including the one that would let them export or reset. One bad value bricked
the app unrecoverably.
EVIDENCE: `9/20 corruption cases broke a screen` before, `all 20 survived` after. Three
real defects, each fixed at the one place it belonged:

1. **`storage.get` lied.** `JSON.parse(raw) as T` told the compiler the value was a `T`
   while nothing had checked it. A value that parsed but held the wrong SHAPE — `null`,
   or an object where a list belongs — reached the read models and crashed them with
   `x.filter is not a function`. The door now verifies shape against the fallback
   (deliberately shallow: a deep validator here would be a second copy of the domain's
   rules, drifting silently). An unusable value reads as ABSENT and is LEFT in storage:
   a merchant's only copy is not ours to delete on a hunch, and a later version that
   understands the shape can still recover it. 10 tests.
2. **A product row with no cost breakdown** crashed every screen that priced a product
   (`reading 'purchase'` of undefined). Repaired to a zero breakdown on read, which is
   the project's existing doctrine for an unreadable record («منتج محذوف», the zeroed
   commission row) applied one layer lower. Storage untouched.
3. **`formatCurrency` threw from inside a render.** `{ ...DEFAULTS, ...opts }` does not
   treat an explicitly passed `undefined` as absent, so `{ currency: product.currency }`
   — a shape callers use everywhere — overrode the default WITH undefined and `Intl`
   threw «Currency code is required with currency style». The corrupt row merely
   exposed a hole open to any caller with an optional field. Now resolved with `??`,
   and wrapped so an unknown code prints the figure with the code beside it: a
   formatter must never be able to take a screen down. 6 tests.

My own guard broke the schema-version stamp on the first pass (a `null` fallback means
the caller declares NO expectation, and judging it against `typeof null` rejected every
valid reading). Caught by the existing migration tests, fixed, and pinned by a test of
its own.

## G4 — the probes lie more often than the app does
Five of five initial "failures" in G1 were defects in my own sweep, not in Flousi. Each
taught a rule now encoded in `scripts/sweeps/README.md`: identify a created row by id
diff and never by array position; scope a click to the control's own group (an unscoped
`:has-text("راجعة")` matched a BADGE and toggled the wrong row); pick a subject the
action can actually change (clicking «راجعة» on an already-returned order is correctly
a no-op); and assert the RULE, not the row count (a target must be updated in place, so
`+1` was the wrong expectation and would have hidden a real duplication bug).
Recording this is the point: the next reader will hit the same trap.

## G5 — the sweeps are repo assets, not scratch files
`scripts/sweeps/{sweep-writes,sweep-keyboard,sweep-corrupt}.mjs` plus a README, wired
as `npm run sweep:writes` / `sweep:keyboard` / `sweep:corrupt`. A one-off script that
found three real bugs and then evaporated would be the laziest possible outcome.

## G6 — nothing regressed
    typecheck · lint · build              clean
    npm test                              428 passed (was 412; +16 for the new guards)
    overflow sweep, 15 routes × 5 widths  none
    cost-leak sweep under a rep session   nothing leaked
