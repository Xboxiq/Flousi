"use client";

import { useState } from "react";
import { Money as MoneyValue } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input, Money, Select } from "@/presentation/components/ui";
import { RingGauge } from "@/presentation/components/objects/ring-gauge";
import { SlideToCommit } from "@/presentation/components/interactive/slide-to-commit";
import { LivingNumber } from "@/presentation/components/interactive/living-number";
import { formatCurrency, formatDate, formatNumber } from "@/presentation/lib/format";

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
  const defaultAmount = due.minorUnits > 0 ? due.amount : 0;
  const amount = amountText === null ? defaultAmount : parseFloat(amountText) || 0;
  const payment = MoneyValue.fromMajor(amount, currency);

  /* Lines are never summed across currencies: the domain holds no FX rate, and
     `Money.subtract` would throw. Paying in another currency is allowed, it just
     does not net against this line. */
  const sameCurrency = currency === pin.currency;
  const remainder = sameCurrency ? due.subtract(payment).amount : due.amount;

  /* Display normalisation only. What is already paid, out of what was earned. */
  const covered = pin.earnedMinor > 0 ? pin.settledMinor / pin.earnedMinor : 0;

  const commit = async () => {
    await createSettlement({
      repId: pin.repId,
      amountMinor: payment.minorUnits,
      currency,
      paidAt: new Date(date + "T12:00:00").toISOString(),
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
        <RingGauge
          value={covered}
          label={balanceMoney(due.amount)}
          caption="المستحق الآن"
          size={124}
          tone={due.minorUnits > 0 ? "accent" : due.minorUnits < 0 ? "muted" : "success"}
        />
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
            step="0.01"
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
          <dd>
            <LivingNumber
              value={remainder}
              format={balanceMoney}
              className="text-[16px] font-bold text-fg"
            />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">تاريخ الدفع</dt>
          <dd className="text-fg">{formatDate(date, { locale })}</dd>
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
