"use client";

import { useMemo, useState } from "react";
import { Target as TargetIcon, Plus, PencilSimple } from "@phosphor-icons/react";
import type { TargetMetric } from "@/domain";
import { computeTargets, type TargetRow } from "@/application/targets";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
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
  Segmented,
  Skeleton,
} from "@/presentation/components/ui";
import { Odometer } from "@/presentation/components/objects/odometer";
import { PaceRail } from "@/presentation/components/objects/pace-rail";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { formatCurrency, formatNumber, formatPercent } from "@/presentation/lib/format";
import { cn } from "@/presentation/lib/cn";
import { TargetDialog } from "./target-dialog";

const METRICS = [
  { label: "صافي الربح", value: "netProfit" as const },
  { label: "الإيراد", value: "revenue" as const },
  { label: "القطع", value: "units" as const },
];

/**
 * Net profit is the merchant's own margin, so it is not offered to a session without
 * `viewCosts` — even in aggregate, and even for that session's own sales.
 *
 * A monthly total does not reveal any single product's cost the way a per-row profit
 * does, which is why this is a narrower rule than the ledger's. But «ما ربحه المتجر
 * من عملي» is still the merchant's figure to share or not, and a role built to hide
 * costs should not print it (gate P3/G4). Revenue and units are quantities a rep is
 * entitled to: they are their own work, counted.
 */
const OPEN_METRICS = METRICS.filter((m) => m.value !== "netProfit");

/**
 * «كم استهدف» — the fourth of the seven things the client asked a merchant to be
 * able to read, and the one that had no screen.
 *
 * Every figure here comes from `computeTargets`, which resolves each subject's own
 * target (most specific first) and measures it against that subject's own sales.
 * The screen owns no arithmetic: it decides what to draw, not what is true.
 */
export function TargetsView() {
  const loaded = useDataStore((s) => s.loaded);
  const targets = useDataStore((s) => s.targets);
  const sales = useDataStore((s) => s.sales);
  const products = useDataStore((s) => s.products);
  const reps = useDataStore((s) => s.reps);
  const settings = useDataStore((s) => s.settings);
  const access = useAccess();

  const canEdit = access.can("manageTargets");
  const canSeeCosts = access.can("viewCosts");
  const metrics = canSeeCosts ? METRICS : OPEN_METRICS;

  /**
   * The chosen metric, and the metric actually READ.
   *
   * They are two values on purpose. `useState` captures its initial value on the
   * first render, and on that render the store has not loaded yet — so `access`
   * still resolves to the owner and an initial value of «netProfit» would stick
   * even after the session turns out to be a rep. Deriving the effective metric
   * every render instead of seeding state from async data means the load order
   * cannot decide what a session is shown.
   */
  const [chosen, setMetric] = useUrlState<TargetMetric>("metric", "netProfit", [
    "netProfit",
    "revenue",
    "units",
  ]);
  const metric: TargetMetric = canSeeCosts ? chosen : chosen === "netProfit" ? "revenue" : chosen;
  const [editing, setEditing] = useState<TargetRow | null>(null);

  // One clock reading for the whole render, so every row on screen measures pace
  // against the same instant rather than each against its own.
  const asOf = useMemo(() => new Date().toISOString(), []);
  const month = asOf.slice(0, 7);

  const view = useMemo(
    () =>
      computeTargets({
        targets,
        sales,
        products,
        reps,
        month,
        asOf,
        metric,
        scope: access.salesScope,
      }),
    [targets, sales, products, reps, month, asOf, metric, access.salesScope],
  );

  const fmt = (n: number) =>
    metric === "units"
      ? `${formatNumber(n, { locale: settings.locale })} قطعة`
      : formatCurrency(n, { currency: settings.currency, locale: settings.locale });

  if (!loaded) {
    return (
      <>
        <PageHeader title="الأهداف" />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-56 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-64 rounded-[var(--radius-2xl)]" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="الأهداف"
        /* The colon form avoids Arabic number agreement, which changes shape at
           1, 2 (dual), 3–10 and 11+ — «3 هدفًا» is simply wrong Arabic, and a
           dashboard line is not the place to conjugate. */
        actions={
          <Segmented aria-label="ما يُقاس" options={metrics} value={metric} onChange={setMetric} />
        }
      />

      <div className="flex flex-col gap-6">
        {/* The account's own reading, at instrument size */}
        <AccountReading
          row={view.account}
          fmt={fmt}
          canEdit={canEdit}
          onEdit={() => setEditing(view.account)}
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>أهداف الفريق</CardTitle>
              {/* The standing mark on each rail is taught once, on the account's own
                  band above, where the caption «مضى ٨٧٪ من الشهر» sits beside it. It
                  was explained here a second time, which made this the one paragraph
                  left standing at rest on this screen (VISUAL-LAW §15). */}
              <CardDescription>
                هدف كل مندوب يُقاس بمبيعاته وحده.
                {canEdit ? " والمندوب بلا هدف يظهر هنا كي تحدّده، لا كي يختفي." : ""}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {view.reps.length === 0 ? (
              <EmptyState
                icon={<TargetIcon size={24} />}
                title="لا مندوبين بعد"
              />
            ) : (
              <ul className="flex flex-col">
                {view.reps.map((row) => (
                  <SubjectRow
                    key={row.key}
                    row={row}
                    fmt={fmt}
                    canEdit={canEdit}
                    onEdit={() => setEditing(row)}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {view.products.length > 0 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>أهداف المنتجات</CardTitle>
                <CardDescription>
                  تظهر هنا المنتجات التي حدّدت لها هدفًا فقط، لا كل الكتالوج.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col">
                {view.products.map((row) => (
                  <SubjectRow
                    key={row.key}
                    row={row}
                    fmt={fmt}
                    canEdit={canEdit}
                    onEdit={() => setEditing(row)}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <TargetDialog
        /* Keyed by the row: the sheet remounts per subject, so one row's typed
           amount can never open on another row. */
        key={editing?.key ?? "none"}
        open={!!editing}
        onClose={() => setEditing(null)}
        subject={{
          name: editing?.name ?? "",
          repId: editing?.repId,
          productId: editing?.productId,
        }}
        month={month}
        metric={metric}
        existing={editing?.target ?? null}
        actual={editing?.progress.actual ?? 0}
      />
    </>
  );
}

function toneFor(row: TargetRow) {
  if (!row.progress.hasTarget) return "muted" as const;
  if (row.progress.met) return "success" as const;
  return row.progress.onPace ? "success" : ("danger" as const);
}

/** «مضى ٥٢٪ من الشهر» — the scribe's own caption, in words. */
function elapsedWord(elapsed: number, locale: string): string {
  return `مضى ${formatPercent(elapsed, { locale, digits: 0 })} من الشهر`;
}

function AccountReading({
  row,
  fmt,
  onEdit,
  canEdit,
}: {
  row: TargetRow;
  fmt: (n: number) => string;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const settings = useDataStore((s) => s.settings);
  const p = row.progress;
  const tone = toneFor(row);

  return (
    /* Two columns, not one stacked band: at full width the rail stretched to
       1,470px, and a 33%-versus-61% comparison gets HARDER the longer the track
       is — the two marks drift apart until the eye has to travel between them
       (§10, composition balance). */
    <div className="halftone grid gap-6 rounded-[var(--radius-2xl)] p-6 shadow-card lg:grid-cols-[1fr_26rem] lg:items-center">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-5">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-fg/70">
            {row.metric === "netProfit" ? "صافي الربح" : row.metric === "revenue" ? "الإيراد" : "القطع"} · هذا الشهر
          </span>
          <div className="mt-2 text-fg">
            <Odometer
              value={p.actual}
              format={fmt}
              drumHeight={1.3}
              className={cn(
                "text-[26px] font-bold leading-none sm:text-[38px]",
                p.actual < 0 && "text-danger",
              )}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-fg/70">
            {p.hasTarget ? (
              <>
                من هدف <bdi dir="ltr" className="font-figure font-semibold">{fmt(p.targetAmount)}</bdi>
                {row.fromOverride && " (هدف هذا الشهر)"}
              </>
            ) : (
              "لا هدف محدّد لهذا الشهر، فتُقاس النتيجة بمعدّلك بدلًا منه."
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <RingGauge
            value={p.attainment}
            label={p.hasTarget ? formatPercent(p.attainment, { locale: settings.locale }) : "—"}
            caption={p.hasTarget ? "من الهدف" : "بلا هدف"}
            size={96}
            tone={tone}
          />
          {canEdit && (
            <Button
              variant="secondary"
              leadingIcon={p.hasTarget ? <PencilSimple size={16} /> : <Plus size={16} />}
              onClick={onEdit}
            >
              {p.hasTarget ? "تعديل" : "حدّد هدفًا"}
            </Button>
          )}
        </div>
      </div>

      {p.hasTarget && (
        <div className="rounded-[var(--radius-lg)] bg-surface/70 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-[11px] font-semibold text-fg/70">
              {elapsedWord(p.elapsed, settings.locale)}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold",
                p.onPace ? "text-success" : "text-danger",
              )}
            >
              {p.met ? "الهدف تحقّق" : p.onPace ? "في الوتيرة" : "متأخّر عن الوتيرة"}
            </span>
          </div>
          <PaceRail
            className="mt-2.5"
            height={16}
            attainment={p.attainment}
            elapsed={p.elapsed}
            tone={tone}
            /* The label used to append «ومضى ٨٧٪ من الشهر», which is the caption
               printed directly above the rail. A screen reader heard the month's
               elapsed share twice per rail; an eye read a third percentage next to
               two others (VISUAL-LAW §15). */
            label={`${formatPercent(p.attainment, { locale: settings.locale })} من الهدف`}
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-fg/70">
            {/* The remainder is the reading a merchant acts on: what is LEFT to
                make, not what has been made (§11). */}
            <span>
              {p.met ? "فوق الهدف بـ" : "يتبقّى"}{" "}
              <bdi dir="ltr" className="font-figure font-semibold text-fg">
                {fmt(p.met ? p.surplus : p.remaining)}
              </bdi>
            </span>
            {/* `pace` is attainment DIVIDED BY elapsed: a third percentage derived
                from the two already on screen, and one nobody acts on. The verdict it
                supports («في الوتيرة» / «متأخّر عن الوتيرة») is stated above in
                words, which is the part a merchant uses (VISUAL-LAW §15). */}
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectRow({
  row,
  fmt,
  onEdit,
  canEdit,
}: {
  row: TargetRow;
  fmt: (n: number) => string;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const settings = useDataStore((s) => s.settings);
  const p = row.progress;
  const tone = toneFor(row);

  return (
    <li
      data-row
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-b border-border-soft py-4 last:border-b-0 sm:grid-cols-[13.5rem_1fr_auto]"
    >
      <div className="min-w-0">
        <span className="block truncate font-medium text-fg">{row.name}</span>
        <span className="mt-0.5 block text-xs text-muted">
          {p.hasTarget ? (
            <>
              <bdi dir="ltr" className="font-figure">{fmt(p.actual)}</bdi>
              {" من "}
              <bdi dir="ltr" className="font-figure">{fmt(p.targetAmount)}</bdi>
            </>
          ) : (
            <>
              <bdi dir="ltr" className="font-figure">{fmt(p.actual)}</bdi>
              {" · بلا هدف"}
            </>
          )}
        </span>
      </div>

      {/* On a phone the rail takes the full width under the name rather than
          being crushed into a column beside it. */}
      <div className="col-span-2 sm:col-span-1 sm:order-none">
        {p.hasTarget ? (
          <>
            <PaceRail
              attainment={p.attainment}
              elapsed={p.elapsed}
              tone={tone}
              label={`${row.name}: ${formatPercent(p.attainment, {
                locale: settings.locale,
              })} من الهدف`}
            />
            {/* The elapsed share is a fact about the MONTH, not about this row: it
                is stated once on the card's own header instead of once per rep. */}
            <div className="mt-1.5 flex items-center justify-end text-[11px]">
              <span className={cn("font-semibold", p.onPace ? "text-success" : "text-danger")}>
                {p.met ? "تحقّق" : p.onPace ? "في الوتيرة" : `يتبقّى ${fmt(p.remaining)}`}
              </span>
            </div>
          </>
        ) : (
          /* No rail at all rather than an empty one: a channel with nothing in it
             would read as "zero progress" when the truth is "no target" (§8). */
          <p className="text-xs text-subtle">لم يُحدَّد هدف، فلا وتيرة تُقاس.</p>
        )}
      </div>

      <div className="flex items-center gap-2 justify-self-end">
        {/* The attainment percentage stood here as a third statement of one fact:
            the rail draws it, the line above it names the verdict in words, and the
            badge printed the number again. The rail and the word stay (VISUAL-LAW
            §15). */}
        {row.fromOverride && <Badge tone="neutral">هذا الشهر</Badge>}
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${p.hasTarget ? "تعديل" : "تحديد"} هدف ${row.name}`}
            leadingIcon={p.hasTarget ? <PencilSimple size={15} /> : <Plus size={15} />}
            onClick={onEdit}
          >
            {p.hasTarget ? "تعديل" : "حدّد"}
          </Button>
        )}
      </div>
    </li>
  );
}
