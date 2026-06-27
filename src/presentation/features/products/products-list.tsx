"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MagnifyingGlass, Package } from "@phosphor-icons/react";
import { ProfitCalculator } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
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

export function ProductsList() {
  const router = useRouter();
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const settings = useDataStore((s) => s.settings);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

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

  const actions = (
    <Button asChild leadingIcon={<Plus size={16} weight="bold" />}>
      <Link href="/products/new">إضافة منتج</Link>
    </Button>
  );

  if (!loaded) {
    return (
      <>
        <PageHeader title="المنتجات" description="كل منتج وصافي ربحه الحقيقي." actions={actions} />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="المنتجات" description="كل منتج وصافي ربحه الحقيقي." actions={actions} />

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
                <TH className="text-start">السعر</TH>
                <TH className="text-start">صافي الربح / وحدة</TH>
                <TH className="text-start">الهامش</TH>
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
                    <div className="font-medium text-fg">{product.name}</div>
                    {product.sku && (
                      <div className="font-mono text-xs text-subtle" dir="ltr">{product.sku}</div>
                    )}
                  </TD>
                  <TD className="text-muted">{product.category ?? "—"}</TD>
                  <TD className="text-start font-mono tabular-nums" dir="ltr">
                    {money(product.sellingPrice, product.currency)}
                  </TD>
                  <TD
                    className={`text-start font-mono tabular-nums ${result.netProfit >= 0 ? "text-success" : "text-danger"}`}
                    dir="ltr"
                  >
                    {money(result.netProfit, product.currency)}
                  </TD>
                  <TD className="text-start">
                    <Badge tone={result.margin >= 0 ? "success" : "danger"}>
                      {formatPercent(result.margin, { locale: settings.locale })}
                    </Badge>
                  </TD>
                </TR>
              ))}
              {rows.length === 0 && (
                <TR>
                  <TD className="py-10 text-center text-muted" colSpan={5}>
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
