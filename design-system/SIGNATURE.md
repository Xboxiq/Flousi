# Flousi — Signature System (the non-generic identity)

> Clean is the floor; identity is the work. These five authored devices are what
> make Flousi unmistakably Flousi. Each has a usage LAW — a device used outside
> its law degrades into decoration, and decoration is slop. Contract level:
> same authority as `design-system/MASTER.md`.

## 1. The Living Number

- **What:** the net-profit figure glides from its current displayed value to the
  next as the user types — interruptible (animates from the live presentation
  value, never restarting from the target), tabular mono so only changing digits
  move, snaps under `prefers-reduced-motion`. Polarity is worded first
  (رابح / خسارة / تعادل badge + icon), color reinforces.
- **Law:** this is the ONE place Flousi spends its delight budget. It lives on
  the ProfitPanel hero (and the standalone calculator, which renders the same
  panel). Numbers the user merely *reads* (tables, reports, dashboard KPIs)
  never use it — they use the static `Money` primitive. Duration ≤ 300ms.
- **Implementation:** `src/presentation/components/interactive/living-number.tsx`,
  wired in `src/presentation/features/products/profit-panel.tsx`.

## 2. Orb markers

- **What:** glossy 3D orbs (blue active / silver idle / emerald done) — the
  tactile mark of the reference DNA (references 234741 / 234742).
- **Law:** orbs mark *selection and progression* only: stepper states, radio-card
  choices, onboarding checkpoints. Never bullets, never icon tiles, never
  decoration. Max one orb cluster per view.
- **Implementation:** `src/presentation/components/ui/glossy-orb.tsx`, consumed
  by `stepper.tsx`. (Landing's decorative orb usage is scheduled for the
  Phase 4 art-direction pass.)

## 3. The connected stepper

- **What:** vertical steps joined by a dotted line, orb states per step — the
  flow language for money-moving sequences.
- **Law:** only for genuine sequences (create product, close period,
  onboarding). Never used to decorate a list of non-sequential features.
- **Implementation:** `src/presentation/components/ui/stepper.tsx`.

## 4. One mesh moment per surface

- **What:** the grainy blue mesh (aurora light / night dark / night-danger loss)
  is Flousi's single accent material.
- **Law:** at most ONE mesh tile per screen — the hero or the single featured
  cell. `night-danger` is semantic loss/destructive only. Hue capped at deep
  indigo `#4f5dff`; grain ≤ 0.08, static surfaces only.
- **Status:** dashboard ✓ (net-profit hero) · ProfitPanel ✓ (hero) ·
  reports hub ✓ (featured monthly card only, enforced this phase) ·
  landing ✗ (3 mesh surfaces — consolidated in Phase 4).
- **Implementation:** `.mesh-*` in `globals.css` via `<MeshSurface>`.

## 5. Hairline-quiet tables

- **What:** data surfaces are deliberately the calmest thing in the product:
  hairline separators, muted lowercase chrome, trailing-aligned tabular figures
  via `Money`, row hover = background shift ≤ 150ms.
- **Law:** no mesh, no orbs, no elevation games, no per-row entrances inside a
  data table — ever. The contrast between calm tables and the Living Number IS
  the aesthetic.
- **Implementation:** `src/presentation/components/ui/table.tsx` +
  `money.tsx`; exemplar: periods breakdown table.

## Amendment protocol

Adding a sixth device (or bending a law) requires: a one-sentence justification,
an entry here, and a pass through `.claude/skills/flousi-anti-slop-gate/` —
in the same PR.
