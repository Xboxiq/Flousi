"use client";

import { useState } from "react";
import { Money as MoneyValue, payableStepMinor } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input, Money, Select } from "@/presentation/components/ui";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { SlideToCommit } from "@/presentation/components/interactive/slide-to-commit";
import { LivingNumber } from "@/presentation/components/interactive/living-number";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/presentation/lib/format";

/**
 * What the sheet is settling, PINNED by the caller at the moment it opens.
 *
 * Passed by value on purpose: the balance keeps deriving itself from the store
 * while the sheet is open, and a live figure could re-target the payment
 * mid-commit. The merchant pays what they were shown.
 */
export interface SettlementPin {
  repId: string;
  repName: string;
  /** The balance line's currency. The settlement may be paid in another. */
  currency: string;
  outstandingMinor: number;
  earnedMinor: number;
  settledMinor: number;
  saleCount: number;
}

interface Props {
  pinned: SettlementPin | null;
  onClose: () => void;
  locale: string;
  /** The open accounting period, so the payment lands in the right month. */
  periodId?: string;
}

/** Settlement currency defaults to the account's and is editable from day one. */
const CURRENCIES = [
  { label: "دينار عراقي (IQD)", value: "IQD" },
  { label: "دولار أمريكي (USD)", value: "USD" },
  { label: "يورو (EUR)", value: "EUR" },
  { label: "ريال سعودي (SAR)", value: "SAR" },
  { label: "درهم إماراتي (AED)", value: "AED" },
];

const EMPTY: SettlementPin = {
  repId: "",
  repName: "",
  currency: "IQD",
  outstandingMinor: 0,
  earnedMinor: 0,
  settledMinor: 0,
  saleCount: 0,
};

/**
 * «التسوية» — paying a rep what the frozen splits say he earned.
 *
 * The gesture is the point (RECIPES R25 names paying a settlement as its own
 * criterion): money leaving the till costs a deliberate drag, and releasing early
 * snaps back. The art band holds the data being acted on, not an icon: the ring
 * reports how much of what he earned is already paid, with what remains struck in
 * its middle.
 *
 * Partial settlement is a first-class case, so the remainder is a live figure the
 * merchant watches while typing, and it is computed by `Money` in minor units,
 * never by a float subtraction in this view.
 */
export function SettleDialog({ pinned, onClose, locale, periodId }: Props) {
  const createSettlement = useDataStore((s) => s.createSettlement);
  const pin = pinned ?? EMPTY;

  /* null = untouched, so a re-open follows the NEW pin instead of a stale draft. */
  const [amountText, setAmountText] = useState<string | null>(null);
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("نقدًا");
  const [notes, setNotes] = useState("");
  const [committed, setCommitted] = useState(false);

  const currency = currencyOverride ?? pin.currency;
  const money = (n: number) => formatCurrency(n, { currency, locale });
  const balanceMoney = (n: number) => formatCurrency(n, { currency: pin.currency, locale });

  const due = MoneyValue.fromMinor(pin.outstandingMinor, pin.currency);
  /* The field must offer an amount that can actually change hands: in a currency
     with no sub-unit in circulation (IQD) the payable step is one whole unit, and
     the default is floored to it — a settlement is money leaving the till, so the
     default never rounds UP into an overpayment. */
  const step = payableStepMinor(pin.currency);
  const payableDueMinor = Math.trunc(pin.outstandingMinor / step) * step;
  const defaultAmount = payableDueMinor > 0 ? MoneyValue.fromMinor(payableDueMinor, pin.currency).amount : 0;
  const amount = amountText === null ? defaultAmount : parseFloat(amountText) || 0;
  const payment = MoneyValue.fromMajor(amount, currency);

  /* Lines are never summed across currencies: the domain holds no FX rate, and
     `Money.subtract` would throw. Paying in another currency is allowed, it just
     does not net against this line. */
  const sameCurrency = currency === pin.currency;
  const remainder = sameCurrency ? due.subtract(payment).amount : due.amount;

  /* Display normalisation only. What is already paid, out of what was earned.
     Clamped at the source: an overpaid rep must not be DRAWN as a completed ring
     and then re-drawn as one at 300%. */
  const covered =
    pin.earnedMinor > 0 ? Math.min(1, Math.max(0, pin.settledMinor / pin.earnedMinor)) : 0;

  /* Parsed ONCE, at noon, so the receipt line and the stored record can never
     name two different days: `formatDate` on a bare "YYYY-MM-DD" parses it as UTC
     midnight, which prints the previous day in any negative UTC offset. */
  const paidAt = new Date(date + "T12:00:00");

  const commit = async () => {
    await createSettlement({
      repId: pin.repId,
      amountMinor: payment.minorUnits,
      currency,
      paidAt: paidAt.toISOString(),
      periodId,
      method: method.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setCommitted(true);
    /* The landed state is held visibly before the sheet leaves: the merchant
       sees the payment register instead of a dialog vanishing under their hand. */
    await new Promise((resolve) => setTimeout(resolve, 900));
    onClose();
    setAmountText(null);
    setCurrencyOverride(null);
    setNotes("");
    setCommitted(false);
  };

  const tooSmall = payment.minorUnits <= 0;

  return (
    <Dialog
      open={pinned !== null}
      onClose={onClose}
      title={`تسوية مع ${pin.repName}`}
      description="ما يُدفع الآن يُخصم من رصيده المشتقّ، والباقي يبقى مستحقًا."
      art={
        /* The ring reports two different quantities — the ARC is coverage of what
           he earned, the struck figure is what is still owed — so the arc is named
           in words under the housing. An unnamed arc is read as a fraction of the
           figure it encircles, which it is not. */
        <div className="flex flex-col items-center gap-2">
          <RingGauge
            value={covered}
            label={balanceMoney(due.amount)}
            caption="المستحق الآن"
            size={124}
            tone={due.minorUnits > 0 ? "accent" : due.minorUnits < 0 ? "muted" : "success"}
          />
          <p className="text-center text-[11px] text-muted">
            {pin.earnedMinor > 0
              ? `القوس: مدفوع ${formatPercent(covered, { locale, digits: 0 })} من حصصه المجمّدة`
              : "لا حصص مجمّدة بعد، فلا قوس يُرسم"}
          </p>
        </div>
      }
      footer={
        <Button variant="ghost" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="المبلغ المدفوع" htmlFor="settle-amount">
          <Input
            id="settle-amount"
            type="number"
            min={0}
            step={step === 1 ? "0.01" : "1"}
            className="clay-inset"
            value={amountText === null ? defaultAmount || "" : amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </Field>
        <Field
          label="العملة"
          htmlFor="settle-currency"
          helper={sameCurrency ? undefined : "عملة مختلفة عن رصيده، فلن تُخصم من هذا السطر."}
        >
          <Select
            id="settle-currency"
            value={currency}
            options={CURRENCIES}
            onChange={(e) => setCurrencyOverride(e.target.value)}
          />
        </Field>
        <Field label="تاريخ الدفع" htmlFor="settle-date">
          <Input
            id="settle-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="الطريقة" htmlFor="settle-method">
          <Input id="settle-method" value={method} onChange={(e) => setMethod(e.target.value)} />
        </Field>
        <Field label="ملاحظة" htmlFor="settle-notes" className="sm:col-span-2">
          <Input id="settle-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      {/* The receipt: every printed line is a field of the record about to be
          written, and the remainder answers back as the amount is typed. */}
      <dl className="clay-inset mt-4 flex flex-col gap-2 rounded-[var(--radius-md)] px-4 py-3 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">المستحق قبل الدفع</dt>
          <dd>
            <Money className="font-semibold text-fg">{balanceMoney(due.amount)}</Money>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">حصصه المجمّدة</dt>
          <dd className="flex items-baseline gap-2">
            <Money className="text-fg">
              {balanceMoney(MoneyValue.fromMinor(pin.earnedMinor, pin.currency).amount)}
            </Money>
            <span className="text-[11px] text-subtle">
              من {formatNumber(pin.saleCount, { locale, digits: 0 })} عملية
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
          <dt className="font-medium text-fg">المتبقّي بعد هذه التسوية</dt>
          {/* The remainder re-reads on every keystroke in the amount Input, where
              focus is, so it must be announced — but LivingNumber GLIDES to its
              new value one animation frame at a time. A live region around it
              would read out a stream of amounts that were never the remainder,
              so the announcement is a separate sr-only line carrying the settled
              figure and the visible number is hidden from the reader. */}
          <dd>
            <LivingNumber
              value={remainder}
              format={balanceMoney}
              aria-hidden
              className="text-[16px] font-bold text-fg"
            />
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {`المتبقّي بعد هذه التسوية ${balanceMoney(remainder)}`}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">تاريخ الدفع</dt>
          <dd className="text-fg">{formatDate(paidAt, { locale })}</dd>
        </div>
      </dl>

      <SlideToCommit
        className="mt-4"
        label={`اسحب لدفع ${money(amount)}`}
        doneLabel="سُجّلت التسوية"
        onCommit={commit}
        disabled={tooSmall || committed}
      />
      <p className="mt-2 text-center text-[11px] text-subtle">
        {tooSmall
          ? "أدخل مبلغًا أكبر من صفر ليُفتح السحب."
          : "الإفلات قبل النهاية يلغي، فلا يُدفع مبلغ بالخطأ."}
      </p>
    </Dialog>
  );
}
