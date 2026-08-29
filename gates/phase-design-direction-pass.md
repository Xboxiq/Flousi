# Phase — the design-direction pass

A brief asked for the whole discipline: understand the product first, design the
system rather than the screen, then critique and refine until the result is
production-ready. What follows is the audit that pass started with, the work it
named, and what the gates found.

## G0 — the audit came before the design

CHECK: what was actually left, measured on the running app rather than assumed?
EVIDENCE: every remaining screen rendered at 1440 dark and read. The findings, in
the order they were then fixed:

| screen | what was wrong |
|---|---|
| `/products/view` | the page WAS the edit form |
| `/targets` | teal atmospheric gradient · danger-red on every pace rail · a decorative ring gauge |
| `/calculator` | mesh field → carved panels → glass result: card in card in card, plus a 2×2 of identical tiles |
| `/access` | seven capability pills per role, restating a count printed above them |
| `/settings` · `/reports` | old card composition; a bento promoting its first item by array order |

## G1 — the product page answers the question it is opened with

CHECK: a merchant opens a product to ask «هل هذا يربّحني». What did he get?
EXPECT: twenty inputs, and the answer computed in his head from fields he was in
the middle of editing.
EVIDENCE: `product-detail.tsx` is now p9's workbench — a rail of every product
with its margin printed (because the real question is «which of these»), the four
figures that ARE the product, where the price goes as the same split bar the
dashboard uses, the two limits a price sheet exists to give, and the cost sheet
with HOW each line was computed beside it. Editing is an action on the sheet.

## G2 — colour means one thing each

CHECK: `/targets` painted every rail `--danger`.
EXPECT: red judges money going the wrong way. A target that is merely late has
cost nobody anything, and a normal mid-month screen was reading as a failing
business.
EVIDENCE: `PaceRail` gains a `warning` tone; `toneFor` returns accent for on-pace
and warning for behind. The gradient and the ring gauge are gone: one instrument
per screen, and the bar already carried the reading the donut repeated.

## G3 — a filter is not a verb

CHECK: `/targets` put its metric switch in the bar's action slot.
EVIDENCE: it now sits in the work panel's toolbar, over the thing it filters.

## G4 — one primary per view, and a destructive verb stays on the page

CHECK: `/periods` drew «إغلاق الفترة» twice; the calculator would have drawn its
save twice; the product page hid delete inside the edit sheet.
EVIDENCE: the duplicates are gone, in-panel roads take the quiet material, and
`sweep-writes` found the delete — a destructive verb two clicks deep behind a
button that means the opposite is worse than no verb.

## G5 — a table sheds, it does not shrink

CHECK: six tables side-scrolled inside their own box at 390.
EXPECT: the boards replace a table with a row list under 768px. Doing that here
would mean a second hand-maintained copy of six tables, and two renderings of one
truth drift apart.
EVIDENCE: `.pri-2` / `.pri-3` in `ritm.css` — priority 1 is unmarked and never
leaves. `sweep-overflow` now asserts it: `no table needs to scroll at 390`.

## G6 — two data-loss bugs, found by asking about states

CHECK: does `/settings` have a loading state?
EXPECT: the question looked cosmetic. It was not.
EVIDENCE: `useState(settings)` captures the store's value on the FIRST render, and
on that render the store still holds its DEFAULTS. So the settings draft was
IQD / ar-IQ regardless of what the merchant had saved, and pressing «حفظ
التغييرات» before hydration wrote those defaults over his real settings. The
calculator had the same trap on `currency`, so a merchant on USD priced in IQD
and saved a product in the wrong currency.

Both are fixed structurally: the form mounts only once `loaded` is true, so its
initial value IS the stored one. This is the same lesson P3 recorded on the
targets screen, hit again in two more places.

## G7 — the gates were wrong twice, and were fixed as gates

A gate that fails on correct work teaches everyone to ignore it.

* `sweep-density` counted the text inside a CLOSED `<details>` as text at rest,
  because this Chromium still returns client rects for those children. Adding a
  disclosure made the count go UP. "At rest" now excludes a closed disclosure and
  any inert subtree — which is what the file already said it meant.
* It also found real defects in the same run: a fifth figure on a `/targets` row
  (the rail draws the attainment, its label announces it, and a percentage
  printed it a third time) and a six-clause paragraph at rest on `/access`.

## G8 — dead materials removed, not left lying

CHECK: what survived the rebuild with no call sites?
EVIDENCE: `CashTill`, `RitualButton`, `ReportsFolderScene`, `month-detail`,
`sale-rows`, `quick-actions` — deleted. Each carried a material the system no
longer uses, and dead code that carries a banned aesthetic is the next person's
precedent.

## G9 — the system is written down

EVIDENCE: `DESIGN.md` describes what is implemented — the palette with the plate/
word split, the type ladder, the rhythm grid and why the mark cannot draw four
equal boxes, the page template, the component set, the states rule, the three RTL
traps, the responsive column-priority rule, the motion budget, and the gates.
Every anti-pattern listed in it has been removed from this codebase at least once.

## G10 — proof

`npm run typecheck` clean · `npm run lint` 0 errors · `npm test` 433/433 ·
`npm run build` exported · `sweep-contrast` PASS with its planted control caught ·
`sweep-density` every screen under the ceiling · `sweep-overflow` nothing scrolls
sideways at 390/768/1440 and no table needs to at 390 · `sweep-keyboard` every
clickable reachable · `sweep-writes` 12/12 · `sweep-corrupt` 20/20 · twelve
screens eye-verified in both themes at 1440, three at 390, plus the product bench.

## What is still open

* **The rep detail screen (board p3)** is not rebuilt. At 758 lines it is the
  largest screen in the app and it deserves its own pass rather than a partial one.
* **The light ground is still an extension.** The board prints none; `#F2F1EE` is
  a derivation, said out loud where it is declared. Still the client's call.
* **`instruments-study` and the landing page** still exercise objects the product
  screens no longer use (`RingGauge`, `WeekBars`, `PriceColumn`, `Odometer`).
  They are a showcase and a marketing page, not product surfaces, but the two
  vocabularies should be reconciled rather than left to diverge.
