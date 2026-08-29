"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowUUpLeft,
  HandCoins,
  PencilSimple,
  Sliders,
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
  repMomentum,
  toMajor,
} from "@/application/commissions";
import { useDataStore } from "@/presentation/stores/data-store";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, EmptyState, Skeleton } from "@/presentation/components/ui";
import {
  Grid,
  Panel,
  Toolbar,
  Metric,
  Trend,
  Progress,
  Chip,
} from "@/presentation/components/structure";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import {
  NOUNS,
  countedNoun,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
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
import { Figure } from "./balance-device";
import { RepDialog } from "./rep-dialog";
import { cn } from "@/presentation/lib/cn";
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
  const orders = useDataStore((s) => s.orders);
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
      // Passed so a returned or cancelled trip stops counting as earnings: the money
      // never arrived, so no share is owed on it (gate P5/G2).
      orders,
      defaultCommissionSchemeId: settings.defaultCommissionSchemeId,
    }),
    [
      sales,
      products,
      reps,
      schemes,
      assignments,
      settlements,
      orders,
      settings.defaultCommissionSchemeId,
    ],
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
  /* Month over month, derived in the read model beside the series it reads — the
     view only chooses whether to print it. */
  const monthDelta = useMemo(
    () =>
      repMomentum(computeRepTrends(input, { currency: settings.currency, months: 6 }).get(id) ?? []),
    [input, settings.currency, id],
  );

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

  /**
   * How much of the ledger is on screen. A working rep reaches hundreds of rows,
   * and rendering all of them made the page 6,700px tall — the settlement section
   * beneath it was unreachable in practice. The newest page is the reading; the
   * rest is available on request.
   */
  const LEDGER_PAGE = 12;
  const [ledgerShown, setLedgerShown] = useState(LEDGER_PAGE);

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

  /* Newest first, so the visible page is the recent history a merchant asks about. */
  const visibleLedger = useMemo(() => ledger.slice(0, ledgerShown), [ledger, ledgerShown]);

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
        <PageHeader title="المندوب" section="الفريق" />
        <Grid>
          <Skeleton className="span-6 h-[260px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[260px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[260px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[360px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  if (!agg) {
    return (
      <>
        <PageHeader title="المندوب" section="الفريق" />
        <EmptyState
          icon={<UsersThree size={24} />}
          title="المندوب غير موجود"
          description="قد يكون حُذف، أو يكون الرابط قديماً."
          action={
            <Button asChild>
              <Link href="/reps">العودة إلى الفريق</Link>
            </Button>
          }
        />
      </>
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
      <PageHeader
        title={name}
        section="الفريق"
        actions={
          <>
            {rep && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                aria-label={rep.status === "active" ? "أرشفة المندوب" : "إعادة تنشيط المندوب"}
                title={rep.status === "active" ? "أرشفة المندوب" : "إعادة تنشيط المندوب"}
                /* the glyph rides `leadingIcon` so the spinner REPLACES it while
                   busy instead of crowding beside it in a 36px key */
                leadingIcon={
                  rep.status === "active" ? <Archive size={16} /> : <ArrowUUpLeft size={16} />
                }
                loading={busy}
                onClick={toggleStatus}
              />
            )}
            {rep && (
              <Button
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
                leadingIcon={<PencilSimple size={15} />}
                onClick={() => setEditOpen(true)}
              >
                عدّل
              </Button>
            )}
            <Button
              size="sm"
              leadingIcon={<HandCoins size={15} />}
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
          </>
        }
      />

      <Grid>
        {/* ── what he is owed, and it is DERIVED ───────────────────────────
            Never read from a field and never added up here: it comes from
            `computeRepAggregates`, which derives it from the frozen splits
            minus the settlements on every single read (P1 G6). */}
        <Panel
          span={6}
          title="رصيده المستحق"
          meta={
            <>
              {rep?.status === "archived" && <Chip>{REP_STATUS_LABELS.archived}</Chip>}
              <Chip tone={agg.balanceMinor > 0 ? "accent" : "success"}>
                {agg.balanceMinor > 0 ? "رصيد مستحق" : "مسوّى"}
              </Chip>
            </>
          }
          bodyClassName="flex flex-col gap-4"
        >
          <Metric
            size="lead"
            amount={money(Math.abs(toMajor(agg.balanceMinor, agg.currency)))}
            name={agg.balanceMinor < 0 ? "مدفوع له مقدّماً" : "من حصصه المجمّدة وحدها"}
          />
          {toMajor(agg.earnedMinor, agg.currency) > 0 && (
            <Progress
              share={toMajor(agg.settledMinor, agg.currency) / toMajor(agg.earnedMinor, agg.currency)}
            />
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-baseline justify-between gap-2 text-[12px]">
              <dt className="text-subtle">الحصص المجمّدة</dt>
              <dd>
                <bdi className="r-num font-bold text-fg">
                  {money(toMajor(agg.earnedMinor, agg.currency))}
                </bdi>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[12px]">
              <dt className="text-subtle">المدفوع</dt>
              <dd>
                <bdi className="r-num font-bold text-fg">
                  {money(toMajor(agg.settledMinor, agg.currency))}
                </bdi>
              </dd>
            </div>
          </dl>
          <p className="text-[11px] leading-relaxed text-subtle">
            من حصصه المجمّدة فقط، فما لم يُجمَّد بعد ليس ديناً.
            {agg.voidedShareMinor !== 0 && (
              <>
                {" "}
                وسقط بالرجيع{" "}
                <bdi className="r-num text-muted">
                  {money(toMajor(agg.voidedShareMinor, agg.currency))}
                </bdi>{" "}
                من {countedNoun(agg.voidedCount, NOUNS.order, { locale: settings.locale })} رجعت أو
                أُلغيت.
              </>
            )}
          </p>
        </Panel>

        {/* ── what his selling actually produced ──────────────────────────
            Three figures on one axis, not three nested circles: an area-scaled
            ring is read by eye as a ratio it cannot state, and the system has
            four chart shapes for a reason. */}
        <Panel
          span={3}
          title="مبيعاته"
          meta={
            monthDelta !== null ? (
              <Trend ratio={monthDelta} suffix="عن الشهر السابق" />
            ) : undefined
          }
          bodyClassName="flex flex-col gap-3"
        >
          <Metric
            size="sm"
            amount={money(toMajor(agg.revenueMinor, agg.currency))}
            name="إيراد مبيعاته"
          />
          <dl className="flex flex-col gap-2 border-t border-line pt-3 text-[12px]">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-subtle">صافي ربحها</dt>
              <dd>
                <bdi className="r-num font-bold text-fg">
                  {money(toMajor(agg.netProfitMinor, agg.currency))}
                </bdi>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-subtle">حصته</dt>
              <dd>
                <bdi className="r-num font-bold text-fg">
                  {money(toMajor(agg.repShareMinor, agg.currency))}
                </bdi>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-subtle">ما بقي لك</dt>
              <dd>
                <bdi
                  className={cn(
                    "r-num font-bold",
                    agg.ownerKeepsMinor < 0 ? "text-danger" : "text-fg",
                  )}
                >
                  {money(toMajor(agg.ownerKeepsMinor, agg.currency))}
                </bdi>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-subtle">القطع المبيعة</dt>
              <dd>
                <bdi className="r-num text-fg">{count(agg.units)}</bdi>
                <span className="ms-1.5 text-[10px] text-subtle">
                  في {count(agg.saleCount)} عملية
                </span>
              </dd>
            </div>
          </dl>
        </Panel>

        {/* ── the one panel asking for a decision ─────────────────────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {agg.needsSchemeCount > 0 ? (
            <>
              <Metric
                size="sm"
                amount={count(agg.needsSchemeCount)}
                name="بيعة باسمه بلا نظام قسمة"
              />
              <p className="text-[12px] leading-relaxed text-muted">
                حصّة هذه البيعات لم تُجمَّد، فهي ليست مستحقّة له بعد ولا تدخل رصيده.
              </p>
              <div className="mt-auto">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/reps/schemes">اضبط القسمة</Link>
                </Button>
              </div>
            </>
          ) : agg.balanceMinor > 0 ? (
            <>
              <Metric
                size="sm"
                amount={money(toMajor(agg.balanceMinor, agg.currency))}
                name="مستحقّ له الآن"
              />
              <p className="text-[12px] leading-relaxed text-muted">
                التسوية تُسجَّل بعملتها وتُنسب إليه، فتظهر في السجل وتخصم من الرصيد فوراً.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              لا مستحقّ عليه: كل حصة مجمّدة قوبلت بدفعة، وكل بيعة باسمه لها قاعدة.
            </p>
          )}
        </Panel>

        {/* ── the whole, divided ──────────────────────────────────────────── */}
        <Panel
          span={6}
          title="قسمة الأساس"
          meta={<span className="text-[12px] text-subtle">المبلغ الذي قُسم فعلاً</span>}
        >
          {split ? (
            <DistributionBar
              parts={split.parts}
              total={split.total}
              format={money}
              formatShare={share}
              label={`قسمة الأساس بين حصتك وحصة ${agg.repName}`}
            />
          ) : (
            <div className="flex flex-col gap-3 text-[13px]">
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
        </Panel>

        {/* ── the rule the engine actually applies to him ─────────────────── */}
        <Panel
          span={6}
          title="نظام القسمة المطبَّق عليه"
          meta={
            <Button asChild variant="ghost" size="sm" leadingIcon={<Sliders size={14} />}>
              <Link href="/reps/schemes">مِسطرة القسمة</Link>
            </Button>
          }
        >
          {scheme ? (
            <>
              <dl className="grid gap-3 sm:grid-cols-2">
                <SchemeRow
                  label="النظام"
                  value={
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-fg">{scheme.name}</span>
                      <Chip className="h-[18px] text-[10px]">
                        {SCHEME_TIER_LABELS[baseline.tier]}
                      </Chip>
                    </span>
                  }
                />
                <SchemeRow label="طريقة الحساب" value={COMMISSION_KIND_LABELS[scheme.kind]} />
                <SchemeRow
                  label="حصته"
                  value={
                    scheme.kind === "fixedPerUnit" ? (
                      <span className="flex items-baseline gap-1.5">
                        <bdi className="r-num font-bold text-fg">
                          {money(
                            MoneyValue.fromMinor(scheme.fixedAmountMinor ?? 0, agg.currency).amount,
                          )}
                        </bdi>
                        <span className="text-[11px] text-subtle">لكل وحدة</span>
                      </span>
                    ) : (
                      <bdi className="r-num font-bold text-fg">
                        {share(
                          scheme.kind === "percentOfPrice"
                            ? (scheme.priceRatio ?? 0)
                            : (scheme.repRatio ?? DEFAULT_REP_RATIO),
                        )}
                      </bdi>
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
                  hint="تذهب دائماً لهذا الطرف، في الربح والخسارة"
                />
              </dl>

              {exceptions.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <span className="r-label">منتجات تسبق قاعدته، لأن الأخصّ يفوز</span>
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
            <div className="flex flex-col items-start gap-3 text-[13px]">
              <p className="text-muted">
                لا ينطبق عليه أي نظام قسمة الآن، فأي بيع جديد باسمه يُسجَّل بدون حصة محسوبة.
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/reps/schemes">اضبط نظام القسمة</Link>
              </Button>
            </div>
          )}
        </Panel>

        {/* ── the work: every operation, frozen as it was sold ────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <>
              <span className="text-[11px] text-subtle">
                {count(visibleLedger.length)} من {count(ledger.length)} عملية · كل سطر بأرقامه
                المجمّدة وقت البيع
              </span>
              {ledger.length > visibleLedger.length && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="ms-auto"
                  onClick={() => setLedgerShown((n) => n + LEDGER_PAGE * 4)}
                >
                  عرض المزيد
                </Button>
              )}
            </>
          }
        >
          <Toolbar title="سجل عملياته">
            <span className="r-spacer" />
          </Toolbar>
          {ledger.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-subtle">
              لا توجد عمليات منسوبة له بعد.
            </p>
          ) : (
            <div className="r-tablewrap">
              <table className="r-tbl">
                <thead>
                  <tr>
                    <th className="pri-2">التاريخ</th>
                    <th>المنتج</th>
                    <th className="n pri-3">الكمية</th>
                    <th className="n pri-3">ربح العملية</th>
                    <th className="n">حصته</th>
                    <th className="n pri-2">حصتك من الأساس</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLedger.map(({ row, stale, currentSchemeName, productName }) => (
                    <tr key={row.sale.id} data-row>
                      <td className="pri-2 text-muted">
                        {formatDate(row.sale.soldAt, {
                          locale: settings.locale,
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td>
                        <span className="block font-bold text-fg">{productName}</span>
                        <span className="block text-[10px] text-subtle">
                          {row.schemeName ?? "بلا نظام قسمة"}
                          {stale && (
                            <span
                              className="ms-2 text-muted"
                              title={`جُمّدت على ${row.schemeName}، والقاعدة اليوم ${currentSchemeName ?? "غير محدّدة"}`}
                            >
                              قاعدة سابقة
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="n pri-3 text-muted">{count(row.sale.quantity)}</td>
                      <td
                        className={cn("n pri-3", row.netProfitMinor < 0 ? "text-danger" : "text-fg")}
                      >
                        {money(toMajor(row.netProfitMinor, row.currency))}
                      </td>
                      <td className="n font-bold">
                        {money(toMajor(row.repShareMinor, row.currency))}
                        {row.lossApplied && (
                          <span className="block text-[10px] font-normal text-subtle">
                            الخسارة عليك وحدك
                          </span>
                        )}
                      </td>
                      <td className="n pri-2 text-muted">
                        {money(toMajor(row.ownerShareMinor, row.currency))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* ── what has actually been paid to him ──────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              كل دفعة بعملتها كما سُجّلت. العملات لا تُجمع.
            </span>
          }
        >
          <Toolbar title="التسويات">
            <span className="r-spacer" />
          </Toolbar>
          {repSettlements.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-subtle">
              لم تُسجَّل أي تسوية له بعد.
            </p>
          ) : (
            <div className="flex flex-col">
              {repSettlements.map((s) => (
                <div key={s.id} className="r-datarow">
                  <span className="tx">
                    <b>{formatDate(s.paidAt, { locale: settings.locale })}</b>
                    <span>{[s.method, s.notes].filter(Boolean).join(" · ") || "بدون تفاصيل"}</span>
                  </span>
                  <bdi className="r-num end text-[13px] font-bold text-fg">
                    {formatCurrency(MoneyValue.fromMinor(s.amountMinor, s.currency).amount, {
                      currency: s.currency,
                      locale: settings.locale,
                    })}
                  </bdi>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </Grid>

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
