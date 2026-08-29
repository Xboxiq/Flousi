"use client";

import { ArrowUUpLeft, HandCoins, HourglassMedium, Truck } from "@phosphor-icons/react";
import type { CashReading } from "@/application/cash";
import { NOUNS, countedNoun } from "@/presentation/lib/format";
import { Odometer } from "./odometer";
import { cn } from "@/presentation/lib/cn";

export interface CashTillProps {
  reading: CashReading;
  /** Locale + currency aware money formatter. */
  money: (n: number) => string;
  /** Withheld from a session that may not read costs: a loss is a cost. */
  showLoss?: boolean;
  /**
   * The window these figures cover, named. REQUIRED in spirit: «بيدك» over the
   * store's whole history is not money the merchant can spend today, because he
   * has been spending it for months. A named window is what makes the claim true.
   */
  windowLabel?: string;
  /**
   * Whose money this is. A rep reading «بيدك» beside the store's collected total
   * would read the merchant's cash as their own, which is a leak of MEANING even
   * though every figure on it is one they are entitled to see (gate P3/G4).
   */
  audience?: "owner" | "rep";
  className?: string;
}

/**
 * الصندوق — where the money actually is.
 *
 * The app used to answer «كم ربحت» and let the merchant assume it meant «كم
 * عندي». In a COD market those are weeks apart: the courier holds the cash, some
 * of it never arrives, and a rep is owed a share of both. So this object prints
 * ONE number — what is spendable today — and then discloses, in order, what is
 * earned but still out, what is still on the road, and what came back.
 *
 * Nothing here is scaled. A bay is the same size whatever it holds, because the
 * four figures do not divide one whole: in-flight money is not a share of money
 * in hand, and a return is a loss, not a slice (VISUAL-LAW §11b). What tells the
 * proportion is the one ratio printed in words under the drawer.
 */
export function CashTill({
  reading,
  money,
  showLoss = true,
  windowLabel,
  audience = "owner",
  className,
}: CashTillProps) {
  const mine = audience === "owner";
  const r = reading;

  return (
    <section className={cn("device flex flex-col gap-5 p-5 sm:p-6", className)}>
      <header className="flex items-start gap-2.5">
        <span className="squircle size-9 shrink-0 text-accent" aria-hidden>
          <HandCoins size={18} weight="bold" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">
            {mine ? "بيدك" : "حُصّل من طلبياتك"}
            {windowLabel ? ` · ${windowLabel}` : ""}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            {mine ? "ما تقدر تصرفه اليوم" : "قيمة طلبياتك التي وصل مالها"}
          </p>
        </div>
      </header>

      <Odometer
        value={r.spendable}
        format={money}
        className="text-[clamp(1.75rem,7vw,2.75rem)] font-bold leading-[1.2] text-fg"
      />

      {/* The drawer front: everything below this line is money that is NOT yours to
          spend, and the lip is what says so before a single word is read. */}
      <div className="till-front" aria-hidden />

      <div className="grid gap-3 sm:grid-cols-2">
        <Bay
          kind="waiting"
          icon={<HourglassMedium size={16} weight="bold" />}
          label="عند التوصيل"
          /* The colon form, never «1 طلبية»: Arabic agrees the noun with the count,
             so a template that works at 3 is wrong at 1 and at 11. */
          note={r.withCourier.trips === 0 ? "لا شيء عند شركات التوصيل." : "سُلّمت ولم يوصلك مالها"}
          amount={money(r.awaiting)}
        />
        <Bay
          kind="road"
          icon={<Truck size={16} weight="bold" />}
          label="في الطريق"
          note={r.inFlight.trips === 0 ? "لا طلبية على الطريق." : "متوقّع، لا محقّق"}
          amount={money(r.inFlight.expected)}
          provisional
        />
      </div>

      {showLoss && r.lost.trips > 0 && (
        <p className="till-loss flex items-start gap-2 p-3 text-xs leading-relaxed text-danger">
          <ArrowUUpLeft size={15} weight="bold" className="mt-0.5 shrink-0" />
          <span>
            رجعت أو أُلغيت {countedNoun(r.lost.trips, NOUNS.order)}: خسرتَ أجرة التوصيل{" "}
            <bdi dir="ltr" className="font-figure font-bold">
              {money(Math.abs(r.lost.netProfit))}
            </bdi>
          </span>
        </p>
      )}
    </section>
  );
}

function Bay({
  kind,
  icon,
  label,
  note,
  amount,
  provisional,
}: {
  kind: "waiting" | "road";
  icon: React.ReactNode;
  label: string;
  note: string;
  amount: string;
  provisional?: boolean;
}) {
  return (
    <div
      className={cn(
        "till-bay flex flex-col gap-1.5 p-3.5",
        kind === "waiting" ? "till-bay--waiting" : "till-bay--road",
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="shrink-0 text-subtle" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <bdi
        dir="ltr"
        className={cn(
          "block font-figure text-lg font-bold leading-[1.2] tabular-nums",
          // A provisional figure is printed quieter than a real one: it is not a
          // smaller amount, it is a less certain one.
          provisional ? "text-muted" : "text-fg",
        )}
      >
        {amount}
      </bdi>
      <span className="text-[11px] leading-relaxed text-subtle">{note}</span>
    </div>
  );
}
