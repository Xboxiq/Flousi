# Gate · ritm-anti-slop-gate over the rebuilt surfaces

Run after the mark and palette were replaced with the client's original artwork.
Scope: eleven brand boards, fourteen design-system screens.

## Scanner

**CHECK** `node .claude/skills/kill-ai-slop/scripts/scan.mjs` over both folders.
**EXPECT** every remaining hit confirmed by reading the code and either fixed or
justified in one sentence.
**EVIDENCE** first run: 7 groups / 175 hits on `ritm`, 2 groups / 8 hits on `brand`.

### Fixed

| finding | what it actually was | fix |
|---|---|---|
| kicker over a heading | `01 · COLOUR SYSTEM` above the Arabic headline on ten boards, restating it in English | the eyebrow is gone from every head; the board's number lives in the foot, where an index belongs |
| kicker over a heading | `NEEDS YOU` above «ثلاثة تحصيلات تأخّرت» on the dashboard | deleted; the heading already says it and the card is already accent-tinted |
| English label on an Arabic product surface | the sidebar's own group labels rendered `TODAY / MONEY / REVIEW` | renders `اليوم / المال / المتابعة`; a group label is a heading for what is under it, not a kicker, so it is Arabic like everything the merchant reads |
| bilingual doubling | `DAILY NET · صافي كل يوم` said the same thing twice | Arabic only |
| animating width | `.progress > i` had `transition: width` | no transition: a fill that grows on load delays the number beside it, and animating width is on the motion blacklist |
| em dash in Arabic copy | three, in d1 and d3 | colons |
| hit area under 24 | `.crumbs a` was 20px tall | `min-height: 24px` on the link box |
| data mislabelled as decoration | hex captions used `.eyebrow` | `.spec-value`, so the scanner and the reader agree what it is |
| **the colour board printed the previous palette** | d1 still showed `#14181D`, `#1C2128`, `#242A31` and the ratios 8.64 / 6.07 / 1.98 / 2.74 after the tokens were retuned | every printed value re-measured against the palette beside it |

The last one is the important one: the board that certifies the colour system was
certifying the palette it no longer uses. Exactly the defect the earlier review
found on the brand's own Colour board, in a new place.

### Confirmed and justified

* **panel labels** (`SURFACES · الأسطح`, `MEANING · دلالة اللون`) — each is the ONLY
  label on its panel, with no heading under it to restate, so it is a section label
  and not a kicker. The Latin half is the token name a reader will type into the CSS.
* **`01` in a chart** (d7) — an axis tick, i.e. day 01, not a section marker.
* **`border-radius: 50%`** — a radio dot and a spinner. A radio is a circle.
* **the mark SVG** flagged as a pastel icon tile — it is the mark.
* **box-drawing rules in code comments** — not user-facing.

## Responsive, measured rather than asserted

**CHECK** the product at 390 × 844 in RTL.
**EXPECT** no sideways scroll, no tap target under 24.
**EVIDENCE** the first run of this check failed: 460px of sideways scroll on three
screens, and 44×20 crumb links. The scroll was the check's own fault — a fixed 1440
artboard measured at 390 measures the frame, not the layout — so `p5-mobile.html` was
built: the same tokens and components in a real 390 plane, where the media queries
actually run. The crumb hit area was a real defect and is fixed. Now `✓`.

## Pre-flight matrix

- [x] Both themes viewed; light is composed on paper, not an inversion; every token re-measured on both
- [x] Single accent: sand only for action; green/red for money only; warning orange and info teal never borrow them
- [x] Radius from tokens; capsule = half its height, read off the mark
- [x] Elevation declared once — the ghost card check is in `audit.mjs` and is clean
- [x] Zero em dashes; zero head kickers; the one `01` is an axis tick
- [x] Numbers tabular, Latin, `Intl`-formatted, isolated; polarity coloured AND signed
- [x] Every interactive element has default / hover / focus / active / disabled / loading — drawn on d4, not described
- [x] Hit areas ≥ 24 (measured at 390); focus ring 2px sand at ≥ 3:1
- [x] Contrast: 43 pairs measured in both modes, plus three failing controls
- [x] RTL: logical properties only; `unicode-bidi: isolate` on every LTR run, checked by the audit; 390 and 1440 both rendered
- [x] Motion: tokens only, no width/height animation, reduced-motion collapses everything to 1ms
- [x] `scan.mjs` reduced to justified leftovers, each named above
- [x] Signature moment, and it is nameable: the split bar. One shape answers the product's whole question — of 5,164,500 sold, 1,775,800 stayed.

## Two conflicts recorded, not resolved silently

1. **The gate says Phosphor only; the identity board prints its own icon set.** The
   icons here are drawn to the board's geometry (24 box, 20 live, 1.75 rendered px)
   and are a stand-in for the client's own set, exactly as Tajawal stands in for
   Tajawal Next. Recorded in `VISUAL-LAW` §20; must be replaced before product code.
2. **The gate's colour clauses describe the retired v4 world** — Apple-blue accent,
   blue-family meshes, IBM Plex Mono numerals. RITM's approved identity is sand on
   ink with Tajawal and Archivo. Where the gate's letter contradicts the client's own
   identity, the identity wins and the clause is logged rather than obeyed.


---

## Second pass · after the system was widened to the product's real scope

Five surfaces added (`d10`, `p6`–`p9`). The gate found two more things, both of the
kind that stay invisible until something measures them.

**A component used on five screens and defined nowhere.** `.toolbar` — the strip above
every table — had no rule in `system.css`. It did not clip, overflow or fail contrast;
it simply laid out as plain blocks, so a 220px search box spanned a whole card on four
screens. `audit.mjs` now has a **class gate**: every class a screen names must be
declared in a shared stylesheet or in that page's own `<style>`. Two dead class names
(`card-f`, `main`) were removed at the same time.

**Figures that did not reconcile, twice.** The product record's cost table totalled
27,278 against a header saying 27,300, and the archive board froze August's rep shares
into July. Both are now derived from one set: 19,000 + 1,400 + 922 + 1,518 + 3,200 +
1,260 = 27,300, and 42,000 − 27,300 = 14,700 at a 35.0% margin.

Em dashes: three more, all in code comments and a table sentinel rather than rendered
copy. The sentinel is now `null`, so the banned glyph is not in the file at all.
