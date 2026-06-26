# Flousi

**Flousi** calculates the *real net profit* of products sold by online stores and small
businesses. It is built as a premium, production-grade SaaS application — not a throwaway
calculator — and is architected to grow into inventory, orders, analytics, multi-user, and
cloud sync without rewrites.

> Premium product aesthetic inspired by Stripe / Linear / Vercel: calm, clean, fast,
> trustworthy, with a single locked accent, dual light/dark themes, and tabular numbers
> everywhere money appears.

## Features

- **Dashboard** — KPIs (net profit, revenue, expenses, margin), revenue/profit trend chart, top products, recent sales, quick actions.
- **Products** — full catalog with per-product profit; create/edit with a **live profit panel** that updates instantly as you type.
- **Profit engine** — revenue, total cost, net profit, margin, ROI, markup, and break-even (handles mixed fixed + percentage costs).
- **Standalone calculator** — test pricing and costs without saving; optionally save as a product.
- **Monthly closing** — close a period to lock it (read-only) with a snapshotted summary; a new period opens automatically.
- **Reports** — monthly, yearly, product, profit, and expense reports with **CSV / Excel / PDF export** and **print**.
- **Settings** — currency, locale, language, theme, default costs, and local **backup / restore / reset**.
- **Local-first** — all data lives in your browser; the persistence layer is swappable to a cloud API behind a single port.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 + CSS-variable semantic tokens |
| Components | Owned, shadcn-style primitives |
| Motion | Motion (`motion/react`) |
| Icons | Phosphor |
| Charts | Recharts |
| State | Zustand (UI/session) |
| Export | jsPDF, SheetJS (xlsx), native CSV |
| Tests | Vitest |
| Fonts | Geist + Geist Mono |

## Architecture (Clean Architecture)

Dependencies point inward; inner layers know nothing about outer layers.

```
presentation/   Next.js routes, design system, feature views, stores
   ▼
application/    Use cases & analytics (computeDashboard, period summary, reports)
   ▼
domain/         Pure TypeScript: Money, Percentage, entities, ProfitCalculator
   ▲
infrastructure/ Adapters for the domain ports: localStorage repos, export, seed, system
```

- **All profit math lives in `domain/`** — framework-free and fully unit-tested.
- **Persistence is a detail.** Today it is a localStorage adapter implementing
  `ProductRepository` / `SaleRepository` / `PeriodRepository` / `SettingsRepository`.
  Swap in a cloud API adapter later without touching domain or UI.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/IA-UX.md`](docs/IA-UX.md), and
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) for the full design records.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (seeds demo data on first run)
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (no emit) |
| `npm run test` | Run unit tests (Vitest) |
| `npm run format` | Prettier write |

## Project structure

```
src/
  domain/         entities, value objects, ProfitCalculator, ports
  application/    analytics, periods, reports (pure use cases)
  infrastructure/ localStorage repositories, export service, seed, system
  presentation/
    app/-not-here (routes live in src/app)
    components/   ui/ (primitives), layout/, charts/, theme/
    features/     dashboard/, products/, periods/, reports/, settings/
    stores/       Zustand (ui + data)
    lib/          cn(), formatters
  app/            Next.js App Router routes ((app) group + styleguide)
```

A living component reference is available at `/styleguide`.

## Testing

```bash
npm run test
```

Covers the profit engine (Money, calculator), dashboard analytics, period summaries,
report building, and CSV export.

## Roadmap / extensibility

The architecture is prepared (no blockers) for: authentication, organizations, multiple
stores, cloud database & sync, an HTTP API, offline/PWA, customers, orders, inventory,
expense tracking, AI insights, RBAC, and audit logs. Each is additive behind existing
ports or as new domain modules.

## Status

Built phase-by-phase following a documented 14-step workflow. Progress and decisions are
tracked in [`docs/PROGRESS.md`](docs/PROGRESS.md).
