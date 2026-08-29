# RITM UI v6 — «مساحات» / FIELDS

A second product design language, and six screens built in it. Real HTML/CSS at
1600×1000 (phones at 390×844 inside F5), rendered at 2× → 3200×2000.

    (cd design-system/ui-v6 && python3 -m http.server 8390 &)
    node design-system/ui-v6/render.mjs        # all six
    node design-system/ui-v6/render.mjs f3     # just one

## Why it exists

The client's note on the previous set was **«جودة تصميم مو نفس الصور ولا الأشكال»**:
raise the quality, and stop reproducing the same images and the same shapes. That
is a fair reading of v5 and of both campaign sets. They shared an object
vocabulary and a compositional formula, and a claim of non-repetition does not
survive four sets that all reach for a huge mono figure, a hairline rule and a
recessed panel.

So v6 keeps the brand constant (Cairo, IBM Plex Mono, latn, RTL by logical
properties) and throws out the forms. Not by picking different shapes, which
would only relocate the problem, but by deriving every shape from a single law.

## v6.1 — the measured cut

The first cut had the idea and lost the craft. The client's note was
**«التصميم والأشكال كلها اختربت وضاعت تفاصيل التصميم»**, and it was right. Three
faults, each measured rather than argued, each now checked by a script:

**1 · Contrast.** Six of the nine ink-on-ground pairs failed WCAG AA. Every
secondary ink was an alpha of the primary, which is a dimmer, not a colour
decision: `rgba(23,19,15,0.40)` on limestone is **2.49:1**. Every ink is a solid
value now, chosen against its ground, with its ratio written beside it in
`tile.css`. Turquoise itself moved from `#14807A` (white 4.54:1, a hair over the
line at any size) to `#0E5F5A` (**7.12:1**), because a person's glaze carries
white text on five screens. Saffron takes kiln ink at **7.38:1**, never gypsum at
2.38 — so the rule is: *the ink on a glaze is whichever ground passes.*

**2 · The scale was not a scale.** Body text drifted across 11.5 / 12 / 12.5 / 13
/ 13.5 / 14 / 14.5 / 15 / 16 / 16.5 / 17 / 19px — eleven sizes doing the work of
four. There are six text steps and four mono steps now, as tokens. A literal
`font-size` in a screen file is a build failure. Same for geometry: every padding,
margin, gap and inset is a multiple of 4, audited, with 1px carets and 2px rules
the only exceptions.

**3 · Voids were leftovers, not negative space.** Because area is the encoding, a
field's size comes from its amount, not its content — so a field holding 45% of
the plane held one label in a corner and 690px of nothing. That is residue, not
composition. Hence **clause 8**: a field over 240px tall carries a foot, and the
honest foot is almost always *the next level of the same law*:

| screen | what filled the void | how |
|---|---|---|
| F1 | the kept profit, by category | a **vertical** nest, because the field is 523×1000 |
| F1 | the purchase cost, by supplier | a **horizontal** nest, because that field is wide |
| F2 | five ledger lines, not three, and a provenance line capping the totals | the void is now bounded at both ends |
| F4 | every paid field, by settlement | horizontal in a 583px strip, **vertical** in a 237px one |
| F5 | each band's margin and its stamp | a foot row, except under 240px where the two-row form is used instead |

A nest always partitions along the field's **longer** axis, and its children carry
the parent's glaze: only grout separates them.

## The audit

    node design-system/ui-v6/audit.mjs      # needs the server on 8390

Seven checks, four static and three live in Chromium, because every fault this
language actually shipped was invisible in the source:

| | check |
|---|---|
| A1 | no literal `font-size` anywhere — the scale is tokens or it is not a scale |
| A2 | every geometric literal on the 4px half-step, or below 6px where it is a caret, a rule, or the grout |
| A3 | no rule sets `direction` **and** `inset-inline-*` — that flips the element's own inline axis |
| B1 | every rendered text node clears WCAG AA against its actual painted ground, at its real size and weight |
| B2 | clause 8: every field over 240px tall carries a foot, unless it is a container or its own text already reaches 65% of its height |
| B3 | nothing clipped: no text box and no painted box exceeds its clipping ancestor |
| B4 | nothing overlapping: no two text boxes intersect by more than 3px |

B4 is the one that would have caught «14.9%» printed through «769,420», B3 the
foundry's footer pushed off the plane entirely, and B1 the six failing inks.
All six screens pass.

## The law

**AREA IS THE ONLY ENCODING.** This product exists to divide a whole, and a
division is a plane cut into parts. So a quantity is drawn as a **field** whose
area is its amount, and never as a bar, a rail, a ring, a gauge or a sparkline.
Two amounts are compared by standing their fields side by side.

Everything else follows, which is the point: none of it is taste.

| | |
|---|---|
| **1 · No lines** | A field needs no border, because its own edge is its outline. The only separator is 4px of **grout**: the gypsum ground showing between two fields. The line is subtractive; nothing is ever drawn. |
| **2 · No radius** | Nothing is rounded, anywhere. The one soft form is a 16px **chamfer** on the leading-bottom corner, and it means exactly one thing: a hand may touch this field. Cut = live. |
| **3 · Glaze = who** | Each person owns one glaze for life, at every scale, on every screen. ليث is lapis on F1, F2, F3, F4 and F5. Full glaze is a frozen fact; **bisque** is a projection, or a part that was never yours. |
| **4 · Ink = verdict** | A verdict never fills a field, it colours the words in one. Without this split, «success» would have to borrow سعد's turquoise and a person would become a status. |
| **5 · Type inside** | A label lives inside the field it names, hung from that field's leading-top corner; its size is a function of the field's area and its glaze. Hierarchy is emergent, not assigned. The one exception: in a field wider than it is tall (a row) the figure ranges to the trailing edge so a column of figures aligns. |
| **6 · Two grounds** | Limestone is the day; kiln is the sealed and the settled. One screen alone (F4) puts both on the same plane, at the seam. |
| **7 · Re-tile** | Motion is never a slide or a fade. Fields grow and shrink along the lattice in 220ms, so a change in the numbers is seen as a change in the **map**. |

Focus is geometric: the leading corner cut **doubles** and the field goes gypsum.
No ring, because nothing in this system is drawn.

## The six screens, and why none is a variation of another

| | Screen | Composition | Density | Navigation | Focal point |
|---|---|---|---|---|---|
| **F1** | الخريطة · the map | full bleed, no margin and no page: a two-level treemap at true area, exact to the percentage | 4 figures + 4 nested, no prose block | a **spine** of tiles on the trailing edge | the kiln column |
| **F2** | السجل · the register | six full-height columns read outward from the reading edge; a column's width is the attention that step is owed | highest per-column | **none** · one task, one exit | the gypsum field the caret is in |
| **F3** | النسيج · the weave | 60 square cells, each holding a centred field; a marginal total below, held off by a wider grout | highest on the plane | the rep names **are** the navigation | the pattern, not a number |
| **F4** | الحدّ · the seam | vertical strips whose widths are earnings, each cut at its own paid height, so the seam zigzags | 4 strips, 11 figures | a band of words on the bottom **edge** | the seam |
| **F5** | الجيب · the pocket | three phones: a one-axis partition, a list, a docked task | varies per frame | a **corner tab** in three states | per frame |
| **F6** | المسبك · the foundry | the sheet the language is fired from, itself a partition | reference | none | the state matrix |

Nothing is shared between them but the spine on F1 and the glazes. Two screens
have no navigation at all, one has no headline, one has no margin, one is the only
screen with two grounds, and one is the only screen where no single number is the
answer.

## Responsive intent (F5)

Not one composition scaled. On a 1600px plane a partition can run in two
directions; in a 390px hand it can only run in one, so the month's map becomes
**bands** whose heights are the amounts and the area law survives on a single
axis. The **navigation** collapses from a spine and a bottom band into a corner
tab cut into the leading-bottom corner, where a thumb already rests; it opens
upward into five words and **reserves its space** rather than lying over content.
The list drops from seven trips to five and says so, and states each trip's size
with the weave's own square rather than a fifth column of figures. The task keeps
every field and docks its consequence above the keyboard, so the split stays
visible while a thumb types.

## What the render pass caught

Every one of these was invisible to the typechecker and to me until the screen was
looked at. Two of them are laws, not slips, and are recorded in
`design-system/VISUAL-LAW.md` §16.

* **F3's first cut was a bar chart.** Cells were 96×148 and every field was
  anchored to its cell's baseline, so height dominated and four rows of glazed
  bars appeared — the exact shape this language exists to avoid. Cells are square
  now and every field is **centred**. The marginal total had the same disease and
  got the same cure.
* **`inset-inline-*` resolves against the element's own `direction`.** Every
  percent stamp in v6 set `direction:ltr` on itself, which flipped its inline axis
  and threw it onto the reading edge; on F5 one printed straight through the
  figure it belonged to. A digits-and-per-cent run is ET/EN under bidi and needs
  no override at all.
* **A light field on a dark screen must declare its own ink.** `.f.stone` had a
  background and no colour, so four of F2's six columns and all three of F5's
  phones inherited the dark page's light ink and went nearly unreadable.
* **A kiln band on a kiln page is not a band.** F5's «ما بقي لك» vanished into the
  page ground; gypsum is already this language's «what stays yours» surface, so it
  became gypsum.
* **A kiln button on a kiln field is not a button.** F4's «سجّل تسوية» read as a
  sentence until it went gypsum.
* **Two labels pinned to opposite corners collide in a narrow field.** F4's 237px
  strip printed «أبعد الفريق عن الحدّ» through «424,320». Both feet on that
  screen are flex blocks now; nothing that can collide is positioned by corner.
* **A read-out taller than its row is a lid.** F3's first read-out was 200px over
  a 90px row and buried three cells; it is now exactly one row tall and grows away
  from the reading edge.
* **A Latin string with an Arabic word inside it reorders into nonsense.** F6's
  arithmetic came out as «= 284,580 · 14.9% = 769,420 …», every operand on the
  wrong side of its own equals sign, and the tag line reversed its own halves.
* **F1's largest field had a 690px void.** Filling it with the second level of the
  same law — the purchase cost partitioned by supplier, separated only by grout —
  was better than shrinking the field or padding it with prose.

And what the v6.1 audit caught, after all of the above had been eye-verified:

* **The foundry's whole footer was off the plane.** A row set to `flex:1 1 auto`
  grew past its share and pushed the last 48px out of a 1000px screen. Nobody saw
  it in four passes of looking; the clipping check found it in one run.
* **A gypsum-on-kiln overlay had no ground of its own.** F4's settlement control
  read fine because it happened to sit over a dark field, but its contrast
  depended on what was behind it. It is one gypsum block now, so the ratio is a
  property of the control and not of its position.
* **The 100px band could not carry clause 8.** Forcing a head and a foot into
  F5's 14.9% band printed «أربع قسمات مختلفة» through «769,420». A field under
  240px uses the two-row form: name and stamp share the top line, figure below.
* **A mono stamp forced onto the tag step.** The first normalisation pass mapped
  every monospaced run to 10.5px, shrinking four screens' figures. Mono has its
  own four-step ladder now; a stamp is not a caption.

## Status

An **exploration**, like v5. `src/` still speaks v4 and is still governed clause
by clause by `design-system/VISUAL-LAW.md`. It is written as markup so any part of
it can be lifted into the app; the moment a piece is, the v4 clause it
contradicts gets settled in §16 in writing.
