# Flousi — Build Progress Tracker

> **Autopilot resume file.** This is the single source of truth for "where the build is".
> When resuming, read this file first, then continue from the first unchecked item.
> Update it at the end of every working session.

**Last updated:** 2026-06-26
**Current phase:** Phase 14 — Optimization & documentation (in progress)
**Branch:** `build-flousi-foundation`

---

## Workflow (the mandated 14-step order)

| # | Phase | Status |
|---|-------|--------|
| 0 | Research repository & understand assets | ✅ Done |
| 1 | Plan architecture | ✅ Done |
| 2 | Information Architecture & UX flows | ✅ Done |
| 3 | Design system (single source of truth) | ✅ Done (spec) |
| 4 | Foundation (scaffold + tooling + layers) | 🚧 In progress |
| 5 | Domain layer (profit calculation engine) | ⬜ Pending |
| 6 | Primitive UI components | ⬜ Pending |
| 7 | App shell (layout + navigation) | ⬜ Pending |
| 8 | Dashboard page | ⬜ Pending |
| 9 | Products module + Profit Calculator | ⬜ Pending |
| 10 | Monthly closing | ⬜ Pending |
| 11 | Reports + export | ⬜ Pending |
| 12 | Settings | ⬜ Pending |
| 13 | Testing | ⬜ Pending |
| 14 | Optimization & documentation | ⬜ Pending |

Legend: ✅ done · 🚧 in progress · ⬜ pending

---

## Detailed checklist

### Phase 0 — Research & assets ✅
- [x] Studied 24 UI references (see `.kiro/steering/visual-references.md`)
- [x] Studied skills: `design-taste-frontend`, `brandkit`, `animate`
- [x] Locked design read (see ARCHITECTURE.md → Design Read)

### Phase 1 — Architecture ✅
- [x] `docs/ARCHITECTURE.md` (layers, tech stack, ADRs, extensibility)

### Phase 2 — IA & UX ✅
- [x] `docs/IA-UX.md` (page tree, navigation, core flows)

### Phase 3 — Design system ✅
- [x] `docs/DESIGN-SYSTEM.md` (tokens spec)

### Phase 4 — Foundation ✅
- [x] Next.js 16 (App Router) + React 19 + TypeScript scaffolded at repo root
- [x] Tailwind v4 configured
- [x] Geist + Geist Mono wired via `next/font`
- [x] Icon library (`@phosphor-icons/react`) + Motion + Zustand + Recharts installed
- [x] ESLint + Prettier configured; Vitest configured
- [x] Clean Architecture folder structure started (`src/presentation/*`; domain/application/infrastructure land in Phase 5)
- [x] Design tokens implemented in `globals.css` (`@theme` semantic utilities) + theme provider (no-flash script, light/dark/system)
- [x] App boots — `npm run typecheck` and `npm run build` both pass
- [x] Reference images moved to `references/`

Note: Next routes live in `src/app/*` (Next convention); the rest of presentation is under `src/presentation/*`.

### Phase 5 — Domain layer ✅
- [x] Value objects: `Money` (integer minor units, float-safe), `Percentage`
- [x] Entities: `Product`, `CostBreakdown`/`CostComponent`, `Sale`, `AccountingPeriod` + `PeriodSummary`
- [x] `ProfitCalculator` (revenue, total cost, net profit, margin, ROI, markup, break-even, per-line costs, quantity)
- [x] Ports: repositories (Product/Sale/Period/Settings) + services (Clock/IdGenerator/ExportService)
- [x] Barrel `@/domain`; unit tests (9 passing) for Money + calculator

### Phase 6 — Primitive UI components ✅
- [x] Button (5 variants, sizes, loading), Input (+leading/trailing), Textarea, Select, Field
- [x] Card family, Badge (6 tones + dot), Stat (KPI w/ trend), Skeleton, Spinner, EmptyState, Table family
- [x] Barrel `@/presentation/components/ui`; living `/styleguide` route
- [x] typecheck + build green

### Phase 7 — App shell ✅
- [x] UI store (Zustand): sidebar collapse + mobile drawer
- [x] Logo mark, nav config (Overview/Catalog/Finance/System), Sidebar (collapsible icon rail), MobileNav (animated drawer), TopBar (period switcher, search, theme toggle, quick-add)
- [x] ThemeToggle, PageHeader, AppShell; `(app)` route group layout; dashboard moved under it
- [x] Button gained `asChild`; typecheck + build green

### Phase 8 — Dashboard ✅
- [x] Infrastructure: storage helper, system (id/clock), localStorage repositories (Product/Sale/Period/Settings) implementing ports
- [x] Realistic seed data (6 products, 6 months of sales, open period) — first-run only
- [x] Application analytics: `computeDashboard` (revenue/expenses/net profit/margin, monthly series, top products, recent sales, today/month) via `ProfitCalculator`
- [x] Client data store (Zustand) hydrating from repos + `DataBootstrap`
- [x] Dashboard UI: KPIs, Recharts revenue/profit area chart, top products, recent sales, quick actions; loading + empty states
- [x] typecheck + build + test green

### Phase 9 — Products module + live Profit Calculator ✅
- [x] `ProfitPanel` (instant net profit, margin, revenue, cost, ROI, break-even, cost breakdown) + `Dialog` primitive
- [x] `CostFields` (7 lines, fixed + %), `ProductForm` (create/edit, sticky live panel, settings-default prefill, validation)
- [x] `/products` list (search, status filter, per-product profit), `/products/new`, `/products/[id]` (edit + record sale + delete)
- [x] `RecordSaleDialog`, standalone `/calculator` with "Save as product"
- [x] typecheck + build green (9 routes)

### Phase 10 — Monthly closing ✅
- [x] `computePeriodSummary` + `nextPeriodAfter` (application/periods.ts)
- [x] `/periods`: active period live totals + Close period; locked history with snapshots; start-period empty state
- [x] Close-and-lock confirm dialog (snapshots summary, opens next period)
- [x] Top-bar period switcher wired to active period

### Phase 11 — Reports + export ✅
- [x] `buildReport` (monthly/yearly/product/profit/expense) + `toExportableTable` (application/reports.ts)
- [x] Export service: CSV (native), Excel (SheetJS), PDF (jsPDF+autotable), Print (clean window); `downloadReport`/`printReport`
- [x] `/reports` hub + `/reports/[type]` view (formatted table, export buttons), statically generated
- [x] Removed not-yet-built Expenses from nav (future module)

### Phase 12 — Settings ✅
- [x] Backup/restore utilities (export/import JSON, reset) in infrastructure
- [x] `/settings`: appearance (theme), localization (currency/locale/language), default costs, data backup/restore/reset
- [x] Persists via `saveSettings`; reset reseeds demo data

### Phase 13 — Testing ✅
- [x] Domain: ProfitCalculator + Money (9)
- [x] Application: analytics (6), periods (3), reports (4)
- [x] Infrastructure: CSV export (2)
- [x] 24 tests passing

### Phase 14 — Optimization & documentation 🚧

---

## Key decisions log (quick reference)
- **Stack:** Next.js App Router, TypeScript (strict), Tailwind v4, Motion, Phosphor icons, Zustand, Recharts.
- **Architecture:** Clean Architecture — domain is framework-free and the home of all profit math.
- **Persistence:** Local-first via a `Repository` port; localStorage/IndexedDB adapter now, swappable to a cloud API later. No business logic in the persistence layer.
- **Aesthetic:** Premium SaaS — Stripe/Linear/Vercel. Geist type, restrained motion, dual light/dark, one accent.
- **i18n-ready:** Arabic + English planned (RTL aware) — copy externalized from day one where practical.

## Notes for the next session
- The 24 reference `.jpg` files live at repo root; catalog in `.kiro/steering/visual-references.md`.
- `design-taste-frontend` skill is landing-page oriented (its Section 13 marks dashboards out of scope). Apply its taste/anti-slop rules to marketing surfaces; use disciplined product-UI conventions for the app itself.
