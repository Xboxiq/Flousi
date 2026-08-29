"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { ProfitCalculator, COST_LINES, type CostLine, type Product } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, Dialog, EmptyState, Skeleton } from "@/presentation/components/ui";
import {
  Grid,
  Panel,
  Toolbar,
  Metric,
  SplitBar,
  SplitKey,
  Chip,
  type Slice,
} from "@/presentation/components/structure";
import { ProductForm } from "./product-form";
import { RecordSaleDialog } from "./record-sale-dialog";
import { useAccess } from "@/presentation/hooks/use-access";
import { COST_LINE_LABELS } from "@/presentation/lib/labels";
import { formatCurrency, formatDate, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

const STATUS_LABELS: Record<string, string> = {
  active: "فعّال",
  draft: "مسودة",
  archived: "مؤرشف",
};

/**
 * «المنتج» — the workbench the boards specify (p9).
 *
 * THE CHANGE THIS MAKES, and it is a product change rather than a visual one:
 * this screen used to BE the edit form. A merchant opening a product to answer
 * «هل هذا المنتج يربّحني؟» was handed twenty inputs and had to compute the answer
 * himself from fields he was in the middle of editing. Reading is now the screen,
 * and editing is an action on it.
 *
 * The layout is a rail plus a workbench, which is what a comparison screen needs:
 * the merchant is rarely asking about ONE product, he is asking «which of these».
 * The rail keeps every product one click away with its margin printed, so the
 * comparison happens without leaving the page. On a phone the rail becomes a strip
 * above the bench, because a 300px column beside a 90px one is not a layout.
 */
export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const loaded = useDataStore((s) => s.loaded);
  const products = useDataStore((s) => s.products);
  const settings = useDataStore((s) => s.settings);
  const deleteProduct = useDataStore((s) => s.deleteProduct);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const access = useAccess();
  const canManage = access.can("manageProducts");
  const canSeeCosts = access.can("viewCosts");
  const canRecord = access.can("recordSales");

  const [saleOpen, setSaleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");

  const result = useMemo(
    () => (product ? ProfitCalculator.forProduct(product) : null),
    [product],
  );

  const money = (n: number, currency?: string) =>
    formatCurrency(n, { currency: currency ?? product?.currency, locale: settings.locale });

  /* The rail's own list, ranked by what each product KEEPS per unit rather than by
     price: the most expensive thing on the shelf can be the least profitable, and
     a list sorted by price hides exactly that. */
  const rail = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) =>
        q ? [p.name, p.sku, p.category].some((f) => f?.toLowerCase().includes(q)) : true,
      )
      .map((p) => ({ product: p, result: ProfitCalculator.forProduct(p) }))
      .sort((a, b) => b.result.netProfit - a.result.netProfit);
  }, [products, query]);

  /* «أين تذهب الكلفة» — the selling price taken apart. Profit first because it is
     what the merchant keeps; the two biggest cost lines next; everything else is
     one honest «كلف أخرى» rather than a rainbow of hairlines. These sum to the
     selling price by construction, which is what makes the bar honest. */
  const slices = useMemo<Slice[]>(() => {
    if (!result) return [];
    const bands: Slice[] = [
      { key: "profit", label: "ربحك", value: Math.max(0, result.netProfit), series: 1 },
    ];
    const lines = COST_LINES.map((line) => ({
      line,
      amount: result.costByLine[line] ?? 0,
    }))
      .filter((l) => l.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const [first, second, ...rest] = lines;
    if (first)
      bands.push({
        key: first.line,
        label: COST_LINE_LABELS[first.line],
        value: first.amount,
        series: 2,
      });
    if (second)
      bands.push({
        key: second.line,
        label: COST_LINE_LABELS[second.line],
        value: second.amount,
        series: 3,
      });
    const other = rest.reduce((sum, l) => sum + l.amount, 0);
    if (other > 0) bands.push({ key: "other", label: "كلف أخرى", value: other, series: 4 });
    return bands;
  }, [result]);

  if (!loaded) {
    return (
      <>
        <PageHeader title="المنتج" section="الكتالوج" />
        <Grid>
          <Skeleton className="span-3 h-[520px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-9 h-[520px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  if (!product || !result) {
    return (
      <>
        <PageHeader title="المنتج" section="الكتالوج" />
        <EmptyState
          title="المنتج غير موجود"
          description="قد يكون حُذف، أو يكون الرابط قديماً."
          action={
            <Button asChild>
              <Link href="/products">العودة إلى الكتالوج</Link>
            </Button>
          }
        />
      </>
    );
  }

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      router.push("/products");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={product.name}
        section="المنتجات"
        actions={
          <>
            {canManage && (
              <Button
                size="sm"
                variant="secondary"
                className="hidden sm:inline-flex"
                leadingIcon={<PencilSimple size={15} />}
                onClick={() => setEditOpen(true)}
              >
                عدّل
              </Button>
            )}
            {canRecord && (
              <Button
                size="sm"
                leadingIcon={<Plus size={15} weight="bold" />}
                onClick={() => setSaleOpen(true)}
              >
                تسجيل بيع
              </Button>
            )}
          </>
        }
      />

      {/* A rail beside a bench, not two panels of one grid: the rail is as tall as
          the whole bench, which a 12-column row cannot express without a row span. */}
      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── the rail: every product, one click away, with its margin printed ── */}
        <Panel
          span="none"
          className="lg:sticky lg:top-[72px] lg:max-h-[calc(100dvh-88px)]"
          bare
          bodyClassName="flex min-h-0 flex-col"
        >
          <Toolbar>
            <div className="relative w-full">
              <MagnifyingGlass
                size={15}
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-subtle"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`ابحث في ${products.length} منتج`}
                aria-label="ابحث في المنتجات"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 ps-8 pe-3 text-[13px] text-fg placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus)]"
              />
            </div>
          </Toolbar>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {rail.length === 0 ? (
              <p className="p-6 text-center text-[13px] text-subtle">لا منتج يطابق البحث.</p>
            ) : (
              rail.map((row) => {
                const current = row.product.id === product.id;
                return (
                  <Link
                    key={row.product.id}
                    href={`/products/view?id=${row.product.id}`}
                    aria-current={current ? "page" : undefined}
                    className="r-datarow"
                  >
                    <span className="tx">
                      <b className="truncate">{row.product.name}</b>
                      {row.product.sku && <span>{row.product.sku}</span>}
                    </span>
                    {canSeeCosts && (
                      <span className="end flex flex-col items-end gap-0.5">
                        <bdi className="r-num text-[13px] font-bold text-fg">
                          {money(row.result.netProfit, row.product.currency)}
                        </bdi>
                        <bdi
                          className={cn(
                            "r-num text-[10px]",
                            row.result.margin >= 0 ? "text-subtle" : "text-danger",
                          )}
                        >
                          {formatPercent(row.result.margin, { locale: settings.locale })}
                        </bdi>
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </Panel>

        {/* ── the bench ────────────────────────────────────────────────────── */}
        <Grid>
          {/* The four figures that ARE the product, in the financial hierarchy the
              system uses everywhere: the amount first, its qualifier under it. */}
          <Panel
            span={12}
            bodyClassName="flex flex-col gap-5"
            footer={
              canManage ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<PencilSimple size={14} />}
                    onClick={() => setEditOpen(true)}
                  >
                    عدّل المنتج
                  </Button>
                  {/* A destructive verb belongs ON the page, at the lowest weight
                      the system has. Moving it inside the edit sheet hid it two
                      clicks deep behind a verb that means the opposite — and the
                      write sweep found it gone, which is what that gate is for. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ms-auto"
                    leadingIcon={<Trash size={14} />}
                    onClick={() => setConfirmDelete(true)}
                  >
                    حذف
                  </Button>
                </>
              ) : undefined
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold leading-tight tracking-tight text-fg">
                  {product.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-subtle">
                  {product.sku && <bdi className="r-num">{product.sku}</bdi>}
                  {product.sku && <span aria-hidden>·</span>}
                  <span>{product.currency}</span>
                  <span aria-hidden>·</span>
                  <span>
                    أُضيف {formatDate(product.createdAt, { locale: settings.locale })}
                  </span>
                </p>
              </div>
              <Chip tone={product.status === "active" ? "success" : "neutral"}>
                {STATUS_LABELS[product.status] ?? product.status}
              </Chip>
            </div>

            <div
              className={cn(
                "grid gap-4 border-t border-line pt-4",
                canSeeCosts ? "sm:grid-cols-4" : "sm:grid-cols-1",
              )}
            >
              <Metric size="sm" amount={money(product.sellingPrice)} name="سعر البيع" />
              {canSeeCosts && (
                <>
                  <Metric size="sm" amount={money(result.totalCost)} name="كلفته كاملة" />
                  <Metric
                    size="sm"
                    amount={money(result.netProfit)}
                    name="ربح القطعة"
                    className={cn(
                      result.netProfit > 0 && "[&_.amount]:text-accent",
                      result.netProfit < 0 && "[&_.amount]:text-danger",
                    )}
                  />
                  <Metric
                    size="sm"
                    amount={formatPercent(result.margin, { locale: settings.locale })}
                    name="الهامش"
                  />
                </>
              )}
            </div>

            {!canSeeCosts && (
              <p className="text-[13px] leading-relaxed text-muted">
                هذه صفحة سعر: أرقام الكلفة والربح مخفية عن هذا الدور.
              </p>
            )}
          </Panel>

          {canSeeCosts && (
            <>
              {/* ── where the price goes ─────────────────────────────────── */}
              <Panel
                span={6}
                title="أين يذهب سعر البيع"
                meta={<bdi className="r-num text-[13px] text-subtle">{money(product.sellingPrice)}</bdi>}
              >
                <SplitBar slices={slices} total={product.sellingPrice} />
                <SplitKey slices={slices} format={(v) => money(v)} />
                <p className="mt-3 text-[11px] leading-relaxed text-subtle">
                  الشريط نفسه بمقياس قطعة واحدة، ومجموعه هو سعر البيع.
                </p>
              </Panel>

              {/* ── the two answers a price sheet exists to give ──────────── */}
              <Panel span={6} title="حدود السعر" bodyClassName="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Metric
                    size="sm"
                    amount={
                      result.breakEvenPrice === null
                        ? "لا يوجد"
                        : money(result.breakEvenPrice)
                    }
                    name="سعر التعادل"
                  />
                  <Metric
                    size="sm"
                    amount={formatPercent(result.roi, { locale: settings.locale })}
                    name="العائد على الكلفة"
                  />
                </div>
                <p className="text-[12px] leading-relaxed text-muted">
                  {result.breakEvenPrice === null ? (
                    "النسب المئوية في سطور الكلفة تبلغ مئة بالمئة أو أكثر، فلا سعر يجعل هذا المنتج متعادلاً. راجع النسب قبل السعر."
                  ) : (
                    <>
                      تحت{" "}
                      <bdi className="r-num font-bold text-fg">
                        {money(result.breakEvenPrice)}
                      </bdi>{" "}
                      تبيع بخسارة. الفرق بينه وبين سعرك الحالي هو كل ما تملكه للخصم أو
                      للتوصيل المجاني.
                    </>
                  )}
                </p>
                {product.notes && (
                  <p className="mt-auto border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
                    {product.notes}
                  </p>
                )}
              </Panel>

              {/* ── the cost sheet, line by line ──────────────────────────── */}
              <Panel
                span={12}
                bare
                footer={
                  <span className="text-[11px] text-subtle">
                    كل سطر مبلغ ثابت أو نسبة من سعر البيع أو الاثنان معاً.
                  </span>
                }
              >
                <Toolbar title="تفصيل الكلفة">
                  <span className="r-spacer" />
                </Toolbar>
                <CostTable
                  product={product}
                  costByLine={result.costByLine}
                  totalCost={result.totalCost}
                  money={money}
                  locale={settings.locale}
                />
              </Panel>
            </>
          )}
        </Grid>
      </div>

      <RecordSaleDialog product={product} open={saleOpen} onClose={() => setSaleOpen(false)} />

      {/* Editing is an ACTION on the sheet, not the sheet itself. The form is the
          same one that always was; what changed is that it no longer stands between
          the merchant and the answer he opened the page for. */}
      {canManage && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title={`تعديل ${product.name}`}
          className="w-[min(720px,calc(100vw-2rem))]"
        >
          <ProductForm product={product} onSaved={() => setEditOpen(false)} />
        </Dialog>
      )}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`حذف ${product.name}؟`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              تراجع
            </Button>
            <Button variant="danger" onClick={onDelete} loading={deleting}>
              حذف المنتج
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          البيعات المسجّلة على هذا المنتج تبقى في السجل، لكنها تفقد اسمها وكلفتها. لا
          يمكن التراجع.
        </p>
      </Dialog>
    </>
  );
}

/**
 * The cost sheet, line by line, with HOW each one was computed printed beside it.
 *
 * The «كيف حُسب» column is the point of the table. A merchant who sees «1,518» for
 * payment fees and nothing else has to trust it; one who sees «2.9% من 42,000 + 300»
 * can check it, and can tell at a glance which lines move when he changes the price
 * and which do not.
 */
function CostTable({
  product,
  costByLine,
  totalCost,
  money,
  locale,
}: {
  product: Product;
  costByLine: Record<string, number>;
  totalCost: number;
  money: (n: number, currency?: string) => string;
  locale: string;
}) {
  const rows = COST_LINES.map((line: CostLine) => {
    const c = product.costs[line];
    return { line, component: c, amount: costByLine[line] ?? 0 };
  }).filter((r) => r.component && (r.component.fixed > 0 || r.component.percent > 0));

  if (rows.length === 0) {
    return (
      <p className="p-6 text-center text-[13px] text-subtle">
        لا سطر كلفة مسجّل بعد. كل ما تبيعه بهذا السعر ربح على الورق فقط.
      </p>
    );
  }

  const rule = (fixed: number, percent: number) => {
    if (fixed > 0 && percent > 0)
      return `${formatPercent(percent / 100, { locale })} + ${money(fixed)}`;
    if (percent > 0) return formatPercent(percent / 100, { locale });
    return "مبلغ ثابت";
  };

  /* The arithmetic, and only where there IS any. A fixed line's «كيف حُسب» was
     printing the same figure the المبلغ column already carries two cells away —
     a column that repeats its neighbour teaches the eye to skip both. */
  const how = (fixed: number, percent: number) => {
    if (percent > 0 && fixed > 0)
      return `${formatPercent(percent / 100, { locale })} من ${money(product.sellingPrice)} + ${money(fixed)}`;
    if (percent > 0)
      return `${formatPercent(percent / 100, { locale })} من ${money(product.sellingPrice)}`;
    return "—";
  };

  return (
    <div className="r-tablewrap">
      <table className="r-tbl">
        <thead>
          <tr>
            <th>السطر</th>
            <th className="pri-2">القاعدة</th>
            <th className="pri-3">كيف حُسب</th>
            <th className="n">المبلغ</th>
            <th className="n">من السعر</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ line, component, amount }) => (
            <tr key={line}>
              <td className="font-bold">{COST_LINE_LABELS[line]}</td>
              <td className="pri-2 text-muted">{rule(component.fixed, component.percent)}</td>
              <td className="pri-3 text-subtle">{how(component.fixed, component.percent)}</td>
              <td className="n">{money(amount)}</td>
              <td className="n text-muted">
                {product.sellingPrice > 0
                  ? formatPercent(amount / product.sellingPrice, { locale })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>مجموع الكلفة</td>
            <td className="pri-2" />
            <td className="pri-3" />
            <td className="n">{money(totalCost)}</td>
            <td className="n">
              {product.sellingPrice > 0
                ? formatPercent(totalCost / product.sellingPrice, { locale })
                : "—"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
