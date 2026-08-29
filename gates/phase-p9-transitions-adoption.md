# Phase P9 — اعتماد الدفعة الثالثة: transitions.dev و rare-ui و beautifului.dev

The client's instruction: «استخدم هذه للتطوير والبناء والتحديثات والاشكال». The same
law as every batch before it (CLAUDE.md): vendored first, applied only where measured
or seen to help, and what was deliberately NOT taken is recorded with its reason.

## G0 — vendored and pinned
EXPECT: `transitions-dev` (32 portable CSS transitions) and `transitions-polish` (the
tuning scale) copied into `.claude/skills/` and pinned in `skills-lock.json` at commit
`ef497bb`. rare-ui recorded as a STUDIED registry (commit `fa71f44`) with inline
attribution where adapted — it is a component registry, not a skill. beautifului.dev
recorded as studied-and-mostly-inapplicable: it is an AI-interface library and RITM
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
  AI-interface furniture with no RITM surface (same verdict as beautifului.dev).
* №27 toggle double-bounce: the app's switches are Segmented controls; a bouncy thumb
  contradicts the restraint clause.
* №2 number pop-in and №26 spinning counter: the app already HAS its number
  instruments (Odometer drums, LivingNumber) — adopting a second idiom for the same
  meaning would break the one-idiom rule (§14 table, anti-slop-ui reconciliation).

## G6 — nothing regressed
EVIDENCE: `npm run typecheck && npm run lint && npm test && npm run build`, the
overflow sweep, the leak sweep, renders light/dark × 1440/360.

## Closing evidence

`npm run typecheck && npm run lint && npm test && npm run build` → clean, 412 tests.
Overflow sweep (15 routes × 5 widths): none. Cost-leak sweep under a rep session:
nothing leaked. All figures below read off the LIVE exported build.

### G0 — vendored and pinned
`transitions-dev` and `transitions-polish` registered as live skills the moment they
were copied in; `skills-lock.json` carries commit `ef497bb` with content hashes, and a
`studied` section records rare-ui (`fa71f44`) and beautifului.dev with their verdicts.

### G1 — height-true disclosure
    .disclose: grid-template-rows | 0.2s (app tokens, not snippet defaults)
    open rung resolves to its real height (1357.8px on the seeded dashboard)
    chart still lazy: 29 js files before opening the rung → 30 after (P7's win kept)
Content mounts on FIRST open and stays mounted after — a ratchet state, because
always-mounted would have refetched Recharts on page load and erased P7's measured
−348 KB, and conditional-render would have made the tween one-directional.

### G2 — the pill slides
    before click: matrix(1,0,0,1, 243, 4) w=59px
    after  click: matrix(1,0,0,1,  86, 4) w=76px   (transform, width, height tween)
In RTL the x moved LEFT for a later option — offsetLeft is geometric, which is why
the pill is anchored with physical left/top (the one sanctioned exception to
logical-properties-only, documented at the class). ~29 call sites lifted by editing
one component. Still: `proofs/p9/segmented-pill-light-1440.png` — the moulded accent
body sits under «تسويات» with the labels riding above it.

### G3 — the wrong PIN shakes, and driving it caught a REAL P3-era bug
The shake works: class present mid-animation, error shown, field cleared for retry,
sheet stays open, auto-revert after the hold (`proofs/p9/pin-wrong-light-1440.png`).

The bug the drive exposed: `Dialog`'s focus effect depended on the UNSTABLE inline
`onClose` every caller passes, so the effect re-ran on every parent render while a
sheet was open — its cleanup yanked focus back to the trigger and the setup
re-focused «إغلاق». The first keystroke a user typed into ANY dialog field stole the
rest of their typing: «9999↵» became one 9 in the field and an Enter on the close
button, closing the sheet with no error at all. The keydown/focusin trace:

    key:9@owner-pin → focus→(trigger) → focus→إغلاق → key:9@BUTTON ×3 → Enter@BUTTON

Fixed with the standard latest-ref (assigned in an effect, per the React compiler
rule), so the focus effect runs once per OPEN. Re-driven: all four digits and the
Enter land on `owner-pin`, the error shows, the sheet stays. This affected every
dialog in the app since P1 and was invisible to the typecheck, the linter, the tests
AND the screenshots — only DRIVING the surface found it.

### G4 — the icon swap
    sun at rest (light theme): opacity 0 / blur(3px)  → after toggle: opacity 1
Both icons stay mounted in one grid slot; a transition, not keyframes, so a mid-swap
tap retargets.

### G5 — deliberately not taken: as listed above, unchanged.
