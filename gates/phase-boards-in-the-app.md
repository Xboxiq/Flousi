# Phase — the artboards, applied to the app itself

> «عزيزي ارسلت لي صور واشكال مفروض انها راح تتطبق وتغيير شكل ui ux مال مشروع وفق
> بنية حديثة ومتطورة نفس الصور»

The identity pass landed the board's colours, its type and its mark. It did not land
the board's STRUCTURE — the rhythm grid, the card anatomy, the toolbar, the table, the
brief row. So the app was the old arrangement in the new palette, which is exactly what
the client said it was.

## G1 — there is ONE component layer, not two

CHECK: the design system's `system.css` and the app's own CSS were two implementations
of one language. Which one does the app run?
EXPECT: one. `src/app/ritm.css` is that file ported onto the app's tokens, so a change
to the language is a change in one place.
EVIDENCE: `.r-grid` `.r-card` `.r-toolbar` `.r-tbl` `.r-datarow` `.r-hbar` `.r-splitbar`
`.r-progress` `.r-navitem` `.r-crumbs` `.r-metric` `.r-badge`, plus the lattice, the
ten-step type ladder and the three control heights in `globals.css`.

The radius ramp came down with it: 10/14/18/24/30 → 6/8/10/12/16. A capsule in the mark
is half its own height, and the old ramp was the over-rounded look the brief bans.

## G2 — the grid is the mark, and it cannot draw four equal boxes

CHECK: what spans exist?
EXPECT: 3, 6, 9, 12 and nothing else — four bars of one width at one pitch divide their
own width into four columns of three.
EVIDENCE: `.span-3/6/9/12` in `ritm.css`; the `Span` type in
`src/presentation/components/structure/index.tsx` admits no other value. The dashboard's
first band is 9 + 3 — descending reach with one block deliberately short — which is
structurally the opposite of the four identical KPI cards every finance dashboard opens
with.

## G3 — the rail is the product and the bar is the screen

CHECK: what is in each?
EXPECT: the rail carries the wordmark, the market chip, four Arabic nav groups, a
current item that is a filled capsule with a sand inline-start edge, and the user at its
foot. The bar carries a breadcrumb and the screen's own actions.
EVIDENCE: `sidebar.tsx`, `topbar.tsx`. `PageHeader` renders NOTHING inside the shell —
it declares chrome through `page-chrome.tsx` and the bar draws it, which is why every
screen now starts with its first card instead of a title repeating the nav item just
pressed.

It still renders a real header when mounted OUTSIDE the shell, which is how the tests
mount a screen. A component that vanishes when its context is missing is a trap for
whoever mounts it next, and it cost two failing tests to learn that here.

## G4 — the page template, on every working screen

CHECK: is the shape actually repeated, or applied to one screen and called done?
EXPECT: a BRIEF row (6/3/3 — what happened, one figure worth its own size, the thing
that needs a decision), then ONE span-12 work panel with a toolbar, the table, and a
footer strip carrying the count.
EVIDENCE: `/dashboard` (p1's 9+3 exception, which the mark's own shape earns),
`/orders` (p6), `/products`, `/ledger` (p8), `/settlements` (p4), `/reps`, `/periods`
(p7). The third slot is an accent panel where there is a decision and a plain one where
there is only a law to state — the boards do both.

## G5 — one primary per view

CHECK: how many sand buttons on a screen?
EXPECT: one. The top bar ACTS; an accent panel EXPLAINS and takes the quiet material
where it still needs its own road.
EVIDENCE: `/periods` had «إغلاق الفترة» in the bar AND in the panel; the panel's copy is
gone. The dashboard's and the team's in-panel buttons are `variant="secondary"`.

## G6 — nothing scrolls sideways, and a table scrolls in its own box

CHECK: at 390, 768 and 1440.
EVIDENCE: `node scripts/sweeps/sweep-overflow.mjs` →
`no page scrolls sideways at 390 / 768 / 1440`. It ignores anything with a scrolling
ancestor, so a `.r-tablewrap` doing its job is not a defect and a page pushed past its
own edge is. Its first run found the settings bench putting two labelled verbs plus the
bar's own controls into 358px and pushing the theme key six pixels off the left edge —
the RTL version of the bug, where the overflow hides on the side the eye leaves last.

## G7 — the quiet ceiling was re-derived, not raised

CHECK: seven screens failed §15 after the rebuild. Were they too dense, or was the rule
measuring the wrong region?
EXPECT: the rule. It capped "figures above the first list" at 8, which describes one
figure over a ladder — not a brief row of three titled panels.
EVIDENCE: measured on the client's OWN boards, which are the approved density:

| board | screen | worst panel |
|---|---|---|
| p1 dashboard | 48 | 13 |
| p6 monitor | 48 | 9 |
| p8 ledger | 47 | 3 |
| p9 product | 68 | 9 |
| p4 settlement | 55 | 25 *(a detail card)* |
| p3 rep | 29 | 4 |
| p7 archive | 43 | 12 |

Every board fails its own ceiling by four to eight times under the old counting rule. So
the ceiling moved to PER PANEL — the unit the eye actually reads, because a panel has
its own title and hairline — at one above the worst honest board panel (14), with a
screen-wide guard at the boards' worst (72). Written up clause by clause in
`design-system/VISUAL-LAW.md` §23 rather than resolved silently, as CLAUDE.md requires
for a conflict between a rule and the client's approved language.
EVIDENCE: `sweep-density.mjs` → every screen under the ceiling, and the rebuilt
dashboard's worst panel measures 13 — the same as the board it was built from.

## G8 — a gate that fails on correct work is a broken gate

CHECK: `sweep-corrupt` reported `/reps/` blank on four of twenty corruption cases.
EXPECT: it was wrong. Probed directly: the screen renders its empty state, the action
works, no page errors — `main.innerText` is 31 characters and the gate failed anything
under 40. That threshold only ever worked because every screen printed an `<h1>` inside
`<main>`, and G3 moved it to the bar.
EVIDENCE: the test is now two facts a crash cannot fake — `<main>` put something in the
document, and the breadcrumb rendered, which proves React mounted. `sweep-corrupt.mjs` →
`all 20 corruption cases survived`.

## G9 — everything else

EVIDENCE:
`npm run typecheck` clean · `npm run lint` 0 errors · `npm test` 433/433 ·
`npm run build` exported · `sweep-contrast` PASS with its planted control caught ·
`sweep-keyboard` every clickable reachable · `sweep-writes` 12/12 write paths drove
clean · eye-verified at 1440 in both themes on the dashboard, orders, products, reps,
ledger, settlements, periods, targets, reports, access, settings and the calculator, and
at 390 on the dashboard, orders and the team.

## What this phase did NOT do

* **`/targets`, `/reports`, `/access`, `/settings`, `/calculator`** run the new shell,
  palette, type and radii, and they still use the old card composition inside the
  content column. The boards do not cover them, so the template was not guessed onto
  them.
* **The product and rep DETAIL screens** (boards p9 and p3) are not rebuilt. Their
  boards are the most specific of the set — a three-column workbench with a picker rail
  — and they deserve their own pass rather than a partial one.
* **A phone does not turn tables into rows yet.** The design system's own responsive
  rule replaces a table with a row list under 768px; here the table scrolls inside its
  `.r-tablewrap` instead. That is honest and the page itself never scrolls (G6), but it
  is not what the boards draw.
* **The light ground is still an extension.** Unchanged from the previous phase, and
  still the client's call.
