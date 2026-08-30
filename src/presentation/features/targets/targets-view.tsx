"use client";

import { useMemo, useState } from "react";
import { Target as TargetIcon, Plus, PencilSimple } from "@phosphor-icons/react";
import type { TargetMetric } from "@/domain";
import { computeTargets, type TargetRow } from "@/application/targets";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { useUrlState } from "@/presentation/hooks/use-url-state";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, EmptyState, Segmented, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric, Chip } from "@/presentation/components/structure";
import { PaceRail } from "@/presentation/components/objects/pace-rail";
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
        <Grid>
          <Skeleton className="span-6 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[220px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-12 h-[380px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }

  const a = view.account.progress;
  const rows = [...view.reps, ...view.products];
  /* Behind pace and worth saying so. Not «late» — late is normal mid-month; this
     is the set the merchant can still do something about. */
  const behind = rows.filter((r) => r.progress.hasTarget && !r.progress.met && !r.progress.onPace);
  const missing = rows.filter((r) => !r.progress.hasTarget);

  return (
    <>
      <PageHeader
        title="الأهداف"
        actions={
          canEdit ? (
            <Button
              size="sm"
              variant="secondary"
              leadingIcon={<TargetIcon size={15} />}
              onClick={() => setEditing(view.account)}
            >
              هدف الحساب
            </Button>
          ) : undefined
        }
      />

      <Grid>
        {/* ── the account's own reading ───────────────────────────────────── */}
        <Panel
          span={6}
          title={`${METRIC_WORD[view.account.metric]} · هذا الشهر`}
          meta={
            <span className="text-[12px] text-subtle">
              {elapsedWord(a.elapsed, settings.locale)}
            </span>
          }
          bodyClassName="flex flex-col gap-4"
        >
          <Metric
            size="lead"
            amount={fmt(a.actual)}
            name={
              a.hasTarget
                ? `من هدف ${fmt(a.targetAmount)}${view.account.fromOverride ? " · هدف هذا الشهر" : ""}`
                : "لا هدف محدّد لهذا الشهر"
            }
            className={a.actual < 0 ? "[&_.amount]:text-danger" : ""}
          />
          {a.hasTarget ? (
            <>
              <PaceRail
                height={16}
                attainment={a.attainment}
                elapsed={a.elapsed}
                tone={toneFor(view.account)}
                label={`${formatPercent(a.attainment, { locale: settings.locale })} من الهدف، و${elapsedWord(a.elapsed, settings.locale)}`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[12px]">
                <span className="text-subtle">
                  {/* The REMAINDER is the reading a merchant acts on: what is left
                      to make, not what has been made (§11). */}
                  {a.met ? "فوق الهدف بـ" : "يتبقّى"}{" "}
                  <bdi className="r-num font-bold text-fg">
                    {fmt(a.met ? a.surplus : a.remaining)}
                  </bdi>
                </span>
                <Chip tone={a.met ? "success" : a.onPace ? "success" : "warning"}>
                  {a.met ? "تحقّق" : a.onPace ? "في الوتيرة" : "متأخّر عن الوتيرة"}
                </Chip>
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              بلا هدف لا وتيرة تُقاس. تُقارن النتيجة بمعدّلك بدلاً منه، وهي مقارنة
              بالماضي لا بقرار.
            </p>
          )}
        </Panel>

        {/* ── one figure worth its own size ───────────────────────────────── */}
        <Panel span={3} title="حال الأهداف" bodyClassName="flex flex-col gap-4">
          <Metric
            size="sm"
            amount={`${formatNumber(rows.filter((r) => r.progress.hasTarget).length, { locale: settings.locale })}`}
            name={`هدف محدّد من ${formatNumber(rows.length, { locale: settings.locale })} موضوع`}
          />
          <dl className="flex flex-col gap-2 text-[12px]">
            <div className="flex items-center justify-between">
              <dt className="text-subtle">تحقّق</dt>
              <dd>
                <bdi className="r-num text-fg">
                  {formatNumber(rows.filter((r) => r.progress.met).length, { locale: settings.locale })}
                </bdi>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-subtle">في الوتيرة</dt>
              <dd>
                <bdi className="r-num text-fg">
                  {formatNumber(
                    rows.filter((r) => r.progress.hasTarget && !r.progress.met && r.progress.onPace)
                      .length,
                    { locale: settings.locale },
                  )}
                </bdi>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-subtle">متأخّر</dt>
              <dd>
                <bdi className="r-num text-fg">
                  {formatNumber(behind.length, { locale: settings.locale })}
                </bdi>
              </dd>
            </div>
          </dl>
        </Panel>

        {/* ── the one panel asking for a decision ─────────────────────────── */}
        <Panel span={3} accent title="ما يحتاج قراراً" bodyClassName="flex h-full flex-col gap-3">
          {behind.length > 0 ? (
            <>
              <Metric
                size="sm"
                amount={formatNumber(behind.length, { locale: settings.locale })}
                name="متأخّر عن وتيرة الشهر"
              />
              <ul className="flex flex-col gap-1 text-[12px]">
                {behind.slice(0, 3).map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-2">
                    <span className="truncate text-fg">{r.name}</span>
                    <bdi className="r-num shrink-0 text-warning">
                      {fmt(r.progress.remaining)}
                    </bdi>
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-[12px] leading-relaxed text-muted">
                المبلغ هو ما تبقّى على كل واحد حتى نهاية الشهر، لا ما خسره.
              </p>
            </>
          ) : missing.length > 0 && canEdit ? (
            <>
              <Metric
                size="sm"
                amount={formatNumber(missing.length, { locale: settings.locale })}
                name="بلا هدف لهذا الشهر"
              />
              <p className="text-[12px] leading-relaxed text-muted">
                بلا هدف لا وتيرة، والنتيجة تُقاس بالماضي بدل قرار اتّخذته. حدّدها من
                الجدول أدناه.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted">
              كل هدف محدّد إمّا تحقّق أو في وتيرته.
            </p>
          )}
        </Panel>

        {/* ── the work: every subject with a target ───────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              هدف كل مندوب يُقاس بمبيعاته وحده، وتظهر المنتجات التي لها هدف فقط.
            </span>
          }
        >
          <Toolbar title="الأهداف">
            {/* The metric is a FILTER, and a filter belongs over the thing it
                filters — not in the bar's action slot beside «إضافة», where it
                reads as a verb the merchant is being offered. */}
            <Segmented aria-label="ما يُقاس" options={metrics} value={metric} onChange={setMetric} />
            <span className="r-spacer" />
          </Toolbar>

          {rows.length === 0 ? (
            <EmptyState icon={<TargetIcon size={24} />} title="لا مندوبين ولا أهداف بعد" />
          ) : (
            <div className="r-tablewrap">
              <table className="r-tbl">
                <thead>
                  <tr>
                    <th>الموضوع</th>
                    <th className="n">المُنجَز</th>
                    <th className="n pri-3">الهدف</th>
                    <th className="pri-2 w-[30%] min-w-[160px]">الوتيرة</th>
                    <th className="n pri-2">يتبقّى</th>
                    {canEdit && <th />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <SubjectRow
                      key={row.key}
                      row={row}
                      fmt={fmt}
                      canEdit={canEdit}
                      locale={settings.locale}
                      onEdit={() => setEditing(row)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </Grid>

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

const METRIC_WORD: Record<TargetMetric, string> = {
  netProfit: "صافي الربح",
  revenue: "الإيراد",
  units: "القطع",
};

function toneFor(row: TargetRow) {
  if (!row.progress.hasTarget) return "muted" as const;
  if (row.progress.met) return "success" as const;
  /* On pace is neutral progress, not a win — the accent is what "moving" looks
     like in this system. Behind pace is a WARNING: red judges money going the
     wrong way, and a target that is merely late has cost nobody anything (§13). */
  return row.progress.onPace ? "accent" : ("warning" as const);
}

/** «مضى ٥٢٪ من الشهر» — the scribe's own caption, in words. */
function elapsedWord(elapsed: number, locale: string): string {
  return `مضى ${formatPercent(elapsed, { locale, digits: 0 })} من الشهر`;
}

/**
 * One subject's row.
 *
 * The pace rail carries TWO facts in one shape: the fill is what has been made,
 * and the standing mark is how much of the month has gone. That comparison is the
 * whole screen — a percentage alone cannot say whether 40% on the 5th is excellent
 * or 40% on the 28th is a problem.
 */
function SubjectRow({
  row,
  fmt,
  onEdit,
  canEdit,
  locale,
}: {
  row: TargetRow;
  fmt: (n: number) => string;
  onEdit: () => void;
  canEdit: boolean;
  locale: string;
}) {
  const p = row.progress;

  return (
    <tr data-row>
      <td>
        <span className="font-medium text-fg">{row.name}</span>
        {row.fromOverride && (
          <Chip className="ms-2 h-[18px] text-[10px]">هذا الشهر</Chip>
        )}
      </td>
      <td className="n">{fmt(p.actual)}</td>
      <td className="n pri-3 text-muted">
        {p.hasTarget ? fmt(p.targetAmount) : "—"}
      </td>
      <td className="pri-2">
        {p.hasTarget ? (
          /* The rail DRAWS the attainment and its label announces it; a percentage
             printed beside it was the same fact a third time, on a row that also
             carries the achieved figure, the target and the remainder. */
          <PaceRail
            attainment={p.attainment}
            elapsed={p.elapsed}
            tone={toneFor(row)}
            label={`${row.name}: ${formatPercent(p.attainment, { locale })} من الهدف`}
          />
        ) : (
          /* No rail at all rather than an empty one: a channel with nothing in it
             reads as "zero progress" when the truth is "no target" (§8). */
          <span className="text-[11px] text-subtle">لم يُحدَّد هدف، فلا وتيرة تُقاس.</span>
        )}
      </td>
      <td className="n pri-2">
        {p.hasTarget ? (
          <span className={cn(p.met ? "text-success" : !p.onPace ? "text-warning" : "text-fg")}>
            {p.met ? "تحقّق" : fmt(p.remaining)}
          </span>
        ) : (
          "—"
        )}
      </td>
      {canEdit && (
        <td className="text-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${p.hasTarget ? "تعديل" : "تحديد"} هدف ${row.name}`}
            leadingIcon={p.hasTarget ? <PencilSimple size={14} /> : <Plus size={14} />}
            onClick={onEdit}
          >
            {p.hasTarget ? "تعديل" : "حدّد"}
          </Button>
        </td>
      )}
    </tr>
  );
}
