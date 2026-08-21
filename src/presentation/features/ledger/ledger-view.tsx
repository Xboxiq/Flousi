"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLineDown,
  ArrowLineUp,
  ClockCounterClockwise,
  Lock,
} from "@phosphor-icons/react";
import { computeLedger, type Movement, type MovementKind } from "@/application/ledger";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Segmented,
  Skeleton,
} from "@/presentation/components/ui";
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
  const settings = useDataStore((s) => s.settings);
  const access = useAccess();

  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);

  const view = useMemo(
    () =>
      computeLedger({
        sales,
        settlements,
        periods,
        products,
        reps,
        currency: settings.currency,
        kind: filter === "all" ? undefined : filter,
        limit: shown,
        scope: access.salesScope,
        costs: access.can("viewCosts"),
      }),
    [sales, settlements, periods, products, reps, settings.currency, filter, shown, access],
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
        <PageHeader title="السجل" description="كل حركة حدثت، بالترتيب الذي حدثت به." />
        <Skeleton className="h-[32rem] rounded-[var(--radius-2xl)]" />
      </>
    );
  }

  const count = (kind: MovementKind) => formatNumber(view.counts[kind], { locale: settings.locale });

  return (
    <>
      <PageHeader
        title="السجل"
        description={`مبيعات: ${count("sale")} · تسويات: ${count("settlement")} · إغلاقات: ${count("periodClose")}`}
        actions={
          <Segmented aria-label="نوع الحركة" options={KINDS} value={filter} onChange={onFilter} />
        }
      />

      <Card>
        <CardContent>
          {view.rows.length === 0 ? (
            <EmptyState
              icon={<ClockCounterClockwise size={24} />}
              title={filter === "all" ? "لا حركة بعد" : "لا حركة من هذا النوع"}
              description={
                filter === "all"
                  ? "سجّل بيعًا أو سوِّ حساب مندوب، فيظهر هنا بترتيبه الزمني."
                  : "غيّر النوع أعلاه لترى بقية الحركة."
              }
            />
          ) : (
            <>
              <ul className="mx-auto flex max-w-[880px] flex-col">
                {view.rows.map((m) => (
                  <MovementRow key={m.id} movement={m} locale={settings.locale} />
                ))}
              </ul>

              <div className="mx-auto mt-5 flex max-w-[880px] flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
                <p className="text-xs text-muted">
                  ظهر {formatNumber(view.rows.length, { locale: settings.locale })} من{" "}
                  {formatNumber(view.total, { locale: settings.locale })}
                </p>
                {view.rows.length < view.total && (
                  <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                    عرض المزيد
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
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
  const mark = MARK[m.kind];
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
            "block font-mono text-sm font-semibold tabular-nums",
            m.direction === "none" ? "text-muted" : "text-fg",
          )}
        >
          {money(m.amount)}
        </bdi>
        {m.secondary !== undefined && (
          <bdi
            dir="ltr"
            className={cn(
              "mt-0.5 block font-mono text-[11px] tabular-nums",
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
    <li className="border-b border-border-soft last:border-b-0">
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
