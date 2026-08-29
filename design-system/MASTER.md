# RITM — Design Direction MASTER v4 (source of truth)

> **v4 — "المال الملموس / Tangible Capital".** Direction pivot ordered by the client
> 2026-08-17: v3's restraint read as plain. The new direction is **rich, dimensional
> and cinematic** — 3D objects, physical motion, layered materials, crafted imagery —
> bounded by exactly ONE law: the anti-slop gate
> (`.claude/skills/ritm-anti-slop-gate/`). Every restraint-era cap that isn't
> slop-prevention or an accessibility/RTL floor is REPEALED (see §9).
>
> v3 (Precision Capital) is preserved in git history; its token infrastructure
> (semantic colors, type roles, motion curves, formatters, Money/LivingNumber)
> carries forward as plumbing — the aesthetics on top change.

## 0. الأطروحة — The thesis

**Money in RITM is a physical thing.** Coins have weight and shine, receipts
fold, a closed month locks inside a vault, profit glows. The interface is not a
page of cards — it is a **scene**: objects sit on materials, one consistent light
source falls across them, and motion behaves like physics (mass, springs,
parallax), not like CSS. The craft target is the reference DNA in `references/`
(glossy 3D steppers 234741/234742, dark glow analytics 204344/204346, grainy
mesh bentos 205718, 3D spot-illustration sets 210425) executed at product grade.

Anti-slop still rules: maximalism must be **authored** — every object, gradient
and motion choreographed and justifiable; elaborate execution, never template
noise. "Maximalist directions need elaborate execution" (frontend-design).

## 1. The material system (expanded — caps repealed)

All materials share the grain (≤0.10) and the light logic (§3).

| Material | What | Where |
|---|---|---|
| **Mesh** (aurora / dawn / night / ember) | grainy blue-family gradients, light + dark variants, ember = danger/loss | heroes, bento cells, CTAs, section fields — as many per screen as the composition needs, provided each is doing compositional work |
| **Glass** | real translucency: blur ≤ 20px + specular top edge + inner light; solid fallback under `prefers-reduced-transparency` | floating panels, top chrome, overlays, hero cards |
| **Clay** (soft-UI evolved) | the neumorphic reference DNA: soft dual shadows, pressed/raised states with real depth response | steppers, segmented controls, inputs on light scenes |
| **Metal** | polished radial speculars (the orb rendering technique, generalized) | coins, orbs, markers, premium accents |
| **Ink on paper** | calm data surfaces — tables and forms stay highly legible | data tables, report bodies, print/export |

Color: blue family remains the brand spectrum (Apple blue → deep indigo `#4f5dff`),
green/red remain profit/loss semantics. **No purple/magenta/pink, no beige-brass,
no default-rainbow semantics** — that's slop law, not taste law.

## 2. The object system (3D)

RITM owns a cast of physical objects, built in this order of preference:
1. **CSS/SVG-rendered 3D** (layered radial gradients + speculars + cast shadows —
   the current orb technique, generalized). Crisp at any scale, themable, tiny.
2. **Layered SVG illustrations** (the 210425 spot-illustration style: extruded
   shapes, gradient light, floating fragments).
3. **Generated renders** (Midjourney/Kling per the client toolkit) — exported to
   `public/assets/3d/` as WebP ≤ 200KB, prompt + license recorded in
   `design-system/ASSETS.md`.

**Sourcing law:** reference screenshots are style DNA only — assets are never
lifted from other products. Any external image must be license-safe and logged.

The core cast:
- **العملة (The Coin)** — a glossy dinar coin, the brand object. Dashboard hero,
  loading moments, favicon/logo evolution, landing.
- **Orb family v2** — active/idle/done/danger; selection + progression markers.
- **الخزنة (The Vault)** — closing a month is a physical ritual: the period folds
  into a safe that locks. Periods screen + close-confirm dialog.
- **الإيصال (The Receipt)** — costs/expenses object; empty states, cost forms.
- **المكعبات (Chart blocks)** — extruded bar/waterfall blocks for report covers
  and empty states.
- Spot illustrations for: first-run onboarding, empty products, backup/restore,
  error states.

## 3. Light logic (amended per VISUAL-LAW §2)

One global light source: **directly overhead, slightly toward the camera** —
NEVER lateral (a side-lit object mirrored by `scaleX(-1)` for RTL would have its
physics flipped by a language setting). Every material obeys:
- speculars/top-edge highlights face up; cast shadows fall below; per-face
  lighting = one neutral material + `filter: brightness()` per face, side faces
  always EQUAL
- three shadows, three jobs: contact (pins) + cast (height) + ambient occlusion
  (seats); one soft shadow alone reads as a sticker; contact shadows animate
  with the object (tighten on close/land, spread on open/lift)
- hover = lift toward the light (translate + shadow deepens); press = compress
- dark scenes: glow rises from below (the `night` mesh logic)

## 3b. The image-grade standard (client requirement, binding)

No "plain simple CSS drawings". Every visual object must pass the **screenshot
test**: cropped alone, it could be mistaken for a rendered image — which in
practice means ≥ 3 cooperating light layers (form gradient + specular/edge lips
+ the shadow trio), composed geometry (a nameable visual axis with balanced
weights), and detail at edges/joints. Flat single-gradient rectangles,
unbalanced line-art and bare-stroke decorations FAIL the gate. The full law:
`design-system/VISUAL-LAW.md`. The proven techniques: `design-system/RECIPES.md`
(mined from the client's own `Xboxiq/nova` — first-party, rebound to RITM
tokens; nova's legacy violet hues are explicitly NOT ported).

## 4. Motion choreography (promoted from garnish to structure)

The v3 curves/durations stay as the physics vocabulary; what changes is scale:
- **Scene entrances:** every screen enters as an orchestrated sequence (hero
  object → headline → KPIs → data, 50–80ms stagger, one authored focal moment
  per screen — entrance ≤ 700ms total, interactive immediately).
- **Physical objects:** springs with real mass (`stiffness 260–360 / damping
  18–28` for objects; UI chrome stays bounce-0), pointer parallax/tilt on hero
  objects (≤ 6°, `@media (hover:hover)` only).
- **The Living Number** stays and grows: digit-roll variant for the hero,
  polarity morph (color + sign + mesh crossfade ~250ms).
- **Micro-interactions on every control:** press depth (clay compress), icon
  transitions (scale 0.25→1 + blur 4→0, bounce 0), checkbox/toggle physical
  snaps, focus ring with a soft bloom (≤ 4px, never a halo).
- **Charts:** may draw on mount (line draw / bar rise, ≤ 600ms, once); still
  never move while being read or on data re-render.
- **Ritual moments:** closing a period, saving a product, exporting — each gets
  one designed sequence (the delight budget is now per-flow, not per-app).
- **Motion budget (from nova — protects the cinema from eating legibility):**
  max two simultaneously animating elements on a product/data surface; max one
  endless loop per page (heroes/chrome only — zero infinite animation on
  product components); one focal material effect per surface; every directional
  animation ships its `[dir="ltr"]` counter-rule.
- Floors that stay: `prefers-reduced-motion` collapses to opacity; nothing
  gates content; interaction feedback ≤ 200ms; animate transform/opacity only.

## 5. Composition

- Screens compose as **scenes with depth**: background field (mesh/tone) →
  midground objects/cards → foreground focal content. Overlap and bleed are
  encouraged when they serve the composition.
- Bento grids with varied spans; cells can carry mesh, objects, or live charts.
  Exactly N cells for N real items (no fillers) — slop law.
- Data zones (tables, forms) stay calm and legible inside the scene: the
  contrast between alive frame and calm data is still the reading rhythm.
- Type: Cairo stays the Arabic voice; display sizes get more courage (clamp up
  to ~96px on landing, 44–56px in-app heroes). Numbers stay IBM Plex Mono
  tabular latn. Arabic letter-spacing stays untouched (script law).

## 6. Imagery pipeline

1. Compose in CSS/SVG when possible (themable, RTL-safe, tiny).
2. Generate hero renders when needed; store under `public/assets/3d/`,
   optimize (WebP/AVIF, ≤ 200KB hero / ≤ 80KB spot), lazy-load below the fold.
3. Record every asset in `design-system/ASSETS.md`: source (built/generated/
   licensed), prompt or origin, license, usage map.
4. Image seams masked with long eased fades; page color continuous (slop law).

## 7. Floors that survive the pivot (not taste — physics)

- Anti-slop gate: mandatory, unchanged in authority.
- Accessibility: AA contrast on text/controls (measure on the actual painted
  scene — busy materials need scrims behind text), visible focus, hit areas
  ≥ 24px, keyboard everywhere, reduced-motion/transparency honored.
- RTL correctness: logical properties, latn digits, `<bdi>` islands, flipped
  directional icons; scenes light from top-start.
- Performance: LCP < 2.5s / INP < 200ms / CLS < 0.1 on the static export;
  assets budgeted; blur ≤ 20px; grain never on scrolling containers.
- Copy: Arabic-first, vocabulary-consistent, no invented numbers.

## 8. Token carry-over (plumbing, unchanged)

Semantic color tokens, type roles (micro→kpi), radius scale, motion curves
(`--ease-out/--ease-in-out/--ease-drawer` + durations), `--elev-*`, `--ink/--paper`,
`Money`, `LivingNumber`, `formatDate`, motion presets lib. New v4 tokens (glass,
clay, metal, light, scene z-layers) are ADDED in Phase D2 — nothing existing breaks.

## 9. Repealed v3 laws (explicit, so no agent re-enforces them)

- ~~One mesh moment per screen~~ → as many as the composition earns.
- ~~Restraint over ornament / flat-first~~ → authored richness is the brief.
- ~~Delight budget = one place~~ → one designed ritual per flow.
- ~~Vibrancy is the only sanctioned blur~~ → glass is a first-class material
  (blur ≤ 20px, fallback required).
- ~~Orb max one cluster per view~~ → orbs/objects wherever they mark something real.
- Still standing from v3: everything in §7, the elevation single-declaration
  rule (border OR shadow per element), digits/`<bdi>` law, chart no-motion-on-read.

## 10. Governance

MASTER v4 + the anti-slop gate are the only contracts. `docs/DESIGN-PLAN.md`
(v4) sequences the build. Gates files + eye-verified screenshot proofs remain
the definition of done for every surface.
