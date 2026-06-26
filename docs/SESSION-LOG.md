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

Priority order for visual parity + completeness:
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

> When you finish a work session, append a row here and tick items in `docs/PROGRESS.md`.
