# Flousi — Architecture

## 1. Product definition

**Flousi** calculates the *real net profit* of products sold by online stores and small
businesses. It must feel like a premium SaaS product, not a calculator, and must be
extensible toward: inventory, orders, sales analytics, financial dashboards, multi-user,
cloud sync, reports, customers, expenses, tax, multi-currency, and AI insights.

The guiding constraint for every decision: **extensibility and maintainability over speed.**

## 2. Design read (per the design-taste-frontend skill)

> Reading this as: a **product SaaS application** (dashboards, forms, data tables) for
> small-business owners and e-commerce sellers, with a **Linear/Stripe-clean, calm,
> high-trust financial** language, leaning toward **Tailwind v4 utilities + Geist +
> owned components (shadcn-style) + restrained Motion**.

Dial values (product app, not a marketing page):
- `DESIGN_VARIANCE: 3` — predictable, grid-aligned, trustworthy (financial data must not feel "artsy").
- `MOTION_INTENSITY: 3` — purposeful micro-interactions only (state, feedback, hierarchy). No scroll-hijack.
- `VISUAL_DENSITY: 5` — daily-app density; numbers in tabular/mono, breathing room around them.

Note: the `design-taste-frontend` skill is explicitly *landing-page* oriented and lists
dashboards as out of scope. We therefore borrow its **anti-slop discipline, color/shape
locks, dark-mode protocol, motion ethics, and pre-flight checks**, and apply
product-UI conventions (clear IA, full interaction states, accessible data display) for
the application itself. A future marketing/landing surface will use the skill fully.

## 3. Architectural style — Clean Architecture

Dependencies point inward. Inner layers know nothing about outer layers.

```
┌─────────────────────────────────────────────────────────────┐
│ presentation/   Next.js App Router, React components, design  │
│                 system, stores (Zustand), charts              │
│   depends on ▼                                                │
├─────────────────────────────────────────────────────────────┤
│ application/    Use cases / services. Orchestrates domain +   │
│                 ports. e.g. CalculateProductProfit,           │
│                 CloseAccountingPeriod, GenerateMonthlyReport  │
│   depends on ▼                                                │
├─────────────────────────────────────────────────────────────┤
│ domain/         Pure TypeScript. Entities, value objects,     │
│                 the ProfitCalculator. NO framework imports.   │
│                 100% unit-testable, no I/O.                   │
├─────────────────────────────────────────────────────────────┤
│ infrastructure/ Adapters that implement domain/application    │
│                 PORTS: persistence (localStorage/IndexedDB    │
│                 now → cloud API later), export (PDF/CSV/XLSX), │
│                 clock, id generation.                         │
└─────────────────────────────────────────────────────────────┘
```

### Why this matters for Flousi
- The **profit math is the product**. Keeping it in a pure `domain/` layer means it is
  trivially testable, reusable (web, future mobile, future API), and immune to UI churn.
- **Persistence is a detail.** Today: local-first. Tomorrow: cloud DB + multi-user. We
  swap the adapter behind the `Repository` port without touching domain or UI.

### Ports (interfaces owned by inner layers)
- `ProductRepository`, `SaleRepository`, `PeriodRepository`, `SettingsRepository`
- `ExportService` (PDF / CSV / XLSX / print)
- `Clock`, `IdGenerator`

### Folder layout
```
src/
  domain/
    entities/        product.ts, sale.ts, accounting-period.ts
    value-objects/   money.ts, percentage.ts
    services/        profit-calculator.ts
    ports/           repositories.ts, services.ts
    index.ts
  application/
    use-cases/       calculate-product-profit.ts, close-period.ts, ...
  infrastructure/
    persistence/     local-storage/*.ts  (adapters implementing ports)
    export/          csv.ts, ...
    system/          clock.ts, id.ts
  presentation/
    app/             Next.js App Router routes
    components/
      ui/            design-system primitives (Button, Card, Stat, ...)
      charts/        chart wrappers
      layout/        Sidebar, TopBar, AppShell
    features/        dashboard/, products/, reports/, settings/, periods/
    stores/          Zustand stores (UI/session state only)
    styles/          globals.css (design tokens)
    lib/             helpers, formatters, cn()
```

## 4. Technology choices (ADR summary)

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Next.js (App Router) + React 19** | RSC, file routing, future PWA/SSR/API routes, industry-standard for premium SaaS. |
| Language | **TypeScript (strict)** | Strong typing is mandatory for financial correctness. |
| Styling | **Tailwind v4** + CSS-variable semantic tokens | One token source, fast, dark-mode native, no duplicated values. |
| Components | **Owned (shadcn-style), never default state** | Full control of the design system; no template look. |
| Motion | **Motion (`motion/react`)** | Restrained, accessible, `prefers-reduced-motion` aware. |
| Icons | **@phosphor-icons/react** | One family, consistent stroke; per skill guidance (Lucide discouraged). |
| Charts | **Recharts** | Composable, themeable, accessible enough; swappable behind a wrapper. |
| State | **Zustand** | UI/session state only. Domain state flows through use cases. |
| Fonts | **Geist + Geist Mono** via `next/font` | Vercel-grade; mono for all numbers (financial clarity). |
| Tests | **Vitest** (+ Testing Library) | Fast; domain engine gets first-class unit tests. |
| Persistence (now) | **localStorage/IndexedDB adapter** | Local-first, offline-friendly, zero backend to start. |
| Persistence (future) | **Cloud API adapter** | Same port; multi-user/RBAC/audit added without rewrites. |

## 5. Extensibility map (nothing blocks future growth)

| Future capability | How today's design enables it |
|---|---|
| Auth / Orgs / Multi-store | `Repository` ports take a scope; add `OrganizationContext` in application layer. |
| Cloud DB & sync | New adapter implementing existing repository ports. |
| API | Application use cases are transport-agnostic; expose via Next.js route handlers. |
| Offline / PWA | Local-first persistence already offline; add service worker + manifest. |
| Inventory / Orders / Customers | New domain entities + use cases; presentation features added as route groups. |
| AI Insights | New `InsightService` port consuming domain read-models. |
| RBAC / Audit logs | Cross-cutting concerns in application layer (decorators around use cases). |
| Multi-currency | `Money` value object carries currency; conversion via a `RateProvider` port. |

## 6. Quality rules
- Clean Architecture boundaries enforced by import direction (lint rule later).
- Strong typing, no `any` in domain/application.
- Zero duplicated logic — all profit math lives in `ProfitCalculator`.
- Every interactive component ships loading / empty / error states.
- WCAG AA contrast in both themes; full keyboard support.
- Readable naming, documented public APIs, no hacks/shortcuts.
