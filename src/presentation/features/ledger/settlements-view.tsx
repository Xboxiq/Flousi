"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "@phosphor-icons/react";
import { computeSettlements, type CurrencyTotal } from "@/application/ledger";
import { Ladder, Rung } from "@/presentation/features/dashboard/ladder";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
  Skeleton,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/presentation/components/ui";
import { PaceRail } from "@/presentation/components/objects/pace-rail";
import { formatCurrency, formatDate } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";

/**
 * «منو دفع» — every payment made to the team, across every rep.
 *
 * Totals are one line PER CURRENCY and are never added together: the domain holds
 * no exchange rates by design, `Money.add` throws on a mismatch, and a screen that
 * summed them would print a number that does not exist (gate P2/G5).
 */
export function SettlementsView() {
  const loaded = useDataStore((s) => s.loaded);
  const settlements = useDataStore((s) => s.settlements);
  const reps = useDataStore((s) => s.reps);
  const sales = useDataStore((s) => s.sales);
  const periods = useDataStore((s) => s.periods);
  const orders = useDataStore((s) => s.orders);
  const settings = useDataStore((s) => s.settings);
  const access = useAccess();
  const [totalsOpen, setTotalsOpen] = useState(false);

  const view = useMemo(
    () =>
      // `orders` is what lets a returned trip stop counting as earned. The payment
      // already made against it stays in `paid`, so the overpayment is visible as a
      // negative outstanding rather than silently absorbed (gate P5/G2).
      computeSettlements({ settlements, reps, sales, periods, orders, scope: access.salesScope }),
    [settlements, reps, sales, periods, orders, access.salesScope],
  );

  const money = (n: number, currency: string) =>
    formatCurrency(n, { currency, locale: settings.locale });

  if (!loaded) {
    return (
      <>
        <PageHeader title="التسويات" description="كل دفعة سُلّمت للفريق، ومتى." />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-40 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-72 rounded-[var(--radius-2xl)]" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="التسويات"
        description={
          view.count === 0
            ? "لم تُسجّل أي دفعة بعد."
            : `دفعات: ${view.count}${
                view.lastPaidAt
                  ? ` · آخرها ${formatDate(view.lastPaidAt, { locale: settings.locale })}`
                  : ""
              }`
        }
      />

      <div className="flex flex-col gap-6">
        {/* One line per currency, three figures each: with two currencies that was a
            twelve-figure device standing over a four-row list. Latched, with the one
            figure that answers «كم بقي عليّ؟» on the closed latch (VISUAL-LAW §15). */}
        {view.totals.length > 0 && (
          <Ladder solo>
            <Rung
              title="المستحق والمدفوع"
              hint="سطر لكل عملة، ولا تُجمع العملات."
              open={totalsOpen}
              onToggle={() => setTotalsOpen((v) => !v)}
              /* Neutral ink, like the line it summarises: «ما زال مستحقًّا» is a
                 liability the merchant owes his own team, not a loss he took, and
                 §13 spends danger on profit that went the wrong way. Painted red on
                 the latch and neutral inside, one figure had two meanings. */
              summary={
                <Money className="font-semibold text-fg">
                  {money(view.totals[0].outstanding, view.totals[0].currency)}
                </Money>
              }
            >
          <div className="flex flex-col gap-5">
            <ul className="flex flex-col divide-y divide-border-soft [&>li]:py-4 [&>li:first-child]:pt-0 [&>li:last-child]:pb-0">
              {view.totals.map((line) => (
                <CurrencyLine key={line.currency} line={line} money={money} />
              ))}
            </ul>
          </div>
            </Rung>
          </Ladder>
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>سجل الدفعات</CardTitle>
              <CardDescription>الأحدث أولًا. كل دفعة تُقرأ بعملتها التي دُفعت بها.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {view.rows.length === 0 ? (
              <EmptyState
                icon={<Receipt size={24} />}
                title="لا تسويات بعد"
                description="تُسجَّل الدفعة من ملف المندوب: تفتح «تسوية»، فتُحسم من رصيده المستحق."
              />
            ) : (
              <>
                {/* Below sm the table becomes rows: five columns on a 360px screen
                    is a sideways-scrolling strip, which is the P1 lesson. */}
                <ul className="flex flex-col sm:hidden">
                  {view.rows.map((r) => (
                    <li
                      key={r.settlement.id}
                      className="flex items-baseline justify-between gap-3 border-b border-border-soft py-3 last:border-b-0"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-fg">
                          {r.repName}
                          {r.repArchived && (
                            <span className="ms-2 align-middle text-[11px] text-subtle">مؤرشف</span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {formatDate(r.paidAt, { locale: settings.locale })}
                          {r.method ? ` · ${r.method}` : ""}
                        </span>
                      </span>
                      <bdi dir="ltr" className="shrink-0 font-figure text-sm font-semibold text-fg">
                        {money(r.amount, r.currency)}
                      </bdi>
                    </li>
                  ))}
                </ul>

                <div className="hidden sm:block">
                  <Table>
                    <THead>
                      <TR>
                        <TH>المندوب</TH>
                        <TH>المبلغ</TH>
                        <TH>التاريخ</TH>
                        <TH>الطريقة</TH>
                        <TH>الفترة</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {view.rows.map((r) => (
                        <TR key={r.settlement.id} data-row>
                          <TD>
                            {r.settlement.repId && !r.repArchived ? (
                              <Link
                                href={`/reps/view?id=${r.settlement.repId}`}
                                className="font-medium text-fg hover:text-accent hover:underline"
                              >
                                {r.repName}
                              </Link>
                            ) : (
                              <span className="font-medium text-fg">
                                {r.repName}
                                {r.repArchived && (
                                  <Badge tone="neutral" className="ms-2">
                                    مؤرشف
                                  </Badge>
                                )}
                              </span>
                            )}
                          </TD>
                          <TD>
                            <bdi dir="ltr" className="font-figure font-semibold text-fg">
                              {money(r.amount, r.currency)}
                            </bdi>
                          </TD>
                          <TD className="text-muted">
                            {formatDate(r.paidAt, { locale: settings.locale })}
                          </TD>
                          <TD className="text-muted">{r.method ?? "—"}</TD>
                          <TD className="text-muted">{r.periodLabel ?? "—"}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function CurrencyLine({
  line,
  money,
}: {
  line: CurrencyTotal;
  money: (n: number, currency: string) => string;
}) {
  // How much of what the team earned in this currency has actually been handed
  // over. The rail's remainder IS the outstanding balance (§11).
  const share = line.earned > 0 ? line.paid / line.earned : 0;
  const ahead = line.outstanding < 0;
  // A rail needs a WHOLE to divide. Paying dollars against a dinar debt leaves
  // this currency with payments and nothing earned, and a full rail would then
  // read as «تمّت التسوية» — the exact opposite of «مدفوع مقدّماً». No whole, no
  // object: the figures say it instead (§8, §11).
  const hasWhole = line.earned > 0;

  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-figure text-xs font-semibold text-muted">{line.currency}</span>
        <span className="text-xs text-muted">
          {ahead ? "مدفوع مقدّمًا" : "ما زال مستحقًّا"}{" "}
          <bdi dir="ltr" className={cn("font-figure font-bold", ahead ? "text-accent" : "text-fg")}>
            {money(Math.abs(line.outstanding), line.currency)}
          </bdi>
        </span>
      </div>

      {hasWhole ? (
        <PaceRail
          className="mt-2"
          height={14}
          attainment={share}
          elapsed={0}
          tone={ahead ? "accent" : share >= 1 ? "success" : "accent"}
          label={`${line.currency}: دُفع ${money(line.paid, line.currency)} من ${money(
            line.earned,
            line.currency,
          )} استحقّها الفريق`}
        />
      ) : (
        <p className="mt-2 text-xs text-subtle">
          لم يستحقّ الفريق شيئًا بهذه العملة، فلا نسبة تُقاس. الدفعة محسوبة كمقدّم.
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          دُفع{" "}
          <bdi dir="ltr" className="font-figure font-semibold text-fg">
            {money(line.paid, line.currency)}
          </bdi>{" "}
          في {line.count} دفعة
        </span>
        {hasWhole && (
          <span>
            استحقّ الفريق{" "}
            <bdi dir="ltr" className="font-figure font-semibold text-fg">
              {money(line.earned, line.currency)}
            </bdi>
          </span>
        )}
      </div>
    </li>
  );
}
