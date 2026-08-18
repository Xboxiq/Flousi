---
name: flousi-anti-slop-gate
description: Flousi's mandatory pre-delivery gate against generic/AI-slop design. Run before ANY visual work ships — every screen, component, landing section, chart, export surface, or copy change. Consolidated from kill-ai-slop, impeccable, taste-skill, pols.dev/slop.md, ui-ux-pro-max finance anti-patterns, and jakubkrehel/interfaces. If a single check fails, the surface is not done.
---

# Flousi Anti-Slop Gate

The company's hard requirement: **nothing generic, nothing recycled, no AI-slop look.**
Clean is the floor, never the achievement — mechanically dodging this blacklist while
inventing nothing is still slop. Every surface needs one **authored signature moment**
and must belong to Flousi's one cohesive world (see `design-system/MASTER.md`).

## How to run the gate

1. Run the scanner: `node .claude/skills/kill-ai-slop/scripts/scan.mjs` over changed files.
2. Run impeccable's detector (`.claude/skills/impeccable/scripts/`) when doing a full pass.
3. Walk the blacklist below against the rendered surface (both themes, RTL, 360px + 1440px).
4. Tick the pre-flight matrix at the bottom. Untickable box = not done.

## Blacklist — color & light

- Indigo→violet / blue→purple gradients anywhere. Flousi mesh gradients stay inside the
  blue family (hue ≤ 265°); no violet, magenta, pink, or purple flats or glows. This is a
  HIGH-severity fintech anti-pattern (ui-ux-pro-max #14/#41/#42).
- Neon glows, colored `box-shadow` halos as dark-mode accents, pulsing halos.
- Pure `#000` / pure `#fff`; blue-charcoal dark defaults; pure-white page backgrounds
  (finance anti-pattern #91).
- More than ONE interactive accent (Flousi lock: Apple blue). Green/red are profit/loss
  semantics only, never decoration. Accent drift between sections.
- Icon sitting in a 10% tint of its own color (`bg-{c}/10` + `text-{c}` tile).
- The default semantic rainbow (blue info / amber tip / green success / red error boxes
  at `-50` bg + `-600` text); one-hue status boxes.
- Warm + cool grays mixed; beige/cream "premium consumer" wash; section theme-flipping.
- Gray text on colored backgrounds (use an opacity/lightness step of the ink instead).

## Blacklist — type & copy

- Gradient-clip headline text. Serif-italic emphasis inside a sans headline. Display
  serif on the app surface. Monospace as house voice (mono = numbers + code only).
- Kickers/eyebrows above headings (`text-[11px] uppercase tracking-[0.18em]` and kin).
  Hard ban — no brief earns it back.
- `01 / 02 / 03` decorative section markers when content isn't a sequence.
- Em-dash `—` in UI copy, headlines, buttons, captions (Arabic or English). "It's not
  just X, it's Y" pivots; "Say goodbye to X"; triads-of-three filler; Elevate/Seamless/
  Unleash-class verbs and their Arabic equivalents (ارتقِ، سلس، أطلق العنان).
- Decorative emoji in headings/buttons/bullets. Invented stats (10k+ users, 99.9%),
  fake-precise numbers, placeholder names/brands.
- Flat hierarchy (everything 14–18px, hierarchy from grays alone). A full marketing
  sentence set at display size wrapping 3–4 lines.
- Scroll cues, version labels in heroes, locale/time strips, photo-credit decoration.

## Blacklist — components & surfaces

- **Ghost card:** hairline border AND wide diffuse shadow on the same element. Declare
  elevation once — border OR shadow.
- Nested cards (always wrong). Cards-in-cards replaced by alignment + spacing + hairlines.
- Rounded card + colored left border as universal decoration. `border-2` accent rings.
- Rounded-square pastel icon tiles in grids; giant decorative filler icons.
- Badge/pill spam ("✨ جديد", "🔥 الأكثر شيوعاً"); pills overlaid on images.
- DEFAULT glassmorphism: `backdrop-blur` slapped on a surface with no light logic.
  Glass is a legitimate Flousi material (MASTER v4) ONLY when authored: specular/
  top-edge highlight consistent with the global light, blur ≤ 20px, and a solid
  `prefers-reduced-transparency` fallback. Missing any of those = slop.
- Sun-and-moon theme toggle cliché; gradient-circle initial avatars; hand-rolled SVG
  icons or AI-drawn mascots (Phosphor only, one weight per surface).
- Div-faked screenshots/terminals/macOS chrome; dead controls; fake interactivity.
- Identical icon+heading+text card grids as page structure; three equal feature cards;
  the full SaaS template sequence (hero → 3 cards → tabs → pricing → FAQ → CTA slab).
- Bento with empty cells; bento used for dense tables or live monitoring (bento is for
  the KPI/overview band only).
- `feTurbulence` grain EXCEPT the sanctioned Flousi use: static (non-scrolling)
  material surfaces at opacity ≤ 0.10 to kill gradient banding. Grain on a
  scrolling container is always slop (repaint cost + noise).
- Hard offset shadows (`4px 4px 0`) outside genuine neobrutalism; zero-offset halos.
- Placeholder-as-label; red-border-only error states; disabled-until-valid submits.

## Blacklist — motion

- `transition: all`; `hover:scale-105` springy hover on everything; card lift + shadow
  bloom + glowing border combos; default "boop".
- `ease-in` on any UI. Bounce/elastic/overshoot in product UI (springs: bounce 0).
- `scale(0)` entrances; press scale below 0.95; animating width/height/top/left/margin.
- Entrance animations gating content (`opacity: 0` initial with no fallback).
- Decorative animation on charts/data being read. Scroll-reveal on daily-use surfaces.
- Infinite micro-loops; marquees; pulsing dots; blinking cursors.
- Missing `prefers-reduced-motion` handling (reduced = gentler, not dead).
- UI durations > 300ms; interaction feedback > 200ms.

## Blacklist — layout

- Centered-hero-over-dark-mesh with no real visual; hero = text + gradient blob.
- One spacing token everywhere (`gap-4 p-4 space-y-4`); flex percentage math;
  `h-screen` (use `min-h-[100dvh]`/`h-dvh`); `z-50` spam.
- Same layout family reused across sections; 3+ consecutive zigzags.
- Non-nesting corners (inner radius must = outer − padding); mixed radius systems.
- Content clipped by `overflow-hidden`; text against viewport edges (≥16px, ideally
  24–32px page padding).

## The positive counterpart (what "done well" means)

- Every visual choice explainable in one sentence. Subtract before decorating.
- Hierarchy from scale + space, not color-swapping. Squint test survives blur.
- Depth from light and tone: surface value shifted from page, 1px self-colored stroke,
  soft top inner highlight. Shadows tight, directional, color-matched.
- Space by relationship: within-group gap × 2 ≥ between-group gap.
- State carried in words + weight first ("خسارة" bold reads before red does); color
  never the only code — charts repeat meaning in text/shape.
- Numbers: IBM Plex Mono, `tabular-nums`, trailing-edge aligned, `Intl.NumberFormat`,
  `<bdi>` around mixed Arabic/number runs, digits never reordered by bidi.
- Real specificity: real product names, real measured numbers with sources.
- One authored signature moment per surface; boldness spent in exactly one place.

## Pre-flight matrix (tick every box, per surface)

- [ ] Theme lock: both themes viewed; dark is composed, not inverted; accent re-measured on dark
- [ ] Single-accent lock: blue interactive only; green/red semantic only; hue audit ≤ 265° on meshes
- [ ] Radius lock: tokens only; nested = outer − padding; cards 12–18px
- [ ] Elevation declared once per element (border OR shadow, never both)
- [ ] Zero em-dashes; zero eyebrows; zero decorative ordinals; copy re-read line by line (Arabic grammar included)
- [ ] Numbers: tabular mono, trailing-aligned, Intl-formatted, profit polarity colored + worded
- [ ] Every interactive element: default/hover/focus-visible/active(0.96–0.98)/disabled/loading states
- [ ] Hit areas ≥ 24×24 (44 primary touch); focus ring ≥ 2px at 3:1, visible under sticky headers
- [ ] Contrast: body ≥ 4.5:1, large/controls ≥ 3:1 — measured against actual painted bg, both themes
- [ ] RTL: logical properties only; direction-tied icons flipped; `<bdi>` on mixed runs; 360px + 1440px checked in RTL
- [ ] Motion: tokens/presets only, interaction feedback < 200ms, scene entrances ≤ 700ms and never gate content, `prefers-reduced-motion` collapses transforms, charts never move while being read
- [ ] Materials: every mesh/glass/clay/metal instance passes the authorship test (SIGNATURE.md) — one sentence for what true thing it marks; text on rich materials sits on a scrim and still measures AA
- [ ] Image-grade standard (VISUAL-LAW): every visual object passes the screenshot test — ≥3 cooperating light layers, overhead light only, shadow trio present, nameable composition axis; motion budget: ≤2 simultaneous animations on data surfaces, ≤1 loop per page, zero infinite loops on product components
- [ ] `scan.mjs` clean or every leftover justified in one sentence
- [ ] LCP < 2.5s / INP < 200ms / CLS < 0.1 on the built static export
- [ ] The surface has a signature moment worth screenshotting, and you can name it
