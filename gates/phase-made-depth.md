# Phase — made depth, and the material layer's removal

The client's design instruction, in two parts that only make sense together:

> «ليس مسطحة بحد كبير بقدر ما تكون ابداعية وكرييتف اكثر ومميز وتضم افكار من رفرنس
> واشكال وترتيبات ذات قيمة تصميمة احترافية تفوق قواعد ui ux»

and, on the objects:

> «تطويرها برؤية تصميمة احترافية اكثر»

Read together: **the cure for cheap 3D is not flatness.** Flatness is cowardice.
The cure is depth that is MADE — composition, scale, negative space, an edge that
carries meaning — rather than depth that is SIMULATED.

Reasoning in `design-system/VISUAL-LAW.md` §25 and `DESIGN.md` §3. Decisions in
`docs/PLAN-MULTI-PURPOSE.md` ق8.

---

## G1 · The direction was chosen by looking

- [x] **CHECK** — three depth mechanisms drawn on the real dashboard, same content,
      same type, same palette; only the mechanism swapped. Rendered at 2× and
      compared.
- **EXPECT** — one that reads as an instrument rather than as a template.
- **EVIDENCE**
  - **A · الحفر** — the page is a plate, panels are cut into it: a ground one step
    down plus a dark top lip and a light bottom lip. **Chosen.**
  - **B · الطبقات المنزاحة** — depth from layout offset alone. Contributed ONE
    idea, grafted as `.r-steps`; the rest read as accidental at this scale and its
    accent-panel overlap did not land visually at all.
  - **C · الحافّة الحاملة** — one sand edge whose LENGTH meant something.
    **Rejected on measurement, not taste:** the edge clipped the rep names in the
    ranked list («ليث العبيدي» rendered as «يث العبيدي»), and repeated on every
    panel, row and tile it became wallpaper. A device that does not survive
    repetition is not a device.

## G2 · Depth is stated once

- [x] **CHECK** — how many ways does the product say "this is at a different height"?
- **EXPECT** — one, plus one named exception.
- **EVIDENCE** — `--cut` (a lip pair, no border, no shadow) on `.r-card`,
      `.r-inset`, `.r-choice`, `.r-slab`, and every track. `--float` is the only
      shadow left in the product and only `dialog.tsx` uses it. The old rule — "a
      lighter ground on dark, a shadow on light" — is gone in both halves.

## G3 · The material layer came out, and it was measured

- [x] **CHECK** — `wc -l src/app/materials.css` before and after; count the families.
- **EXPECT** — every family that simulates a material is gone; every family that
      encodes DATA stays.
- **EVIDENCE** — **1,319 → 479 lines.** Thirteen families removed: glass with a
      specular lip and a caustic, the studio scene field, the device shell, the
      digit drums, capsule bars, the halftone plate, the floating dock, the lamp,
      the milled slabs, the 3D squircle on a lit stage, the document folder, the
      ritual button, the lit tick comb. Plus 12 dead tokens from both theme blocks
      (`--glass-*`, `--neu-hi/lo`, the three shadow ROLES).
      **Six of the thirteen were already dead code nothing called** — the tell that
      a language nobody's screen runs was never a language.

      **What stayed, and why:** the distribution bar's hatches and dot screens are
      DATA (diagonal hatch = unfilled remainder, dots = a quieted reading), so a
      colour-blind reader and a printed page still read the split. Same for the
      pace rail. `slide-to-commit`, the ladder, the disclosure and the transitions
      carry no lighting at all.

## G4 · The two objects that carried proportion were rebuilt, not deleted

- [x] **CHECK** — does the object carry a quantity, or was the effect its content?
- **EVIDENCE**
  - `Odometer` **deleted.** Its only content was the drum illusion — flat it is
    just a number, and it rendered ten digit glyphs per drum, so a seven-figure
    amount put seventy characters into the DOM (which blinded the density gate
    once). Replaced by `LivingNumber` where the figure is live and `Money` where
    it is a static sample.
  - `TickMeter` → `.r-comb`, `PriceColumn` → `.r-band`: same quantities, no
    gradients, no bevels, no rim lights.
  - `RingGauge`: the arc's `drop-shadow` halo removed. **Found by eye on the
    styleguide render, not by any sweep** — a coloured bloom around an arc is
    emitted light, and no sweep measures that.

## G5 · Two real regressions, caught and fixed

- [x] **The invisible track.** With bone as the panel, `--surface-2` WAS the panel,
      so every pace track, ranked bar and badge inside a panel went invisible in
      light mode. Caught by eye on the first render. Fixed as one plane per token,
      which forced re-deriving two inks that now sit on three grounds: `--subtle`
      measured **4.22** on the new plane (a fail) and `--accent` **3.85**. Both
      re-derived and measured — subtle 5.08/5.94/6.77, accent 4.58/5.35/6.10.
      `--accent-fill` untouched, so the sand plate is the same sand.
- [x] **White on near-white, twice over, on the landing CTA.** Caught by the
      contrast sweep at **1.13:1**. TWO causes stacked:
      1. `bg-fg` inverts with the theme — in dark mode `--fg` is `#f2f1ee`, so the
         plate was near-WHITE under white text. Fixed with `--ink`/`--paper`, which
         are theme-invariant, because this band is the page's one inverted surface.
      2. The reveal animation was on the plate itself, so the plate started at
         `opacity: 0` — and any moment before the reveal fires is a moment of white
         text on the page. Moved the motion to the inner div; the ground is opaque
         from the first frame.

## G6 · Everything else

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — 0 errors (1 pre-existing warning, `design-system/ui-v7/shell.js`)
- [x] `npx vitest run` — **433 passed**
- [x] `npm run build` — exported
- [x] `sweep-contrast` — **PASS, every text run meets AA**, planted control caught
- [x] `sweep-overflow` — no sideways scroll at 390 / 768 / 1440, no table at 390
- [x] `sweep-density` — every screen under the quiet ceiling
- [x] `sweep-keyboard` — every clickable reachable
- [x] `sweep-writes` — **12/12 write paths drove clean**
- [x] `sweep-corrupt` — **all 20 corruption cases survived**
- [x] eye-verified: every route, both themes, 1440 and 390

## Closed by this phase

**The light ground is no longer an extension.** It was flagged as an open question
for two phases: the identity board prints no light ground and `#f2f1ee` was a
derivation. Bone is now the PANEL and `#f2f1ee` is the page, so bone has a job and
the board's own value is the ground it was drawn as.

## Still open

1. The domain work — `BusinessProfile` as a discriminated union (`goods` /
   `services`), user-defined cost lines, and a first screen per role. Decided in
   `docs/PLAN-MULTI-PURPOSE.md`, deliberately AFTER this phase: new screens should
   not be built on a language that was about to change.
2. `kill-ai-slop` reports 61 hits across 13 groups. Most are box-drawing characters
   in comments. Not audited line by line this phase.
