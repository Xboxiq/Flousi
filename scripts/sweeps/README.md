# Interaction sweeps

Three scripts that DRIVE the built app rather than reading it. They exist because of
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
```

Override the port with `BASE=http://localhost:9999 node …` where the script supports it.

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
