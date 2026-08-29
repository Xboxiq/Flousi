"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, Package, Plus } from "@phosphor-icons/react";
import { computeDelivery, computeOrders, type OrderRow } from "@/application/orders";
import { computeCash } from "@/application/cash";
import { AccessPolicy, DELIVERY_ALLOCATION_LABELS, isFreeDelivery } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { useUrlState } from "@/presentation/hooks/use-url-state";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Badge, Button, EmptyState, Segmented, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric, Progress } from "@/presentation/components/structure";
import { OrderStatusControl, STATE_MARK, stateLabel, stateOf } from "./order-status-control";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";
import { OrderBuilder } from "./order-builder";

const PAGE = 12;

/**
 * The filter row over the trips.
 *
 * These are the five states an order can actually be in — `stateOf` reads two
 * independent fields to decide, so the filter compares against the SAME function
 * the rows use rather than re-deriving the state and quietly disagreeing.
 */
const STATE_FILTERS = ["all", "inHand", "withCourier", "pending", "returned"] as const;
type StateFilter = (typeof STATE_FILTERS)[number];

const STATE_OPTIONS: { label: string; value: StateFilter }[] = [
  { label: "الكل", value: "all" },
  { label: "بيدك", value: "inHand" },
  { label: "عند التوصيل", value: "withCourier" },
  { label: "في الطريق", value: "pending" },
  { label: "راجعة", value: "returned" },
];

/**
 * «الطلبيات» — the trips, and what each one actually made.
 *
 * The head of the screen is the reading this phase exists to make possible: what the
 * customers paid for delivery against what the couriers were paid. A merchant who
 * charges a fixed fee «on the customer» may be losing money on every trip, and before
 * P4 nothing in the app could tell him.
 */
export function OrdersView() {
  const loaded = useDataStore((s) => s.loaded);
  const orders = useDataStore((s) => s.orders);
  const sales = useDataStore((s) => s.sales);
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const periods = useDataStore((s) => s.periods);
  const settings = useDataStore((s) => s.settings);
  const access = useAccess();

  const [shown, setShown] = useState(PAGE);
  const [building, setBuilding] = useState(false);

  const view = useMemo(
    () =>
      computeOrders({
        orders,
        sales,
        products,
        reps,
        limit: shown,
        scope: access.salesScope,
      }),
    [orders, sales, products, reps, shown, access.salesScope],
  );
  // `AccessPolicy.inScope` exists so no caller has to remember that the scope has a
  // third state ("none"), which is exactly the thing a caller forgets on the one
  // screen that then leaks.
  const delivery = useMemo(
    () => computeDelivery(orders.filter((o) => AccessPolicy.inScope(access.salesScope, o))),
    [orders, access.salesScope],
  );
  /* The till is scoped to the OPEN period, and says so. «بيدك» over the store's
     whole history would count money the merchant has been spending for months —
     216 pre-P4 sales made the figure 26,000,000 and useless. The app already has a
     window of its own, so the reading uses it rather than inventing a second one. */
  const activePeriod = useMemo(() => periods.find((p) => p.status === "open"), [periods]);
  const cash = useMemo(
    () =>
      computeCash({
        orders: activePeriod ? orders.filter((o) => o.periodId === activePeriod.id) : orders,
        sales: activePeriod ? sales.filter((s) => s.periodId === activePeriod.id) : sales,
        products,
        currency: settings.currency,
        scope: access.salesScope,
      }),
    [orders, sales, products, activePeriod, settings.currency, access.salesScope],
  );

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });
  const canRecord = access.can("recordSales");
  const canSeeCosts = access.can("viewCosts");

  const [filter, setFilter] = useUrlState<StateFilter>("state", "all", STATE_FILTERS);
  const [query, setQuery] = useState("");

  /* The filter runs over the COMPUTED rows, not over raw orders, because the
     state a row wears is `stateOf(order)` — two fields read together — and
     re-deriving it here is how the toolbar and the rows end up disagreeing. */
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return view.rows.filter((row) => {
      if (filter !== "all" && stateOf(row.order) !== filter) return false;
      if (!q) return true;
      const hay = [row.order.code, row.order.customerName, row.order.customerArea, row.repName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [view.rows, filter, query]);

  if (!loaded) {
    return (
      <>
        <PageHeader title="الطلبيات" />
        <Grid>
          <Skeleton className="span-6 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[420px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  /* «أين الطلبات، وأين المال» — the two facts a trip carries, side by side and
     never added together. A row of the table below is a STATE, and its money
     column says what that state means for cash: money already in hand, money a
     courier is holding, money that has not been earned yet. */
  const states: { key: string; label: string; trips: number; value: number; note: string }[] = [
    { key: "inHand", label: "بيدك", trips: cash.inHand.trips, value: cash.inHand.collected, note: "محصّلة" },
    { key: "withCourier", label: "عند التوصيل", trips: cash.withCourier.trips, value: cash.withCourier.collected, note: "عند المندوب" },
    { key: "pending", label: "في الطريق", trips: cash.inFlight.trips, value: cash.inFlight.expected, note: "متوقّعة" },
    { key: "void", label: "راجعة أو ملغاة", trips: cash.lost.trips, value: 0, note: "لا ينطبق" },
  ];

  return (
    <>
      <PageHeader
        title="الطلبيات"
        actions={
          canRecord ? (
            <Button
              size="sm"
              leadingIcon={<Plus size={15} weight="bold" />}
              onClick={() => setBuilding(true)}
            >
              طلبية جديدة
            </Button>
          ) : undefined
        }
      />

      <Grid>
        {/* ── where the trips are, and where their money is ─────────────── */}
        <Panel
          span={6}
          title="أين الطلبات، وأين المال"
          meta={
            <span className="text-[12px] text-subtle">
              {formatNumber(view.total, { locale: settings.locale })} طلبية في{" "}
              {activePeriod?.label ?? "الفترة"}
            </span>
          }
          bare
        >
          <div className="r-tablewrap">
            <table className="r-tbl">
              <thead>
                <tr>
                  <th>حالة الطلب</th>
                  <th className="n">العدد</th>
                  <th className="n">القيمة</th>
                  <th>أين المال</th>
                </tr>
              </thead>
              <tbody>
                {states.map((st) => (
                  <tr key={st.key}>
                    <td>{st.label}</td>
                    <td className="n font-bold">{formatNumber(st.trips, { locale: settings.locale })}</td>
                    <td className="n">{st.value > 0 ? money(st.value) : "—"}</td>
                    <td className="text-subtle">{st.note}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>المجموع</td>
                  <td className="n">{formatNumber(view.total, { locale: settings.locale })}</td>
                  <td className="n">{money(cash.spendable + cash.awaiting)}</td>
                  <td className="text-subtle">المحصَّل والمعلّق</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        {/* ── the delivery reading: charged against paid ────────────────── */}
        {canSeeCosts ? (
          <Panel span={3} title="التوصيل" bodyClassName="flex flex-col gap-3">
            <Metric
              size="sm"
              amount={money(delivery.margin)}
              name={delivery.margin < 0 ? "خسارة على التوصيل" : "بقي لك من أجور التوصيل"}
              className={delivery.margin < 0 ? "[&_.amount]:text-danger" : ""}
            />
            {/* The fill is what the merchant KEPT of the delivery money. Filling
                it with paid/charged made a FULLER bar mean MORE of the fee eaten:
                a rail that read as better the worse it got (§13). */}
            <Progress share={delivery.charged > 0 ? Math.max(0, delivery.margin) / delivery.charged : 0} />
            <dl className="mt-1 flex flex-col gap-1.5 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-subtle">قُبض</dt>
                <dd><bdi className="r-num text-fg">{money(delivery.charged)}</bdi></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-subtle">دُفع</dt>
                <dd><bdi className="r-num text-fg">{money(delivery.paid)}</bdi></dd>
              </div>
              {delivery.freeTrips > 0 && (
                <div className="flex justify-between">
                  <dt className="text-subtle">توصيل مجاني</dt>
                  <dd><bdi className="r-num text-fg">{formatNumber(delivery.freeTrips, { locale: settings.locale })}</bdi></dd>
                </div>
              )}
            </dl>
          </Panel>
        ) : (
          <Panel span={3} title="التوصيل">
            <p className="text-[13px] text-subtle">أرقام التوصيل مخفية عن هذا الدور.</p>
          </Panel>
        )}

        {/* ── the one panel asking for a decision ───────────────────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {canSeeCosts && delivery.subsidised > 0 ? (
            <>
              <Metric
                size="sm"
                amount={formatNumber(delivery.subsidised, { locale: settings.locale })}
                name={`رحلة دفعت فيها أكثر مما قبضت، من أصل ${formatNumber(delivery.trips, { locale: settings.locale })}`}
              />
              <p className="text-[12px] leading-relaxed text-muted">
                أجرة المندوب أعلى مما تأخذه من الزبون في هذه الرحلات. راجع السعر أو المنطقة.
              </p>
            </>
          ) : cash.withCourier.trips > 0 ? (
            <>
              <Metric
                size="sm"
                amount={money(cash.awaiting)}
                name={`${formatNumber(cash.withCourier.trips, { locale: settings.locale })} طلبية مالها عند المندوب`}
              />
              <p className="text-[12px] leading-relaxed text-muted">
                حصّلها وسجّلها «بيدك» حتى يصير الرقم الأول في اللوحة صحيحاً.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              لا شيء معلّق: لا رحلة بالخسارة ولا مال عند مندوب.
            </p>
          )}
        </Panel>

        {/* ── the work: every trip, filterable ──────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <>
              <span className="text-[11px] text-subtle">
                {formatNumber(rows.length, { locale: settings.locale })} من{" "}
                {formatNumber(view.total, { locale: settings.locale })}
                {view.looseSales > 0 &&
                  ` · ${formatNumber(view.looseSales, { locale: settings.locale })} بيعة بلا طلبية`}
              </span>
              {view.rows.length < view.total && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="ms-auto"
                  onClick={() => setShown((n) => n + PAGE)}
                >
                  عرض المزيد
                </Button>
              )}
            </>
          }
        >
          <Toolbar title="الرحلات">
            <div className="relative w-full max-w-[220px]">
              <MagnifyingGlass
                size={15}
                className="pointer-events-none absolute inset-inline-start-2.5 top-1/2 -translate-y-1/2 text-subtle"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث برقم الطلب أو الزبون"
                aria-label="ابحث في الرحلات"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 ps-8 pe-3 text-[13px] text-fg placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus)]"
              />
            </div>
            <Segmented
              aria-label="حالة الطلب"
              options={STATE_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
            <span className="r-spacer" />
          </Toolbar>

          {rows.length === 0 ? (
            <EmptyState
              icon={<Package size={24} />}
              title={view.rows.length === 0 ? "لا طلبيات بعد" : "لا رحلة تطابق هذا البحث"}
              action={
                view.rows.length === 0 && canRecord ? (
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setBuilding(true)}>
                    طلبية جديدة
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-col">
              {rows.map((row) => (
                <OrderRowView
                  key={row.order.id}
                  row={row}
                  money={money}
                  locale={settings.locale}
                  canSeeCosts={canSeeCosts}
                  canRecord={canRecord}
                  audience={access.salesScope === undefined ? "owner" : "rep"}
                />
              ))}
            </ul>
          )}
        </Panel>
      </Grid>

      {canRecord && <OrderBuilder open={building} onClose={() => setBuilding(false)} />}
    </>
  );
}

function OrderRowView({
  row,
  money,
  locale,
  canSeeCosts,
  canRecord,
  audience,
}: {
  row: OrderRow;
  money: (n: number) => string;
  locale: string;
  canSeeCosts: boolean;
  canRecord: boolean;
  audience: "owner" | "rep";
}) {
  const [open, setOpen] = useState(false);
  /* Mounted on first open, kept after — the same rule as the ladder's rungs. */
  const [everOpened, setEverOpened] = useState(false);
  const r = row.result;
  const o = row.outcome;
  const state = stateOf(row.order);
  const mark = STATE_MARK[state];
  const isVoid = state === "returned" || state === "cancelled";
  // A trip that never arrived did not lose money on its delivery margin; it lost the
  // delivery outright, and that is said in the panel below rather than twice.
  const subsidised = r.deliveryMargin < 0 && !isVoid;

  return (
    <li data-row className="border-b border-border-soft last:border-b-0">
      {/* Collapsed to one line, opened on tap — the pattern the checkout research
          settles for order summaries on a phone. */}
      <button
        type="button"
        onClick={() => {
          setEverOpened(true);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 py-3.5 text-start transition-colors hover:bg-surface-2"
      >
        {/* The key is the STATE's own form, so «راجعة» is distinguishable from
            «بيدك» at a glance and never by colour alone (§13, gate P5/G3). */}
        <span
          className={cn(
            "squircle size-9 shrink-0",
            isVoid ? "text-danger" : state === "inHand" ? "text-accent" : "text-muted",
          )}
          aria-hidden
        >
          {mark.icon}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            {/* An isolate, or the bidi algorithm reorders «ط-1043» into «1043-ط»:
                the digits are a left-to-right run inside a right-to-left line, and
                the dash between them belongs to neither. */}
            <bdi className="truncate font-medium text-fg">
              {row.order.code ?? row.order.customerName ?? "طلبية"}
            </bdi>
            <Badge tone={isVoid ? "danger" : state === "inHand" ? "success" : "neutral"}>
              {stateLabel(state, audience)}
            </Badge>
            {r.discountTotal > 0 && <Badge tone="accent">عرض</Badge>}
            {/* An offer the merchant CHOSE, named as one — never scolded as a loss. */}
            {isFreeDelivery(row.order) && <Badge tone="accent">توصيل مجاني</Badge>}
            {subsidised && canSeeCosts && !isFreeDelivery(row.order) && (
              <Badge tone="danger">توصيل بالخسارة</Badge>
            )}
          </span>
          {/* WHERE and WHEN — the two things that identify a trip in a list. The item
              and piece counts moved into the panel, which lists every line with its own
              quantity anyway, and the rep's name with them: a five-part meta line under
              a code is not a row a merchant scans (VISUAL-LAW §15). */}
          <span className="mt-0.5 block truncate text-xs text-muted">
            {row.order.customerArea ? `${row.order.customerArea} · ` : ""}
            {/* Day and month, no year: every trip in this list is inside one period, so
                the year was a figure repeated on every row that distinguished none. */}
            {formatDate(row.order.placedAt, { locale, month: "short", day: "numeric" })}
          </span>
        </span>
        <span className="shrink-0 text-end">
          {/* What the trip DID, not what it would have done. A pending or void trip
              collected nothing, so its figure is struck rather than printed as
              income: the amount is real, the collection is not (gate P5/G3). */}
          <bdi
            dir="ltr"
            className={cn(
              "block font-figure text-sm font-semibold tabular-nums",
              o.collected === 0 ? "text-muted" : "text-fg",
              /* A semantic strike, not decoration: the amount exists on the order but
                 was never collected, which is the accounting convention for a voided
                 figure. */
              o.collected === 0 &&
                r.collected > 0 &&
                // deslop-ignore-next-line 09
                "line-through decoration-[1.5px] decoration-current/60",
            )}
          >
            {money(o.collected === 0 ? r.collected : o.collected)}
          </bdi>
          {canSeeCosts && (
            <bdi
              dir="ltr"
              className={cn(
                "mt-0.5 block font-figure text-[11px] tabular-nums",
                o.netProfit < 0 ? "text-danger" : "text-muted",
              )}
            >
              {state === "pending" ? "متوقّع " : o.netProfit < 0 ? "خسارة " : "ربح "}
              {money(Math.abs(state === "pending" ? r.netProfit : o.netProfit))}
            </bdi>
          )}
        </span>
      </button>

      <div className="disclose disclose-fast" data-open={open} inert={open ? undefined : true}>
        <div>
          {everOpened && (
            <div className="flex flex-col gap-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_18rem]">
            <ul className="flex flex-col">
              {row.lines.map((line, i) => {
                const lineResult = r.lines.find((l) => l.lineId === line.id);
                return (
                  <li
                    key={line.id}
                    className="flex items-baseline justify-between gap-3 border-t border-border-soft py-2 text-sm first:border-t-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-fg">{row.names[i]}</span>
                      <span className="text-xs text-muted">
                        {line.quantity} ×{" "}
                        <bdi dir="ltr" className="font-figure">
                          {money(line.unitPrice)}
                        </bdi>
                        {canSeeCosts && lineResult && lineResult.deliveryShare > 0 && (
                          <>
                            {" · توصيل "}
                            <bdi dir="ltr" className="font-figure">
                              {money(lineResult.deliveryShare)}
                            </bdi>
                          </>
                        )}
                      </span>
                    </span>
                    <bdi dir="ltr" className="shrink-0 font-figure text-sm tabular-nums text-fg">
                      {money(lineResult?.revenue ?? 0)}
                    </bdi>
                  </li>
                );
              })}
              {row.lineCount === 0 && (
                <li className="py-2 text-sm text-subtle">لا أصناف مسجّلة في هذه الطلبية.</li>
              )}
            </ul>

            <div className="flex flex-col gap-3">
              {isVoid ? (
                /* A void trip's own arithmetic: nothing collected, the goods back on the
                 shelf, and the delivery legs the only real cost (gate P5/G1). */
                <dl className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-sunken p-3 text-xs">
                  <Row label="المحصّل" value={money(0)} strong />
                  {canSeeCosts && (
                    <>
                      <Row label="توصيل مدفوع" value={money(r.deliveryPaid)} />
                      {(row.order.returnCost ?? 0) > 0 && (
                        <Row label="أجرة الرجوع" value={money(row.order.returnCost ?? 0)} />
                      )}
                      <Row
                        label={o.netProfit < 0 ? "خسارة الطلبية" : "نتيجة الطلبية"}
                        value={money(Math.abs(o.netProfit))}
                        strong
                        tone={o.netProfit < 0 ? "danger" : undefined}
                      />
                    </>
                  )}
                  <p className="mt-1 text-[11px] leading-relaxed text-subtle">
                    قيمة شراء الأصناف ليست خسارة: الأصناف عندك. لو سُلّمت هذه الطلبية لكانت حصّلت{" "}
                    <bdi dir="ltr" className="font-figure">
                      {money(r.collected)}
                    </bdi>
                    .
                  </p>
                </dl>
              ) : (
                <dl className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-sunken p-3 text-xs">
                  {r.discountTotal > 0 && (
                    <>
                      <Row label="الأصناف قبل العرض" value={money(r.listRevenue)} />
                      <Row label="الخصم" value={money(r.discountTotal)} tone="danger" />
                    </>
                  )}
                  <Row
                    label={r.discountTotal > 0 ? "أصناف بعد العرض" : "أصناف"}
                    value={money(r.goodsRevenue)}
                  />
                  <Row label="توصيل مقبوض" value={money(r.deliveryCharged)} />
                  <Row
                    label={state === "pending" ? "المتوقّع" : "المحصّل"}
                    value={money(r.collected)}
                    strong
                  />
                  {canSeeCosts && (
                    <>
                      <Row label="تكلفة الأصناف" value={money(r.goodsCost)} />
                      <Row label="توصيل مدفوع" value={money(r.deliveryPaid)} />
                      <Row
                        label="نتيجة التوصيل"
                        value={money(r.deliveryMargin)}
                        tone={
                          r.deliveryMargin < 0
                            ? "danger"
                            : r.deliveryMargin > 0
                              ? "success"
                              : undefined
                        }
                      />
                      <Row
                        label={state === "pending" ? "صافي متوقّع" : "صافي الطلبية"}
                        value={money(r.netProfit)}
                        strong
                        tone={r.netProfit < 0 ? "danger" : "success"}
                      />
                      <Row label="الهامش" value={formatPercent(r.margin, { locale })} />
                    </>
                  )}
                  <p className="mt-1 text-[11px] leading-relaxed text-subtle">
                    توزيع الأجرة: {DELIVERY_ALLOCATION_LABELS[row.order.deliveryAllocation]}. ربح
                    الطلبية لا يتغيّر به.
                    {state === "pending" &&
                      " ولا شيء من هذا محقّق قبل أن تُسلَّم الطلبية ويوصلك مالها."}
                    {state === "withCourier" && " والمال ما زال عند شركة التوصيل، لا بيدك."}
                  </p>
                </dl>
              )}
            </div>
          </div>

          {/* The control spans the row: a segmented group of four in an 18rem column
              wrapped into a 2×2 block that read as a keypad, not as a state. */}
          {canRecord && <OrderStatusControl order={row.order} />}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "danger" | "success";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd>
        <bdi
          dir="ltr"
          className={cn(
            "font-figure tabular-nums",
            strong ? "font-bold text-fg" : "text-fg",
            tone === "danger" && "text-danger",
            tone === "success" && "text-success",
          )}
        >
          {value}
        </bdi>
      </dd>
    </div>
  );
}
