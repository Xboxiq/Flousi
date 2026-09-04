"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, Trash, Truck } from "@phosphor-icons/react";
import {
  CommissionCalculator,
  DELIVERY_ALLOCATIONS,
  DELIVERY_ALLOCATION_LABELS,
  calculateOrder,
  costsByProduct,
  type DeliveryAllocation,
  type DiscountKind,
  type OrderDiscount,
  type OrderLineInput,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import {
  Button,
  Dialog,
  Field,
  Input,
  Segmented,
  Select,
} from "@/presentation/components/ui";
import { DistributionBar } from "@/presentation/components/objects/distribution-bar";
import { formatCurrency, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

interface Draft extends OrderLineInput {
  /** Local key only; becomes the sale's id once recorded. */
  key: string;
}

let seq = 0;
const nextKey = () => `L${(seq += 1)}`;

/**
 * بانِي الطلبية — several products, one trip, one delivery fee.
 *
 * The fee is entered TWICE on purpose: what the customer paid, and what the courier
 * was paid. Netting them into one number would hide the only fact about delivery a
 * merchant cannot otherwise see, and in this market the fee is a fixed amount on the
 * customer (usually 5,000 to 10,000) that may quietly cost more than it collects.
 */
export function OrderBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const settings = useDataStore((s) => s.settings);
  const periods = useDataStore((s) => s.periods);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);
  const createOrder = useDataStore((s) => s.createOrder);
  const access = useAccess();

  const sellable = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products],
  );
  const activeReps = useMemo(() => reps.filter((r) => r.status === "active"), [reps]);

  const [lines, setLines] = useState<Draft[]>([]);
  const [charged, setCharged] = useState<number | null>(5_000);
  const [paid, setPaid] = useState<number | null>(5_000);
  const [allocation, setAllocation] = useState<DeliveryAllocation>("byValue");
  const [repId, setRepId] = useState(access.repId ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerArea, setCustomerArea] = useState("");
  /* "" = no offer. The kind, the value and the target line together make the offer. */
  const [offerKind, setOfferKind] = useState<"" | DiscountKind>("");
  const [offerValue, setOfferValue] = useState<number | null>(null);
  const [offerLine, setOfferLine] = useState("");
  const [busy, setBusy] = useState(false);

  const discount: OrderDiscount | undefined = useMemo(
    () =>
      offerKind === "" || offerValue === null || offerValue <= 0
        ? undefined
        : { kind: offerKind, value: offerValue, lineId: offerLine || undefined },
    [offerKind, offerValue, offerLine],
  );

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  const addLine = () => {
    // The first product NOT already on the order: tapping «أضف صنفاً» three times
    // should build three lines, not the same line three times. Falls back to the
    // first product once every one is already on the order, since a merchant may
    // genuinely want two lines of the same thing at different prices.
    const used = new Set(lines.map((l) => l.productId));
    const first = sellable.find((p) => !used.has(p.id)) ?? sellable[0];
    if (!first) return;
    setLines((prev) => [
      ...prev,
      { key: nextKey(), id: nextKey(), productId: first.id, quantity: 1, unitPrice: first.sellingPrice },
    ]);
  };

  const patchLine = (key: string, patch: Partial<Draft>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const result = useMemo(
    () =>
      calculateOrder({
        order: {
          currency: settings.currency,
          deliveryCharged: charged ?? 0,
          deliveryPaid: paid ?? 0,
          deliveryAllocation: allocation,
          discount,
        },
        lines: lines.map((l) => ({ id: l.key, productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
        costsByProduct: costsByProduct(products),
      }),
    [lines, charged, paid, allocation, discount, products, settings.currency],
  );

  const onSave = async () => {
    if (busy || lines.length === 0) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const rep = activeReps.find((r) => r.id === repId) ?? null;
      const discountByKey = new Map(result.lines.map((r) => [r.lineId, r.discountShare]));
      await createOrder({
        order: {
          currency: settings.currency,
          placedAt: now,
          periodId: periods.find((p) => p.status === "open")?.id,
          repId: repId || undefined,
          deliveryCharged: charged ?? 0,
          deliveryPaid: paid ?? 0,
          deliveryAllocation: allocation,
          discount,
          customerName: customerName.trim() || undefined,
          customerArea: customerArea.trim() || undefined,
        },
        lines: lines.map((l) => {
          const product = products.find((p) => p.id === l.productId);
          const lineDiscount = discountByKey.get(l.key) || undefined;
          /* Freeze the split BY VALUE at record time, per line — the same rule the
             single-sale dialog has always followed. P4 shipped order lines WITHOUT
             this, so a trip's sales resolved live forever: they created no debt in
             the balance, and a later scheme edit rewrote their history (gate P6/G5).
             The line's discount share is frozen with it, under the scheme's own
             treatment (gate P6/G3). Undefined when no rule resolves: the sale still
             records and surfaces as fixable. */
          const commissionSnapshot =
            rep && product
              ? CommissionCalculator.snapshot({
                  sale: {
                    unitPrice: l.unitPrice,
                    quantity: l.quantity,
                    currency: settings.currency,
                    repId: rep.id,
                    discount: lineDiscount,
                  },
                  costs: product.costs,
                  rep,
                  resolution: CommissionCalculator.resolveScheme({
                    productId: l.productId,
                    repId: rep.id,
                    assignments,
                    schemes,
                    accountDefaultSchemeId: settings.defaultCommissionSchemeId,
                  }),
                  calculatedAt: now,
                })
              : undefined;
          return {
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: lineDiscount,
            commissionSnapshot,
          };
        }),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const marginTone =
    result.deliveryMargin > 0 ? "text-success" : result.deliveryMargin < 0 ? "text-danger" : "text-muted";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="طلبية جديدة"
      description="عدّة أصناف، رحلة واحدة، أجرة توصيل واحدة."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button onClick={onSave} disabled={busy || lines.length === 0}>
            تسجيل الطلبية
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* ── the lines ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">الأصناف</h3>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Plus size={15} />}
              onClick={addLine}
              disabled={sellable.length === 0}
            >
              أضف صنفاً
            </Button>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-border bg-sunken px-4 py-6 text-center text-sm text-muted">
              {sellable.length === 0
                ? "لا منتجات نشطة بعد. أضف منتجاً أولاً."
                : "أضف أول صنف في هذه الطلبية."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((l) => {
                const share = result.lines.find((r) => r.lineId === l.key);
                return (
                  <li
                    key={l.key}
                    /* Two shapes, not one grid with span overrides: on a phone the
                       product takes its own row and the three small controls share the
                       next; from `sm` the whole line is one grid row. `sm:contents`
                       promotes the inner wrapper's children to grid items, so the same
                       markup serves both — and it avoids a className passthrough that
                       `Select` does not offer, since it applies className to the
                       <select> rather than to the grid item. An earlier `col-span-3`
                       there did nothing at all for exactly that reason. */
                    className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-soft bg-surface p-3 sm:grid sm:grid-cols-[1fr_5rem_7rem_auto] sm:items-center sm:gap-3"
                  >
                    <Select
                      aria-label="المنتج"
                      value={l.productId}
                      onChange={(e) => {
                        const p = sellable.find((x) => x.id === e.target.value);
                        patchLine(l.key, {
                          productId: e.target.value,
                          unitPrice: p?.sellingPrice ?? l.unitPrice,
                        });
                      }}
                      options={sellable.map((p) => ({ label: p.name, value: p.id }))}
                    />
                    <div className="flex items-center gap-2 sm:contents">
                      <Input
                        aria-label="الكمية"
                        type="number"
                        min={1}
                        className="w-16 sm:w-full"
                        value={l.quantity}
                        onChange={(e) =>
                          patchLine(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                        }
                      />
                      <Input
                        aria-label="سعر الوحدة"
                        type="number"
                        min={0}
                        className="min-w-0 flex-1"
                        /* "" is a cleared field, not a zero: a giveaway line is a real
                           thing, and `|| 0` would erase a typed 0 as readily as it
                           invents one. */
                        value={Number.isFinite(l.unitPrice) ? l.unitPrice : ""}
                        onChange={(e) =>
                          patchLine(l.key, {
                            unitPrice: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="حذف الصنف"
                        onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                      >
                        <Trash size={15} />
                      </Button>
                    </div>
                    {share && allocation !== "orderOnly" && (
                      <p className="col-span-2 text-[11px] text-subtle sm:col-span-4">
                        نصيبه من التوصيل{" "}
                        <bdi dir="ltr" className="font-figure">{money(share.deliveryShare)}</bdi>
                        {share.netProfit < 0 ? " · خسارته " : " · ربحه "}
                        {/* The word carries the sign. «-1,028 د.ع.» inside an LTR
                            isolate puts the currency mark on the wrong side of the
                            minus, so the absolute value is printed instead — the same
                            rule the ledger already follows. */}
                        <bdi
                          dir="ltr"
                          className={cn("font-figure", share.netProfit < 0 ? "text-danger" : "")}
                        >
                          {money(Math.abs(share.netProfit))}
                        </bdi>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── the trip ── */}
        <section className="r-slab flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-accent">
              <Truck size={17} weight="bold" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-fg">التوصيل</h3>
              <p className="text-xs text-muted">
                مرّة واحدة للطلبية كلها، لا لكل صنف.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="مقبوض من الزبون" htmlFor="charged" helper="إيراد. اتركه صفراً للتوصيل المجاني.">
              <Input
                id="charged"
                type="number"
                min={0}
                step={1000}
                trailing={settings.currency}
                value={charged ?? ""}
                onChange={(e) => setCharged(e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label="مدفوع للتوصيل" htmlFor="paid" helper="تكلفة. ما يأخذه المندوب أو الشركة.">
              <Input
                id="paid"
                type="number"
                min={0}
                step={1000}
                trailing={settings.currency}
                value={paid ?? ""}
                onChange={(e) => setPaid(e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
          </div>

          {/* The figure that did not exist before: is the trip earning or costing? */}
          <p className="text-sm">
            <span className="text-muted">نتيجة التوصيل </span>
            <bdi dir="ltr" className={cn("font-figure font-bold", marginTone)}>
              {money(result.deliveryMargin)}
            </bdi>
            <span className="text-muted">
              {(charged ?? 0) === 0 && (paid ?? 0) > 0
                ? ": توصيل مجاني، تتحمّل أجرته عرضاً"
                : result.deliveryMargin < 0
                  ? ": أنت تدفع فوق ما تقبض"
                  : result.deliveryMargin > 0
                    ? ": التوصيل يربحك"
                    : ": متعادل"}
            </span>
          </p>

          <Field label="توزيع الأجرة على الأصناف" htmlFor="alloc" labelsGroup>
            <Segmented
              id="alloc"
              aria-labelledby="alloc-label"
              options={DELIVERY_ALLOCATIONS.map((a) => ({
                label: DELIVERY_ALLOCATION_LABELS[a],
                value: a,
              }))}
              value={allocation}
              onChange={setAllocation}
            />
          </Field>
          <p className="text-xs leading-relaxed text-subtle">
            ربح الطلبية لا يتغيّر بهذا الخيار أبداً؛ التوزيع يحرّك التكلفة بين الأصناف فقط،
            كي يبقى «ربح المنتج» تقديراً معلناً لا رقماً مخفيّاً.
          </p>
        </section>

        {/* ── the offer ── */}
        <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border-soft bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Tag size={15} weight="bold" className="text-muted" />
              عرض على هذه الطلبية
            </h3>
            <Segmented
              aria-label="نوع العرض"
              value={offerKind}
              onChange={(next: "" | DiscountKind) => {
                setOfferKind(next);
                if (next === "") {
                  setOfferValue(null);
                  setOfferLine("");
                } else if (offerValue === null) {
                  setOfferValue(next === "percent" ? 10 : 5_000);
                }
              }}
              options={[
                { label: "بلا عرض", value: "" as const },
                { label: "نسبة", value: "percent" as const },
                { label: "مبلغ", value: "fixed" as const },
              ]}
            />
          </div>

          {offerKind !== "" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={offerKind === "percent" ? "النسبة" : "مبلغ الخصم"}
                htmlFor="offer-value"
                helper={
                  offerKind === "percent"
                    ? "من قيمة الأصناف، لا من أجرة التوصيل."
                    : "لا يمكن أن يتجاوز قيمة ما يخصمه."
                }
              >
                <Input
                  id="offer-value"
                  type="number"
                  min={0}
                  max={offerKind === "percent" ? 100 : undefined}
                  step={offerKind === "percent" ? 1 : 500}
                  trailing={offerKind === "percent" ? "%" : settings.currency}
                  value={offerValue ?? ""}
                  onChange={(e) =>
                    setOfferValue(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))
                  }
                />
              </Field>
              <Field
                label="على ماذا؟"
                htmlFor="offer-line"
                helper="الطلبية كلها، أو صنف واحد منها."
              >
                <Select
                  id="offer-line"
                  value={offerLine}
                  onChange={(e) => setOfferLine(e.target.value)}
                  options={[
                    { label: "الطلبية كلها", value: "" },
                    ...lines.map((l) => ({
                      label: sellable.find((p) => p.id === l.productId)?.name ?? "صنف",
                      value: l.key,
                    })),
                  ]}
                />
              </Field>
            </div>
          )}

          {result.discountTotal > 0 && (
            <p className="text-sm">
              <span className="text-muted">قبل العرض </span>
              <bdi dir="ltr" className="font-figure text-muted line-through decoration-[1.5px]">
                {money(result.listRevenue)}
              </bdi>
              <span className="text-muted"> · الخصم </span>
              <bdi dir="ltr" className="font-figure font-semibold text-fg">
                {money(result.discountTotal)}
              </bdi>
              <span className="text-muted"> · الأصناف بعد العرض </span>
              <bdi dir="ltr" className="font-figure font-bold text-fg">
                {money(result.goodsRevenue)}
              </bdi>
            </p>
          )}

          <p className="text-xs leading-relaxed text-subtle">
            التوصيل المجاني ليس من هنا: اترك «مقبوض من الزبون» صفراً في التوصيل، فهو تكلفة
            تتحمّلها لا خصم على سعر الأصناف.
          </p>
        </section>

        {/* ── who and where ── */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Field label="المندوب" htmlFor="order-rep">
            <Select
              id="order-rep"
              value={repId}
              onChange={(e) => setRepId(e.target.value)}
              options={[
                { label: "بيع مباشر (بلا مندوب)", value: "" },
                ...activeReps.map((r) => ({ label: r.name, value: r.id })),
              ]}
            />
          </Field>
          <Field label="الزبون" htmlFor="order-customer">
            <Input
              id="order-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="اسم أو رقم…"
            />
          </Field>
          <Field label="المنطقة" htmlFor="order-area">
            <Input
              id="order-area"
              value={customerArea}
              onChange={(e) => setCustomerArea(e.target.value)}
              placeholder="الكرادة…"
            />
          </Field>
        </section>

        {/* ── the reading, as one divided whole ── */}
        {lines.length > 0 && (
          <section className="flex flex-col gap-3">
            <DistributionBar
              total={Math.max(result.collected, 0.01)}
              format={money}
              formatShare={(n) => formatPercent(n, { digits: 0 })}
              label="قسمة ما حصّلته هذه الطلبية"
              parts={[
                { id: "goods", label: "تكلفة الأصناف", amount: Math.max(0, result.goodsCost), kind: "spend" },
                { id: "delivery", label: "أجرة التوصيل", amount: Math.max(0, result.deliveryPaid), kind: "spend" },
                {
                  id: "keep",
                  label: "يبقى لك",
                  amount: Math.max(0, result.netProfit),
                  kind: "keep",
                },
              ]}
              overrun={
                result.netProfit < 0
                  ? { amount: Math.abs(result.netProfit), label: "تجاوزت التكاليف المحصّل" }
                  : undefined
              }
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="text-muted">
                حصّلت{" "}
                <bdi dir="ltr" className="font-figure font-semibold text-fg">
                  {money(result.collected)}
                </bdi>
              </span>
              <span className="text-muted">
                صافي الطلبية{" "}
                <bdi
                  dir="ltr"
                  className={cn(
                    "font-figure font-bold",
                    result.netProfit < 0 ? "text-danger" : "text-success",
                  )}
                >
                  {money(result.netProfit)}
                </bdi>
              </span>
            </div>
          </section>
        )}
      </div>
    </Dialog>
  );
}
