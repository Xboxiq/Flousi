"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UsersThree, Faders } from "@phosphor-icons/react";
import { computeTeamCommissions, toMajor } from "@/application/commissions";
import { useDataStore } from "@/presentation/stores/data-store";
import { useUrlState } from "@/presentation/hooks/use-url-state";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, EmptyState, Segmented, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric, Progress, Chip } from "@/presentation/components/structure";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/presentation/lib/format";
import { REP_STATUS_LABELS } from "@/presentation/lib/labels";
import { cn } from "@/presentation/lib/cn";
import { Figure } from "./balance-device";
import { RepDialog } from "./rep-dialog";

/** A real filter: it changes which sales are aggregated, not just a label (R38). */
const SCOPES = [
  { label: "هذا الشهر", value: "month" as const },
  { label: "كل السجل", value: "all" as const },
];
type Scope = (typeof SCOPES)[number]["value"];

const SCOPE_WORD: Record<Scope, string> = { month: "هذا الشهر", all: "كل السجل" };

/** DistributionBar owns six plates; the sixth is spent on the grouped tail. */
const TOP_PARTS = 5;

/**
 * «طاولة الشركاء» — the month's profit as one divided whole at the head, and a
 * body per partner beneath it.
 *
 * Every figure on this screen is a read model from `@/application/commissions`,
 * which derives it from the FROZEN splits on each sale minus the settlements.
 * Nothing is stored, nothing is recomputed here, and the screen owns no
 * arithmetic beyond normalising a rail's width.
 */
export function RepsList() {
  const router = useRouter();
  const loaded = useDataStore((s) => s.loaded);
  const sales = useDataStore((s) => s.sales);
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const schemes = useDataStore((s) => s.commissionSchemes);
  const assignments = useDataStore((s) => s.commissionAssignments);
  const settlements = useDataStore((s) => s.settlements);
  const orders = useDataStore((s) => s.orders);
  const settings = useDataStore((s) => s.settings);

  const [scope, setScope] = useUrlState<Scope>("scope", "month", ["month", "all"]);
  const [addOpen, setAddOpen] = useState(false);

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

  /* What is OWED is always the whole history: a payable does not reset with a
     window. Only the split reading below is scoped. */
  const team = useMemo(
    () => computeTeamCommissions(input, { currency: settings.currency }),
    [input, settings.currency],
  );

  const windowSales = useMemo(() => {
    if (scope === "all") return sales;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return sales.filter((s) => new Date(s.soldAt).getTime() >= from);
  }, [sales, scope]);

  const windowTeam = useMemo(
    () => computeTeamCommissions({ ...input, sales: windowSales }, { currency: settings.currency }),
    [input, windowSales, settings.currency],
  );


  /* The window's ranking joined to the all-history balance, plus the strongest
     MAGNITUDE in the window — never the largest signed value, or a month of
     losses would fill every rail to the brim. */
  const rows = useMemo(() => {
    const owed = new Map(team.reps.map((r) => [r.repId, r]));
    const peak = Math.max(...windowTeam.reps.map((r) => Math.abs(r.repShareMinor)), 1);
    return windowTeam.reps.map((row, i) => ({
      row,
      balance: owed.get(row.repId) ?? row,
      /* «آخر بيع» is a fact about the rep, not about the window — the same reason
         the balance is read all-history. Taken from the window it told an archived
         rep with real older sales «لا مبيعات بعد». */
      lastSaleAt: (owed.get(row.repId) ?? row).lastSaleAt,
      /* display normalisation only; no money is computed in this view */
      pull: Math.abs(row.repShareMinor) / peak,
      leading: i === 0 && row.repShareMinor > 0,
    }));
  }, [team.reps, windowTeam.reps]);

  /**
   * The parts of the divided whole. `basis` is what the two sides actually split
   * (net profit for a `netProfit` scheme, more for an `afterPurchaseCost` one),
   * and owner share + every rep share sums to it as an integer identity, so the
   * bar can never draw past its own whole (VISUAL-LAW §11b).
   *
   * The object owns six plates and six textures, so a seventh rep would silently
   * repeat one. Only the top five stand alone; the rest become ONE grouped part
   * that names its members in its own hint — the same rule the dashboard uses for
   * its minor cost lines. The tail is summed in MINOR units before it is
   * converted, so the identity stays exact.
   */
  const split = useMemo(() => {
    const drawable =
      windowTeam.basisMinor > 0 &&
      windowTeam.ownerShareMinor >= 0 &&
      windowTeam.reps.every((r) => r.repShareMinor >= 0);
    if (!drawable) return null;
    /* already ranked best-earner-first by `computeRepAggregates` */
    const paid = windowTeam.reps.filter((r) => r.repShareMinor > 0);
    const top = paid.slice(0, TOP_PARTS);
    const rest = paid.slice(TOP_PARTS);
    const restMinor = rest.reduce((sum, r) => sum + r.repShareMinor, 0);
    const parts: DistributionPart[] = [
      {
        id: "owner",
        label: "حصة التاجر",
        amount: toMajor(windowTeam.ownerShareMinor, windowTeam.currency),
        kind: "keep",
      },
      ...top.map((r) => ({
        id: r.repId,
        label: `حصة ${r.repName}`,
        amount: toMajor(r.repShareMinor, windowTeam.currency),
        kind: "spend" as const,
      })),
      ...(restMinor > 0
        ? [
            {
              id: "rest",
              /* A plate label is a plain string, so <Money> cannot be the bidi
                 island here: FSI…PDI is. Parentheses around a digit run in RTL
                 text resolve on the wrong side without it. */
              label: `بقية الفريق \u2068(${formatNumber(rest.length, { locale: settings.locale, digits: 0 })})\u2069`,
              hint: rest.map((r) => r.repName).join(" · "),
              amount: toMajor(restMinor, windowTeam.currency),
              kind: "spend" as const,
            },
          ]
        : []),
    ];
    return { parts, total: toMajor(windowTeam.basisMinor, windowTeam.currency) };
  }, [windowTeam, settings.locale]);

  const actions = (
    <>
      <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
        <Link href="/reps/schemes">
          <Faders size={15} />
          إعدادات القسمة
        </Link>
      </Button>
      <Button size="sm" leadingIcon={<Plus size={15} weight="bold" />} onClick={() => setAddOpen(true)}>
        إضافة مندوب
      </Button>
    </>
  );

  if (!loaded) {
    return (
      <>
        <PageHeader title="الفريق" actions={actions} />
        <Grid>
          <Skeleton className="span-6 h-[240px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[240px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[240px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[380px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  if (reps.length === 0) {
    return (
      <>
        <PageHeader title="الفريق" actions={actions} />
        <EmptyState
          icon={<UsersThree size={24} />}
          title="لا يوجد مندوبون بعد"
          action={
            <Button leadingIcon={<Plus size={16} weight="bold" />} onClick={() => setAddOpen(true)}>
              إضافة مندوب
            </Button>
          }
        />
        <RepDialog open={addOpen} onClose={() => setAddOpen(false)} />
      </>
    );
  }

  const owedTotal = toMajor(team.outstandingMinor, team.currency);
  const earnedTotal = toMajor(team.earnedMinor, team.currency);
  const settledTotal = toMajor(team.settledMinor, team.currency);
  const needsScheme = rows.filter(({ row }) => row.needsSchemeCount > 0);

  return (
    <>
      <PageHeader title="الفريق" actions={actions} />

      <Grid>
        {/* ── the whole, divided ──────────────────────────────────────────
            Owner share plus every rep share sums to the basis as an integer
            identity, so the bar can never draw past its own whole (§11b). */}
        <Panel
          span={6}
          title="قسمة الأرباح"
          meta={
            <Segmented
              aria-label="نطاق القراءة"
              options={SCOPES}
              value={scope}
              onChange={setScope}
            />
          }
        >
          {split ? (
            <DistributionBar
              parts={split.parts}
              total={split.total}
              format={money}
              formatShare={share}
              label={`قسمة الأساس المقسوم بين حصتك وحصص المندوبين، ${SCOPE_WORD[scope]}`}
            />
          ) : (
            /* Not drawable as a whole: a negative basis has no parts to divide,
               so the figures are stated instead of forced into a bar. */
            <div className="flex flex-col gap-3 text-[13px]">
              <p className="text-muted">
                {windowTeam.saleCount === 0
                  ? "لا توجد عمليات منسوبة لمندوب في هذه الفترة."
                  : "الأساس المقسوم في هذه الفترة لا يقبل القسمة كحصص موجبة."}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Figure
                  label="الأساس المقسوم"
                  value={money(toMajor(windowTeam.basisMinor, windowTeam.currency))}
                  polarity={windowTeam.basisMinor}
                />
                <Figure
                  label="حصتك"
                  value={money(toMajor(windowTeam.ownerShareMinor, windowTeam.currency))}
                />
                <Figure
                  label="حصص الفريق"
                  value={money(toMajor(windowTeam.repShareMinor, windowTeam.currency))}
                />
              </div>
            </div>
          )}
        </Panel>

        {/* ── one figure worth its own size ────────────────────────────────
            All-history, never windowed: a payable does not reset with a month,
            and «المستحق» scoped to August would say the merchant owes nothing
            the day a month turns over. */}
        <Panel span={3} title="المستحق للفريق" bodyClassName="flex flex-col gap-3">
          <Metric
            size="sm"
            amount={money(Math.abs(owedTotal))}
            name={owedTotal < 0 ? "مدفوع مقدّماً" : "من كل السجل"}
          />
          {earnedTotal > 0 && <Progress share={settledTotal / earnedTotal} />}
          <dl className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-subtle">استحقّوا</dt>
              <dd><bdi className="r-num text-fg">{money(earnedTotal)}</bdi></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle">دُفع</dt>
              <dd><bdi className="r-num text-fg">{money(settledTotal)}</bdi></dd>
            </div>
          </dl>
          <p className="mt-auto text-[11px] leading-relaxed text-subtle">
            الرصيد مشتقّ دائماً: الحصص المجمّدة ناقص التسويات.
          </p>
        </Panel>

        {/* ── the one panel asking for a decision ─────────────────────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {needsScheme.length > 0 ? (
            <>
              <Metric
                size="sm"
                amount={count(needsScheme.reduce((sum, r) => sum + r.row.needsSchemeCount, 0))}
                name="بيعة منسوبة لمندوب بلا نظام قسمة"
              />
              <p className="text-[12px] leading-relaxed text-muted">
                حصة هذه البيعات لم تُجمّد، فهي ليست مستحقّة بعد. اربطها بنظام قسمة حتى
                تدخل الرصيد.
              </p>
              <div className="mt-auto">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/reps/schemes">إعدادات القسمة</Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              كل بيعة منسوبة لمندوب لها نظام قسمة، وحصتها مجمّدة.
            </p>
          )}
        </Panel>

        {/* ── the work: every rep ─────────────────────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              {count(rows.length)} مندوب · الرصيد من كل السجل، والحصة {SCOPE_WORD[scope]}
            </span>
          }
        >
          <Toolbar title="المندوبون">
            <span className="r-spacer" />
          </Toolbar>

          <div className="r-tablewrap">
            <table className="r-tbl">
              <thead>
                <tr>
                  <th>المندوب</th>
                  <th className="n">حصته</th>
                  <th className="pri-3">نسبته إلى أعلى حصة</th>
                  <th className="n pri-2">الرصيد</th>
                  <th className="pri-3">آخر بيع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ row, balance, lastSaleAt, pull, leading }) => {
                  const owed = toMajor(balance.balanceMinor, balance.currency);
                  const losing = row.repShareMinor < 0;
                  /* Nothing is drawn for a reading that does not exist; above zero
                     the fill keeps a 4% stub so it can never vanish. */
                  const drawn = pull > 0.002;
                  const pct = drawn ? Math.max(4, pull * 100) : 0;
                  return (
                    <tr
                      key={row.repId}
                      data-row
                      className="cursor-pointer"
                      onClick={() => router.push(`/reps/view?id=${row.repId}`)}
                    >
                      <td>
                        {/* The row is clickable for the mouse and the NAME is a real
                            link, so the keyboard has the same road. The link stops
                            the bubble: one click is one navigation. */}
                        <Link
                          href={`/reps/view?id=${row.repId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-fg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          {row.repName}
                        </Link>
                        {row.status === "archived" && (
                          <Chip className="ms-2 h-[18px] text-[10px]">
                            {REP_STATUS_LABELS.archived}
                          </Chip>
                        )}
                        {row.needsSchemeCount > 0 && (
                          <Chip tone="warning" className="ms-2 h-[18px] text-[10px]">
                            {`${count(row.needsSchemeCount)} بلا قسمة`}
                          </Chip>
                        )}
                      </td>
                      <td className={cn("n font-bold", losing && "text-danger")}>
                        {money(toMajor(row.repShareMinor, row.currency))}
                      </td>
                      <td className="pri-3 w-[34%] min-w-[140px]">
                        <span className="flex items-center gap-2">
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                            {drawn && (
                              <i
                                className="block h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  /* Only the leader stays solid: a quieted reading
                                     is the same colour at a lower weight (§11a). */
                                  background: losing
                                    ? "var(--danger)"
                                    : leading
                                      ? "var(--accent-fill)"
                                      : "var(--series-3)",
                                }}
                              />
                            )}
                          </span>
                          <bdi className="r-num w-[3.5rem] shrink-0 text-end text-[11px] text-subtle">
                            {share(pull)}
                          </bdi>
                        </span>
                      </td>
                      <td className={cn("n pri-2", owed < 0 && "text-accent")}>
                        {money(Math.abs(owed))}
                        {owed < 0 && (
                          <span className="ms-1.5 text-[10px] font-normal text-subtle">مقدّم</span>
                        )}
                      </td>
                      <td className="pri-3 text-muted">
                        {lastSaleAt
                          ? formatDate(lastSaleAt, {
                              locale: settings.locale,
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </Grid>

      <RepDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
