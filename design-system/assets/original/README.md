# المصدر الأصلي / The original artwork

Supplied by the client on `main` (`9f60ee8`). Copied here so the design system
sits next to the thing it is accountable to.

## What these files actually are

All four are an **SVG wrapper around an embedded PNG** — zero `<path>` elements.
They are visual references, not editable assets, and the embedded rasters are small:

| file | real pixels |
|---|---|
| `RITM_original_logo.svg` | 200 × 130 |
| `RITM_original_symbol.svg` | 80 × 195 — the fourth bar is cropped off the frame |
| `RITM_original_app_icon.svg` | 155 × 235 |
| `RITM_original_identity_board.svg` | 1536 × 1024 |

So the symbol could not be traced from `RITM_original_symbol.svg`: it does not
contain the whole mark. It was measured from the board's «الرمز» panel instead.

## `mark.svg` — the symbol, redrawn as vector

Measured from the board at pixel precision: bar width **12.5**, pitch **19.7**
in a **71px** mark, i.e. `w / pitch = 0.635`. Normalised to a **24 × 39** box:

* bar width **4.2**, fully rounded (radius = half the width), pitch **6.6**
* bottoms step down by exactly one pitch: **39 · 32.5 · 26 · 19.5**
* the three long bars' tops step by half a pitch: **7 · 3.5 · 0**
* the fourth bar is short — **14**, a little over two pitches — and hangs between
  the others. It is what stops the run reading as a plain ascending bar chart.

`reconstruction-proof.png` is the check: the original at scale, the redrawn mark,
and the two overlaid. The outline sits on the original's edges.

## The palette printed on the board

    #0B0E11   #1A1F24   #2A2F36      grounds
    #B8A880   #E8E2DA   #3D8680      sand, bone, teal

Measured, before anything is built on it:

* sand on ink **8.25:1**, on `#1A1F24` **7.07:1**, on `#2A2F36` **5.74:1**
* sand on bone **1.82:1** — it is a fill on a light ground, never a word
* teal on ink **4.53:1**, on `#1A1F24` **3.89:1** — it FAILS as body text on a
  card, and needs a decision rather than a default
* bone on ink **15.04:1**

The board carries no light ground. Any light mode is an extension beyond it and
has to say so.

## One conflict worth recording

The board's own dashboard mock is four identical KPI cards, a line chart and a
donut. `../../ritm/` bans all three. The board is art direction for the identity;
the ban is a product rule, argued in `ritm/README.md` and `../../VISUAL-LAW.md`.
Neither is silently overruled.
