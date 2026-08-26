# Phase P9 — اعتماد الدفعة الثالثة: transitions.dev و rare-ui و beautifului.dev

The client's instruction: «استخدم هذه للتطوير والبناء والتحديثات والاشكال». The same
law as every batch before it (CLAUDE.md): vendored first, applied only where measured
or seen to help, and what was deliberately NOT taken is recorded with its reason.

## G0 — vendored and pinned
EXPECT: `transitions-dev` (32 portable CSS transitions) and `transitions-polish` (the
tuning scale) copied into `.claude/skills/` and pinned in `skills-lock.json` at commit
`ef497bb`. rare-ui recorded as a STUDIED registry (commit `fa71f44`) with inline
attribution where adapted — it is a component registry, not a skill. beautifului.dev
recorded as studied-and-mostly-inapplicable: it is an AI-interface library and Flousi
has no AI surface; writing that down is what stops the next reader re-deriving it.
EVIDENCE: the two skills registered and appear in the session's skill list; the lock
carries commits and hashes; README batch-3 table.

## G1 — the ladder and the order panels animate their HEIGHT, not only their ink
CHECK: transitions.dev №21 (accordion via `grid-template-rows: 0fr ↔ 1fr`).
EXPECT: P8's reveal faded the content in but the LAYOUT still teleported — everything
below the rung jumped. The grid-rows technique animates height with no JS measurement,
which is precisely the case the `animate` skill tolerated `height` for. The rung and
the order row panel move to it; the caret keeps its rotation. Durations stay on the
app's own tokens, not the snippet's defaults.
EVIDENCE: read off the live element (grid-template-rows transition present), and the
eye: content below a rung now follows instead of jumping.

## G2 — the segmented control's active pill SLIDES between options
CHECK: transitions.dev №16 (tabs sliding), against the app's own constraints: RTL,
groups that WRAP (P5), and a molded pill, not a flat one.
EXPECT: one measured pill (offsetLeft/offsetTop/width written by JS, CSS owns the
tween) behind the labels, carrying the existing `molded molded-accent` material. First
paint and container resize write position WITHOUT a transition. ~29 call sites lift at
once because the component is the unit. Under reduced motion the app-wide rule
flattens the tween.
EVIDENCE: renders of a mid-slide state at 2× duration cannot be shot reliably, so the
evidence is: computed transition on the pill, the pill's coordinates before/after a
click, and eye-verified stills light/dark.

## G3 — the wrong PIN shakes
CHECK: transitions.dev №12, whose own text names this exact case: «a wrong-PIN field
on a lock screen».
EXPECT: the owner-PIN sheet's field shakes with per-segment easing on a wrong code,
the error border and message revert to neutral after a hold, and typing cancels the
revert. Feedback tier: occasional; purpose: feedback (the interface heard the wrong
code) — passes the animate gate.
EVIDENCE: driven — enter a wrong PIN, the shake class lands and the field reverts;
still at design-system/proofs/p9/.

## G4 — the theme toggle swaps its icon like an object, not a paint job
CHECK: transitions.dev №9 (icon swap: cross-fade + blur + scale in one slot).
EXPECT: sun and moon cross-swap in the button's single slot. Rare tier (a few
times/day at most), 200ms, no layout shift.
EVIDENCE: computed styles + the eye.

## G5 — what was deliberately NOT taken
* rare-ui `fluid-orb`, `gravity-letters`, `emoji-reaction`, `card-tilt` (№19),
  cursor-glare: decorative motion on data surfaces — the anti-slop gate and
  VISUAL-LAW §13 both refuse them on a finance app. Recorded, not adopted.
* №15 shimmer-text / №31 matrix-loader / №28-30 thinking-states, reasoning, streaming:
  AI-interface furniture with no Flousi surface (same verdict as beautifului.dev).
* №27 toggle double-bounce: the app's switches are Segmented controls; a bouncy thumb
  contradicts the restraint clause.
* №2 number pop-in and №26 spinning counter: the app already HAS its number
  instruments (Odometer drums, LivingNumber) — adopting a second idiom for the same
  meaning would break the one-idiom rule (§14 table, anti-slop-ui reconciliation).

## G6 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`, the
overflow sweep, the leak sweep, renders light/dark × 1440/360.

## Closing evidence
pending
