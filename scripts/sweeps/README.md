# Interaction sweeps

Five scripts that MEASURE or DRIVE the built app rather than reading its source. They exist because of
one repeated lesson in this project: every defect that mattered was invisible to the
typechecker, the linter, the tests **and the screenshots**. P9's focus thief broke
every dialog in the app since P1 and only surfaced when a script typed into a field.
P10's five findings all came from these three.

## Running them

```bash
npm run build
(cd out && python3 -m http.server 8123 &)
node scripts/sweeps/sweep-writes.mjs      # every store mutation, through its real UI
node scripts/sweeps/sweep-keyboard.mjs    # anything clickable a keyboard cannot reach
node scripts/sweeps/sweep-corrupt.mjs     # the app against a mangled localStorage
node scripts/sweeps/sweep-density.mjs     # the quiet ceiling (VISUAL-LAW §15), at rest
node scripts/sweeps/sweep-contrast.mjs    # every text run vs. the colour painted behind it
```

Override the port with `BASE=http://localhost:9999 node …`. All five honour it.

## sweep-contrast and grounding a run

Written when the identity's palette landed in the app and put `text-white` on the
board's sand in five places at 2.35:1 — none of which the typechecker, the linter, the
tests or a screenshot noticed.

It measures the ground the COMPOSITOR paints, not the one the DOM tree suggests: colours
are resolved through a canvas (so `color-mix()` and `oklab()` answer for themselves), a
run is grounded by hit test (so an absolutely-positioned pill under a label counts), and
the walk stops at the first opaque paint (so a gradient slab is not scored against the
page behind it). Each of those three started out wrong and reported a readable surface
as a failure.

A planted failing control runs before anything real — the board's sand as a word on the
page ground, 2.08:1. If the control is not caught, the sweep exits reporting ITSELF
broken rather than reporting the app clean.

## sweep-density and the rule about metrics

The density gate measures a screen AT REST — before any disclosure is opened — against
the budget in VISUAL-LAW §15. It is the one sweep that can be wrong about the app
rather than the app being wrong, and in P11 it was wrong four times: it read the
Odometer's hidden drum digits, it read `sm:hidden` duplicates off a detached clone, it
counted the currency abbreviation «د.ع.» as two sentences, and it lost every full stop
that sat at an element boundary. Two of those flattered the screens.

So the rule is: **when the gate and the screen disagree, examine the counter first.**
Every recalibration lives in a comment beside the number it changed, with the case that
forced it. Contorting a money row to satisfy a number nobody measured is the wrong
repair — and a metric that flatters the screen is worse than no metric.

Rows are declared by the app (`data-row`), not guessed: a screen with rows and no tag
reads as all-summary and fails LOUD.

## What each one asserts

**`sweep-writes`** drives all twelve user-reachable write paths (product, sale, order
with an offer, order status, target, rep, role, scheme, settings, settlement, period
close, product delete) and asserts the STORE actually changed — not that a toast
appeared. It also checks the things a screenshot cannot: that an order's lines froze
their commission snapshots, that the offer reached each line, that a status change is
reversible, and that editing a target updates its scope in place instead of
duplicating it.

**`sweep-keyboard`** finds elements that respond to a pointer but cannot be reached by
keyboard. It deliberately does NOT flag a child of a clickable region whose region has
a focusable stand-in — the pattern the reps cards use (whole card clickable, name a
real link). Without that rule it reported 47 false positives on `/reps` alone.

**`sweep-corrupt`** boots the app, then mangles one storage key and visits the
heaviest-reading screens, failing on a thrown error OR a blank screen. Cases: invalid
JSON, an object where a list belongs, `null`, a row missing its fields, and the key
removed. A local-first app has no server to fall back on, so a blank screen here means
the merchant cannot reach ANY screen — including the one that would let them export.

## Writing a new case

The probes lie more often than the app does. In P10 five of five initial "failures"
were probe defects, and each taught a rule now encoded in the scripts:

* Identify a row you created by **id diff**, never by array position — the
  repositories do not return rows in insertion order.
* Scope a click to the control's own `[role="group"][aria-label="…"]`; an unscoped
  `:has-text("راجعة")` matched a *badge* and toggled the wrong row.
* Pick a subject the action can actually change: clicking «راجعة» on an
  already-returned order is correctly a no-op.
* Assert the RULE, not the row count: a target that already exists must be updated in
  place, so `+1` is the wrong expectation and would have hidden a real duplication bug.

When a sweep fails, prove which side is wrong with a narrow probe before touching
either. That is what separated P10's two real findings from its three false alarms.
