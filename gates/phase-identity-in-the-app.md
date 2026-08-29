# Phase — the identity, applied to the app itself

> «ماكو تغييرات ولا تطبيق للشكل الجديد والالوان المقترحة وديزاين جديد ولوجو جديد
> كلشي ماتطبق»

The client was right. Three phases of brand and design-system work had produced
`design-system/` — boards, specs, nineteen artboards — and had not touched a single
pixel of the product. The app was still on Apple blue `#0A6CFF`, Cairo + IBM Plex
Mono, and a tick inside a rounded accent tile. A design system nobody's screen runs
is a folder, not a design system.

This phase moves it into `src/`.

## G1 — the palette the app actually paints is the board's

CHECK: does `globals.css` carry the identity, in both modes, with the ratio measured
at every token that reads?
EXPECT: coal `#0B0E11`, graphite `#1A1F24`, steel `#2A2F36`, sand `#B8A880`, bone
`#E8E2DA`, teal `#3D8680` — and the light ground `#F2F1EE` marked as an EXTENSION,
because the board prints no light ground and pretending otherwise is the debt §19
was written about.
EVIDENCE: `src/app/globals.css` — both `:root` blocks replaced; every colour token
that can carry a word has its ratio in the comment beside it. `--blue-*` is gone and
`--sand-*` stands in its place. `--indigo` and the four mesh gradients are deleted
outright, not retuned: a blue→indigo grainient is the exact aesthetic the client
banned, it appeared on no product screen, and a "brand-coloured" version of a shape
that should not exist is still a shape that should not exist.

## G2 — sand is a plate, not a word

CHECK: the identity's own colour is 2.08:1 on paper and 1.9:1 under white. Does any
text sit on it?
EXPECT: no. `--accent` carries the darkened sand `#736440` for anything that reads;
`--accent-fill` carries the board's `#B8A880` for anything that fills; `--accent-fg`
is the ink each mode's accent needs — white on light, coal on dark.
EVIDENCE: `text-white` on an accent body was found in five places by measurement,
not by reading: the primary button, the segmented control's sliding pill, the mobile
dock's FAB, and both landing CTAs. All now `text-accent-fg`. `::selection` was
painting `--paper` on `--accent` — white on dark-mode sand, 1.9:1 — and now paints
`--accent-fg`.

## G3 — the gate that finds this class of defect is runnable

CHECK: a palette swap breaks contrast silently. What catches it next time?
EXPECT: `scripts/sweeps/sweep-contrast.mjs` — every text run, on 13 routes, in both
themes, measured against the colour actually painted behind it.
EVIDENCE: `node scripts/sweeps/sweep-contrast.mjs` →
`control: caught the planted failure` / `PASS — every text run meets AA`.

Three things had to be true before the number could be trusted, and each one was
first WRONG:

| The sweep said | Why it was wrong | Fix |
|---|---|---|
| the landing CTA slab fails at 1.13 | it walked past an opaque gradient body to the page ground behind it | stop at the first opaque paint |
| the primary buttons fail at 1.13 | `color-mix()` and `oklab()` survive into computed styles; an `rgb()` regex misses exactly the colours these materials are mixed from | resolve every colour through a canvas, which is the engine's own answer |
| the segmented chip fails at 1.01 | the accent pill is an absolutely-positioned SIBLING under the label, invisible to an ancestor walk | ground the run by hit test (`elementsFromPoint`), which sees what the compositor sees |

A planted failing control runs first, every time: the board's sand as a word on the
page ground. If the control is not caught, the sweep reports itself broken rather
than reporting the app clean.

## G4 — `--subtle` is set against its worst ground, not its best

CHECK: `#8A9199` was documented as "6.07 on bg · 5.21 on surface". Is that the whole
truth?
EXPECT: no — it is 4.23 on `--surface-2`, which is the ground the reps' balance note
and the calculator's captions actually sit on.
EVIDENCE: lifted to `#939AA2` — 6.90 / 5.92 / **4.74**. A token is only as good as
its worst ground, and a comment that lists only the grounds where it passes is worse
than no comment.

## G5 — the mark is the client's, and it is drawn from the measurement

CHECK: does the app render the four-bar RITM mark, or the tick-in-a-tile?
EXPECT: four bars of ONE width at ONE pitch, at four heights, in `currentColor`, no
tile, no plate.
EVIDENCE: `src/presentation/components/layout/logo.tsx` — `viewBox 0 0 24 39`, bars
at x = 0 / 6.6 / 13.2 / 19.8, width 4.2, heights 32 / 29 / 26 / 14, rx 2.1. Width is
the caller's size and height is DERIVED, so a caller passing a square box cannot
squash it. The wordmark is «رِتم», the product's name in the product's language; the
Latin "RITM" it replaced was a transliteration of a name no one here reads in Latin.

## G6 — the home screen agrees with the sidebar

CHECK: the installed-app icons were generated in a phase that no longer exists. Do
they still carry the old mark?
EXPECT: they did.
EVIDENCE: `scripts/brand/make-icons.mjs` regenerates all three from the SAME four
numbers the React mark uses — coal ground, sand bars, mark at 0.52 of the icon
height so it stays inside a maskable launcher's 80% circle. `manifest.webmanifest`
and the `themeColor` pair now carry `#0B0E11` / `#F2F1EE`, which are `--bg` in each
mode: a themeColor that lags the ground shows as a seam above the header.

## G7 — the type is the pairing, and the token stops lying

CHECK: Cairo + IBM Plex Mono, or Tajawal + Archivo?
EXPECT: Tajawal carries every Arabic word; Archivo with `tabular-nums` carries every
number. A monospace face is not what lines a money column up — `font-variant-numeric`
is — and Plex Mono carries no Arabic at all, which cost this project three separate
bugs where a heading fell back glyph by glyph.
EVIDENCE: `src/app/layout.tsx`. The token was also renamed `--font-mono` →
`--font-figure` across 30 files, because a token named "mono" invites the next person
to put code in it or to swap in a real monospace and quietly break every Arabic run
sharing the class. The name was the bug waiting to happen.

## G8 — nothing else broke

CHECK: the rest of the suite.
EVIDENCE:
`npm run typecheck` clean · `npm run lint` 0 errors · `npm test` 433/433 ·
`npm run build` compiled · `sweep-density` every screen under the quiet ceiling ·
`sweep-keyboard` every clickable reachable · `sweep-writes` 12/12 write paths drove
clean · eye-verified at 1440 light/dark on landing, dashboard, orders, products,
reps, settings, and at 390 dark on the dashboard.

## What this phase did NOT settle

The light ground is still an extension. The board prints coal, graphite, steel, sand,
bone and teal, and no light mode at all; `#F2F1EE` is a derivation, said out loud
here and in `globals.css` rather than presented as given. The alternatives are to
build light on bone alone, or to drop light mode. That is the client's call, and it
is still open.
