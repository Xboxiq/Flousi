# Flousi — Design System MASTER v3 (source of truth)

> **v3 — "Precision Capital".** Reconciles the implemented Apple-grade system
> (`src/app/globals.css`, Cairo + IBM Plex Mono, flat crisp surfaces, single Apple-blue
> accent) with the full skill audit of 2026-08-17 (impeccable, frontend-design,
> emilkowalski, jakubkrehel/interfaces, ui-ux-pro-max, kill-ai-slop, taste-skill,
> baseline-ui, unlazy). This file overrides taste and overrides older docs
> (`docs/DESIGN-SYSTEM.md` = v2 history). When building a page: read this, then run
> `.claude/skills/flousi-anti-slop-gate/`.
>
> Pending input: the client will attach external design-system files (Apple and
> others). Process them via the Reference Intake Protocol in `docs/DESIGN-PLAN.md`
> §Phase 0 before changing any lock below.

## 0. Identity

- Product: Arabic-first (RTL) premium fintech SaaS — net-profit engine for online stores.
- DNA: Apple HIG restraint × Linear density × Stripe trust. Reference screens in
  `references/` (cataloged in `.kiro/steering/visual-references.md`).
- Voice: precise, calm, financial. Restraint over ornament. Numbers are the heroes.
- **Signature devices (the non-generic identity):** the live ProfitPanel (numbers that
  respond as you type), glossy 3D orbs as selection/step markers (reference 234741/234742),
  connected vertical steppers, one grainy blue mesh on hero/CTA surfaces only.
- Anti-identity: everything in `.claude/skills/flousi-anti-slop-gate/SKILL.md`.

## 1. Color (locked)

- **Interactive accent — exactly one:** Apple system blue. Light `#0a6cff` / hover
  `#0a4fc4`; dark `#2f86ff` / hover `#0a6cff`. Nav-active, primary buttons, focus, links.
- **Profit polarity (semantic only, never decorative):** profit `#0c9a52` (dark `#1fc06e`),
  loss `#e5322b` (dark `#ff5a52`), break-even = muted ink. Polarity is always color + word
  + sign, never color alone.
- Neutrals: cool gray ramp, off-white `#f4f4f6` page / `#ffffff` card (light);
  `#0a0a0b` page / `#161619` card (dark). No pure black/white anywhere.
- **Mesh discipline:** grainy gradients live ONLY on hero / CTA / bento-accent tiles,
  blue family capped at hue 265° (blue → deep indigo). No violet/magenta/pink — a
  HIGH-severity fintech anti-pattern. Grain overlay ≤ 0.08 opacity, static surfaces only.
- Semantic tokens as implemented in `globals.css` (`--bg`, `--surface`, `--surface-2`,
  `--sunken`, `--border`/`--border-soft`, `--fg`/`--muted`/`--subtle`, `--accent*`,
  `--success/danger/warning/info` + `-soft`). Components never touch primitives or raw hex.
- Dark mode is composed, not inverted: accent desaturated one step, ramp separation
  widened at the dark end, every pair re-measured. One switching mechanism only
  (`[data-theme]` + no-flash script — already implemented; never mix with `.dark` class).

## 2. Typography (locked)

- **Cairo** (Arabic+Latin geometric grotesk — the open SF-Pro-Arabic equivalent): all UI
  and display. **IBM Plex Mono:** every number, currency, SKU, table figure.
  (Evaluated alternative: IBM Plex Sans Arabic, to be revisited only during Phase 0
  reference intake.)
- Role ramp (px / lh / weight) — one decision per role, steps ≥ 1.2×:
  `micro 11/1.4/500 (non-interactive only)` · `caption 12/1.4/400` · `ui 14/1.45/400`
  · `body 16/1.55/400` · `heading 18/1.35/600` · `title 22/1.25/700`
  · `display 28/1.15/700` · `kpi 40–48/1.1/700 (mono, tabular)`.
- Interactive text never below 11px; inputs ≥ 16px on mobile (iOS zoom).
- Emphasis = one weight step (400→500/600), never a size change mid-hierarchy.
- Tracking: −0.02em on display sizes only; ~0 on body; positive tracking only on short
  uppercase Latin labels (rare in an Arabic UI). Floor −0.04em.
- `font-variant-numeric: tabular-nums` + `slashed-zero` wherever a digit can change.
- `text-wrap: balance` on headings; `text-align: start` always (never justify, never
  physical left/right).
- Arabic copy: 30–40% expansion budget; no fixed-width text containers; buttons size
  from `padding-inline`.

## 3. Space, radius, layout (locked)

- 4px base scale: 4/8/12/16/24/32/48/64/96. Space by relationship: between-group gap
  ≥ 2× within-group gap; more space above a heading than below.
- Radius: `sm 10 · md 14 · lg 18 · xl 24 · 2xl 30 · full`. Cards 14–18, large panels
  24, controls 10–14, pills only for small controls. Nested radius = outer − padding.
- Page: `max-w-[1400px]`, padding-inline 16 → 24 → 32. App shell: collapsible sidebar
  (72/240px) + content. KPI band: bento (varied spans) — bento NEVER for data tables.
  Tables/reports: quiet 12-col grid, row height 40–44px, chrome type 12–13px.
- Padding inside any bordered container ≥ 12px. 12px between adjacent bordered
  controls; ≥ 24px clearance around borderless icon buttons.
- Hit areas: 24×24 floor, 40px desktop comfort, 44px primary touch.
- CSS Grid over flex math; `min-h-[100dvh]`; breakpoints from content (Tailwind
  defaults as starting grid: 640/768/1024/1280/1536).

## 4. Elevation (locked)

- **Declare elevation once per element: border OR shadow.** The hairline + wide diffuse
  shadow "ghost card" is banned.
- Light theme card recipe (shadow-as-border):
  `0 0 0 1px oklch(0 0 0/.06), 0 1px 2px -1px oklch(0 0 0/.06), 0 2px 4px 0 oklch(0 0 0/.04)`;
  hover bumps opacities to .08/.08/.06.
- Dark theme: layered shadows are invisible — collapse to a single ring
  `0 0 0 1px oklch(1 0 0/.08)` (hover .13) + optional soft top inner highlight.
- Existing `--shadow-xs..xl` stay for overlays (menus/dialogs); cards migrate to the
  recipes above during Phase 1.
- Vibrancy (`backdrop-blur` chrome) is sanctioned ONLY on the top bar / floating nav.

## 5. Motion (locked — Emil standards)

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);   /* enter/exit */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen morph */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* sheets/drawers */
```

- Frequency gate first: 100+/day actions (nav, table row hover, keyboard) = no
  animation or ≤ 150ms color/surface shift only. Occasional (modal/drawer/toast) =
  standard. First-run/rare = the only delight budget.
- Durations: press 120–160ms (`:active` scale 0.96–0.98, fire on pointer-down);
  tooltip 125–200; dropdown 150–250; modal 250 (scale 0.96 + opacity, backdrop same
  timing); drawer 500 `--ease-drawer`, % translate. **All UI < 300ms.** Exits ≈ 75%.
- Animate `transform` + `opacity` only (full transform strings in motion/react, not
  x/y shorthands). Never `ease-in`. Never scale(0). Springs: `bounce: 0` default
  (fintech), 0.2 max for genuinely spatial gestures.
- Stagger 50ms/item, y-offset 8–12px, entrances only, never blocking input.
- Tab/segment indicator: clip-path duplicate technique, 250ms `--ease-in-out`.
- **Charts: data being read does not move.** Mount-only reveal (Recharts
  `animationDuration` 300–400, ease-out, series stagger ≤ 80ms), disabled on data/filter
  re-render and under `prefers-reduced-motion`.
- KPI numbers: animated count-up on mount only, tabular digits so nothing shifts.
- `prefers-reduced-motion`: keep opacity/color, drop transforms — gentler, not dead.
  Honor `prefers-reduced-transparency` (solid instead of vibrancy).
- Theme flip: suppress transitions for one frame (inject `transition: none`, reflow,
  remove) — no cross-fade slop.

## 6. RTL / Arabic (locked — Flousi owns this layer; no vendored skill covers it)

- Logical properties ONLY: `ms-/me-/ps-/pe-/text-start/inset-inline` — physical
  left/right reserved for genuinely physical geometry.
- Identifying content leads (right in RTL), metadata/actions trail. Direction-tied
  icons (chevrons, arrows, send) flip via `rtl:-scale-x-100`; media controls stay LTR.
- **Digits are never reordered.** Wrap mixed Arabic+number runs in `<bdi>`. All
  formatting through `Intl.NumberFormat`/`Intl.DateTimeFormat` with the locale from
  settings (ar-IQ default, IQD).
- `lang`/`dir` set at every direction boundary; embedded English paragraphs (3+ lines)
  keep their own LTR alignment.

## 7. Data surfaces (locked)

- Tables: numbers trailing-aligned tabular mono; text leading-aligned; hairline
  row separators (borders, not shadows); header 12px/500 muted; sticky headers with
  `scroll-padding` so focus stays visible; row hover = background shift ≤ 150ms.
- The one number the user came for is large + semibold; its label small + muted below.
- Charts: color never the only encoding (shape/label/pattern too); text/table
  equivalent nearby; trend = line (< 4 points → stat card); part-to-whole = donut ≤ 6
  slices; cumulative = waterfall with profit/loss bar colors.
- Currency: `Intl.NumberFormat`, consistent decimals (2), polarity color + sign + word.

## 8. States & accessibility (locked)

- Every interactive primitive ships: default / hover / focus-visible / active /
  disabled / loading / error / selected. Every container: skeleton (shaped like final
  layout) / empty (one clear next action) / error (diagnose + explain + recover).
- Contrast: AA 4.5:1 body, 3:1 large text + controls + focus rings, measured on the
  actual painted background in BOTH themes. KPI headline numbers target AAA.
- Focus ring ≥ 2px, accent color, visible under sticky chrome. Labels above inputs
  (programmatic `<label>`), errors below with `aria-invalid` + `aria-describedby`,
  focus first invalid field on submit; never disable submit until valid; never block
  paste.
- Icons: Phosphor only, one weight per surface (`regular`; `fill` for the active
  state), sizes 16/20/24, inherit text color, no tiles.

## 9. Governance

- This file is the contract. Token change = edit `globals.css` + this file in one
  commit. No raw hex/px in components that exists as a token.
- Every surface ships only after the anti-slop gate matrix is fully ticked and its
  unlazy gates file (`gates/*.md`) shows evidence. See `docs/DESIGN-PLAN.md`.
- `/styleguide` is the living render of every token + primitive; it updates in the
  same PR as any token change.
