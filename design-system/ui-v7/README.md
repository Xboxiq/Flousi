# Flousi · UI v7 — a product interface, built from references

Six screens and the component system they are made of. Real HTML/CSS at
1440×900 (the component sheet is taller), rendered at 2×.

    (cd design-system/ui-v7 && python3 -m http.server 8391 &)
    node design-system/ui-v7/render.mjs        # all six
    node design-system/ui-v7/audit.mjs         # the gate — must print ✓

## Why v7 replaces v6

v6 was art direction wearing a product's clothes. It invented a private visual
language — «area is the only encoding», glazes, kilns, chamfers — that a merchant
would have had to learn before he could read his own money, and it called that
design. The client's note was **«اعتمد على رفرنس والتفكير ك مصمم مو ك رسام»**, and
it is correct. A designer starts from what has been proven and earns every
departure from it.

So v7 has no invented vocabulary. Every decision below cites the reference it
came from, and the three departures are named and justified.

## The references, and what each one decided

| source | what it settled |
|---|---|
| `products.csv #42` · Banking / Traditional Finance | the style: **Minimalism & Swiss + Accessible & Ethical**. «Security-first. Account overview. Transaction history. Accessibility critical. Trust paramount.» |
| `styles.csv #28` · Data-Dense Dashboard | the metrics, unaltered: sidebar **240**, header **56**, table row **36**, grid gap **8**, card padding **12**, 12-column grid, sticky table headers, sortable columns, row hover, KPI card row, filter toolbar, export |
| `styles.csv #1` · Minimalism & Swiss | grid-based, one accent, clear hierarchy, no decorative shadow |
| `colors.csv #42` | the palette, **unmodified**: primary `#0F172A` · secondary `#1E3A8A` · accent `#A16207` · bg `#F8FAFC` · card `#FFFFFF` · muted `#E8ECF1` · muted-fg `#475569` · border `#E2E8F0` · destructive `#DC2626` · ring `#0F172A` |
| `arabic-fonts-extract.csv` | **IBM Plex Sans Arabic**, ranked first for «clean modern minimal professional readable · arabic RTL», paired with **IBM Plex Mono** — one superfamily, drawn to sit together. Downloaded and subset into `fonts/`. |
| `stacks/shadcn.csv` | the component vocabulary and its rules: Sidebar for app nav (#44) · **Table for tabular data, never a div grid** (#24) · Tabs for content switching (#27) · Dialog for modals (#11) · Field + Input for forms (#16) · Badge for status · Sonner-shaped toast (#31) |
| `ux-guidelines.csv` | tables scroll inside their own wrapper (#71) · reserve space so nothing jumps (#19) · loading matched to the wait (#78) · **multi-select plus one bulk action bar** rather than repeating actions per row (#91) · a placeholder is never a label (§8) |
| `charts.csv` | one chart per data shape: **line** for trend, with the two series told apart by **line style and direct labels, never hue alone**; **100% stacked bar** for part-to-whole in an accessibility-first context, not a pie; **horizontal bars sorted descending** with direct values for ranking |

Icons are **Lucide** geometry (24 box, 1.75 stroke, round caps) because Lucide is
shadcn's own icon set — the reference, not a hand-drawn set.

## The three departures, and why each is allowed

1. **The split bar.** One 100% stacked bar showing where a month's revenue went.
   Generic dashboards do not have this; «what is actually mine» is this product's
   entire reason to exist, so it gets the one chart that answers it directly.
2. **A stable hue per rep.** Four people are named on every screen; giving each a
   colour for life makes the team legible at a glance. It is never used for a
   status — status is a separate, restrained system.
3. **«مجمَّد» on frozen prices and rules.** The promise that a closed month cannot
   be rewritten is the product's core claim, so it is visible wherever a frozen
   figure appears rather than buried in a settings page.

## The six screens

| | screen | pattern |
|---|---|---|
| **S1** | لوحة اليوم | KPI row → trend + split → recent table + ranking → target, dues, decisions |
| **S2** | الرحلات | the full data table: search, segmented filter, date range, bulk bar, sortable headers, totals row, pagination |
| **S3** | رحلة جديدة | form with visible labels, hints, one live error, and the consequence in a reserved column so nothing jumps |
| **S4** | المندوبون | master–detail: list on the reading side, record with tabs, figure row, settlements, monthly bars |
| **S5** | تقرير أغسطس | the closed month: split bar, ranking, per-rep breakdown, per-category table, all reconciling |
| **S6** | دليل المكوّنات | the system itself: tokens with **measured** contrast, type scale, spacing, the icon set, and every control in every state |

## The gate

`audit.mjs` runs the reference's own priority order against the rendered DOM:
accessibility first, then interaction, then typography and colour, then forms.

| | check |
|---|---|
| 1 | every rendered text node clears WCAG AA against its **actual painted** ground, at its real size and weight |
| 2 | no two text boxes overlap |
| 3 | nothing clipped by an ancestor |
| 4 | every button and link has an accessible name |
| 5 | every input has a real label, not a placeholder |
| 6 | every font size is on the scale |
| 7 | no interactive target under 26px |

All six screens pass.

## What the render pass and the gate caught

* **Arabic in the monospace face, again.** `.tbl th.n` inherited IBM Plex Mono,
  which carries no Arabic, so «صافي الربح» fell back glyph by glyph and lost its
  joins. Only the numeric **cell** is monospaced now, never the header.
* **The report did not reconcile with its own chart.** The rep table summed to
  1,437,670 while the split bar above it said the reps took 769,420. Every figure
  in v7 now derives from one set: ليث 736,000 × 45% = 331,200 · سعد 996,000 × 30%
  = 298,800 · زينب 116 قطعة × 1,200 = 139,200, summing to **769,200**, which is
  exactly the rep slice of 5,164,500. A money product may ship no other defect
  more cheaply than this one, and none is worse.
* **`all:unset` on a list button** also unsets `box-sizing`, which pushed 24px of
  padding outside a 300px card and clipped every amount in the team list.
* **A placeholder at `#94A3B8` is 2.6:1.** Placeholders are `#64748B` (4.8:1).
* **The accent badge was 4.42:1**, just under AA at 11px. Its ink is `#7C4A06`.
* **A 9px icon caption** is below the 10px floor the guidelines set.

## What the anti-slop gate changed

Run per `CLAUDE.md`, and it found four real hits:

* **Ghost card.** `.card` had a hairline border **and** a shadow. Elevation is
  declared once now: cards use the border, and only genuinely floating things
  (toast, dialog) use a shadow, dropping the border in exchange.
* **The default semantic rainbow.** Tinted status boxes at `-50` background with
  `-600` text are the banned pattern. A settled state is now a neutral chip with
  a small coloured dot; a tint is reserved for the two states that actually want
  a decision (مفتوحة, مرتجع). Colour is never the only carrier — every badge
  says its state in words.
* **Nested cards.** The rep record had four KPI cards inside a card. It is a
  figure row on hairlines now.
* **An em dash** in the report's totals row.

Two conflicts are recorded rather than resolved silently, in
`design-system/VISUAL-LAW.md` §17: v7 uses **Lucide** where the shipped app uses
Phosphor, and it uses a **pure-white card** on an off-white page because
`colors.csv #42` prescribes it.

## Status

An exploration, like v5 and v6. `src/` still speaks v4 under `VISUAL-LAW.md`.
Unlike v5 and v6, this one is built from patterns the app can adopt piece by
piece: the sidebar, the table, the toolbar and the field are ordinary components,
and each can be lifted on its own.
