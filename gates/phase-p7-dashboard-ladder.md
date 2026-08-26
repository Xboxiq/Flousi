# Phase P7 — اللوحة: رقم واحد ثم سلّم كشف

The client chose the bold option by name: «رقم واحد ثم سلّم كشف». The research behind
it (PLAN-ORDERS §6): Mercury, Ramp and Brex open on one number; disclosure is a ladder
(الرقم ← التفصيل مرئياً ← البيانات الخام ← التصدير); Tufte's criterion — a figure that
does not change your behaviour when it changes has no place in the first view; and
density per role, which P3 made real.

## G1 — the screen opens on ONE number
CHECK: what is visible before any interaction.
EXPECT: «بيدك مقابل ما ينتظرك عند التوصيل» — the till, alone. Not net profit: profit
is a verdict about the month, but cash-in-hand against cash-still-out is the figure
that changes what the merchant DOES today (call the courier, or don't). Everything
else waits behind a rung. The old wall (hero + two stats + chart + top products +
distribution + table, all open) is gone.
EVIDENCE: the render at 1440/360, light/dark, showing one object above the fold.

## G2 — the ladder is the client's, in the client's order
CHECK: the rungs and what each latch says while CLOSED.
EXPECT: التفصيل مرئياً (the month's reading: figure, margin, week, curve, the split),
then البيانات الخام (the month's sales, as rows), then التصدير (CSV/XLSX/PDF of that
same table). A closed rung is not a mystery door: its latch carries its own one-line
summary (net profit + delta on the first, a count on the second), so a glance still
answers without opening anything — and no summary repeats the till's number above.
EVIDENCE: renders of the closed ladder and of each rung open.

## G3 — nothing loads before its rung opens
CHECK: the first-load JS of /dashboard.
EXPECT: the chart (Recharts, the dashboard's single heaviest import) is not fetched
until التفصيل opens. P4's measurement discipline applies: state the before/after
first-load figures from the build output, and keep the change only if the number
actually moved.
EVIDENCE: `next build` first-load JS for /dashboard before and after, in this file.

## G4 — density per role holds
CHECK: the dashboard under a rep session.
EXPECT: unchanged from P3 — the whole screen needs «يرى التكاليف», because every rung
below the till is costs and margins; the till itself already speaks rep-safe words
(«حُصّل من طلبياتك») on /orders. The refusal screen, not a hollowed-out copy.
EVIDENCE: the leak sweep under a rep session still passes with /dashboard refused.

## G5 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`, the
overflow sweep, the leak sweep, and eye-verified renders light/dark × 1440/360.

## Closing evidence

`npm run typecheck && npm run lint && npm test && npm run build` → clean, 412 tests.

### G1 — the screen opens on ONE number
`/dashboard` now opens on the till — «بيدك · أغسطس 2026: 4,949,500», with «عند
التوصيل: 195,000» and «في الطريق: 0» in the two sunk bays under the drawer lip, and
nothing else open. The old wall (hero + two stats + chart + top products +
distribution + table, all rendered on arrival) is gone.
`design-system/proofs/p7/closed-{light,dark}-{1440,360}.png`.

### G2 — the ladder is the client's, in the client's order
Three rungs on one physical rail (`.ladder` / `.ladder-rung` in materials.css: a
carved groove, each latch plugged in with a milled pin; the OPEN rung's pin turns
accent — the step being stood on). In order:

1. **الشهر بالتفصيل** — the month's whole visual reading (odometer, margin dial,
   week capsules, the curve with the target line, «وين راح المال؟», best products).
   Closed latch: «1,775,580 ‎+7.7%».
2. **الكشف الخام** — this month's sales row by row («47 بيعة» on the latch), paged
   by 12, phone rows + desktop table.
3. **التصدير** — the same statement as a file: CSV / XLSX / PDF through the existing
   export service, columns named on the rung so the merchant knows what he is
   handing an accountant.

One rung open at a time — a ladder is stood on one step, and letting them all open
would quietly rebuild the wall. A latch's summary disappears while its rung is open:
the content states it larger, and a figure printed twice on one screen is a figure
the reader has to reconcile (found by eye on the first render, fixed).

### G3 — nothing loads before its rung opens
Measured, per the P4 discipline (playwright counting .js bytes on first load of
`/dashboard`, same seeded store):

    before (P6 build)   1,540 KB in 29 files
    after  (P7 build)   1,192 KB in 28 files   → −348 KB (−23%)

The Recharts chunk now downloads only when «الشهر بالتفصيل» opens, behind a skeleton
the exact height of the chart. The export writers (xlsx, jspdf) were already behind
`await import` and now the service module itself loads only on use.

### G4 — density per role holds
Unchanged from P3: `/dashboard` needs «يرى التكاليف» and the leak sweep still shows it
REFUSED under a rep session, with no cost figure anywhere outside a refusal screen.
The rep's own one-number reading lives on `/orders` in their words («حُصّل من طلبياتك»).

### What the eye caught that the types did not
1. The open latch repeated its summary beside the same figure printed large inside.
2. At 360 the closed latch squeezed its title into a five-line sliver beside the
   summary — the latch now wraps, summary on its own line.

### G5 — nothing regressed
    typecheck · lint · 412 tests · build   clean
    overflow sweep, 15 routes × 5 widths   none
    cost-leak sweep, rep session           nothing leaked
    renders light/dark × 1440/360          proofs/p7/{closed,detail,raw,export}-*
