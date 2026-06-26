---
inclusion: always
---

# Flousi — current project status (auto-loaded)

You are continuing work on **Flousi**, a premium local-first SaaS that calculates the real
net profit of products for online stores / small businesses.

**Before doing anything, read `docs/SESSION-LOG.md` (master resume guide), then
`docs/PROGRESS.md` (phase checklist).** Continue from the "Next steps" section there.

Quick facts:
- Branch: `build-flousi-foundation`. Open PR: #3 → `main`. Push there (never to `main` directly; use the GitHub power, not raw `git push`).
- Stack: Next.js 16 (App Router, **static export** for GitHub Pages) · React 19 · TS strict · Tailwind v4 · Motion · Phosphor · Zustand · Recharts. Fonts: General Sans + Geist Mono.
- Architecture: Clean Architecture — `src/domain` (pure, all profit math), `src/application` (use cases), `src/infrastructure` (localStorage repos + export + seed), `src/presentation` (UI). Don't break layer boundaries.
- Design system v2 "Soft Capital": neumorphism (`.neu-raised`/`.neu-inset`), grainient mesh (`MeshSurface`), glossy orbs (`GlossyOrb`), `Segmented`, `Stepper`. One electric-blue accent. Reference screens in `references/`. See `/styleguide`.
- Health gates before declaring done: `npm run typecheck && npm run lint && npm run test && npm run build` (all must pass). After moving routes, `rm -rf .next` first.
- Gotchas: Phosphor SSR import for server components; `Input` affixes are `leading`/`trailing`; routes are static-export safe (no dynamic segments for runtime data — product detail is `/products/view?id=`).

When you finish a work session: append a row to the changelog in `docs/SESSION-LOG.md` and tick `docs/PROGRESS.md`.
