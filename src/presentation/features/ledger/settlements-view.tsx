"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Receipt } from "@phosphor-icons/react";
import { computeSettlements } from "@/application/ledger";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { EmptyState, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric, Progress, Chip } from "@/presentation/components/structure";
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
        <PageHeader title="التسويات" />
        <Grid>
          <Skeleton className="span-6 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[400px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  const primary = view.totals[0];
  const owing = view.totals.filter((t) => t.outstanding > 0);

  return (
    <>
      <PageHeader title="التسويات" />

      <Grid>
        {/* ── the balances, one line per currency ─────────────────────────
            Never summed. The domain holds no exchange rates by design and
            `Money.add` throws on a mismatch, so a total across two lines is a
            number that does not exist (gate P2/G5). */}
        <Panel
          span={6}
          title="الأرصدة"
          meta={<span className="text-[12px] text-subtle">سطر لكل عملة، ولا سطر جامع</span>}
          bare
        >
          {view.totals.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-subtle">لا دفعة بعد.</p>
          ) : (
            <div className="r-tablewrap">
              <table className="r-tbl">
                <thead>
                  <tr>
                    <th>العملة</th>
                    <th className="n pri-3">استحقّوا</th>
                    <th className="n pri-2">دُفع</th>
                    <th className="n">المتبقّي</th>
                    <th className="n pri-3">الدفعات</th>
                  </tr>
                </thead>
                <tbody>
                  {view.totals.map((line) => (
                    <tr key={line.currency}>
                      <td>
                        <bdi className="r-num rounded-[4px] bg-surface-2 px-1.5 py-0.5 text-[11px] font-bold">
                          {line.currency}
                        </bdi>
                      </td>
                      <td className="n pri-3">{money(line.earned, line.currency)}</td>
                      <td className="n pri-2">{money(line.paid, line.currency)}</td>
                      {/* The WORD, not just the colour: an absolute figure cannot
                          tell a debt from an advance, and «مدفوع مقدّماً» painted the
                          same red as «مستحقّ» is the opposite reading. */}
                      <td className={cn("n font-bold", line.outstanding > 0 ? "text-danger" : "text-accent")}>
                        {money(Math.abs(line.outstanding), line.currency)}
                        <span className="ms-1.5 text-[10px] font-normal text-subtle">
                          {line.outstanding > 0 ? "مستحقّ" : line.outstanding < 0 ? "مقدّم" : "مسوّى"}
                        </span>
                      </td>
                      <td className="n pri-3 text-subtle">{line.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* ── one figure worth its own size ───────────────────────────────── */}
        <Panel span={3} title="ما دُفع" bodyClassName="flex flex-col gap-3">
          {primary ? (
            <>
              <Metric
                size="sm"
                amount={money(primary.paid, primary.currency)}
                name={`مدفوع للمندوبين بـ${primary.currency}`}
              />
              {primary.earned > 0 ? (
                <Progress share={primary.paid / primary.earned} />
              ) : (
                <p className="text-[11px] text-subtle">
                  لم يستحقّ الفريق شيئاً بهذه العملة، فلا نسبة تُقاس.
                </p>
              )}
              <p className="text-[12px] text-subtle">
                {primary.count} دفعة
                {view.lastPaidAt
                  ? ` · آخرها ${formatDate(view.lastPaidAt, { locale: settings.locale })}`
                  : ""}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-subtle">لم تُسجّل أي دفعة بعد.</p>
          )}
        </Panel>

        {/* ── the one panel asking for a decision ─────────────────────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {owing.length > 0 ? (
            <>
              <Metric
                size="sm"
                amount={money(owing[0].outstanding, owing[0].currency)}
                name="ما زال مستحقًّا للفريق"
              />
              <p className="text-[12px] leading-relaxed text-muted">
                هذه حصص مجمّدة على بيعات وصلت. تُدفع من صفحة المندوب نفسه، حتى تُنسب
                الدفعة إلى من استحقّها.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              لا مستحقّ على أحد: كل حصة مجمّدة قوبلت بدفعة.
            </p>
          )}
        </Panel>

        {/* ── the work: every payment ─────────────────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              {view.rows.length} من {view.count} دفعة · كل دفعة تُقرأ بعملتها
            </span>
          }
        >
          <Toolbar title="سجل الدفعات">
            <span className="r-spacer" />
          </Toolbar>

          {view.rows.length === 0 ? (
            <EmptyState icon={<Receipt size={24} />} title="لا تسويات بعد" />
          ) : (
            <div className="r-tablewrap">
              <table className="r-tbl">
                <thead>
                  <tr>
                    <th>المندوب</th>
                    <th className="n">المبلغ</th>
                    <th className="pri-2">التاريخ</th>
                    <th className="pri-3">الطريقة</th>
                    <th className="pri-3">الفترة</th>
                  </tr>
                </thead>
                <tbody>
                  {view.rows.map((r) => (
                    <tr key={r.settlement.id} data-row>
                      <td>
                        {r.settlement.repId && !r.repArchived ? (
                          <Link
                            href={`/reps/view?id=${r.settlement.repId}`}
                            className="font-bold text-fg hover:text-accent hover:underline"
                          >
                            {r.repName}
                          </Link>
                        ) : (
                          <span className="font-bold text-fg">
                            {r.repName}
                            {r.repArchived && (
                              <Chip className="ms-2 h-[18px] text-[10px]">مؤرشف</Chip>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="n font-bold">{money(r.amount, r.currency)}</td>
                      <td className="pri-2 text-muted">
                        {formatDate(r.paidAt, { locale: settings.locale })}
                      </td>
                      <td className="pri-3 text-muted">{r.method ?? "—"}</td>
                      <td className="pri-3 text-muted">{r.periodLabel ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </Grid>
    </>
  );
}
