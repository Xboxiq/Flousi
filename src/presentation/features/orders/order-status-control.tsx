"use client";

import { useState } from "react";
import {
  ArrowUUpLeft,
  HandCoins,
  HourglassMedium,
  Prohibit,
  Truck,
} from "@phosphor-icons/react";
import {
  COLLECTION_LABELS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  orderCollection,
  orderStatus,
  type CollectionStatus,
  type Order,
  type OrderStatus,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Field, Input, Segmented, Spinner } from "@/presentation/components/ui";

export type OrderState = "pending" | "withCourier" | "inHand" | "returned" | "cancelled";

/** The five states, each with its own form so the state is read before the word. */
export const STATE_MARK: Record<
  OrderState,
  { icon: React.ReactNode; label: string; repLabel?: string }
> = {
  pending: { icon: <Truck size={14} weight="bold" />, label: "في الطريق" },
  withCourier: { icon: <HourglassMedium size={14} weight="bold" />, label: "عند التوصيل" },
  // «بيدك» is the MERCHANT's hand. A rep reading it on their own row would read the
  // store's cash as theirs, so their word for the same state is «محصّلة».
  inHand: { icon: <HandCoins size={14} weight="bold" />, label: "بيدك", repLabel: "محصّلة" },
  returned: { icon: <ArrowUUpLeft size={14} weight="bold" />, label: "راجعة" },
  cancelled: { icon: <Prohibit size={14} weight="bold" />, label: "ملغاة" },
};

/** The word for a state, in the reader's own terms. */
export function stateLabel(state: OrderState, audience: "owner" | "rep"): string {
  const mark = STATE_MARK[state];
  return audience === "rep" && mark.repLabel ? mark.repLabel : mark.label;
}

/** Which mark a row wears, from the two fields that decide it. */
export function stateOf(order: Pick<Order, "status" | "collection">): OrderState {
  const status = orderStatus(order);
  if (status === "returned" || status === "cancelled") return status;
  if (status === "pending") return "pending";
  return orderCollection(order) === "collected" ? "inHand" : "withCourier";
}

/**
 * The state of a trip, changed in place.
 *
 * A status is a FIELD, not a destructive edit: nothing is deleted, no sale is
 * removed, and the frozen commission snapshot is never touched. Marking an order
 * returned and then delivered again returns every figure to what it was, which is
 * the only way a merchant can afford to correct a mistake (gate P5/G4).
 */
export function OrderStatusControl({ order }: { order: Order }) {
  const updateOrder = useDataStore((s) => s.updateOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = orderStatus(order);
  const collection = orderCollection(order);

  const patch = async (next: Partial<Order>) => {
    setBusy(true);
    setError(null);
    try {
      await updateOrder(order.id, { ...next, statusAt: new Date().toISOString() });
    } catch {
      setError("لم يُحفظ التغيير. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (next: OrderStatus) => {
    if (next === status) return;
    // A round trip usually costs what the trip cost, so the field is SEEDED with
    // the outbound fee. It stays editable, because some couriers charge half for a
    // return and some charge nothing, and a guessed figure shown as fact is worse
    // than an asked one (gate P5/G5).
    const seed =
      next === "returned" && order.returnCost === undefined
        ? { returnCost: order.deliveryPaid }
        : {};
    void patch({ status: next, ...seed });
  };

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-sunken p-3.5">
      {/* Label and control on ONE line: a four-state group alone in a wide band left
          the box looking like an empty tray with a keypad in the corner. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted">
          حالة الطلبية
          {busy && <Spinner className="size-3.5" />}
        </p>
        <Segmented
          aria-label="حالة الطلبية"
          value={status}
          onChange={setStatus}
          options={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
        />
      </div>

      {status === "delivered" && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border-soft pt-3">
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            وصل المال ليدك، أو ما زال عند شركة التوصيل؟ الربح واحد في الحالتين، وما تقدر تصرفه
            مختلف.
          </p>
          <Segmented
            aria-label="مكان المال"
            value={collection}
            onChange={(next: CollectionStatus) => void patch({ collection: next })}
            options={[
              { value: "withCourier" as const, label: COLLECTION_LABELS.withCourier },
              { value: "collected" as const, label: COLLECTION_LABELS.collected },
            ]}
          />
        </div>
      )}

      {status === "returned" && (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-border-soft pt-3">
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            الأصناف رجعت إليك، فقيمة شرائها لم تُصرف ولا تُحسب خسارة. الذي خسرته فعلاً هو أجرة
            الطريق ذهاباً ورجوعاً.
          </p>
          <Field
            label="أجرة الرجوع"
            htmlFor={`return-${order.id}`}
            helper="بعض الشركات تأخذ نصف الأجرة، وبعضها لا تأخذ شيئاً."
            className="w-full max-w-[15rem]"
          >
            <Input
              id={`return-${order.id}`}
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
              value={order.returnCost ?? ""}
              onChange={(e) =>
                void patch({
                  returnCost: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                })
              }
            />
          </Field>
        </div>
      )}

      {status === "cancelled" && (
        <p className="border-t border-border-soft pt-3 text-xs leading-relaxed text-muted">
          الطلبية لم تخرج: لا محصّل ولا أجرة ولا خسارة. حصّة المندوب منها سقطت، وما اتُّفق عليه
          محفوظ في السجل كما هو.
        </p>
      )}

      {status === "returned" && (
        <p className="text-xs leading-relaxed text-muted">
          حصّة المندوب من هذه الطلبية سقطت، وما اتُّفق عليه محفوظ في السجل كما هو.
        </p>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
