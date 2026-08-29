# RITM · نظام التصميم / The design system

**حركة منظّمة · ORGANIZED MOTION** — تدفّق ← إيقاع ← بنية ← وضوح ← سيطرة.

This is the product layer of the identity settled in [`../brand/`](../brand/). Nothing
here redraws the mark, the wordmark, the palette or the typefaces: they are the source,
and the work was to answer the question a brand manual cannot — what each of them
**means** inside a product that computes a merchant's real profit and splits it with the
people who sell for him.

    https://claude.ai/code/artifact/c205bf8a-7a37-4a45-a2ba-ab09b7918dd0

    node audit.mjs      # measure: contrast both modes, plane, scale, lattice, RTL
    node render.mjs     # look:    every screen photographed at 2x into renders/

## The files

| file | what it settles |
|---|---|
| `tokens.css` | the whole arithmetic: primitives, semantic colour in **both** modes, type, rhythm, radius, elevation, motion, dimensions, depth order, breakpoints |
| `system.css` | every component, built only from tokens. No literal value below its first line |
| `shell.js` | the icon set, the mark, the navigation, and the one month of figures every screen uses |
| `contrast.js` | one WCAG implementation, shared by the pages that *print* a ratio and the audit that *fails* on one |
| `audit.mjs` | the check that makes each claim here verifiable |
| `render.mjs` | serve and photograph |

## The screens

**Foundations** — `d1` colour (both modes, measured) · `d2` type · `d3` the rhythm grid
· `d4` actions and forms with every state · `d5` feedback, empty, error, loading ·
`d6` the financial language · `d7` the chart language · `d8` motion · `d9` responsive.

**The product** — `p1` the merchant's dashboard · `p2` the same screen in light ·
`p3` the representative on a phone · `p4` the settlement, with its drawer and its
confirmation.

## Five decisions worth defending

**1 · The grid comes from the mark.** The symbol is four capsules of 8, 12, 16 and 4
units on a 24 grid. As twelfths that is 4, 6, 8 and 2, so those are the only legal
column spans. There is no `.span-3`, `.span-5` or `.span-7`. This is what structurally
prevents the four identical cards every finance dashboard opens with: `4+4+4` is legal
and rare, `8+4` and `6+6` and `8+2+2` are what the grid is for.

**2 · Light mode needed a token the dark mode does not have.** Sand `#C6A97D` is
`1.98:1` on paper. It cannot be a word. So light mode carries `--accent` (a fill, dark
ink on top) and `--accent-ink` `#7C6036` (`5.17:1`) as two different tokens, and the
audit holds sand *below* the AA threshold on paper as a failing control: if it ever
passes, someone has lightened a ground and broken the rule silently.

**3 · The dashboard is one number, then a ladder.** Not four cards and a chart. The
screen answers «ما بقي لك» first, at 38px; underneath, where the revenue went, who
earned what and by which rule, and the orders behind it. Beside the number sits the one
thing that needs a decision today — not a fifth statistic.

**4 · A chart that answers no question does not ship.** Four shapes: split (part of a
whole), rank (ordered comparison), trend (change over time), gauge (distance to a
number). Series differ by style as well as hue, every value is labelled in place, and
the totals reconcile with the tables beside them — `5,164,500 − 2,334,920 − 769,200 −
284,580 = 1,775,800` on every screen in this folder.

**5 · Motion explains what changed, or it is removed.** The beat is the brand's own
`120ms`. Exit is two thirds of enter. Only opacity and translate ever move, the translate
is always `2px`, and a figure may recount but never fly. Under `prefers-reduced-motion`
every duration becomes `1ms` — not slower, none.

## What the audit actually checks

Contrast for **every** token pair in both modes, against the darkest ground each ink is
allowed to sit on; that nothing falls off the 1440×900 plane; that no interface text is
under 10px or off the ten-step scale; that every gap and padding is on the 4px lattice;
that no element carries a hairline border *and* a shadow; that no Arabic is laid out in
the Latin face; and that no `direction: ltr` run is missing its isolate.

Each of those rules exists because the corresponding defect shipped in this project at
least once and was invisible to reading the source.

## Two standing substitutions

The brand's named faces are commercial. **Tajawal** and **Archivo** stand in for Tajawal
Next and Neue Montreal and are vendored under `fonts/`, so nothing here needs a network
at render time. Swapping in the licensed cuts is a change to the `@font-face` block at
the top of `tokens.css` and nothing else.
