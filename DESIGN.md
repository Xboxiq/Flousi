# DESIGN.md — رِتم

The design system as it is actually implemented, not as it was imagined. Every
number here can be found in `src/app/globals.css`, `src/app/ritm.css` or
`src/presentation/components/structure/`, and every rule here is enforced by a
script under `scripts/sweeps/` or it is not a rule.

The long-form reasoning — why a decision was taken, and what it cost to learn —
lives in `design-system/VISUAL-LAW.md`. This file is the reference.

---

## 1 · What the product is

RITM is a local-first operations app for a small Iraqi merchant who sells online
and delivers cash-on-delivery through reps. It is **not** a profit calculator with
extras: it is order monitoring, an archive of frozen months, a commission ledger,
and a cost sheet, and the merchant opens it for all four.

Three facts about the user shape every screen:

* **He reads Arabic, right to left, and reads figures left to right.** RTL is the
  architecture, not a setting.
* **He is often standing in a shop with a phone.** The phone is not a shrunken
  desktop; it is where trips and people get checked.
* **His money is in three places at once** — in his hand, with a courier, on the
  road. An app that reports one balance answers a question he did not ask.

### The questions the product answers, and where

| question | screen |
|---|---|
| كم عندي اليوم | `/dashboard` |
| وين طلبياتي ووين مالها | `/orders` |
| هل هذا المنتج يربّحني | `/products/view` |
| منو يستاهل كم | `/reps` · `/settlements` |
| كم استهدفت وكم بلغت | `/targets` |
| شنو صار | `/ledger` |
| شنو جُمِّد | `/periods` |

---

## 2 · Personality

Four qualities, chosen and not stacked:

**دقيق (precise)** · **هادئ (calm)** · **صريح (plain-spoken)** · **متين (durable)**

What that rules out, concretely: no atmospheric gradients, no glass, no
decorative 3D, no icon tiles above headings, no giant context-free statistics, no
badge walls, no motion that is not carrying information. What it rules in: solid
grounds, hairline rules, real tables, figures at the size their importance earns,
and Arabic that says what it means.

---

## 3 · Colour

The palette is the client's own identity board, measured off the original
artwork. Six values are printed by the board and used unchanged:

| | hex | role |
|---|---|---|
| coal | `#0B0E11` | the page, dark |
| graphite | `#1A1F24` | a card |
| steel | `#2A2F36` | a nested surface, a table head, an input |
| sand | `#B8A880` | the one accent |
| bone | `#E8E2DA` | the warm light |
| teal | `#3D8680` | the live signal |

**Dark is the identity's native mode.** The light ground, paper `#F2F1EE`, is an
EXTENSION — the board prints no light ground — and that is stated where it is
declared rather than smuggled in as given.

### The rule that matters most

**Sand is a plate, not a word.** `#B8A880` measures 2.08:1 on paper and 1.9:1
under white. So the accent is two tokens and they are not interchangeable:

* `--accent` — the value that must READ. `#736440` on light (5.13 on paper), sand
  itself on dark (8.25 on coal).
* `--accent-fill` — the value that FILLS. The board's sand, in both modes.
* `--accent-fg` — the ink each mode's accent needs. White on light, coal on dark.

Getting these backwards is the easiest way to ship an unreadable screen that
looks correct in a mockup. It happened five times in one pass and was caught by
measurement, not by eye.

### What each colour is allowed to mean

* **Green and red judge MONEY**, and nothing else. Profit against loss.
* **Amber is a warning** — behind pace, a trip that needs a decision. A late
  target has cost nobody anything, so it is never red.
* **Teal is information**, and it is a FILL: `#3D8680` clears the 3:1 a shape
  needs and misses the 4.5 a word needs, so `--info` carries a lifted twin.
* **Sand is action and attention**, and one screen gets one sand button.

### Chart bands

Four, and each ships the ink that survives on it: `--series-1..4` with
`--on-series-1..4`. A band is a fill, so a legible band on coal
(`#2E3238`) is an unreadable one on paper — the pair is declared per mode.

### Structural lines

`--line` is a SOLID colour, not a translucent border. A wash over two different
surfaces is two different greys, which is what made the boards' crispness
impossible to reproduce.

---

## 4 · Type

Three roles, two skeletons, one voice. The pairing is the oldest working one in
Arabic typography and not an invention: **Kufi for what is built, Naskh for what
is read.**

| token | face | what wears it |
|---|---|---|
| `--font-display` | **Noto Kufi Arabic** | titles, the wordmark, table heads, eyebrows |
| `--font-sans` | **IBM Plex Sans Arabic** | every word that is read rather than scanned |
| `--font-figure` | **IBM Plex Sans** | standalone Latin and every number in the product |

Noto Kufi is geometric and flat-based — the same construction as the four-bar
mark, which is why it belongs to *this* product rather than to any product. Plex
Arabic is drawn for interfaces: open counters that survive 11px, seven real
weights, and a Latin companion cut from the same skeleton, so a Latin word inside
an Arabic sentence no longer switches design mid-line. The two Plex faces mean the
whole product is one type design plus one deliberate voice.

What this replaced was **Tajawal for everything plus Archivo for figures**, and the
client's verdict on it was «خطوط مخزية». The measurement agreed: Tajawal is the
face every Arabic template ships, it has almost no vertical drama, and a screen set
entirely in it has one texture — so nothing on it can be more important than
anything else by voice alone.

**Reem Kufi was tried first and rejected on sight**: it is a display Kufi and its
joins come apart below about 16px, which is most of this app.

Never set Arabic in a Latin-only face. Doing it once cost this project three
separate bugs where a heading fell back glyph by glyph and lost its joins. Each
stack therefore falls back through the *other two* before it reaches the system, so
a heading with a year in it resolves that run to Plex rather than to whatever the
OS hands back.

The figure token is called `--font-figure`, **not** `--font-mono`: a monospace
face is not what lines a money column up — `tabular-nums` is — and a token named
"mono" invites the next person to swap in a real monospace and silently break
every Arabic run sharing the class.

### The weight law

Four weights, one job each. Before this there were 175 weight decisions in the app
and no law behind them, 135 of them at 600 or 700 — a screen where everything is
emphasised and therefore nothing is.

```
400  prose, descriptions, table cells, secondary values. The default.
500  the identity of a row, nav items, buttons, chips, values in a definition list.
600  structure: headings, eyebrow labels, table heads, the current nav item.
700  a figure that carries a decision, and the wordmark. NOTHING ELSE.
```

The last line is the point: **bold here does not mean "important text", it means
"a number you act on".** A heading is therefore lighter than the figure under it,
which looks wrong for one second and then reads correctly forever.

One correction rides on top: weight is optical, so the same apparent colour needs
less of it as the glyph grows. A figure above 22px steps back one rung — the 56px
hero is 600, an inline figure in a table cell is 700.

### The tracking law

**Arabic is never tracked.** It is a connected script and `letter-spacing` inserts
its space *between joined glyphs*: at 0.04em «الشهر» starts to come apart, at
0.08em it is visibly two words. The app carried 0.04em on `.r-label` and on every
table head — a Latin habit (tracked-out small caps) applied to a script that has
no such convention and is damaged by it. Verified by eye at 4× before it was
removed. An eyebrow is set apart by its **face, its size and its colour**.

Latin figures are the opposite case: they do not join, so tightening them is
optical work rather than damage, and they tighten as they grow (−0.01em at text
sizes, −0.03em at the hero).

### The currency mark

`formatCurrency` appends «د.ع.» to the string, and the app used to print it at the
figure's own size — which made a four-character word as tall as the 56px hero it
qualifies, and on a phone took most of the line. The client's own dashboard board
prints it beside the hero at a fraction of its size, and on the rows underneath
prints no currency at all.

Both `<Money>` and `<Metric>` now split the trailing mark and set it at
`max(10px, 0.34em)` with 60% opacity. One rule has to serve a 56px hero and an
11px table cell: the em term keeps it proportional where there is room, the 10px
floor keeps it legible where there is not.

### The ladder

Ten steps. Five (13, 16, 22, 38, 56) are the brand's own display ladder; the
other five are the density a product needs and a manual does not.

```
--fs-label 10   --fs-caption 11   --fs-small 12   --fs-table 13
--fs-body  14   --fs-lead    16   --fs-h3     22  --fs-h2    28
--fs-h1    38   --fs-display 56
```

Arabic body is set at 1.7 line-height. 1.5 is too tight: the language sets a
taller x-height and joins across the baseline.

---

## 5 · The rhythm grid

Read off the mark, which is four bars of ONE width at ONE pitch whose feet step
down by exactly that pitch, with one bar deliberately short.

Horizontally that divides the width into four columns of three, so **the legal
spans are 3, 6, 9 and 12 and nothing else**. There is no `.span-4`.

Vertically it gives the law that makes this system recognisable: **blocks stack
in descending reach and exactly one is deliberately short.** Four equal boxes in a
row is the one shape this mark cannot make — and it is the shape every finance
dashboard opens with.

Spacing is a 4px lattice with two half-steps for optical work inside controls
(`--s-05` … `--s-18`). Every gap in the structural layer is one of these.

### Radius

Read off the mark, not chosen for softness. A capsule in the mark is four units
tall with a radius of two — exactly half its height — so anything the height of a
capsule IS a capsule and anything larger is a panel.

```
--radius-sm 6    a pressed thing: button, input, select
--radius-md 8    a card, a panel, a menu
--radius-xl 12   a full-bleed region, a modal, a sheet
--radius-full    a badge, a chip, an avatar, a track
```

---

## 6 · The page template

Every working screen is the same three bands:

1. **A BRIEF row** — three panels at spans 6 / 3 / 3: what happened, one figure
   worth its own size, and the thing that needs a decision.
2. **A WORK panel** — span 12: a toolbar (title, filters, search), the table or
   list, and a footer strip carrying the count and the export.
3. **Nothing else.** A screen that needs a fourth band is two screens.

`/dashboard` is the one exception and it earns it: a hero at span 9 beside a
decision at span 3, which is the mark's own shape.

The third slot is an **accent panel** where there is a decision and a plain one
where there is only a law to state. Both appear on the boards.

### The split that keeps the chrome one line

* **The rail is the PRODUCT** — the wordmark, the market chip, four Arabic nav
  groups, and the user at its foot.
* **The bar is the SCREEN** — a breadcrumb and this screen's actions.

Which is why **no screen draws a title of its own**. `<PageHeader>` renders
nothing inside the shell; it declares chrome and the bar draws it. Outside the
shell it renders a real header, because a component that vanishes without its
context is a trap for whoever mounts it next.

### One primary per view

The bar ACTS. An accent panel EXPLAINS, and takes the quiet material where it
still needs a road of its own. Two sand buttons on one screen means one of them
is lying about its importance.

---

## 7 · Components

`src/presentation/components/structure/` — the pieces every screen is assembled
from, in one module. They live together because `.toolbar` was once used on five
boards and defined nowhere: nothing failed, the elements simply laid out as plain
blocks, and a 220px search box spanned an entire card.

| | what it is for |
|---|---|
| `Grid` · `Panel` | the rhythm grid and its one surface type |
| `Toolbar` | the strip above a table: title, filters, search |
| `Metric` · `Trend` | the financial hierarchy |
| `SplitBar` · `SplitKey` | where a whole went |
| `HBar` | who earned what, ordered |
| `Sparkbars` · `Progress` | the shape of a window, progress to a number |
| `Chip` | a status: a word plus a shape, never a colour alone |
| `Disclose` | a claim at rest, its reasoning one tap away |

`Panel` takes `span={3|6|9|12|"none"}`. **`"none"` is required outside the rhythm
grid** — the default of 12 sets `grid-column: 1 / -1`, which silently eats every
column of whatever grid the panel happens to be in.

### The financial hierarchy

The same on every surface in the product:

> amount → label → period → comparison → trend

The amount is the largest thing in its container and the only thing set in the
Latin face. The currency word is Arabic and sits OUTSIDE the figure's LTR
isolate, or it lays out as part of a Latin run and cramps the last digit.

### Charts

Four shapes, each answering a different question. A chart that answers no
question is decoration and does not ship.

```
splitbar   where did the revenue go     part of a whole
hbar       who earned what              ordered comparison
sparkbars  what shape was the month     change over time
progress   how far to the target        progress to a number
```

Every series is labelled in place. There is no legend that makes the eye look
away from the shape to find out what it is.

---

## 8 · States

Every screen carries loading, empty and permission-denied. Two rules learned the
hard way:

**Never seed state from async data.** `useState(store.settings)` captures the
store's DEFAULTS on the first render, so the settings form held IQD regardless of
what was saved, and pressing Save wrote those defaults over the merchant's real
settings. The fix is structural: the form mounts only once `loaded` is true.

**An empty state says why it is empty and what fills it.** Not a hatched box
standing where a chart will be.

---

## 9 · RTL

RTL is the architecture. Every inline axis is a logical property —
`padding-inline`, `inset-inline`, `border-inline`, `text-align: start/end`. There
is no `direction: rtl` applied to a left-to-right layout and no mirrored margin.

Three traps this project has actually hit:

1. **`direction: ltr` alone does not re-order a run.** It needs
   `unicode-bidi: isolate`, or `#C6A97D` prints as `C6A97D#`.
2. **A logical property resolves against the ELEMENT'S OWN direction.** A figure
   is an LTR isolate, so `margin-inline-start: auto` on one adds space on its
   LEFT — the opposite of what the RTL row intended.
3. **Sideways overflow hides on the edge the eye leaves last.** In RTL the
   content runs off the LEFT, which is exactly where nobody looks.

Icons are mirrored only when their meaning is directional (a back arrow), never
when it is not (a calendar, a package).

---

## 10 · Responsive

Not a shrunken desktop. Below the tablet threshold the twelve columns become
four, and the four legal spans survive: 3, 6, 9, 12 of twelve become 1, 2, 3, 4
of four.

The rail becomes a **bottom tab bar that sits in the layout**, not a floating
dock: a pill hovering over content has to be dodged by every page that ends
underneath it. Every tab wears its label — hiding three of four behind a glyph
saves nothing at 390px and costs a merchant who does not know what it means.

### A table sheds; it does not shrink

The boards replace a table with a row list under 768px. Doing that here would
mean a second, hand-maintained copy of six tables, and two renderings of one
truth drift apart. So a table keeps ONE markup and loses columns by priority:

* **unmarked** — the columns that ARE the row. They never leave.
* **`.pri-2`** — the qualifier a phone can do without.
* **`.pri-3`** — the context a laptop has room for.

What is shed is not lost: every row opens its own record.

---

## 11 · Motion

The beat is 120ms. Exit is ⅔ of enter. Only opacity and translate ever move, and
the one translate distance is 2px.

**Motion explains what changed.** A number that changed may recount. A row that
arrived slides one step from the direction it came from. Nothing loops, nothing
bounces, nothing decorates — and **money never flies**.

Two things are deliberately NOT animated: a progress fill (animating width is on
the blacklist, and a bar that grows on load delays the figure beside it for
nothing) and a theme switch.

`prefers-reduced-motion` gets none of it. Not slower: none.

---

## 12 · Accessibility

Target is WCAG AA, **measured, never asserted**.

`scripts/sweeps/sweep-contrast.mjs` measures every text run on 13 routes in both
themes against the colour actually painted behind it. Three things had to be
fixed in the MEASUREMENT before its answer was worth anything:

* it walked past an opaque gradient body to the page ground behind it;
* it matched `rgb()` with a regex, and `color-mix()` / `oklab()` survive into
  computed styles — exactly the colours these materials are mixed from;
* it walked ancestors, and the segmented control paints its pill as an
  absolutely-positioned SIBLING under the label.

A ground is what the compositor paints, not what the DOM tree suggests.

A **planted failing control** runs before anything real — the board's sand as a
word on the page ground, 2.08:1. If the control is not caught, the sweep reports
ITSELF broken rather than reporting the app clean.

Beyond contrast: every clickable is keyboard reachable (`sweep-keyboard`), a
status is a word plus a shape and never a colour alone, and a crumb is a link
people tap so it carries a hit box rather than a line height.

---

## 13 · The gates

Nothing about this system is a rule unless a script enforces it.

```bash
npm run typecheck && npm run lint && npm test && npm run build
npx serve out -l 8123

node scripts/sweeps/sweep-contrast.mjs   # every text run vs. the painted ground
node scripts/sweeps/sweep-density.mjs    # the quiet ceiling, per panel
node scripts/sweeps/sweep-overflow.mjs   # nothing scrolls sideways
node scripts/sweeps/sweep-keyboard.mjs   # every clickable reachable
node scripts/sweeps/sweep-writes.mjs     # every store mutation, through its UI
node scripts/sweeps/sweep-corrupt.mjs    # the app against a mangled localStorage

node .claude/skills/kill-ai-slop/scripts/scan.mjs src
```

### The quiet ceiling

Figures at rest, measured **per panel** — the unit the eye reads, because a panel
has its own title and its own hairline. **14** per panel, **72** per screen, both
derived from the client's own approved boards rather than invented. See
VISUAL-LAW §23 for the derivation and for the conflict it resolves.

### What the gates have actually caught

Every one of these was invisible to the typechecker, the linter, the tests and a
screenshot:

* `text-white` on the accent in five places, at 2.35:1 on dark.
* A ranked bar's track drawn on a `<span>`, which is inline and ignores height —
  so a row of bars rendered as a row of nothing.
* `deleteProduct` gone from the product page, because a destructive verb had been
  moved two clicks deep behind a button that means the opposite.
* A fifth figure on a targets row: the rail draws the attainment, its label
  announces it, and a percentage printed it a third time.
* A settings form that would overwrite real settings with defaults.

### And what the gates got wrong

A gate that fails on correct work teaches everyone to ignore it, so a failing
gate is investigated before the screen is changed:

* The density ceiling measured "figures above the first list", which describes a
  screen shape the boards do not have. **The rule was wrong, not the screens.**
* The corruption sweep called an empty state a crash because it counted
  characters, and the page title had moved to the bar.
* The density sweep counted the text inside a CLOSED `<details>`, because this
  Chromium still returns client rects for those children — so adding a disclosure
  made the count go UP.

---

## 14 · Anti-patterns, banned

Not preferences. Each of these has been removed from this codebase at least once.

* Blue→indigo→violet mesh gradients, and atmospheric gradients generally.
* Glassmorphism, and a "glass object" floating over content.
* A card inside a card inside a card.
* **Four identical KPI tiles in a row** — the one shape the mark cannot make.
* A wall of capability pills that restates a count printed above it.
* A bento grid that promotes its first item by size for no reason but array order.
* A decorative ring gauge competing with the bars beside it.
* Over-rounded corners (the 10/14/18/24/30 ramp).
* A hairline border AND a shadow on the same element — the ghost card.
* Green used for something that is not money going the right way.
* Red used for something that has not lost anybody anything.
* A page title that repeats the nav item just pressed.
* A second copy of a button the bar already shows.
* A percentage stated three times in one row.
* Em dashes in Arabic copy, and Arabic number-agreement traps
  (`3 هدفًا` is wrong; use the colon form, «أهداف محدّدة: 3»).

---

## 15 · Conventions

* Money is **integer minor units** in `src/domain`, major units in `application/`
  and above. Never mixed, and the scale is documented at every field.
* **The domain is framework-free.** All arithmetic lives in `src/domain`; a screen
  decides what to draw, never what is true.
* `Intl` with `numberingSystem: "latn"` everywhere, so one screen never mixes
  numeral systems.
* Every figure sits in a `<bdi>` and passes through `.r-num`.
* A screen that needs a filter puts it in the **toolbar**, over the thing it
  filters — never in the bar's action slot, where it reads as a verb.
