# Gate — the one measured use of GSAP

Closes the open question from the design-taste-frontend/gsap commit: gsap was
declared with zero bytes shipped anywhere. This phase gives it exactly one job
it can do that `motion/react`'s `whileInView` cannot, measures the cost, and
keeps or reverts by the number — same method as the barrel-import test in
CLAUDE.md.

## CHECK 1 — the job is one `whileInView` cannot do

**EXPECT**: a scroll-*scrubbed* value (continuous, tied to scroll position),
not a scroll-*triggered* one (boolean, fires once). `whileInView` only knows
in-view/not-in-view.

**EVIDENCE**: `src/presentation/features/landing/landing-page.tsx` — the "How
it works" section's step rail. A track (`bg-border-soft`) plus a fill
(`bg-accent`) share `inset-y-0 start-[76px]` inside the `<ol>`; a `gsap.to`
tween drives the fill's `height` from a `ScrollTrigger` with `scrub: true`, so
the rail reads as "how far through the three steps" while the visitor
scrolls, not a fixed enter animation. Every other reveal on the page keeps
using `motion/react`'s `whileInView` — this is not a replacement, it is the
one place the other tool's mechanism is required.

## CHECK 2 — reduced motion is honoured

**EXPECT**: no scroll-linked motion for a visitor with reduced motion
requested — same rule the rest of the page follows via `useReducedMotion()`.

**EVIDENCE**: the effect early-returns on `reduce` before registering the
`ScrollTrigger`, so no tween is created. Verified headless with
`reducedMotion: "reduce"`: fill height measured `0px` at the scroll position
where a non-reduced run measures `459px` (script:
`/tmp/.../scratchpad/rail-reduced.mjs`, not committed — throwaway probe).

## CHECK 3 — the scrub is calibrated to the real content, not guessed

**EXPECT**: the rail starts filling as the step list enters view and finishes
filling once the list has mostly scrolled into place — not complete before
the visitor has read anything, not still animating after the list is gone.

**EVIDENCE**: probed the live `ScrollTrigger` fill height across the actual
scroll range (`rail-probe2.mjs`): 0px until the list is ~70% down the
viewport, ~53% filled at the list's midpoint, 100% once the list's top is
~60px from the viewport top — i.e. once the full three-item list is already
on screen. Screenshots at start/mid/end, light and dark, confirm the fill
sits in the gutter between the step number and its text with no overlap
(first attempt at `start-[15px]` overlapped the digits; moved to
`start-[76px]`, past the 4rem number column plus half the gutter).

## CHECK 4 — the bundle cost is real and isolated

**EXPECT**: gsap's cost is paid only by the landing route, not by the whole
app, and the number is stated rather than assumed.

**EVIDENCE**:
```
grep -rl "ScrollTrigger" out/_next/static/chunks/*.js
  → out/_next/static/chunks/1rr7j4yi__dl1.js (134,878 bytes raw, 51,049 bytes gzip)
grep -rl "1rr7j4yi__dl1" out/*.html
  → out/index.html only
```
The chunk is code-split to `/` alone; `/dashboard`, `/products`, etc. do not
reference it. Cost: ~51 KB gzip, paid once, on the one page that uses it.

## CHECK 5 — no regression elsewhere

**EXPECT**: typecheck, lint, full test suite, and `kill-ai-slop` hit-count all
unchanged.

**EVIDENCE**:
```
npm run typecheck   → clean
npm run lint        → 1 pre-existing warning (design-system/ui-v7/shell.js), unrelated
npm test            → 433 passed (433), 20 files
kill-ai-slop scan   → 61 hits / 13 groups, same count as gates/phase-made-depth.md
                       (no new hits from this change)
```

## Verdict

Kept. This is the specific-use path from the open question, not the
declared-only path: gsap now does one job `motion/react` cannot, the job is
measured to behave correctly (scrub range, reduced-motion, alignment), and
the cost is a stated, isolated number rather than an assumption.
