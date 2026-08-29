# RITM UI v5 — «آلة تحريرية» / The Editorial Instrument

A product design language and seven screens built in it. Real HTML/CSS at
1600×1000 (and 390×844 phones), rendered at 2× → 3200×2000 PNG/JPEG.

    (cd design-system/ui-v5 && python3 -m http.server 8380 &)
    node design-system/ui-v5/render.mjs        # all seven
    node design-system/ui-v5/render.mjs s3     # just one

This is an **exploration**, not the shipped app: v4 (`src/`, governed by
`design-system/VISUAL-LAW.md`) stays as it is. What v5 proposes is a different
answer to the same product — print instead of product-shot, rules instead of
cards — and it is written as markup so any part of it can be lifted straight into
the app if the direction is approved.

## The idea

An accountant's ledger printed by a Swiss press. Money is set like a headline;
everything else gets out of its way. Structure comes from RULES and SPACE. There
is no card in this system, and no sidebar.

## The seven constants (every screen honours all seven)

| | |
|---|---|
| **Type** | Cairo 300..900 for language, IBM Plex Mono 500 for every figure, latn and tabular. A figure and a sentence never share a weight, so a number is recognisable before it is read. |
| **Colour** | ink on paper, one blue. Blue is **reserved**: the primary action, or the one measured quantity. Green and red are verdicts about money and appear nowhere else. Night is used on exactly one screen. |
| **Rhythm** | 4px base, 8px vertical step, a 12-column grid with a 40px gutter and a 72px margin (56 tablet, 20 phone). |
| **Geometry** | 2px radius on surfaces, 999px on the single pill control, **nothing in between** — so «rounded» carries meaning instead of taste. The sheet shows 14px as rejected. |
| **Surface** | paper (base), bone (the one recessed instrument), ink (night). Separation is a 1px hairline at 11% ink. Elevation exists only under the cursor, and only 1px. |
| **Icon** | three hairline glyphs at 1.25px, used only where no word fits. The phone's navigation is words, not icons. |
| **Motion** | 140ms in, 200ms out, ease-out. It reports state: a selected row grows a 2px rule, a pressed control drops 1px. Nothing decorates. |

## The seven screens, and why none is a variation of another

| | Screen | Composition | Density | Navigation | Focal point |
|---|---|---|---|---|---|
| **S1** | الافتتاح · the open | one 132px figure on the reading side, three numbered facts on the other, a wide void between | lowest in the product | masthead only | the figure |
| **S2** | الرحلات · trips | 9 columns of ledger + a 3-column anchored reader, tied by one blue rule | highest list density | breadcrumb + one segmented filter | the selected row and its reader |
| **S3** | تسجيل رحلة · record | a narrow column of work with the live consequence pinned opposite; nothing else on screen | five inputs | none: one task, one exit | the field under the cursor |
| **S4** | القسمة · the split | starts from the WHOLE: one full-width bar in four real parts, then that bar broken out per rep | highest overall | masthead, no filter | the bar (the only full-width element) |
| **S5** | إغلاق الشهر · the close | night. Four huge figures as a colonnade, what gets sealed beside them, a drag gesture at the foot | four figures, one control | masthead | the gesture |
| **S6** | الهاتف · the phone | three phone screens, each re-composed rather than shrunk | varies per screen | **bottom dock of four words** | per screen |
| **S7** | النظام · the system | four bands: type, colour, rhythm and geometry, then 12 states drawn | reference sheet | none | the state matrix |

Nothing is shared between them: not the hero structure, not the navigation, not
the CTA placement, not the section rhythm, not the balance. Three screens have no
masthead nav at all, two have no headline, one has no light.

## Responsive intent (S6)

Not one composition scaled. The **navigation** migrates from a masthead rule to a
bottom dock of words; the **hierarchy** turns three side-by-side facts into three
stacked rules; the **density** of the ledger drops from five columns to three,
keeping the state word, the destination and one amount; the **task** keeps every
field but docks its consequence as a two-figure bar above the keyboard, so the
split stays visible while a thumb types; and **margins** drop 72 → 20 while the
8px step stays, so the rhythm survives the change of measure.

## States (S7)

Drawn, not implied: default · hover · focus (keyboard ring) · pressed (1px drop) ·
primary · disabled with its reason beside it · loading · success · error ·
selected row (2px rule) · empty · validation. A control drawn only in its resting
state has not been designed.

## What the render pass caught

Every one of these was invisible until the screen was looked at:

* **Arabic must never be set in the mono face.** Plex Mono carries no Arabic, so
  `.val` in mono made the browser fall back glyph by glyph and «زيونة» came out as
  «ز ي و ن ة», unjoined. Values are Cairo now; figures opt in with `.num`.
* **A leading minus inside an RTL row lands after the digits** («8,000−»). Every
  money cell is an LTR run.
* **Two spans in one grid cell are inline**, so a row's title and its meta ran
  together into «...مرينوزيونة». Rows stack explicitly.
* **S1's figure at 176px overran its column** and threw the «د.ع.» unit into the
  middle of the screen; the figure is 132px in one LTR row now.
* **S5's slide gesture had its fill on the physical left and its handle on the
  logical right**, so the control read as two unrelated blocks at opposite ends of
  the track. Both grow from the reading edge, and the handle sits at the fill's
  leading edge — mid-drag, which is the state worth showing.
* **A `>` selector missed nested headings** on S7 and glued «الإيقاع» to its own
  description.
