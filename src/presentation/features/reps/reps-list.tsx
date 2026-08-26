"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UsersThree, Faders } from "@phosphor-icons/react";
import {
  computeRepTrends,
  computeTeamCommissions,
  toMajor,
  type RepAggregate,
} from "@/application/commissions";
import { useDataStore } from "@/presentation/stores/data-store";
import { useUrlState } from "@/presentation/hooks/use-url-state";
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
  Segmented,
  Skeleton,
} from "@/presentation/components/ui";
import {
  DistributionBar,
  type DistributionPart,
} from "@/presentation/components/objects/distribution-bar";
import { Sparkline } from "@/presentation/components/objects/sparkline";
import {
  NOUNS,
  countedNoun,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/presentation/lib/format";
import { REP_STATUS_LABELS } from "@/presentation/lib/labels";
import { cn } from "@/presentation/lib/cn";
import { BalanceDevice, Figure } from "./balance-device";
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

  const trends = useMemo(
    () => computeRepTrends(input, { currency: settings.currency, months: 6 }),
    [input, settings.currency],
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
    <div className="flex items-center gap-2.5">
      <Button leadingIcon={<Plus size={17} weight="bold" />} onClick={() => setAddOpen(true)}>
        إضافة مندوب
      </Button>
      {/* one labelled primary beside an icon-only sibling that names itself (R42) */}
      <Button asChild variant="graphite" size="icon">
        <Link href="/reps/schemes" aria-label="إعدادات القسمة" title="إعدادات القسمة">
          <Faders size={19} />
        </Link>
      </Button>
    </div>
  );

  if (!loaded) {
    return (
      <>
        <PageHeader title="الفريق" description="من يبيع، وكم له، وكم بقي عليك." actions={actions} />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (reps.length === 0) {
    return (
      <>
        <PageHeader title="الفريق" description="من يبيع، وكم له، وكم بقي عليك." actions={actions} />
        <EmptyState
          icon={<UsersThree size={24} />}
          title="لا يوجد مندوبون بعد"
          description="أضِف أول مندوب، ثم اختره عند تسجيل البيع لتُقسم أرباح العملية بينكما فورًا."
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

  return (
    <>
      <PageHeader title="الفريق" description="من يبيع، وكم له، وكم بقي عليك." actions={actions} />

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        <BalanceDevice
          label="المستحق للفريق"
          outstanding={toMajor(team.outstandingMinor, team.currency)}
          earned={toMajor(team.earnedMinor, team.currency)}
          settled={toMajor(team.settledMinor, team.currency)}
          money={money}
          caption="الرصيد مشتقّ دائمًا: الحصص المجمّدة ناقص التسويات."
        />

        <Card>
          <CardHeader className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle>قسمة الأرباح</CardTitle>
              <CardDescription>
                الأساس المقسوم بين حصتك وحصص المندوبين، {SCOPE_WORD[scope]}.
              </CardDescription>
            </div>
            <Segmented
              className="self-start sm:ms-auto"
              aria-label="نطاق القراءة"
              options={SCOPES}
              value={scope}
              onChange={setScope}
            />
          </CardHeader>
          <CardContent>
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
              <div className="flex flex-col gap-2 text-[13px]">
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
          </CardContent>
        </Card>
      </div>

      {/* the count is a figure, so it is a bdi island rather than digits loose in
          an RTL sentence — parentheses around it would resolve on either side */}
      <h2 className="mt-7 mb-3 flex items-baseline gap-1.5 text-sm font-medium text-subtle">
        المندوبون <Money>{count(rows.length)}</Money>
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ row, balance, lastSaleAt, pull, leading }) => (
          <RepCard
            key={row.repId}
            row={row}
            balance={balance}
            lastSaleAt={lastSaleAt}
            pull={pull}
            leading={leading}
            scope={scope}
            trend={trends.get(row.repId) ?? []}
            money={money}
            count={count}
            share={share}
            locale={settings.locale}
            href={`/reps/view?id=${row.repId}`}
            onOpen={() => router.push(`/reps/view?id=${row.repId}`)}
          />
        ))}
      </div>

      <RepDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

/**
 * One partner, one body. Four readings, each carried once: what he is owed, what
 * he earned in the window, how many pieces he moved, and where he stands against
 * the strongest rep. The leader is marked inside the chart (R37) — his rail stays
 * solid while the others keep the hue and drop to a dot screen — never by a medal.
 */
function RepCard({
  row,
  balance,
  lastSaleAt,
  pull,
  leading,
  scope,
  trend,
  money,
  count,
  share,
  locale,
  href,
  onOpen,
}: {
  row: RepAggregate;
  balance: RepAggregate;
  lastSaleAt: string | null;
  pull: number;
  leading: boolean;
  scope: Scope;
  trend: number[];
  money: (n: number) => string;
  count: (n: number) => string;
  share: (r: number) => string;
  locale: string;
  href: string;
  onOpen: () => void;
}) {
  const owed = toMajor(balance.balanceMinor, balance.currency);
  const losing = row.repShareMinor < 0;
  /* The RingGauge rule: nothing is drawn for a reading that does not exist, so at
     zero the carved rail hatch is the whole statement and the badge prints «0%»
     against it. Above zero the fill keeps a 4% stub so it can never vanish. */
  const drawn = pull > 0.002;
  const pct = drawn ? Math.max(4, pull * 100) : 0;

  return (
    <Card className="bento-hover cursor-pointer" onClick={onOpen}>
      <CardHeader>
        <div className="min-w-0">
          {/* the whole card is clickable for the mouse, and the name is a real
              link so the keyboard has the same road — the link stops the bubble
              so one click is one navigation, not the Link plus the card's push */}
          <CardTitle className="truncate">
            <Link href={href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
              {row.repName}
            </Link>
          </CardTitle>
          <span className="mt-1 block text-[11px] text-subtle">
            {lastSaleAt
              ? `آخر بيع ${formatDate(lastSaleAt, { locale, month: "short", day: "numeric" })}`
              : "لا مبيعات بعد"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {row.status === "archived" && <Badge>{REP_STATUS_LABELS.archived}</Badge>}
          {row.needsSchemeCount > 0 && (
            <Badge tone="warning">{`${count(row.needsSchemeCount)} بلا نظام قسمة`}</Badge>
          )}
          {/* the trend is a drawn line, never animated; phones drop it entirely.
              A rep's share is a QUANTITY of money changing hands, not a profit, so
              the line stays neutral ink — success means the merchant keeps (§13) */}
          <Sparkline
            className="hidden md:block"
            values={trend}
            tone="neutral"
            label={`اتجاه حصة ${row.repName} في آخر ستة أشهر`}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Figure
            label={owed < 0 ? "مدفوع مقدّمًا" : "الرصيد"}
            value={money(Math.abs(owed))}
            hint="كل السجل"
          />
          <Figure
            label="حصته"
            value={money(toMajor(row.repShareMinor, row.currency))}
            hint={SCOPE_WORD[scope]}
          />
          <Figure
            label="القطع المبيعة"
            value={count(row.units)}
            hint={`${count(row.saleCount)} عملية`}
          />
        </div>

        {/* A balance that silently fell is a balance the rep will dispute. The share
            that was agreed and then returned is named, so the drop has a reason on the
            same card as the figure (gate P5/G2). */}
        {row.voidedShareMinor !== 0 && (
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-relaxed text-muted">
            <span>سقط بالرجيع:</span>
            <bdi dir="ltr" className="font-mono font-semibold text-fg">
              {money(toMajor(row.voidedShareMinor, row.currency))}
            </bdi>
            <span className="text-subtle">
              من {countedNoun(row.voidedCount, NOUNS.order, { locale })} رجعت أو
              أُلغيت. ما اتُّفق عليه محفوظ في السجل.
            </span>
          </p>
        )}

        <div>
          <div className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-muted">نسبته إلى أعلى حصة</span>
            {leading && <span className="text-subtle">القراءة المرجعية</span>}
          </div>
          <div className="rail relative mt-1.5 h-6 overflow-hidden rounded-[10px]">
            {drawn && (
              <div
                className={cn(
                  "rail-fill absolute inset-y-0 start-0 rounded-[10px]",
                  losing ? "bg-danger" : "bg-accent",
                  /* dots = a quieted reading (§11a): only the leader stays solid */
                  !leading && "capsule-fill-quiet",
                )}
                style={{ width: `${pct}%` }}
              />
            )}
            <span
              className="rail-badge px-1.5 py-[3px] text-[10px] font-bold text-fg"
              style={{ insetInlineStart: `max(4px, calc(${pct}% - 38px))` }}
            >
              <Money>{share(pull)}</Money>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
