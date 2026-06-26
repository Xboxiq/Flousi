# Flousi — Information Architecture & UX Flows

## 1. UX principles

Every screen must answer, at a glance:
1. **What is happening?** (state, period, headline number)
2. **What should I do next?** (one clear primary action)
3. **How much money did I earn?** (net profit, always findable)
4. **What changed?** (deltas vs previous period)

Operating rules: reduce cognitive load, avoid clutter, prefer clarity, money figures in
tabular mono, positive/negative profit consistently color-coded, never hide the net result.

## 2. Page tree (v1)

```
/                         → redirect to /dashboard
/dashboard                Overview: KPIs, charts, top products, recent sales, quick actions
/products                 Product list (search, filter, profit per product)
/products/new             Create product (live profit calculator)
/products/[id]            Product detail / edit (live profit calculator)
/calculator               Standalone quick profit calculator (no save required)
/periods                  Accounting periods list (open + locked/read-only history)
/periods/[id]             Period detail (closing summary, locked report)
/reports                  Reports hub (monthly / yearly / product / profit / expense)
/reports/[type]           Report view + export (PDF / Excel / CSV / print)
/expenses                 Expense tracking (operating costs beyond per-product COGS)
/settings                 Currency, language, theme, tax, default costs, backup/restore
```

Reserved for future (routes designed not to collide): `/auth`, `/orgs`, `/stores`,
`/customers`, `/orders`, `/inventory`, `/insights`.

## 3. Primary navigation

Left sidebar (collapsible), grouped:
- **Overview** → Dashboard
- **Catalog** → Products, Calculator
- **Finance** → Expenses, Periods, Reports
- **System** → Settings

Top bar: period switcher (active accounting period), global search, theme toggle,
quick-add (＋) menu, and a slot reserved for future account/org switcher.

## 4. Core flows

### Flow A — Add a product and see real profit
1. `/products` → primary CTA **Add product** → `/products/new`.
2. Form sections: **Identity** (name, SKU, category, images, notes) ·
   **Pricing** (selling price) · **Costs** (purchase, shipping, packaging,
   marketplace fees, payment fees, taxes, other).
3. A sticky **Profit panel** updates instantly on every keystroke: Revenue, Total Cost,
   Net Profit, Margin %, Break-even, ROI. Positive = success color, negative = danger.
4. Save → returns to list with the new product and its profit badge.

### Flow B — Quick calculation (no commitment)
`/calculator` → enter price + costs → instant results → optional "Save as product".

### Flow C — Close a month
1. `/periods` shows the active period with running totals.
2. **Close period** → confirmation modal (summarizes revenue, costs, net profit,
   product count) → on confirm, the period becomes **read-only** and a fresh period opens.
3. Locked periods are visibly badged and immutable; their reports are archived.

### Flow D — Generate & export a report
`/reports` → pick report type + range → preview → **Export** (PDF / Excel / CSV) or
**Print**. Period-scoped reports pull from locked-period snapshots when available.

### Flow E — Configure defaults
`/settings` → set currency, default marketplace/payment fee %, default tax, theme,
language. Defaults pre-fill new product forms to cut repetitive entry.

## 5. State coverage (mandatory per screen)
- **Loading:** skeletons matching final layout (no spinners for page content).
- **Empty:** composed empty states with the next action (e.g. "Add your first product").
- **Error:** inline for forms, contextual toast for transient failures.
- **Success:** clear confirmation; figures update in place.

## 6. Responsive behavior
- Sidebar collapses to icons < `lg`, becomes a sheet/drawer < `md`.
- KPI grids: 4-up → 2-up → 1-up.
- Tables become stacked cards < `md`; the net-profit figure stays prominent.
- Forms: two-column (form + sticky profit panel) → single column with profit panel pinned to bottom on mobile.

## 7. Internationalization & RTL
Arabic + English from the start. Layout is direction-aware (`dir` attr). Numbers and
currency formatted via `Intl.NumberFormat` with the selected locale/currency.
