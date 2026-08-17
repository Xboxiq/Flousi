# Flousi — خطة التطوير الرسومي المتكاملة (Design Plan v3)

> **الملخص التنفيذي (عربي):**
> هذه الخطة تحوّل Flousi من "تطبيق مرتب" إلى منتج بهوية بصرية مملوكة لا تُنسب لأي قالب
> أو ذكاء اصطناعي. بُنيت على تدقيق كامل لأهم سكلز التصميم في السوق (impeccable،
> frontend-design من Anthropic، سكلز Emil Kowalski للحركة، interfaces، ui-ux-pro-max،
> kill-ai-slop، taste-skill، unlazy، ponytail) وكلها مثبّتة الآن داخل الريبو تحت
> `.claude/skills/` وتعمل تلقائياً في كل جلسة. الميثاق الملزم في
> `design-system/MASTER.md`، وبوابة مكافحة السلوب في
> `.claude/skills/flousi-anti-slop-gate/`. الخطة سبع مراحل، كل مرحلة لها بوابات قبول
> مقاسة بالأدلة (منهج unlazy) — لا تسليم بدون تعليم كل البنود بدليل. المرحلة صفر
> مخصصة لاستقبال ملفات الديزاين سستم التي سيرفقها العميل (آبل وغيرها) ودمج المناسب
> منها قبل قفل أي قرار نهائي.

**Status:** approved plan, execution not started. **Branch:** `claude/professional-design-system-c0m4ei`.
**Contract:** `design-system/MASTER.md` (v3) + `.claude/skills/flousi-anti-slop-gate/SKILL.md`.
**Method:** unlazy gates — every phase writes `gates/<phase>.md` before work, with
`CHECK`/`EXPECT`/`EVIDENCE` lines; a phase is done only when `node .claude/skills/unlazy/scripts/gate-check.mjs` passes and the anti-slop matrix is fully ticked.

---

## Skill routing table (which installed skill drives what)

| Skill (`.claude/skills/…`) | Used for | When |
|---|---|---|
| `flousi-anti-slop-gate` | Mandatory pre-delivery gate | Every surface, every phase |
| `impeccable` (+ its detector CLI) | Design direction, critique passes, 59-rule detection | Phase 2–6 reviews |
| `frontend-design` | Aesthetic risk & signature decisions, landing art direction | Phases 2, 4 |
| `animate`, `review-animations`, `improve-animations`, `apple-design`, `emil-design-eng` | All motion work; STANDARDS.md is the values table | Phases 1, 5 |
| `animation-systems`, `beautiful-shadows` (MengTo) | Duration/stagger tables; layered shadow strings | Phase 1 |
| `better-ui/-typography/-colors/-layout/-accessibility/-writing`, `interface-review` (jakubkrehel) | Numeric floors (type, spacing, hit areas, contrast), RTL rules, review checklists | Phases 1, 3, 6 |
| `baseline-ui`, `fixing-motion-performance` (ibelick) | Stack-exact Tailwind/motion guardrails | Continuous |
| `ui-ux-pro-max` (data CSVs + search) | Finance-specific patterns, chart selection, palette cross-checks | Phases 0, 3, 5 |
| `kill-ai-slop` (scan.mjs) | Automated slop scanning | Every PR |
| `unlazy` | Gates method, four-pass finishing, evidence ledger | Every phase |
| `ponytail`, `ponytail-review`, `ponytail-debt` | Code-quality ladder (logic/deps only — never design polish), debt ledger | Continuous |
| `layers-conceptual-model`, `layers-surface` | Object model + Arabic ubiquitous vocabulary | Phase 0 |
| `create-design-md` | Regenerating a distributable DESIGN.md after Phase 1 | End of Phase 1 |

Design references vendored knowledge: `VoltAgent/awesome-design-md` entries worth
consulting live at getdesign.md — Linear, Stripe, Apple, Wise, Revolut, Kraken,
Coinbase, Sentry, Shopify, Vercel (fintech-relevant §7 Do's/Don'ts).

---

## Phase 0 — Reference intake & vocabulary (blocks all visual locks)

**Purpose:** the client will attach external design-system files (Apple HIG exports and
others). Nothing in MASTER v3 gets re-locked until these are processed.

Protocol when files arrive:
1. Store originals under `references/design-systems/<source>/` (never edited in place).
2. For each file produce a one-page delta memo in `design-system/intake/<source>.md`:
   what it prescribes for color/type/space/motion, where it agrees with MASTER v3,
   where it conflicts, and a keep/adapt/reject verdict per conflict **with a one-sentence
   reason** (anti-slop rule: every choice explainable).
3. Conflicts touching a LOCKED section of MASTER require a client decision; everything
   else is decided by the delta memo and folded into MASTER in the same PR.
4. Re-run the font question exactly once here: Cairo (current) vs IBM Plex Sans Arabic
   (unifies with Plex Mono) vs whatever the attached systems prescribe for Arabic.

Also in Phase 0 (no client input needed):
- Ubiquitous Arabic vocabulary pass (`layers-conceptual-model`): one canonical Arabic
  term per domain object (منتج، تكلفة، بيع، فترة، صافي الربح، الهامش، نقطة التعادل…)
  recorded in `design-system/VOCABULARY.md`; surface copy audited against it.

**Gates:** intake memos exist for every attached source · vocabulary file exists and
every nav label/page title matches it · font decision recorded with rationale.

## Phase 1 — Foundation surgery (tokens, motion, RTL, numbers)

Bring `globals.css` + primitives to MASTER v3 exactly. No screen work until green.

1. **Motion tokens:** replace current easings with the three Emil curves; add duration
   tokens (press/pop/drop/modal/drawer); create `src/presentation/lib/motion.ts` with
   named presets (`enter`, `pressable`, `staggerList`, `modal`, `drawer`) so feature code
   never hand-writes curves.
2. **Elevation surgery:** implement the light shadow-as-border recipe + dark single-ring
   recipe as `--elev-card`/`--elev-card-hover`; migrate `Card`, `Stat`, `Dialog`,
   dropdowns; delete every hairline+diffuse "ghost card" combo.
3. **Type ramp:** encode the 8-role ramp as tokens; sweep all `text-*` usages onto
   roles; kill any size within 2px of a neighbor; `text-wrap: balance` on headings.
4. **Numbers layer:** one `<Money>`/`<Num>` component: Plex Mono, `tabular-nums`,
   `slashed-zero`, `Intl.NumberFormat(ar-IQ)`, `<bdi>` wrapping, polarity =
   color + sign + word. Everything that renders currency migrates to it.
5. **RTL audit:** grep-and-fix every physical `ml-/mr-/pl-/pr-/left-/right-/text-left/
   text-right` to logical equivalents; flip direction-tied icons; verify digit runs.
6. **Mesh/grain discipline:** re-cap mesh gradients at hue 265° (current
   `.mesh-aurora`/`.mesh-bento` use `#6d5cff` violet — pull back to deep indigo max);
   grain only on static surfaces; `.mesh-night-rose` becomes a danger-surface exception
   used ONLY for destructive confirmation heroes, or is deleted.
7. **State completeness:** every primitive in `/styleguide` shows all 8 states; add the
   theme-flip transition suppressor; `prefers-reduced-transparency` fallback for
   vibrancy.

**Gates (excerpt, full list in `gates/phase-1.md`):** zero physical-direction utilities
in `src/` (CHECK: grep count = 0) · zero `transition: all` · zero raw hex in components
· typecheck/build/test/lint green · scan.mjs clean · `/styleguide` renders all states
in both themes.

## Phase 2 — Signature system (the non-generic identity)

The anti-slop rule: clean is the floor; identity is the work. Flousi's authored
signature set, each with usage law:

1. **The Living Number** — the ProfitPanel's net-profit figure is the product's
   heartbeat: count-up on change (mount-only elsewhere), polarity transition
   (color + sign morph, 250ms `--ease-in-out`), break-even flash worded not just
   colored. This is the one place the delight budget is spent.
2. **Orb markers** — glossy 3D orbs (already built) are Flousi's radio/step/status
   mark (references 234741/234742). Law: orbs mark *selection and progression*, never
   decoration; max one orb cluster per view.
3. **Connected stepper** — the vertical dotted-line stepper is the flow language for
   create-product, close-period, onboarding. Law: only for genuine sequences.
4. **One mesh moment per surface** — at most one grainy blue mesh tile per screen
   (hero, primary CTA, or the single featured bento cell).
5. **Hairline-quiet tables** — data surfaces are deliberately the calmest thing in the
   product; the contrast between calm tables and the Living Number IS the aesthetic.

Deliverable: `design-system/SIGNATURE.md` documenting each device, its law, and its
implementation file. Review with `impeccable` critique + `frontend-design` ("name the
one aesthetic risk").

**Gates:** signature doc exists · each device has exactly one implementation source ·
impeccable detector run recorded on `/styleguide`.

## Phase 3 — Screen-by-screen art direction (app surfaces)

Order = user-impact. Each screen: gates file first → build → four passes (complete,
expert re-read, defect hunt, free polish) → anti-slop matrix → screenshot both themes
RTL 360/1440 into `design-system/proofs/<screen>/`.

| # | Screen | Direction (one sentence each) |
|---|---|---|
| 3.1 | **Dashboard** | Bento KPI band (varied spans, `Stat` on quiet cards) + ONE mesh hero cell for net profit (the Living Number), trend chart mount-reveal only, top products + recent sales as hairline-quiet tables. |
| 3.2 | **Products list** | Quiet 12-col table, 40–44px rows, profit polarity column (word+sign+color), search/filter as segmented pills, empty state teaches the create flow. |
| 3.3 | **Product form + ProfitPanel** | Two-column: grouped soft sections (no nested cards) + sticky Living Number panel; cost lines as connected stepper rows; save CTA is the screen's single filled action. |
| 3.4 | **Calculator** | The standalone stage for the Living Number: oversized KPI ramp, inputs left(trailing)-labeled, "save as product" secondary. |
| 3.5 | **Periods** | Close-period as connected stepper + confirmation dialog with worded consequences; locked history as timeline of quiet snapshot cards. |
| 3.6 | **Reports hub + view** | Hub = one bento with exactly N cells for N report types (one mesh cell max); view = print-grade table typography, export bar with real affordances. |
| 3.7 | **Settings** | Grouped quiet cards, Segmented theme control, danger zone with worded destructive confirm (AlertDialog), backup/restore with full state cycle. |
| 3.8 | **App shell** | Sidebar icon rail + labels (logical-props), vibrancy top bar (the one sanctioned blur), active-nav shared-layout indicator (clip-path technique). |

**Gates per screen:** anti-slop matrix ticked · both-theme RTL proofs saved ·
contrast measured on painted bg · states demo'd (loading/empty/error reachable) ·
detector + scan clean or justified.

## Phase 4 — Landing page (marketing surface)

Full `frontend-design` + taste application; this is where boldness is spent.
- Hero is a thesis: the real product (live ProfitPanel embed with seeded data), not
  text + gradient blob. Arabic display type at real scale (3–5 word headline).
- ≥ 4 distinct layout families across sections; exactly-N bento; no SaaS template
  sequence; no invented stats — use the demo dataset's real numbers.
- One aesthetic risk, named in the PR description.
- CTA leads to `/dashboard` (local-first — "no signup" is the honest differentiator).

**Gates:** frontend-design token block written before code · risk named · zero
blacklist hits · LCP < 2.5s on Pages build.

## Phase 5 — Motion & data-viz pass (whole product)

- `improve-animations` audit (AUDIT.md workflow) over all surfaces; fix list executed
  with `review-animations` STANDARDS values.
- Frequency-gate sweep: nav/table/hover interactions down to ≤ 150ms surface shifts.
- Chart pass with `ui-ux-pro-max` charts.csv + dataviz rules: mount-only animation,
  color-plus-shape encoding, text/table equivalents, waterfall for period summaries
  (profit/loss bars), donut ≤ 6 slices for cost breakdown, stat card when < 4 points.
- NumberFlow-style count-up audit: mount-only, tabular, reduced-motion silent.

**Gates:** zero animations without a nameable purpose (ledger lists every animation +
its purpose sentence) · chart re-renders animation-free · reduced-motion pass recorded.

## Phase 6 — Hardening (RTL, a11y, performance, print)

- RTL/i18n: full-copy audit against VOCABULARY.md; `<bdi>` sweep; 3-line-English-block
  direction check; 30–40% expansion test at 360px.
- A11y: keyboard walk of every flow; focus visible under sticky chrome; form error
  protocol (aria-invalid/describedby/focus-first-invalid) on all forms; charts get
  table equivalents; AA measured both themes (AAA on KPI numbers).
- Performance: static export budget LCP < 2.5s / INP < 200ms / CLS < 0.1; font
  subsetting check (Cairo arabic+latin only); no blur > 20px; vibrancy fallback.
- Print/export surfaces (reports, PDF): re-apply brand ramp to jsPDF/print CSS —
  exported artifacts must pass the same gate (they are the product's face in Excel/PDF).

**Gates:** measured numbers pasted as evidence (not claims) for every budget ·
keyboard walk recorded per flow · print sample archived in proofs.

## Phase 7 — Continuous enforcement

- PR checklist = anti-slop matrix (copy into PR body); scan.mjs + impeccable detector
  in the loop for every visual PR.
- `ponytail-debt` harvest monthly → debt ledger; `interface-review` quarterly full pass.
- SESSION-LOG updated per session (existing convention).
- Any new screen starts from MASTER v3 + gates file, not from an existing screen's code.

---

## Definition of Done (per surface — composite, from unlazy + gate)

1. Gates file fully checked **with evidence lines** (no `pending`).
2. Four passes done: complete build → expert re-read → defect hunt → free polish.
3. Anti-slop pre-flight matrix: every box ticked honestly.
4. Proof screenshots: light+dark × RTL × 360/1440 in `design-system/proofs/`.
5. `typecheck` + `build` + `test` + `lint` green; scan.mjs clean or justified.
6. Every number reported in the PR re-measured at report time.

## Risks & open decisions

- **Font lock** (Cairo vs Plex Sans Arabic vs incoming reference systems) — Phase 0.
- **Violet in current meshes** conflicts with the fintech anti-pattern lock — Phase 1
  pulls to ≤ 265°; if the client's incoming references demand violet, it needs an
  explicit MASTER amendment (client decision).
- **`docs/DESIGN-SYSTEM.md` (v2)** is now historical; superseded by
  `design-system/MASTER.md` v3 (noted at its top when Phase 1 lands).
- Landing i18n (English variant) intentionally out of scope until the Arabic surface
  is locked.
