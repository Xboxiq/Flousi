"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ArrowUUpLeft,
  HandCoins,
  PencilSimple,
  UsersThree,
} from "@phosphor-icons/react";
import {
  CommissionCalculator,
  DEFAULT_REP_RATIO,
  Money as MoneyValue,
  schemeParams,
  type CommissionSchemeParams,
} from "@/domain";
import {
  computeRepAggregates,
  computeRepTrends,
  computeSaleCommissions,
  toMajor,
} from "@/application/commissions";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Delta,
  EmptyState,
  Money,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import { MagnitudeRings } from "@/presentation/components/objects/magnitude-rings";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "@/presentation/lib/format";
import {
  COMMISSION_KIND_LABELS,
  LOSS_POLICY_LABELS,
  PROFIT_BASIS_HINTS,
  PROFIT_BASIS_LABELS,
  REP_STATUS_LABELS,
  ROUNDING_BENEFICIARY_LABELS,
  SCHEME_TIER_LABELS,
} from "@/presentation/lib/labels";
import { BalanceDevice, Figure } from "./balance-device";
import { RepDialog } from "./rep-dialog";
import { RepSaleRows } from "./rep-sale-rows";
import { SettleDialog, type SettlementPin } from "./settle-dialog";

/** Field-by-field, so a scheme edited in place is caught as well as a swapped one. */
function sameParams(a: CommissionSchemeParams, b: CommissionSchemeParams): boolean {
  return (
    a.kind === b.kind &&
    (a.repRatio ?? null) === (b.repRatio ?? null) &&
    (a.fixedAmountMinor ?? null) === (b.fixedAmountMinor ?? null) &&
    (a.priceRatio ?? null) === (b.priceRatio ?? null) &&
    a.profitBasis === b.profitBasis &&
    a.lossPolicy === b.lossPolicy &&
    a.roundingBeneficiary === b.roundingBeneficiary
  );
}

/**
 * «ملف المندوب» — two acts on one axis: the instrument that states what he is
 * owed, and the ritual that discharges it.
 *
 * The balance is never read from a field and never added up here: it comes from
 * `computeRepAggregates`, which derives it from the frozen splits minus the
 * settlements on every single read (P1 G6).
 */
export function RepDetail({ id }: { id: string }) {
  const loaded = useDataStore((s) => s.loaded);
  const sales = useDataStore((s) => s.sales);
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);
  const settlements = useDataStore((s) => s.settlements);
  const periods = useDataStore((s) => s.periods);
  const settings = useDataStore((s) => s.settings);
  const archiveRep = useDataStore((s) => s.archiveRep);
  const restoreRep = useDataStore((s) => s.restoreRep);

  const [settling, setSettling] = useState<SettlementPin | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const money = (n: number) =>
    formatCurrency(n, { currency: settings.currency, locale: settings.locale });
  const count = (n: number) => formatNumber(n, { locale: settings.locale, digits: 0 });
  const share = (r: number) => formatPercent(r, { locale: settings.locale, digits: 0 });

  const input = useMemo(
    () => ({
      sales,
      products,
      reps,
      schemes,
      assignments,
      settlements,
      defaultCommissionSchemeId: settings.defaultCommissionSchemeId,
    }),
    [sales, products, reps, schemes, assignments, settlements, settings.defaultCommissionSchemeId],
  );

  const rep = useMemo(() => reps.find((r) => r.id === id), [reps, id]);
  const agg = useMemo(
    () => computeRepAggregates(input, { currency: settings.currency }).find((a) => a.repId === id),
    [input, settings.currency, id],
  );
  const rows = useMemo(
    () => computeSaleCommissions(input).filter((r) => r.repId === id),
    [input, id],
  );
  const trend = useMemo(
    () => computeRepTrends(input, { currency: settings.currency, months: 6 }).get(id) ?? [],
    [input, settings.currency, id],
  );

  /* Month over month, over the application's own series. A display ratio, not a
     money computation: nothing here is stored or paid out. */
  const monthDelta = useMemo(() => {
    if (trend.length < 2) return null;
    const current = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    if (previous === 0) return null;
    return (current - previous) / Math.abs(previous);
  }, [trend]);

  /* His baseline rule, resolved by the domain resolver itself. An empty productId
     can match no product-tier binding, so the chain falls exactly to
     rep → account default, which is what «his rule» means. */
  const baseline = useMemo(
    () =>
      CommissionCalculator.resolveScheme({
        productId: "",
        repId: id,
        assignments,
        schemes,
        accountDefaultSchemeId: settings.defaultCommissionSchemeId,
      }),
    [id, assignments, schemes, settings.defaultCommissionSchemeId],
  );

  /** Products where a more specific tier beats his baseline. The chain, visible. */
  const exceptions = useMemo(() => {
    const out: { productId: string; productName: string; schemeName: string; tier: string }[] = [];
    const seen = new Set<string>();
    for (const a of assignments) {
      if (a.status !== "active" || !a.productId) continue;
      if (a.repId && a.repId !== id) continue;
      if (seen.has(a.productId)) continue;
      seen.add(a.productId);
      const resolved = CommissionCalculator.resolveScheme({
        productId: a.productId,
        repId: id,
        assignments,
        schemes,
        accountDefaultSchemeId: settings.defaultCommissionSchemeId,
      });
      if (!resolved.scheme || resolved.scheme.id === baseline.scheme?.id) continue;
      out.push({
        productId: a.productId,
        productName: products.find((p) => p.id === a.productId)?.name ?? a.productId,
        schemeName: resolved.scheme.name,
        tier: SCHEME_TIER_LABELS[resolved.tier],
      });
    }
    return out;
  }, [assignments, id, schemes, settings.defaultCommissionSchemeId, products, baseline.scheme?.id]);

  /** Each frozen row against today's rule: the snapshot is history, not a mirror. */
  const ledger = useMemo(
    () =>
      rows.map((row) => {
        const current = CommissionCalculator.resolveScheme({
          productId: row.sale.productId,
          repId: id,
          assignments,
          schemes,
          accountDefaultSchemeId: settings.defaultCommissionSchemeId,
        });
        const frozenParams = row.sale.commissionSnapshot?.params;
        const stale =
          row.frozen &&
          Boolean(frozenParams) &&
          (!current.scheme ||
            current.scheme.id !== row.schemeId ||
            !sameParams(frozenParams as CommissionSchemeParams, schemeParams(current.scheme)));
        return {
          row,
          stale,
          currentSchemeName: current.scheme?.name,
          productName: products.find((p) => p.id === row.sale.productId)?.name ?? "منتج محذوف",
        };
      }),
    [rows, id, assignments, schemes, settings.defaultCommissionSchemeId, products],
  );

  const repSettlements = useMemo(
    () =>
      settlements
        .filter((s) => s.repId === id)
        .slice()
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()),
    [settlements, id],
  );

  const split = useMemo(() => {
    if (!agg) return null;
    if (agg.basisMinor <= 0 || agg.repShareMinor < 0 || agg.ownerShareMinor < 0) return null;
    const parts: DistributionPart[] = [
      {
        id: "owner",
        label: "حصتك",
        amount: toMajor(agg.ownerShareMinor, agg.currency),
        kind: "keep",
      },
      {
        id: "rep",
        label: `حصة ${agg.repName}`,
        amount: toMajor(agg.repShareMinor, agg.currency),
        kind: "spend",
      },
    ];
    return { parts, total: toMajor(agg.basisMinor, agg.currency) };
  }, [agg]);

  if (!loaded) {
    return (
      <>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-6 h-96 w-full" />
      </>
    );
  }

  if (!agg) {
    return (
      <EmptyState
        icon={<UsersThree size={24} />}
        title="المندوب غير موجود"
        description="ربما تمت إزالة هذا المندوب من هذا المتصفّح."
        action={
          <Button asChild>
            <Link href="/reps">العودة إلى الفريق</Link>
          </Button>
        }
      />
    );
  }

  const name = rep?.name ?? agg.repName;
  const activePeriod = periods.find((p) => p.status === "open");
  const scheme = baseline.scheme;

  const toggleStatus = async () => {
    if (!rep) return;
    setBusy(true);
    try {
      if (rep.status === "active") await archiveRep(rep.id);
      else await restoreRep(rep.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm" leadingIcon={<ArrowLeft size={16} />}>
          <Link href="/reps">الفريق</Link>
        </Button>
      </div>

      <PageHeader
        title={name}
        description={rep?.phone ? rep.phone : "عملياته وحصصه ورصيده المشتقّ."}
        actions={
          <>
            {rep?.status === "archived" && <Badge>{REP_STATUS_LABELS.archived}</Badge>}
            {agg.needsSchemeCount > 0 && (
              <Badge tone="warning">{`${count(agg.needsSchemeCount)} بلا نظام قسمة`}</Badge>
            )}
            <Button
              leadingIcon={<HandCoins size={16} />}
              onClick={() =>
                setSettling({
                  repId: agg.repId,
                  repName: name,
                  currency: agg.currency,
                  outstandingMinor: agg.balanceMinor,
                  earnedMinor: agg.earnedMinor,
                  settledMinor: agg.settledMinor,
                  saleCount: agg.saleCount,
                })
              }
            >
              تسوية
            </Button>
            {rep && (
              <Button
                variant="secondary"
                leadingIcon={<PencilSimple size={16} />}
                onClick={() => setEditOpen(true)}
              >
                تعديل
              </Button>
            )}
            {rep && (
              <Button
                variant="ghost"
                leadingIcon={
                  rep.status === "active" ? <Archive size={16} /> : <ArrowUUpLeft size={16} />
                }
                loading={busy}
                onClick={toggleStatus}
              >
                {rep.status === "active" ? "أرشفة" : "إعادة تنشيط"}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <BalanceDevice
          label="رصيده المستحق"
          outstanding={toMajor(agg.balanceMinor, agg.currency)}
          earned={toMajor(agg.earnedMinor, agg.currency)}
          settled={toMajor(agg.settledMinor, agg.currency)}
          money={money}
          caption="من حصصه المجمّدة فقط، فما لم يُجمَّد بعد ليس دينًا."
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>مبيعاته وربحها وحصته</CardTitle>
              <CardDescription>ثلاث كميات يحوي بعضها بعضًا، بمقياس المساحة.</CardDescription>
            </div>
            {monthDelta !== null && (
              <Delta
                value={monthDelta}
                label={formatSignedPercent(monthDelta, { locale: settings.locale })}
                against="مقارنة بالشهر السابق"
              />
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <MagnitudeRings
              rings={[
                {
                  label: "إيراد مبيعاته",
                  value: toMajor(agg.revenueMinor, agg.currency),
                  kind: "whole",
                },
                {
                  label: "صافي ربحها",
                  value: toMajor(agg.netProfitMinor, agg.currency),
                  kind: "keep",
                },
                { label: "حصته", value: toMajor(agg.repShareMinor, agg.currency), kind: "cost" },
              ]}
              size={132}
              format={money}
            />
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Figure
                label="ما بقي لك فعلًا"
                value={money(toMajor(agg.ownerKeepsMinor, agg.currency))}
                polarity={agg.ownerKeepsMinor}
                hint="صافي الربح ناقص حصته"
              />
              <Figure
                label="القطع المبيعة"
                value={count(agg.units)}
                hint={`${count(agg.saleCount)} عملية`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>قسمة الأساس</CardTitle>
            <CardDescription>المبلغ الذي قُسم فعلًا، كوحدة واحدة: حصتك منه وحصته.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {split ? (
            <DistributionBar
              parts={split.parts}
              total={split.total}
              format={money}
              formatShare={share}
            />
          ) : (
            <div className="flex flex-col gap-2 text-[13px]">
              <p className="text-muted">
                {agg.saleCount === 0
                  ? "لا توجد عمليات منسوبة له بعد."
                  : "الأساس المقسوم لا يقبل القسمة كحصص موجبة، فالأرقام مذكورة كما هي."}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Figure
                  label="الأساس المقسوم"
                  value={money(toMajor(agg.basisMinor, agg.currency))}
                  polarity={agg.basisMinor}
                />
                <Figure label="حصتك" value={money(toMajor(agg.ownerShareMinor, agg.currency))} />
                <Figure label="حصته" value={money(toMajor(agg.repShareMinor, agg.currency))} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>نظام القسمة المطبَّق عليه</CardTitle>
            <CardDescription>القاعدة بالكلمات وبأرقامها، كما يقرأها المحرّك.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/reps/schemes">مِسطرة القسمة</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {scheme ? (
            <>
              <dl className="grid gap-3 sm:grid-cols-2">
                <SchemeRow
                  label="النظام"
                  value={
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-fg">{scheme.name}</span>
                      <Badge>{SCHEME_TIER_LABELS[baseline.tier]}</Badge>
                    </span>
                  }
                />
                <SchemeRow label="طريقة الحساب" value={COMMISSION_KIND_LABELS[scheme.kind]} />
                <SchemeRow
                  label="حصته"
                  value={
                    scheme.kind === "fixedPerUnit" ? (
                      <span className="flex items-baseline gap-1.5">
                        <Money className="font-semibold text-fg">
                          {money(
                            MoneyValue.fromMinor(scheme.fixedAmountMinor ?? 0, agg.currency).amount,
                          )}
                        </Money>
                        <span className="text-[11px] text-subtle">لكل وحدة</span>
                      </span>
                    ) : (
                      <Money className="font-semibold text-fg">
                        {share(
                          scheme.kind === "percentOfPrice"
                            ? (scheme.priceRatio ?? 0)
                            : (scheme.repRatio ?? DEFAULT_REP_RATIO),
                        )}
                      </Money>
                    )
                  }
                  hint={scheme.kind === "percentOfPrice" ? "من سعر البيع، لا من الربح" : undefined}
                />
                <SchemeRow
                  label="الأساس المقسوم"
                  value={PROFIT_BASIS_LABELS[scheme.profitBasis]}
                  hint={PROFIT_BASIS_HINTS[scheme.profitBasis]}
                />
                <SchemeRow label="عند الخسارة" value={LOSS_POLICY_LABELS[scheme.lossPolicy]} />
                <SchemeRow
                  label="الوحدة الصغرى غير القابلة للقسمة"
                  value={ROUNDING_BENEFICIARY_LABELS[scheme.roundingBeneficiary]}
                  hint="تذهب دائمًا لهذا الطرف، في الربح والخسارة"
                />
              </dl>

              {exceptions.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <span className="text-[11px] text-subtle">
                    منتجات تسبق قاعدته، لأن الأخصّ يفوز
                  </span>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {exceptions.map((e) => (
                      <li
                        key={e.productId}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[13px]"
                      >
                        <span className="text-fg">{e.productName}</span>
                        <span className="text-muted">
                          {e.schemeName}
                          <span className="ms-2 text-[11px] text-subtle">{e.tier}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-start gap-2 text-[13px]">
              <p className="text-muted">
                لا ينطبق عليه أي نظام قسمة الآن، فأي بيع جديد باسمه يُسجَّل بدون حصة محسوبة.
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/reps/schemes">اضبط نظام القسمة</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>سجل عملياته</CardTitle>
            <CardDescription>كل سطر بأرقامه المجمّدة وقت البيع.</CardDescription>
          </div>
        </CardHeader>
        {/* the table is for the width that fits it; phones get rows */}
        <div className="hidden sm:block">
          <Table>
            <THead>
              <TR>
                <TH>التاريخ</TH>
                <TH>المنتج</TH>
                <TH className="text-start">الكمية</TH>
                <TH className="text-start">ربح العملية</TH>
                <TH className="text-start">حصته</TH>
                <TH className="text-start">حصتك من الأساس</TH>
              </TR>
            </THead>
            <TBody>
              {ledger.map(({ row, stale, currentSchemeName, productName }) => (
                <TR key={row.sale.id}>
                  <TD className="whitespace-nowrap text-muted">
                    {formatDate(row.sale.soldAt, {
                      locale: settings.locale,
                      month: "short",
                      day: "numeric",
                    })}
                  </TD>
                  <TD>
                    <div className="font-medium text-fg">{productName}</div>
                    <div className="text-[11px] text-subtle">
                      {row.schemeName ?? "بلا نظام قسمة"}
                      {stale && (
                        <span
                          className="ms-2 text-muted"
                          title={`جُمّدت على ${row.schemeName}، والقاعدة اليوم ${currentSchemeName ?? "غير محدّدة"}`}
                        >
                          قاعدة سابقة
                        </span>
                      )}
                    </div>
                  </TD>
                  <TD className="text-start">
                    <Money className="text-fg">{count(row.sale.quantity)}</Money>
                  </TD>
                  <TD className="text-start">
                    <Money polarity={row.netProfitMinor}>
                      {money(toMajor(row.netProfitMinor, row.currency))}
                    </Money>
                  </TD>
                  <TD className="text-start">
                    <Money className="font-semibold text-fg">
                      {money(toMajor(row.repShareMinor, row.currency))}
                    </Money>
                    {row.lossApplied && (
                      <div className="text-[11px] text-muted">الخسارة عليك وحدك</div>
                    )}
                  </TD>
                  <TD className="text-start">
                    <Money className="text-fg">
                      {money(toMajor(row.ownerShareMinor, row.currency))}
                    </Money>
                  </TD>
                </TR>
              ))}
              {ledger.length === 0 && (
                <TR>
                  <TD className="py-10 text-center text-muted" colSpan={6}>
                    لا توجد عمليات منسوبة له بعد.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
        <RepSaleRows
          rows={ledger.map(({ row, stale, currentSchemeName, productName }) => ({
            id: row.sale.id,
            productName,
            meta: `${formatDate(row.sale.soldAt, { locale: settings.locale, month: "short", day: "numeric" })} · ${count(row.sale.quantity)} قطعة`,
            netProfit: money(toMajor(row.netProfitMinor, row.currency)),
            polarity: row.netProfitMinor,
            repShare: money(toMajor(row.repShareMinor, row.currency)),
            stale,
            staleHint: `جُمّدت على ${row.schemeName ?? "بلا نظام"}، والقاعدة اليوم ${currentSchemeName ?? "غير محدّدة"}`,
          }))}
        />
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>التسويات</CardTitle>
            <CardDescription>ما دُفع له، بعملة كل دفعة كما سُجّلت.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {repSettlements.length === 0 ? (
            <p className="text-sm text-muted">لم تُسجَّل أي تسوية له بعد.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {repSettlements.map((s) => (
                <li
                  key={s.id}
                  className="clay-inset flex items-center gap-3 rounded-[var(--radius-lg)] px-3.5 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">
                      {formatDate(s.paidAt, { locale: settings.locale })}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-subtle">
                      {[s.method, s.notes].filter(Boolean).join(" · ") || "بدون تفاصيل"}
                    </span>
                  </span>
                  <Money className="shrink-0 text-sm font-bold text-fg">
                    {formatCurrency(MoneyValue.fromMinor(s.amountMinor, s.currency).amount, {
                      currency: s.currency,
                      locale: settings.locale,
                    })}
                  </Money>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SettleDialog
        pinned={settling}
        onClose={() => setSettling(null)}
        locale={settings.locale}
        periodId={activePeriod?.id}
      />
      {rep && <RepDialog open={editOpen} onClose={() => setEditOpen(false)} rep={rep} />}
    </>
  );
}

/** One line of the applied rule: the word, then the number that makes it real. */
function SchemeRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-[14px] text-fg">{value}</dd>
      {hint && <dd className="text-[11px] text-subtle">{hint}</dd>}
    </div>
  );
}
