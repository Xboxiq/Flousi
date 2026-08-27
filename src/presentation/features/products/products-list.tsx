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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
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
    <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
      <Link href="/products/new">إضافة منتج</Link>
    </Button>
  ) : undefined;

  /* The description must not promise a figure this session will not be shown: the
     catalogue reads as a price list to a rep, and as a profit sheet to the merchant. */
  const description = canSeeCosts
    ? "كل منتج وصافي ربحه الحقيقي."
    : "كل منتج وسعر بيعه.";

  if (!loaded) {
    return (
      <>
        <PageHeader title="المنتجات" description={description} actions={actions} />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="المنتجات" description={description} actions={actions} />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title="لا توجد منتجات بعد"
          description="أضِف أول منتج لتبدأ بحساب صافي الربح الحقيقي."
          action={
            <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
              <Link href="/products/new">إضافة منتج</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle"
              />
              <Input
                placeholder="ابحث في المنتجات…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <div className="sm:ms-auto sm:w-44">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { label: "كل الحالات", value: "all" },
                  { label: "نشط", value: "active" },
                  { label: "مسودة", value: "draft" },
                  { label: "مؤرشف", value: "archived" },
                ]}
              />
            </div>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>المنتج</TH>
                <TH>الفئة</TH>
                {canSeeCosts && <TH className="hidden md:table-cell">آخر 6 أشهر</TH>}
                <TH className="text-start">السعر</TH>
                {/* Profit and margin ARE the cost: revenue minus profit is what the
                    merchant paid, so printing them to a session without `viewCosts`
                    hands over the purchase price by subtraction (gate P3/G4). */}
                {canSeeCosts && <TH className="text-start">صافي الربح / وحدة</TH>}
                {canSeeCosts && <TH className="text-start">الهامش</TH>}
              </TR>
            </THead>
            <TBody>
              {rows.map(({ product, result }) => (
                <TR
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/products/view?id=${product.id}`)}
                >
                  <TD>
                    {/* The whole row is clickable for the mouse, and the NAME is a real
                        link so the keyboard has the same road — the pattern the reps
                        cards already follow. Without the link this row was reachable
                        by pointer only: no tab stop, no Enter, no open-in-new-tab, and
                        nothing for a screen reader to announce as a destination. The
                        link stops the bubble so the row's own handler cannot fire a
                        second navigation on top of it. */}
                    <Link
                      href={`/products/view?id=${product.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-[var(--radius-sm)] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                      {product.name}
                    </Link>
                    {product.sku && (
                      <div className="font-mono text-xs text-subtle" dir="ltr">{product.sku}</div>
                    )}
                  </TD>
                  <TD className="text-muted">{product.category ?? "—"}</TD>
                  {canSeeCosts && (
                    <TD className="hidden md:table-cell">
                      <Sparkline
                        values={trends.get(product.id) ?? []}
                        label={`اتجاه ربح ${product.name} في آخر ستة أشهر`}
                      />
                    </TD>
                  )}
                  <TD className="text-start font-mono tabular-nums" dir="ltr">
                    {money(product.sellingPrice, product.currency)}
                  </TD>
                  {canSeeCosts && (
                    <TD
                      className={`text-start font-mono tabular-nums ${result.netProfit >= 0 ? "text-success" : "text-danger"}`}
                      dir="ltr"
                    >
                      {money(result.netProfit, product.currency)}
                    </TD>
                  )}
                  {canSeeCosts && (
                    <TD className="text-start">
                      <Badge tone={result.margin >= 0 ? "success" : "danger"}>
                        {formatPercent(result.margin, { locale: settings.locale })}
                      </Badge>
                    </TD>
                  )}
                </TR>
              ))}
              {rows.length === 0 && (
                <TR>
                  <TD className="py-10 text-center text-muted" colSpan={canSeeCosts ? 6 : 3}>
                    لا توجد منتجات مطابقة لبحثك.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </Card>
      )}
    </>
  );
}
