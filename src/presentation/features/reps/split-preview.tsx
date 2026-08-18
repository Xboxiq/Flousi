"use client";

import type { CommissionSplitResult, ProfitBasis } from "@/domain";
import { Money } from "@/presentation/components/ui";
import { LivingNumber } from "@/presentation/components/interactive/living-number";
import { TickMeter } from "@/presentation/components/objects/tick-meter";
import { formatPercent } from "@/presentation/lib/format";
import { LOSS_POLICY_LABELS, PROFIT_BASIS_LABELS } from "@/presentation/lib/labels";
import { cn } from "@/presentation/lib/cn";

interface Props {
  /** Straight from `CommissionCalculator.split` — the view computes no share. */
  split: CommissionSplitResult;
  /** The scheme's basis, so the well can name what it just divided. */
  profitBasis: ProfitBasis;
  repName: string;
  schemeName: string;
  /** Which tier of the chain won, already worded. */
  tierLabel: string;
  /** The screen's own formatter (currency + locale bound). */
  money: (n: number) => string;
  locale: string;
  className?: string;
}

/** Profit polarity only: the owner's keep is a profit figure, so it takes the code. */
const keepTone = (n: number) => (n > 0 ? "text-success" : n < 0 ? "text-danger" : "text-muted");

/**
 * «هذا لك / هذا له» — the split stated before the sale is saved (P1 G7).
 *
 * The two figures are LivingNumbers because the merchant is SHAPING them: price
 * and quantity are being typed one keystroke away, and this is the one figure on
 * the surface that answers back (SIGNATURE device #1). Every other figure here
 * is read, so it stays a static `Money`.
 *
 * Colour is code, not emphasis: the owner's keep is a profit figure and takes
 * success/danger, while the rep's share is a QUANTITY of money changing hands
 * and stays neutral ink. Painting it green would redefine VISUAL-LAW §13, whose
 * success already means «the merchant keeps».
 *
 * The instrument reports two owner figures on purpose. `ownerShare` is what the
 * contract says; `ownerKeeps` is net profit minus the rep's share, i.e. what
 * actually stays once costs the basis excluded are paid. They differ under an
 * `afterPurchaseCost` scheme, and collapsing them would credit the merchant with
 * money never seen.
 */
export function SplitPreview({
  split,
  profitBasis,
  repName,
  schemeName,
  tierLabel,
  money,
  locale,
  className,
}: Props) {
  const ratio = split.effectiveRepRatio;
  const keeps = split.ownerKeeps.amount;
  const contractDiffers = split.ownerShare.minorUnits !== split.ownerKeeps.minorUnits;

  return (
    <div className={cn("device relative px-4 pt-3.5 pb-4", className)} data-part="split-preview">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-fg">القسمة قبل الحفظ</span>
        <span className="text-[11px] text-subtle">
          {schemeName} · {tierLabel}
        </span>
      </div>

      {/* The two figures re-read on every keystroke in price/quantity while focus
          sits in the Input, so the container is the live region — not LivingNumber
          itself, which also renders figures the merchant is typing directly. */}
      <div className="mt-3 grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
        <div className="clay-inset rounded-[var(--radius-md)] px-3 py-2.5">
          <div className="text-xs text-muted">هذا لك</div>
          <LivingNumber
            value={keeps}
            format={money}
            className={cn("mt-1 block text-[19px] font-bold", keepTone(keeps))}
          />
          <div className="mt-0.5 text-[11px] text-subtle">بعد كل التكاليف</div>
        </div>
        <div className="clay-inset rounded-[var(--radius-md)] px-3 py-2.5">
          <div className="text-xs text-muted">هذا له</div>
          <LivingNumber
            value={split.repShare.amount}
            format={money}
            className="mt-1 block text-[19px] font-bold text-fg"
          />
          <div className="mt-0.5 truncate text-[11px] text-subtle" title={repName}>
            {repName}
          </div>
        </div>
      </div>

      {/* the share, countable: filled ticks are his, the carved slots are yours */}
      <div className="mt-3.5 flex items-center gap-3">
        <span className="shrink-0 text-[11px] text-muted">حصته من الأساس</span>
        {ratio === null ? (
          <span className="text-[11px] text-subtle">لا أساس يُقسم</span>
        ) : (
          <>
            <TickMeter
              value={ratio}
              ticks={16}
              height={14}
              tone="accent"
              label={`حصة ${repName} من الأساس المقسوم`}
              className="min-w-0 flex-1"
            />
            <Money className="shrink-0 text-[11px] font-semibold text-fg">
              {formatPercent(ratio, { locale, digits: 0 })}
            </Money>
          </>
        )}
      </div>

      <dl className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-[12px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">الأساس المقسوم · {PROFIT_BASIS_LABELS[profitBasis]}</dt>
          <dd>
            <Money className="text-fg">{money(split.basis.amount)}</Money>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">صافي ربح العملية</dt>
          <dd>
            <Money polarity={split.netProfit.amount}>{money(split.netProfit.amount)}</Money>
          </dd>
        </div>
        {contractDiffers && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">حصتك من الأساس نفسه</dt>
            <dd>
              <Money className="text-fg">{money(split.ownerShare.amount)}</Money>
            </dd>
          </div>
        )}
      </dl>

      {/* state-bound, and named in words: nothing here glows without a reason */}
      {split.lossApplied && (
        <p className="mt-3 flex items-start gap-2 text-[12px] text-muted">
          <span
            aria-hidden
            className="lamp mt-[5px] size-[8px] shrink-0"
            style={
              {
                "--lamp-color": "var(--danger)",
                "--lamp-glow": "color-mix(in srgb, var(--danger) 60%, transparent)",
              } as React.CSSProperties
            }
          />
          الأساس سالب، فحصة المندوب صفر حسب سياسة الخسارة، والخسارة كلها عليك.
        </p>
      )}

      {/* state-bound too: the rep is owed LESS than the rule promises, and that is
          a fact about this sale rather than a rounding detail. No lamp — the cap is
          not a loss, and a second lit dot would claim a state it has not earned. */}
      {split.feeCapped && (
        <p className="mt-3 text-[12px] text-muted">
          العمولة أكبر من الأساس فقُصّت إليه: مع «{LOSS_POLICY_LABELS.ownerOnly}» لا تصنع العمولة
          خسارة، فحصته أقل مما تعِد به القاعدة.
        </p>
      )}
    </div>
  );
}
