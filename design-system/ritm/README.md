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

## What RITM is

Not a profit calculator. Four jobs, and the design system has to carry all four:

1. **مراقبة الطلبات** — every order holds TWO independent facts: where it stands
   (في الطريق / مُسلَّمة / راجعة / ملغاة) and where the money is (عند المندوب / بيدك).
   The domain refuses to merge them because in a cash-on-delivery market the cash sits
   with the courier for weeks. A returned order is not revenue however it was recorded.
2. **الأرشيف** — accounting periods that close and freeze. A closed period is read-only
   and its summary is a snapshot, so a report written in July does not drift in October.
3. **السجل والتفاصيل** — products with a full cost breakdown, commission schemes and
   targets on one precedence ladder, and a movement log where a correction is a new
   entry and never an edit.
4. **الأرباح والحصص** — what the first version of this system covered.

Plus one rule that shapes the interface: **balances are per currency and are never
summed**, because the domain holds no exchange rates and will not invent one.

## The screens

**Foundations** — `d1` colour (both modes, measured) · `d2` type · `d3` the rhythm grid
· `d4` actions and forms with every state · `d5` feedback, empty, error, loading ·
`d6` the financial language · `d7` the chart language · `d8` motion · `d9` responsive ·
`d10` **the object model**: what the system recognises, in what states, under what names.

**The product** — `p1` the merchant's dashboard · `p2` the same screen in light ·
`p3` the representative on a phone · `p4` the settlement · `p5` **the dashboard at 390**,
where the responsive rules actually run · `p6` **order monitoring**, the two axes drawn
as two axes · `p7` **the archive**, a closed period beside what it would be if it drifted
· `p8` **the ledger**, per-currency and without a summing row · `p9` **the product
record**, every cost line with the rule that produced it.

## Five decisions worth defending

**1 · The grid comes from the mark.** The symbol is four bars of ONE width at ONE
pitch whose feet step down by exactly that pitch, with the fourth deliberately short.
Horizontally that divides its own width into four equal columns of three, so the legal
spans are 3, 6, 9 and 12 — there is no `.span-4`, `.span-5` or `.span-8`. The
distinctive half of the law is vertical, because that is where the mark varies: blocks
stack in descending reach and exactly one is deliberately short. Four equal boxes in a
row is the one shape this mark cannot make, and it is precisely the shape every finance
dashboard opens with.

**2 · Two roles needed a token the source does not print.** Sand `#B8A880` is `2.08:1`
on paper, so it cannot be a word: light mode carries `--accent` (a fill, dark ink on
top) and `--accent-ink` `#736440` (`5.13:1`). The board's teal `#3D8680` is `3.89:1` on
coal, so it cannot be a word either: `--signal` fills and `--info` `#4AA49C` carries the
word. Both are the same rule — where a role needs a value the source does not provide,
that is a NEW token, never the same one quietly reassigned — and the audit holds sand
and teal *below* AA as failing controls. If either ever passes, a ground was lightened
and the rule broke silently.

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

## The source

`../assets/original/` holds the client's own artwork and the mark redrawn from it. The
six colours the identity board prints are used unchanged; everything else here is
derived and says so. Two gaps in the source are marked as extensions rather than
papered over: the board carries **no light ground** (paper `#F2F1EE` and its whole light
set are ours), and it carries **no profit or loss colour** (a product that judges money
must have them).

## Two standing substitutions

The brand's named faces are commercial. **Tajawal** and **Archivo** stand in for Tajawal
Next and Neue Montreal and are vendored under `fonts/`, so nothing here needs a network
at render time. Swapping in the licensed cuts is a change to the `@font-face` block at
the top of `tokens.css` and nothing else.
