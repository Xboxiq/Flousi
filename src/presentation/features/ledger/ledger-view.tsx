"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLineDown,
  ArrowLineUp,
  ArrowUUpLeft,
  ClockCounterClockwise,
  Lock,
  Prohibit,
} from "@phosphor-icons/react";
import { computeLedger, type Movement, type MovementKind } from "@/application/ledger";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { useUrlState } from "@/presentation/hooks/use-url-state";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, EmptyState, Segmented, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric } from "@/presentation/components/structure";
import { formatCurrency, formatDate, formatNumber } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

const KINDS = [
  { label: "الكل", value: "all" as const },
  { label: "مبيعات", value: "sale" as const },
  { label: "تسويات", value: "settlement" as const },
  { label: "إغلاقات", value: "periodClose" as const },
];
type Filter = (typeof KINDS)[number]["value"];

/** A window, not the whole log — the P1 lesson about a 6,716px page (gate P2/G7). */
const PAGE = 14;

/**
 * «شنو صار» — one movement log: sales, payments and month closes in the order they
 * happened.
 *
 * Direction is carried by a GLYPH and a position, not by colour alone (§13): an
 * inward mark for a sale, an outward mark for a payment, a lock for a close that
 * moved no money at all. The three are never summed into a running balance,
 * because a sale's revenue is not cash in hand and a payment is not a cost.
 */
export function LedgerView() {
  const loaded = useDataStore((s) => s.loaded);
  const sales = useDataStore((s) => s.sales);
  const settlements = useDataStore((s) => s.settlements);
  const periods = useDataStore((s) => s.periods);
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const orders = useDataStore((s) => s.orders);
  const settings = useDataStore((s) => s.settings);
  const access = useAccess();

  /* In the URL, so a reload keeps the reading and «التسويات فقط» can be a bookmark. */
  const [filter, setFilter] = useUrlState<Filter>("kind", "all", [
    "all",
    "sale",
    "settlement",
    "periodClose",
  ]);
  const [shown, setShown] = useState(PAGE);

  const view = useMemo(
    () =>
      computeLedger({
        sales,
        settlements,
        periods,
        products,
        reps,
        // A sale on a returned trip is marked void here, so the log paints it as no
        // movement instead of as income (gate P5/G2).
        orders,
        currency: settings.currency,
        kind: filter === "all" ? undefined : filter,
        limit: shown,
        scope: access.salesScope,
        costs: access.can("viewCosts"),
      }),
    [sales, settlements, periods, products, reps, orders, settings.currency, filter, shown, access],
  );

  const onFilter = (next: Filter) => {
    setFilter(next);
    // A new filter starts a new window: keeping «عرض المزيد» expanded across a
    // filter change would show 60 sales because the merchant once expanded closes.
    setShown(PAGE);
  };

  if (!loaded) {
    return (
      <>
        <PageHeader title="السجل" />
        <Grid>
          <Skeleton className="span-6 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[480px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  const n = (v: number) => formatNumber(v, { locale: settings.locale });
  const latest = view.rows[0];

  return (
    <>
      <PageHeader title="السجل" />

      <Grid>
        {/* ── what is in the log ──────────────────────────────────────────
            Counts of the FULL log, not of the window on screen: a summary
            that changed every time «عرض المزيد» was pressed would be a
            reading of the scroll position rather than of the store. */}
        <Panel
          span={6}
          title="ما في السجل"
          meta={<span className="text-[12px] text-subtle">{n(view.total)} حركة</span>}
          bare
        >
          <div className="r-tablewrap">
            <table className="r-tbl">
              <thead>
                <tr>
                  <th>نوع الحركة</th>
                  <th className="n">العدد</th>
                  <th>ماذا تعني</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>مبيعات</td>
                  <td className="n font-bold">{n(view.counts.sale)}</td>
                  <td className="text-subtle">مال داخل</td>
                </tr>
                <tr>
                  <td>تسويات</td>
                  <td className="n font-bold">{n(view.counts.settlement)}</td>
                  <td className="text-subtle">مال خارج إلى مندوب</td>
                </tr>
                <tr>
                  <td>إغلاقات</td>
                  <td className="n font-bold">{n(view.counts.periodClose)}</td>
                  <td className="text-subtle">لا حركة مال</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ── one figure worth its own size ───────────────────────────────── */}
        <Panel span={3} title="آخر حركة" bodyClassName="flex flex-col gap-3">
          {latest ? (
            <>
              <Metric
                size="sm"
                amount={formatCurrency(latest.amount, {
                  currency: latest.currency,
                  locale: settings.locale,
                })}
                name={latest.title}
              />
              <p className="text-[12px] text-subtle">
                {formatDate(latest.at, { locale: settings.locale })}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-subtle">لا حركة بعد.</p>
          )}
        </Panel>

        {/* ── the law of this screen, which is what its third slot is for ── */}
        <Panel span={3} title="كيف يُقرأ" bodyClassName="flex flex-col gap-2">
          <p className="text-[12px] leading-relaxed text-muted">
            لا يُحذف من السجل شيء. التصحيح حركة جديدة تُنسب إلى ما تصحّحه، فيبقى الأصل
            ظاهراً ومعه ما عدّله.
          </p>
          <p className="text-[12px] leading-relaxed text-muted">
            المبيعات والتسويات لا تُجمع في رصيد واحد: إيراد بيعة ليس مالاً بيدك، ودفعة
            لمندوب ليست كلفة.
          </p>
        </Panel>

        {/* ── the work: the log itself ────────────────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <>
              <span className="text-[11px] text-subtle">
                {n(view.rows.length)} من {n(view.total)}
              </span>
              {view.rows.length < view.total && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="ms-auto"
                  onClick={() => setShown((cur) => cur + PAGE)}
                >
                  عرض المزيد
                </Button>
              )}
            </>
          }
        >
          <Toolbar title="الحركات">
            <Segmented aria-label="نوع الحركة" options={KINDS} value={filter} onChange={onFilter} />
            <span className="r-spacer" />
          </Toolbar>

          {view.rows.length === 0 ? (
            <EmptyState
              icon={<ClockCounterClockwise size={24} />}
              title={filter === "all" ? "لا حركة بعد" : "لا حركة من هذا النوع"}
            />
          ) : (
            <ul className="flex flex-col px-4">
              {view.rows.map((m) => (
                <MovementRow key={m.id} movement={m} locale={settings.locale} />
              ))}
            </ul>
          )}
        </Panel>
      </Grid>
    </>
  );
}

/**
 * glyph · name · detail · figure.
 *
 * The name column is BOUNDED and the detail takes the slack. With the name on
 * `1fr` it absorbed every spare pixel and pushed the figure ~700px away from what
 * it belonged to, so the eye had to travel the width of the card to pair them
 * (§10). The list itself is capped at a reading measure for the same reason: a
 * ledger row is a sentence, and a 1,176px sentence is not read, it is scanned.
 */
const ROW =
  "grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[auto_minmax(0,20rem)_1fr_auto]";

const MARK: Record<MovementKind, { icon: React.ReactNode; word: string }> = {
  sale: { icon: <ArrowLineDown size={16} weight="bold" />, word: "داخل" },
  settlement: { icon: <ArrowLineUp size={16} weight="bold" />, word: "خارج" },
  periodClose: { icon: <Lock size={15} weight="bold" />, word: "لا حركة مال" },
};

function MovementRow({ movement, locale }: { movement: Movement; locale: string }) {
  const m = movement;
  /* A void sale is its own mark, not a sale's mark greyed out: the goods went out and
     came BACK, which is a different event from an inward one, and the U-turn glyph
     says so before any word is read (gate P5/G3). */
  const mark = m.voided
    ? m.status === "cancelled"
      ? { icon: <Prohibit size={16} weight="bold" />, word: "ملغاة، لم تُحصّل" }
      : { icon: <ArrowUUpLeft size={16} weight="bold" />, word: "راجعة، لم تُحصّل" }
    : MARK[m.kind];
  const money = (n: number) => formatCurrency(n, { currency: m.currency, locale });

  const body = (
    <>
      {/* The kind's mark is a moulded key, so the row's type is answered by form
          before any word is read (§1, §5). */}
      <span
        className={cn(
          "squircle size-9 shrink-0",
          // Neutral ink: an arrow's DIRECTION already says in or out, and a wall of
          // 216 green keys would be colour spent on a fact (§13). Colour is kept
          // for the exception, which is the losing sale below.
          m.direction === "none" ? "text-subtle" : "text-muted",
        )}
        aria-hidden
      >
        {mark.icon}
      </span>

      <span className="min-w-0">
        <span className="block truncate font-medium text-fg">{m.title}</span>
        {/* Below sm the detail sits under the name; from sm it takes its own
            column, so the row spans the width instead of leaving ~900px of dead
            space between the name and the figure (§10). */}
        <span className="mt-0.5 block text-xs text-muted sm:hidden">
          {m.detail} · {formatDate(m.at, { locale })}
        </span>
      </span>

      <span className="hidden min-w-0 text-xs text-muted sm:block">
        <span className="block truncate">{m.detail}</span>
        <span className="mt-0.5 block">{formatDate(m.at, { locale })}</span>
      </span>

      <span className="shrink-0 text-end">
        <bdi
          dir="ltr"
          className={cn(
            "block font-figure text-sm font-semibold tabular-nums",
            m.direction === "none" ? "text-muted" : "text-fg",
            // Struck, not hidden: the figure is what the sale WOULD have brought in,
            // and the strike is what says it did not (gate P5/G2).
            /* A semantic strike: the sale's revenue never arrived. The figure is kept
               so the row still explains itself. */
            // deslop-ignore-next-line 09
            m.voided && "line-through decoration-[1.5px] decoration-danger/70",
          )}
        >
          {money(m.amount)}
        </bdi>
        {m.secondary !== undefined && (
          <bdi
            dir="ltr"
            className={cn(
              "mt-0.5 block font-figure text-[11px] tabular-nums",
              m.secondary < 0 ? "text-danger" : "text-muted",
            )}
          >
            {/* The word goes BEFORE the number: «-5,000 ربحًا» would call a loss a
                profit. And it names WHICH figure this is — a rep sees their own
                share here, never the sale's profit (gate P3/G4). */}
            {m.secondaryKind === "repShare"
              ? "حصّتك "
              : m.secondary < 0
                ? "خسارة "
                : "ربح "}
            {money(Math.abs(m.secondary))}
          </bdi>
        )}
        {/* The direction word carries what the glyph carries, for a reader who
            cannot see either the glyph or the colour. */}
        <span className="sr-only">{mark.word}</span>
      </span>
    </>
  );

  return (
    <li data-row className="border-b border-border-soft last:border-b-0">
      {m.href ? (
        <Link
          href={m.href}
          className={cn(ROW, "transition-colors hover:bg-surface-2 focus-visible:bg-surface-2")}
        >
          {body}
        </Link>
      ) : (
        <div className={ROW}>{body}</div>
      )}
    </li>
  );
}
