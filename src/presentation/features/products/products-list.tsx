"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MagnifyingGlass, Package } from "@phosphor-icons/react";
import { ProfitCalculator } from "@/domain";
import { computeProductTrends } from "@/application/analytics";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, EmptyState, Input, Select, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric, HBar, Chip } from "@/presentation/components/structure";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";
import { Sparkline } from "@/presentation/components/objects/sparkline";

export function ProductsList() {
  const router = useRouter();
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const sales = useDataStore((s) => s.sales);
  const settings = useDataStore((s) => s.settings);
  const access = useAccess();
  const canSeeCosts = access.can("viewCosts");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  // each row's trailing six months, comparable across rows (R27)
  const trends = useMemo(() => computeProductTrends(products, sales), [products, sales]);

  const rows = useMemo(() => {
    return products
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) =>
        query.trim()
          ? [p.name, p.sku, p.category].some((f) => f?.toLowerCase().includes(query.toLowerCase()))
          : true,
      )
      .map((p) => ({ product: p, result: ProfitCalculator.forProduct(p) }));
  }, [products, query, status]);

  const money = (n: number, c: string) =>
    formatCurrency(n, { currency: c, locale: settings.locale });

  // A button that leads straight to a refusal is worse than no button.
  const actions = access.can("manageProducts") ? (
    <Button asChild size="sm" leadingIcon={<Plus size={15} weight="bold" />}>
      <Link href="/products/new">إضافة منتج</Link>
    </Button>
  ) : undefined;

  /* The catalogue's own reading, computed from the SAME rows the table draws so
     the brief and the list can never disagree about which products they mean.
     It is scoped to the visible rows deliberately: a summary that ignores the
     filter above it is a figure the merchant has to mentally discount. */
  const brief = useMemo(() => {
    const priced = rows.filter((r) => r.product.sellingPrice > 0);
    const margins = priced.map((r) => r.result.margin);
    const avg = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
    const ranked = [...priced].sort((a, b) => b.result.netProfit - a.result.netProfit);
    return {
      avgMargin: avg,
      best: ranked.slice(0, 4),
      losing: priced.filter((r) => r.result.netProfit < 0),
      topProfit: ranked[0]?.result.netProfit ?? 0,
      byStatus: {
        active: rows.filter((r) => r.product.status === "active").length,
        draft: rows.filter((r) => r.product.status === "draft").length,
        archived: rows.filter((r) => r.product.status === "archived").length,
      },
    };
  }, [rows]);

  if (!loaded) {
    return (
      <>
        <PageHeader title="المنتجات" actions={actions} />
        <Grid>
          <Skeleton className="span-6 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[420px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <PageHeader title="المنتجات" actions={actions} />
        <EmptyState
          icon={<Package size={24} />}
          title="لا توجد منتجات بعد"
          action={
            <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
              <Link href="/products/new">إضافة منتج</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="المنتجات" actions={actions} />

      <Grid>
        {/* ── which products carry the catalogue ───────────────────────────
            Ordered by what each one KEEPS per unit, not by price: a product
            can be the most expensive thing on the shelf and the least
            profitable, and a list sorted by price hides exactly that. */}
        {canSeeCosts ? (
          <Panel
            span={6}
            title="أكثر المنتجات ربحاً للوحدة"
            meta={<span className="text-[12px] text-subtle">من المعروض أدناه</span>}
          >
            {brief.best.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-subtle">لا منتج بسعر بيع بعد.</p>
            ) : (
              <div className="flex flex-col">
                {brief.best.map((r, i) => (
                  <HBar
                    key={r.product.id}
                    label={r.product.name}
                    value={Math.max(0, r.result.netProfit)}
                    max={Math.max(0, brief.topProfit)}
                    display={money(r.result.netProfit, r.product.currency)}
                    series={(Math.min(i + 1, 4) as 1 | 2 | 3 | 4)}
                    note={`الهامش ${formatPercent(r.result.margin, { locale: settings.locale })}`}
                  />
                ))}
              </div>
            )}
          </Panel>
        ) : (
          <Panel span={6} title="الكتالوج">
            <p className="text-[13px] text-subtle">
              أرقام الربح مخفية عن هذا الدور. القائمة أدناه تعرض الأسعار.
            </p>
          </Panel>
        )}

        {/* ── one figure worth its own size ───────────────────────────────── */}
        <Panel span={3} title="حال الكتالوج" bodyClassName="flex flex-col gap-4">
          {canSeeCosts && (
            <Metric
              size="sm"
              amount={formatPercent(brief.avgMargin, { locale: settings.locale })}
              name="متوسط الهامش على المعروض"
            />
          )}
          <dl className="flex flex-col gap-2 text-[12px]">
            <div className="flex items-center justify-between">
              <dt className="text-subtle">نشط</dt>
              <dd><bdi className="r-num text-fg">{brief.byStatus.active}</bdi></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-subtle">مسودة</dt>
              <dd><bdi className="r-num text-fg">{brief.byStatus.draft}</bdi></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-subtle">مؤرشف</dt>
              <dd><bdi className="r-num text-fg">{brief.byStatus.archived}</bdi></dd>
            </div>
          </dl>
        </Panel>

        {/* ── the one panel asking for a decision ─────────────────────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {canSeeCosts && brief.losing.length > 0 ? (
            <>
              <Metric
                size="sm"
                amount={String(brief.losing.length)}
                name="منتج سعره لا يغطي كلفته"
              />
              <ul className="flex flex-col gap-1 text-[12px]">
                {brief.losing.slice(0, 3).map((r) => (
                  <li key={r.product.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/products/view?id=${r.product.id}`}
                      className="truncate text-fg underline-offset-2 hover:underline"
                    >
                      {r.product.name}
                    </Link>
                    <bdi className="r-num shrink-0 text-danger">
                      {money(r.result.netProfit, r.product.currency)}
                    </bdi>
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-[12px] leading-relaxed text-muted">
                ارفع السعر أو راجع سطور الكلفة قبل أن تبيع منها أكثر.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              {canSeeCosts
                ? "كل منتج معروض يغطي كلفته."
                : "لا شيء معلّق على هذا الدور في الكتالوج."}
            </p>
          )}
        </Panel>

        {/* ── the work: every product ─────────────────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              {rows.length} من {products.length} منتج
            </span>
          }
        >
          <Toolbar title="الكتالوج">
            <div className="relative w-full max-w-[220px]">
              <MagnifyingGlass
                size={15}
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-subtle"
              />
              <Input
                placeholder="ابحث في المنتجات…"
                aria-label="ابحث في المنتجات"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 ps-8 text-[13px]"
              />
            </div>
            <div className="w-40">
              <Select
                aria-label="حالة المنتج"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 text-[13px]"
                options={[
                  { label: "كل الحالات", value: "all" },
                  { label: "نشط", value: "active" },
                  { label: "مسودة", value: "draft" },
                  { label: "مؤرشف", value: "archived" },
                ]}
              />
            </div>
            <span className="r-spacer" />
          </Toolbar>

          <div className="r-tablewrap">
            <table className="r-tbl">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الفئة</th>
                  {canSeeCosts && <th className="hidden md:table-cell">آخر 6 أشهر</th>}
                  <th className="n">السعر</th>
                  {/* Profit and margin ARE the cost: revenue minus profit is what
                      the merchant paid, so printing them to a session without
                      `viewCosts` hands over the purchase price by subtraction
                      (gate P3/G4). */}
                  {canSeeCosts && <th className="n">صافي الربح / وحدة</th>}
                  {canSeeCosts && <th className="n">الهامش</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, result }) => (
                  <tr
                    key={product.id}
                    data-row
                    className="cursor-pointer"
                    onClick={() => router.push(`/products/view?id=${product.id}`)}
                  >
                    <td>
                      {/* The whole row is clickable for the mouse, and the NAME is a
                          real link so the keyboard has the same road. Without it the
                          row was reachable by pointer only: no tab stop, no Enter, no
                          open-in-new-tab, nothing for a screen reader to announce.
                          The link stops the bubble so the row's own handler cannot
                          fire a second navigation on top of it. */}
                      <Link
                        href={`/products/view?id=${product.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-[var(--radius-sm)] font-bold text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      >
                        {product.name}
                      </Link>
                      {product.sku && (
                        <bdi className="r-num block text-[10px] text-subtle">{product.sku}</bdi>
                      )}
                    </td>
                    <td className="text-muted">{product.category ?? "—"}</td>
                    {canSeeCosts && (
                      <td className="hidden md:table-cell">
                        <Sparkline
                          values={trends.get(product.id) ?? []}
                          label={`اتجاه ربح ${product.name} في آخر ستة أشهر`}
                        />
                      </td>
                    )}
                    <td className="n">{money(product.sellingPrice, product.currency)}</td>
                    {canSeeCosts && (
                      <td className={`n ${result.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                        {money(result.netProfit, product.currency)}
                      </td>
                    )}
                    {canSeeCosts && (
                      <td className="n">
                        <Chip tone={result.margin >= 0 ? "success" : "danger"}>
                          {formatPercent(result.margin, { locale: settings.locale })}
                        </Chip>
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-10 text-center text-muted" colSpan={canSeeCosts ? 6 : 3}>
                      لا توجد منتجات مطابقة لبحثك.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </Grid>
    </>
  );
}
