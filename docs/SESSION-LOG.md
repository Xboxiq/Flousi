# Flousi — Master Session Log & Resume Guide

> **Read this FIRST when resuming (new session or new agent).**
> Order: (1) this file → (2) `docs/PROGRESS.md` (phase checklist) → (3) `docs/ARCHITECTURE.md`,
> `docs/IA-UX.md`, `docs/DESIGN-SYSTEM.md`. Then continue from "Next steps" below.

---

## 1. Snapshot (where we are right now)

- **Project:** Flousi — premium SaaS that calculates the real net profit of products for online stores / small businesses. Local-first, extensible toward inventory/orders/multi-user/cloud.
- **Status:** v1 complete (all 14 workflow phases) **+** a v2 design-system overhaul ("Soft Capital") applied to the highest-impact surfaces.
- **Branch:** `build-flousi-foundation`
- **Open PR:** [#3](https://github.com/Xboxiq/Flousi/pull/3) (target `main`). Keep pushing here.
- **GitHub Pages:** static export configured; workflow `.github/workflows/deploy.yml` deploys on push. URL once enabled: `https://xboxiq.github.io/Flousi/` (Settings → Pages → Source: GitHub Actions).
- **Health gates (all green):** `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test` (24/24).

---

## 2. Tech stack & commands

Next.js 16 (App Router, **static export**) · React 19 · TypeScript strict · Tailwind v4 · Motion · Phosphor · Zustand · Recharts · Vitest. Fonts: **General Sans** (fontshare, via `<link>` in `layout.tsx`) + **Geist Mono** (numbers).

```bash
npm install
npm run dev        # localhost:3000 (seeds demo data first run)
npm run typecheck && npm run lint && npm run test
NEXT_PUBLIC_BASE_PATH=/Flousi npm run build   # static export -> ./out (Pages build)
```

---

## 3. Architecture (Clean Architecture — keep boundaries)

```
src/domain/         pure TS: Money, Percentage, entities, ProfitCalculator, ports     (NO framework imports)
src/application/    use cases: analytics.ts, periods.ts, reports.ts                    (returns RAW values; no presentation imports)
src/infrastructure/ localStorage repos, seed.ts, export-service.ts, backup.ts, system  (adapters implementing ports)
src/presentation/   components/ui (primitives), components/layout, features/*, stores/, lib/
src/app/            Next routes: (app) group + styleguide
```

- **All profit math lives in `domain/ProfitCalculator`.** Don't duplicate it.
- **Persistence is a localStorage adapter** behind repository ports → swappable to a cloud API later. `data-store.ts` (Zustand) hydrates from repos + seeds on first run.

---

## 4. Design system v2 — "Soft Capital" (the look the references demand)

Implemented in `src/app/globals.css`. The reference screens (in `references/`) ARE the brand brief: neumorphic soft-UI, grainy mesh gradients, glossy 3D orbs, bento depth, one electric-blue accent.

Material classes / components:
- `.neu-raised`, `.neu-raised-sm`, `.neu-inset` — soft dual-shadow depth.
- `.grainy` — SVG-noise grain overlay (fixed, pointer-events-none).
- `.mesh-aurora` / `.mesh-night` / `.mesh-night-rose` — grainient gradients → use via `<MeshSurface variant=…>`.
- `.orb-blue` / `.orb-silver` / `.orb-emerald` → `<GlossyOrb tone=…>`.
- Components: `MeshSurface`, `GlossyOrb`, `Segmented`, `Stepper` (+ refined `Button` pill/glossy, `Card`, `Stat`). See `/styleguide`.
- Accent = electric blue only. Indigo/violet/rose appear ONLY inside mesh gradients.
- Semantic tokens: `bg`, `bg-tint`, `surface`, `surface-2`, `sunken`, `border`/`border-soft`, `fg`/`muted`/`subtle`, `accent`/`accent-strong`/`accent-soft`, `success`/`danger`/`warning`/`info` (+`-soft`), shadows `xs..xl`. Dark via `[data-theme="dark"]`.

**Design overhaul applied to:** design tokens (global, so every screen inherits softer surfaces), `Dashboard` (bento + mesh hero), `ProfitPanel` (mesh-night hero), shared primitives, Settings theme switcher (Segmented), `/styleguide` (materials showcase).

**NOT yet individually art-directed (still functional, inherit new tokens):** products list, product detail/form layout polish, periods view, reports hub/view, settings forms. These are the main "next steps" for visual parity.

---

## 5. Route map (all static-exportable)

`/` (client redirect → dashboard) · `/dashboard` · `/products` · `/products/new` · `/products/view?id=…` (detail; query-param route, NOT a dynamic segment — required for static export) · `/calculator` · `/periods` · `/reports` · `/reports/[type]` (SSG over 5 types) · `/settings` · `/styleguide`.

---

## 6. Gotchas / conventions (don't relearn the hard way)

- **After moving/renaming routes:** `rm -rf .next` before `typecheck`/`build` (stale Next route validator types otherwise error).
- **Phosphor icons:** server components import from `@phosphor-icons/react/dist/ssr`; client components import from `@phosphor-icons/react` (and need `"use client"`).
- **Recharts tooltip formatter:** don't annotate `value: number`; use `Number(value)` (v3 typing).
- **Static export:** `next.config.ts` has `output: "export"`, `trailingSlash`, `images.unoptimized`, and `basePath` from `NEXT_PUBLIC_BASE_PATH` (set to `/Flousi` by the Pages workflow). No server-only features (no runtime `redirect()` in pages → root uses a client redirect).
- **GitHub push:** use the github power's `push_to_remote` / `create_pull_request` (or sandbox tools). Never `git push` directly. Always push to `build-flousi-foundation` (or a new branch), never `main`.
- **`Input` affixes** are `leading`/`trailing` (not `prefix`/`suffix` — collides with native HTML attr).
- **`Button`** supports `asChild` (wrap a Next `<Link>`).
- **Skills:** the 3 design skills (design-taste-frontend/brandkit/animate) are NOT in this branch's tree; the canonical taste-skill content was fetched from `github.com/Leonxlnx/taste-skill` (`skills/taste-skill/SKILL.md`). The 24 reference images are in `references/` and cataloged in `.kiro/steering/visual-references.md` (on `main`).

---

## 7. Next steps (pick up here)

> **2026-08-17 — Design Plan v3 supersedes the list below.** Execute
> `docs/DESIGN-PLAN.md` phase by phase (Phase 0 = reference intake, waiting on the
> client's attached design-system files; Phase 1 = foundation surgery can start now).
> Contract: `design-system/MASTER.md` v3. Mandatory gate:
> `.claude/skills/flousi-anti-slop-gate/`. 29 curated skills vendored under
> `.claude/skills/` (see its README + the routing table in the plan).

Old v2 priority list (historical):
1. **Art-direct remaining screens** to the Soft Capital language:
   - Products list → bento/cards, profit polarity, softer table.
   - Product form/detail → group sections on soft surfaces, use `Stepper` for create flow, glossy save CTA.
   - Periods → close flow with `Stepper`, mesh summary hero.
   - Reports hub → premium cards with mesh accents; report view header polish.
   - Settings → soft grouped cards, `GlossyOrb`/`Segmented` accents.
2. **Marketing landing page** (`/` or `/home`) applying the full `taste-skill` (hero, bento, social proof, CTA) — this is where the skill fully applies.
3. **Full i18n + RTL** (Arabic): translate strings + `dir` switching wired to `settings.language`.
4. **Expenses module** (operating costs beyond per-product COGS) — was deferred; re-add to nav when built.
5. Optional: merge PR #3 → main once design parity is acceptable.

---

## 8. Session changelog

| Date | Session focus | Outcome |
|---|---|---|
| 2026-06-26 | Build Flousi v1 (phases 0–14) | Foundation, domain engine, dashboard, products+calculator, periods, reports+export, settings, tests, docs. PR #3. |
| 2026-06-26 | GitHub Pages | Static export + `deploy.yml`; `/products/[id]` → `/products/view?id=`. |
| 2026-06-26 | Design overhaul v2 "Soft Capital" | New tokens (neumorphism, grainient mesh, glossy orbs), General Sans, revamped dashboard + ProfitPanel + signature components + styleguide. |
| 2026-08-17 | **Design Plan v3 "Precision Capital"** | Audited + vendored 29 skills into `.claude/skills/` (impeccable, frontend-design, emil motion set, interfaces, ui-ux-pro-max data, kill-ai-slop, unlazy, ponytail, layers). Authored `flousi-anti-slop-gate` skill, rewrote `design-system/MASTER.md` (v3), wrote `docs/DESIGN-PLAN.md` (7 phases, gates method, reference-intake protocol for incoming client design files). `docs/DESIGN-SYSTEM.md` marked historical. |
| 2026-08-17 | **Plan v3 Phase 1 — Foundation surgery** | All 15 gates green with evidence (`gates/phase-1.md`). Emil motion tokens + `lib/motion.ts` presets (all hand-written curves migrated); `--elev-card` shadow-as-border recipes (light triple / dark ring), Card ghost-combo removed; type role ramp tokens (micro→kpi); `Money` primitive (bdi+mono+tabular+polarity) adopted in periods; violet purged (mesh capped at #4f5dff, night-rose→mesh-night-danger); static `--ink`/`--paper` tokens replaced raw hexes; gradient-clip headline removed; `uppercase tracking-wide` stripped from Arabic labels (breaks connected script); theme-flip suppressor; vibrancy `prefers-reduced-transparency` fallback; scrim blur + icon scale-hover removed. typecheck/lint/test(24)/build green. **Next: Phase 0 reference intake when client files arrive, else Phase 2 (signature system).** |
| 2026-08-17 | **Plan v3 Phase 2 — Signature system** | 10/10 gates green (`gates/phase-2.md`). `design-system/SIGNATURE.md` charters the 5 identity devices with laws. Built `LivingNumber` (interruptible glide from live value, ≤300ms, reduced-motion snap) and wired it into ProfitPanel hero with worded 3-state polarity (رابح/خسارة/تعادل + Equals icon). Enforced "one mesh moment per screen": reports hub demoted 4 of 5 mesh headers to quiet cards. ProfitPanel/Metric/cost-breakdown ghost combos → shadow-card; internal badge blurs removed; dashboard KPI onto text-kpi role. Scan 90→88. **Next: Phase 3 screen-by-screen art direction (3.1 dashboard), or Phase 0 when client reference files arrive.** |
| 2026-08-17 | **Plan v3 Phase 3.1 — Dashboard** | 6/6 gates green (`gates/phase-3-1-dashboard.md`) with EYE-verified proofs in `design-system/proofs/dashboard/` (light/dark × 1440/360, RTL). Chart law applied (Arabic tooltips — were English; mount-only 350ms reveal; RTL Y-axis right). Money adopted across dashboard tables/top-products; solid accent bars; `formatDate` (latn digits — dates no longer mix numbering systems with money); responsive hero KPI; nowrap sale rows; CountUp locale-aware; fixed English loading copy in periods. Scan 88→84. **Next: 3.2 products list (screenshot-verify flow established: build → serve out/ on :8123 → npx playwright screenshot).** |
| 2026-08-17 | **DIRECTION PIVOT → v4 "المال الملموس / Tangible Capital"** | Client rejected v3 restraint as plain. New charter (`design-system/MASTER.md` v4): rich/dimensional/cinematic — 3D object cast (Coin, Vault, Receipt, orbs v2, chart blocks), material system (mesh family, glass, clay, metal + grain), global light logic (top-start), motion promoted to structure (scene entrances, physical springs, pointer tilt, per-flow rituals), crafted imagery pipeline (`public/assets/3d/` + ASSETS.md, license-safe, never lifted from references). ONE law kept: anti-slop gate (+ a11y/RTL/perf floors). v3 restraint caps explicitly repealed (MASTER §9); token plumbing carries over. Plan rewritten (`docs/DESIGN-PLAN.md` v4): D0 direction proof (calculator + dashboard-hero taster, client approves before rollout) → D1 asset foundry → D2 material/motion tokens → D3 scene-by-scene → D4 landing showpiece → D5 hardening. SIGNATURE.md v2; gate skill updated (glass authored-not-default, grain ≤0.10, materials authorship test in matrix). **Next: D0 — build the direction proof.** |
| 2026-08-17 | **Product Plan v1 — roles, reps, profit sharing** | Client feature: merchant with reps paid by profit split (e.g. cost 10, sold 20 → 5/5), flexible customization, full organization. Authored `docs/PRODUCT-PLAN.md`: ubiquitous vocabulary, domain model (Rep, CommissionScheme kinds profitShare/fixedPerUnit/percentOfPrice + profitBasis + rounding rules, frozen commissionSnapshot on Sale, derived Balance, Settlement, Target, append-only Ledger), specificity-wins scheme resolution, honest two-stage access (P1–P2 local entities, P3 cloud accounts + permission matrix as integration tests), new screens woven into v4 scenes (reps/settlements/targets/ledger + split-preview ritual at sale time), phases P1–P3 with unit-test gates (client's 10/20→5/5 example verbatim), 4 open decisions for client. DESIGN-PLAN D3 extended (D3.8–D3.10) + sequencing D0 → P1∥D1–D2 → P2+D3 → D4 → D5 → P3. **Next: D0 direction proof (design), then P1.** |
| 2026-08-17 | **nova mined + image-grade standard locked** | Client decisions 1–4 recorded in PRODUCT-PLAN §7 (per-scheme profitBasis, editable 50%, lossPolicy option, Settlement.currency). Cloned client's `Xboxiq/nova` (Arabic-first RTL component library, "Luminous Mineral", 7 theme packs, 3 glass depths) and digested it: authored `design-system/VISUAL-LAW.md` (13-clause law ported/adapted: body-before-shape, overhead-light-only for RTL physics, three-shadow doctrine, state-bound detail, composition-axis balance, rejection log) and `design-system/RECIPES.md` (15 image-grade CSS recipes rebound to Flousi tokens: mesh money field, two-lip glass, @property conic rim, pointer foil, RTL-safe 3D face rig, three-role shadows, state leaks, metal switch, conic orb, blob+masked grid, draw-on sparkline, drum picker, RTL shimmer, ritual button+donut). MASTER v4 amended: §3 light law corrected to overhead-only, §3b image-grade standard (screenshot test, ≥3 light layers — client's "no plain CSS drawings" requirement), motion budget guardrails. DESIGN-PLAN: D1 sources from nova; enforcement expanded (design-law gates that parse code, RTL+LTR×light+dark proofs, dial declaration 8/6/6, deslop-ignore convention). Gate matrix gained the image-grade line. **Next: D0 direction proof — now armed with the recipe book.** |

> When you finish a work session, append a row here and tick items in `docs/PROGRESS.md`.
