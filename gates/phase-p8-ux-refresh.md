# Phase P8 — تحديث الواجهة: حركة هادفة، وحالة في الرابط، وبحث في بياناتك

From the client's brief: «كمل واستخدم افكار افضل وتصميم ui ux محدث». Three upgrades,
each from a named skill, each measured or seen — never applied on authority alone
(CLAUDE.md: a skill's advice is applied only when it is measured or seen to help).

## G1 — disclosure content ENTERS instead of teleporting (skill: animate)
CHECK: the animate skill's build sequence, run in order.
EXPECT:
* Gate: the ladder rung is occasional-tier; the order row panel is tens-a-day tier —
  standard motion for the first, fast-and-subtle for the second. Purpose named:
  preventing a jarring change (a tall block otherwise teleports in).
* Ingredients: CSS `@starting-style` transition — no JS, no library; `opacity` +
  `transform` only; the app's own `--ease-out` (cubic-bezier(0.23,1,0.32,1));
  200ms for the rung, 150ms for the row panel; a 4px/3px drift, enter ONLY —
  closing is the user asking for it GONE, and an exit animation there would be the
  interface disobeying for 200ms.
* The Dialog was AUDITED, not rebuilt: it already enters scale 0.96 + fade at 200ms
  on a strong curve with a symmetric exit through Motion. Nothing to fix.
EVIDENCE: read off the LIVE element —

    rung .reveal: opacity, transform | 0.2s | cubic-bezier(0.23, 1, 0.32, 1)

Under `reducedMotion: "reduce"` the app-wide rule flattens it to 0.01ms — instant
appearance, exactly the pre-P8 behaviour. A per-class reduced-motion variant was
written, found DEAD under that `!important`, and deleted rather than kept as a
comforting lie.

## G2 — the screen's tab lives in the URL (task #22; skill: web-design-guidelines)
CHECK: reload, share, and the back button on filtered screens.
EXPECT: `useUrlState` — the URL is the single owner of the value, derived every
render (the P3 lesson about seeding state from async data, applied again). Writes
use `replace`, so flipping a filter five times does not bury the previous page five
entries deep in the back stack. The default clears its key: the address stays clean
at rest. A hand-edited value outside the allowed set falls back rather than smuggling
an arbitrary string into a trusted type. `/reports` needed nothing — its tabs were
already routes (`/reports/[type]`).
EVIDENCE: driven in the exported build —

    /ledger/?kind=settlement   → reload → the «تسويات» tab is still active
    /targets/?metric=revenue
    /reps/?scope=all           → back to default → /reps/ (clean)

Suspense boundaries added to the three page shells (required by `useSearchParams`
under `output: "export"`); each view keeps its own skeleton, so no second fallback.

## G3 — the palette searches the merchant's DATA, not only the screens
CHECK: Ctrl+K with a product's or a rep's name.
EXPECT: records join the results the moment there is a query — «وشاح» lands on the
product, a rep's name lands on their profile. At REST the palette lists screens and
actions only: dumping the whole catalogue into the unfiltered list would bury the
six doors the merchant actually opens. Gated by the same capabilities as the screens
they open (`viewProducts` / `viewTeam`), archived rows excluded — a door to a
retired record is a refusal one tap away.
EVIDENCE: driven — at rest no product listed inside the dialog; query «وشاح» hits
«المنتجات / وشاح صوف ميرينو» and Enter lands on `/products/view?id=…`; query «سعد»
hits «الفريق / سعد الجبوري». Renders at
`design-system/proofs/p8/palette-records-{light,dark}-1440.png`.

## G4 — keyboard and focus on the new surfaces
EVIDENCE: the rung latch reached by keyboard opens with Enter (`aria-expanded:
true`) and wears the full accent focus ring around the latch
(`proofs/p8/rung-focus-light-1440.png`). The palette keeps its esc/arrow/Enter
paths from P1.

## G5 — nothing regressed
    typecheck · lint · 412 tests · build   clean
    overflow sweep, 15 routes × 5 widths   none
    cost-leak sweep under a rep session    nothing leaked, /dashboard still refused

## G6 — the app installs like an app
CHECK: the merchant's actual habit — this is opened daily on a phone.
EXPECT: a web manifest (Arabic, RTL, standalone), the brand mark as real icons at
192/512/apple-touch/favicon — drawn from the app's OWN LogoMark glyph on the accent
tile, not a generic template — and the five Next.js template SVGs deleted from
`public/` along with the default Next favicon.
EVIDENCE: fetched from the exported build —

    manifest: فلوسي | standalone | dir rtl | icons 3
    icon-192/icon-512/apple-touch-icon/favicon.ico → all 200

And a resolution bug caught before it shipped: a relative `./manifest.webmanifest`
resolves against the PAGE, so on `/dashboard/` it pointed at
`/dashboard/manifest.webmanifest` — a 404. Next does not apply `basePath` to
metadata URLs, so the links are prefixed explicitly and verified under BOTH
deployments: `/manifest.webmanifest` at the root and `/Flousi/manifest.webmanifest`
under the Pages base path. Inside the manifest the paths stay relative — they
resolve against the manifest's own URL, which is correct in both.
