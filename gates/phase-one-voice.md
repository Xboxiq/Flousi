# Phase — one voice on every surface

The client's instruction: «كمل اريد نتيجة متكامله و ux ui creative و متكامل ومتميز
وخطوط استخدم غير هذه الخطوط المخزية استخدم خطوط عربية واضحة وتتميز بروح الإبداع
واوزان جيده متماسكة تضيف الإبداع».

Two demands: **change the faces**, and **make the result whole**. Both are measured
below. The reasoning is written up in `design-system/VISUAL-LAW.md` §24 and
`DESIGN.md` §4.

---

## G1 · The faces are chosen by looking, not by naming

- [x] **CHECK** — seven candidate Arabic faces rendered at the product's own
      strings and sizes, in the product's own palette, and looked at.
- **EXPECT** — a pairing with a real voice for titles and real clarity for text,
      with a full weight ladder in both.
- **EVIDENCE** — the first specimen was **rejected as worthless**: the Google Fonts
      `<link>` never loaded in the `file://` context, and a probe proved it —
      every face measured 166.0px for the same string, INCLUDING a face named
      `NoSuchFaceXYZ`. The faces were then fetched through the proxy and served
      locally, and the second render showed seven genuinely different rows.
      **Reem Kufi was rejected on sight**: its joins come apart in running text at
      13px. Chosen: **Noto Kufi Arabic** (display) + **IBM Plex Sans Arabic**
      (text) + **IBM Plex Sans** (figures).

## G2 · Arabic is not tracked

- [x] **CHECK** — «صافي الربح هذا الشهر» rendered at 10px in both new faces at
      tracking 0 / 0.04em / 0.08em, magnified 4×, looked at.
- **EXPECT** — either the tracking is harmless, or it is not and the rule changes.
- **EVIDENCE** — it is not harmless. At 0.08em «الشهر» reads as ش + هر; at 0.04em
      the joins are already loosening. `letter-spacing: 0.04em` was on `.r-label`
      and on every table head. Removed; the rule is written into `globals.css`
      beside the weight law.

## G3 · The weight law is a law, not an intention

- [x] **CHECK** — census the weight decisions before and after.
- **EXPECT** — 700 reserved for figures that carry a decision, and the wordmark.
- **EVIDENCE** — before: 71 `font-bold` · 64 `font-semibold` · 35 `font-medium`
      in `.tsx`, plus 15 `font-weight: 700` in `ritm.css`. Each of the 71 was
      classified by what it sits on (figure-bearing vs word) rather than swept:
      **43 figure-bearing, 28 words**. All 28 stepped down. The structural layer
      now reads **400×1 / 500×5 / 600×8 / 700×1** — the one 700 is a table's
      total row. The three `font-bold` left in components are the `Trend` delta,
      the settle dialog's living figure, and the wordmark.

## G4 · One surface language

- [x] **CHECK** — grep for every surface class that predates the boards, and
      convert or delete each.
- **EXPECT** — zero off-board surface languages left on a product screen.
- **EVIDENCE** — `.clay` / `.clay-inset` / `.clay-press` (20 call sites) → `.r-inset`
      on wells, `.r-choice` on selectable plates, and simply removed from `<Input>`
      where it existed only to cancel the input's own border. `.molded molded-quiet`
      on tiles → `.r-choice.is-on`. `.device` (7 sites) → `.r-slab`. 65 + 26 lines
      of CSS deleted, not left unused. `grep -c clay src/app/materials.css` → **0**.

## G5 · The button matches the client's own board

- [x] **CHECK** — read `design-system/ritm/renders/d4-actions.png` and compare.
- **EXPECT** — whatever the board draws.
- **EVIDENCE** — the board draws a primary as a **flat sand plate with dark ink**
      and a modest rounded rectangle. The app shipped a moulded body: rim light,
      lit top edge, shaded lower lip, drop shadow, full pill. Flattened, and the
      radius moved from `rounded-full` to `--radius-md`, in `Button`, in
      `Segmented`, and on the landing page's four local buttons.
      One contrast trap found on the way: light-mode `--accent-fg` is **white**,
      so a button filled with `--accent-fill` (sand) needed `--accent-fill-fg`, not
      `--accent-fg` — white on sand measures ~2.1:1. New tokens `--color-accent-fill`,
      `--color-accent-fill-fg`, `--color-accent-fill-hover`.

## G6 · The currency word is a qualifier

- [x] **CHECK** — compare the hero against `renders/p1-dashboard.png`.
- **EXPECT** — the board's treatment.
- **EVIDENCE** — the board prints «د.ع.» beside a 56px figure at a fraction of its
      size, and prints no currency at all on the rows below. The app printed it at
      the figure's own size everywhere. `<Money>` and `<Metric>` now split the
      trailing mark to `max(10px, 0.34em)` at 60% opacity.

## G7 · One locale, one calendar

- [x] **CHECK** — grep for date formatters that bypass the app's own.
- **EXPECT** — none.
- **EVIDENCE** — three did: `periods-view.tsx`, `application/periods.ts` and
      `infrastructure/seed.ts` called `Intl.DateTimeFormat("ar", …)`, which is the
      Egyptian month set. The top bar therefore read «أغسطس 2026» over rows reading
      «27 آب». All three moved to `ar-IQ` + `numberingSystem: "latn"`. Two tests
      asserted the old names and were updated with the reason on the line.

## G8 · The marketing surface and the product speak the same vocabulary

- [x] **CHECK** — which objects are exercised only by the landing page and the
      styleguide?
- **EXPECT** — none, or a written reason.
- **EVIDENCE** — `Odometer`, `RingGauge`, `PriceColumn` and `MagnitudeRings` all
      turned out to be on product screens after all. Two were genuinely orphaned:
      **`WeekBars`** (a second weekly-bars object doing `Sparkbars`' job) and
      **`ReportFolder`** (an illustrated folder for a reports hub that is a list).
      Both deleted; the landing now draws the dashboard's own `Sparkbars` and a row
      list, which is what `/reports` actually shows.

## G9 · Nothing regressed

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — 0 errors (1 pre-existing warning in `design-system/ui-v7/shell.js`)
- [x] `npx vitest run` — **433 passed**
- [x] `npm run build` — exported
- [x] `sweep-contrast` — **PASS, every text run meets AA**, planted control caught
- [x] `sweep-overflow` — no page scrolls sideways at 390 / 768 / 1440, no table at 390
- [x] `sweep-density` — every screen under the quiet ceiling
- [x] `sweep-keyboard` — every clickable reachable
- [x] `sweep-writes` — **12/12 write paths drove clean**
- [x] `kill-ai-slop` — 57 hits, down from 67

## Open, and the client's call

1. **The light ground is still an extension.** The identity board prints no light
   ground; `#F2F1EE` is a derivation, said out loud where it is declared. It stays,
   moves to bone `#E8E2DA`, or is dropped — not my decision.
