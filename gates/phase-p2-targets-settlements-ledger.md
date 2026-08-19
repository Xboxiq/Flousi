# Phase P2 — «كم استهدف · منو دفع · شنو صار»

The client's own sentence named seven things a merchant must be able to read:
«كم اشترى وكم باع وكم ربح وكم استهدف و وين راح ومنو دفع وشنو صار».
Five are shipped. Three are not, and this phase is those three:

| السؤال | الحالة قبل هذه المرحلة |
|---|---|
| كم اشترى · كم باع · كم ربح | المنتجات، المبيعات، اللوحة ✅ |
| وين راح | شريط التوزيع ✅ |
| **كم استهدف** | هدف واحد للحساب كله في الإعدادات. لا هدف لمندوب ولا لمنتج ولا لشهر معيّن ❌ |
| **منو دفع** | التسويات موجودة في النطاق ومخزّنة، لكن لا تُقرأ إلا من داخل ملف مندوب واحد ❌ |
| **شنو صار** | لا سجل موحّد لحركة واحدة ❌ |

## Gates

### G1 — a target is one truth, not two
CHECK: after this phase, is there exactly one place a target is read from?
EXPECT: `AppSettings.monthlyProfitTarget` was the only target store. Adding a
`Target` table beside it would leave two answers to «ما هدف هذا الشهر؟». The
settings field becomes a legacy INPUT to a one-time idempotent lift into the
target store, and every reader — the dashboard's target line included — goes
through `TargetCalculator.resolve`.
EVIDENCE: `grep -rn "monthlyProfitTarget" src/ | grep -v test` → 5 hits, and not one
of them reads it as a target: the field on `AppSettings`, the zeroed default, and
three lines inside `migrations.ts`. The settings screen's input is gone (it now
links to `/targets`) and the dashboard's threshold reads
`TargetCalculator.resolve` instead. `migrations.test.ts` proves the lift is
idempotent across a triple run, never overwrites a target the merchant set
himself, and still clears the stale field when it declines to write.

### G2 — specificity wins, and the rule is the one already in the codebase
CHECK: resolution order for «هدف المندوب س في شهر ٨».
EXPECT: month+rep → rep standing → month+account → account standing → none. The
same specificity-wins shape as `CommissionAssignment` (product×rep → product →
rep → default), because a second unrelated precedence rule in one product is a
bug waiting to be reasoned about wrongly.
EVIDENCE: `targetScope()` + `TARGET_SCOPE_RANK` mirror `assignmentTier()` +
`SCHEME_TIER_RANK`; tests T-G2a…T-G2f cover every rung and the ties.

### G3 — no target is a real state, not zero
CHECK: what a reading shows when nothing is set.
EXPECT: `attainment` is never a division by zero and never a fake 0%. A target of
0 or absent returns `hasTarget: false`, and the surface then compares the month
against the merchant's own average instead of against a target — which is what
the settings copy already promises («اتركه صفرًا لمقارنة الشهر بمعدّلك»).
EVIDENCE: tests assert `hasTarget === false` and `attainment === 0` with no
`Infinity`/`NaN` anywhere.

### G4 — pace is reported, not implied
CHECK: a month at 45% of target on its 18th day.
EXPECT: 45% against a target is not the reading a merchant needs mid-month; the
reading is 45% attained with 58% of the month elapsed, so BEHIND. `pace` and
`onPace` are computed in the domain from an injected clock, never from
`Date.now()` inside a component.
EVIDENCE: tests drive `asOf` explicitly. `grep -n "Date.now()\|new Date()"` in the
target service → no match. The one `new Date` there is
`new Date(Date.UTC(y, m, 0)).getUTCDate()`, a calendar computation from the MONTH
ARGUMENT, so February is 28 days and 2028's is 29 (test G4e) with nothing read
from the wall clock. The screens take one `asOf` per render so every row on
screen measures against the same instant.

### G5 — «منو دفع» reads across every rep, in every currency
CHECK: `/settlements`.
EXPECT: one list of every payment made: who, how much, in which currency, when,
by which method, against which period. Totals are grouped PER CURRENCY and never
summed across them (the domain holds no FX rates — `Money.add` throws on a
mismatch, and one mistyped currency must not brick the screen).
EVIDENCE: route builds. `computeSettlements` returns `totals: CurrencyTotal[]`, one
per currency, and `grep -c "totalPaid\|grandTotal" src/application/ledger.ts` → `0`:
there is no combined figure to print. A test asserts two currencies stay two
lines, and the demo store now seeds one USD payment beside the dinar ones so the
rule is VISIBLE in the proof rather than only true in a test.

### G6 — «شنو صار» is one movement log, ordered by when it happened
CHECK: `/ledger`.
EXPECT: sales, settlements and period closes interleaved in one reverse
chronological list, each entry saying what moved, how much, and its direction
(in / out / neutral). A sale and a payment are different events and must not be
summed into one running "balance" — the ledger reports events, and balances stay
derived where they already are.
EVIDENCE: route builds. A mixed fixture asserts the three kinds interleave strictly
by timestamp, that direction is `in`/`out`/`none` per kind, that amounts are always
positive with direction carrying the sign, and that ids are unique across kinds. The
demo store has no closed period yet, so `periodClose` appears in the proof only as
the «إغلاقات» filter's honest empty state; its row shape is covered by the test.

### G7 — the ledger stays usable at real volume
CHECK: a store with hundreds of movements.
EXPECT: paged/windowed like the rep profile was (P1 shipped 176 operations in a
6,716px page and had to be fixed). The ledger opens with a bounded window and
says how many of how many it is showing.
EVIDENCE: the seeded store holds **219 movements**. `/ledger` opens with 14 and says
«ظهر 14 من 219», with «عرض المزيد» adding 14 at a time; changing the filter resets
the window rather than carrying an expansion into a different kind. Page height
1,247px at 1440 and 1,535px at 360 — against the 6,716px page P1 had to fix.

### G8 — money stays in the units its layer already uses
CHECK: `Target.amount` units.
EXPECT: MAJOR units, like `AppSettings.monthlyProfitTarget` and like the
`analytics` output a target is compared against — NOT the integer minor units the
commission engine uses. Mixing the two silently by a factor of 100 is the single
most expensive bug available in this codebase, so the choice is written down at
the field.
EVIDENCE: the doc comment at `Target.amount` states the scale and why. Test G8
asserts 6,312,000 against a 5,000,000 target reads as 126.24% with a surplus of
1,312,000 — not 1.26% and not 12,624,000%.

### G9 — the three screens are objects, not tables of numbers
CHECK: the renders against VISUAL-LAW.
EXPECT: targets read on a real instrument (the ring/comb already in the system)
with the unfilled remainder as data (§11); the ledger's direction is carried by
form and not by colour alone (§13); nothing floats (§7).
EVIDENCE: 12 eye-verified proofs in `design-system/proofs/p2/` (three screens ×
light/dark × 1440/360), plus per-row crops. The new object is
`objects/pace-rail.tsx` + `.pace-*` in `materials.css`: the moulded run is what was
ACHIEVED and a scribe line is how much of the MONTH has gone, so «45% من الهدف»
cannot be read without «وقد مضى نصف الشهر». The remainder carries the app-wide
diagonal hatch (§11a) and the scribe is a LINE, not a second hue (§13).

## What looking at the renders caught, that no test could

1. **A full rail that meant the opposite of what it drew.** A USD line with 150
   paid and nothing earned in that currency computed `share = 1` and rendered a
   COMPLETE rail — reading «تمّت التسوية» when the truth was «مدفوع مقدّماً». A rail
   needs a whole to divide; with no whole there is now no rail, and the figures say
   it instead (§8). This is exactly the case the seeded USD payment exists to keep
   visible.
2. **A grey run beside a grey hatch.** The currency rail was toned `muted`, so the
   69% that had actually been paid was indistinguishable from the 31% that had not.
   `muted` means «لا شيء محدَّد»; a real quantity gets a real hue.
3. **216 green keys.** Every sale is inward, so a green glyph on every row spent
   the colour on a fact rather than a meaning (§13). The glyph's FORM carries
   direction now, ink is neutral, and colour is kept for the exception — a sale
   that lost money.
4. **«-5,000 ربحًا»** would have called a loss a profit: the word moved before the
   figure and became «خسارة» when negative.
5. **Arabic number agreement, three times.** «3 هدفًا» is wrong (that form is for
   11–99) and «2 منها متأخّر» needs the dual. All three headers moved to the
   agreement-free colon form: «أهداف محدّدة: 3 · متأخّرة عن الوتيرة: 2».
6. **A 1,470px pace rail.** At full width the 33%-versus-61% comparison got HARDER,
   the two marks drifting apart until the eye had to travel between them. The hero
   became two columns.
7. **The same fact three times.** «مضى 61% من الشهر» printed on the hero and under
   every rep rail. It belongs to the month, so it is said once.
8. **A ledger row ~900px wide.** The name column on `1fr` absorbed every spare
   pixel and pushed the figure to the far edge. The name is bounded, the detail took
   its own column, and the list is capped at a reading measure.
9. A hatch at 16% of `--fg` read as empty at 14px tall; raised to 24%.
10. `DEFAULT_SETTINGS.monthlyProfitTarget` still shipped 2,500,000 — a stale second
    answer on a fresh store. Zeroed, with the reason at the field.

### G10 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`

## Closing evidence

    npm run typecheck && npm run lint && npm test && npm run build
      → clean · clean · 201 passed (12 files) · 26 static routes

    node .claude/skills/kill-ai-slop/scripts/scan.mjs src
      → 8 groups, 122 hits (108 before P2; the 14 new ones are `font-mono` on
        figures and `tabular-nums`, which is this product's own law for money)

Measured: no element overflows its box and no horizontal scroll at 1440 / 1024 /
768 / 390 / 360 on any of the three screens.

New routes: `/targets` · `/settlements` · `/ledger`, all three under «المالية».
