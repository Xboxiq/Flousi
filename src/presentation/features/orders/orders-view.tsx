"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Warning } from "@phosphor-icons/react";
import { computeDelivery, computeOrders, type OrderRow } from "@/application/orders";
import { computeCash } from "@/application/cash";
import { AccessPolicy, DELIVERY_ALLOCATION_LABELS, isFreeDelivery } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
  Skeleton,
} from "@/presentation/components/ui";
import { PaceRail } from "@/presentation/components/objects/pace-rail";
import { CashTill } from "@/presentation/components/objects/cash-till";
import { OrderStatusControl, STATE_MARK, stateLabel, stateOf } from "./order-status-control";
import { Ladder, Rung } from "@/presentation/features/dashboard/ladder";
import {
  NOUNS,
  countedNoun,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";
import { OrderBuilder } from "./order-builder";

const PAGE = 12;

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
  const [deliveryOpen, setDeliveryOpen] = useState(false);

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

  if (!loaded) {
    return (
      <>
        <PageHeader title="الطلبيات" />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-40 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-80 rounded-[var(--radius-2xl)]" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="الطلبيات"
        /* The subsidised COUNT used to be stated here too. It is a cost fact the
           delivery latch already reports, in full, with its own «من أصل» whole: two
           places for one number is one place too many, and the header is the one that
           cannot explain itself (VISUAL-LAW §15). */
        actions={
          canRecord ? (
            <Button
              leadingIcon={<Plus size={16} weight="bold" />}
              onClick={() => setBuilding(true)}
            >
              طلبية جديدة
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        {/* «كم عندي» comes FIRST, before any profit reading: in a market where the
            courier holds the cash for weeks, that is the question the merchant
            actually opens the app with (gate P5/G3). */}
        <CashTill
          reading={cash}
          money={money}
          showLoss={canSeeCosts}
          windowLabel={activePeriod?.label}
          audience={access.salesScope === undefined ? "owner" : "rep"}
        />

        {/* The delivery reading is a DIAGNOSTIC, not a daily question: «هل توصيلي
            يخسر؟» is asked weekly at most, so it sits behind a latch that states its
            own answer while closed. Before P11 it stood open beside the till and the
            two competed — 18 figures in a summary that answers one question, which is
            what «صعب ومعقد» was pointing at (VISUAL-LAW §15). */}
        {canSeeCosts && delivery.trips > 0 && (
          <Ladder solo>
            <Rung
              title="التوصيل: مقبوض مقابل مدفوع"
              open={deliveryOpen}
              onToggle={() => setDeliveryOpen((v) => !v)}
              summary={
                <Money polarity={delivery.margin} className="font-semibold">
                  {money(delivery.margin)}
                </Money>
              }
            >
          <div className="flex flex-col gap-4">
            {/* The fill is what the merchant KEPT of the delivery money, and the
                hatched remainder is what went to the couriers. The first version
                filled it with `paid / charged`, so a FULLER green bar meant MORE of
                the fee had been eaten — a rail that read as better the worse it got.
                Fill must always mean the good direction (§13). */}
            <PaceRail
              height={16}
              attainment={
                delivery.charged > 0 ? Math.max(0, delivery.margin) / delivery.charged : 0
              }
              elapsed={0}
              tone={delivery.margin < 0 ? "danger" : delivery.margin > 0 ? "success" : "muted"}
              label={`بقي لك ${money(delivery.margin)} من ${money(delivery.charged)} قُبضت على التوصيل`}
            />

            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 text-sm">
              <span className="text-muted">
                قُبض{" "}
                <bdi dir="ltr" className="font-figure font-semibold text-fg">
                  {money(delivery.charged)}
                </bdi>
              </span>
              <span className="text-muted">
                دُفع{" "}
                <bdi dir="ltr" className="font-figure font-semibold text-fg">
                  {money(delivery.paid)}
                </bdi>
              </span>
              <span className="text-muted">
                {delivery.margin < 0 ? "خسارة التوصيل " : "ربح التوصيل "}
                <bdi
                  dir="ltr"
                  className={cn(
                    "font-figure font-bold",
                    delivery.margin < 0
                      ? "text-danger"
                      : delivery.margin > 0
                        ? "text-success"
                        : "text-fg",
                  )}
                >
                  {money(Math.abs(delivery.margin))}
                </bdi>
              </span>
            </div>

            {delivery.freeTrips > 0 && (
              <p className="text-xs leading-relaxed text-muted">
                توصيل مجاني تحمّلت أجرته في{" "}
                {countedNoun(delivery.freeTrips, NOUNS.order, { locale: settings.locale })}: عرض
                اخترته، لا خسارة.
              </p>
            )}
            {delivery.subsidised > 0 && (
              <p className="flex items-start gap-2 rounded-[var(--radius-md)] bg-danger-soft p-3 text-xs leading-relaxed text-danger">
                <Warning size={15} weight="bold" className="mt-0.5 shrink-0" />
                <span>
                  {/* The colon form here on purpose: after «في» the Arabic dual takes
                      «طلبيتين», not the nominative «طلبيتان» that `countedNoun`
                      produces, so the count goes after the colon instead. */}
                  رحلات دفعتَ فيها على التوصيل أكثر مما قبضت:{" "}
                  {formatNumber(delivery.subsidised, { locale: settings.locale })} من أصل{" "}
                  {formatNumber(delivery.trips, { locale: settings.locale })}.
                </span>
              </p>
            )}
          </div>
            </Rung>
          </Ladder>
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>الرحلات</CardTitle>
              <CardDescription>
                الأحدث أولاً.
                {view.looseSales > 0 &&
                  ` وهناك ${countedNoun(view.looseSales, NOUNS.sale, {
                    locale: settings.locale,
                  })} مسجّلة بلا طلبية، من قبل هذه الميزة أو من صفحة منتج.`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {view.rows.length === 0 ? (
              <EmptyState
                icon={<Package size={24} />}
                title="لا طلبيات بعد"
                action={
                  canRecord ? (
                    <Button leadingIcon={<Plus size={16} />} onClick={() => setBuilding(true)}>
                      طلبية جديدة
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ul className="flex flex-col">
                  {view.rows.map((row) => (
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
                {/* A pagination counter is only news while something is BEING held
                    back. Shown always, «ظهر 7 من 7» repeated the header's own count
                    at the bottom of the same screen and read as a figure to check
                    (VISUAL-LAW §15). */}
                {view.rows.length < view.total && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
                    <p className="text-xs text-muted">
                      ظهر {formatNumber(view.rows.length, { locale: settings.locale })} من{" "}
                      {formatNumber(view.total, { locale: settings.locale })}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                      عرض المزيد
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
