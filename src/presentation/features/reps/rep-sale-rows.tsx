"use client";

import { Money } from "@/presentation/components/ui";

export interface RepSaleRowData {
  id: string;
  productName: string;
  meta: string;
  netProfit: string;
  polarity: number;
  repShare: string;
  /** The frozen rule no longer matches today's resolution. A state, not a style. */
  stale: boolean;
  staleHint?: string;
}

/**
 * His ledger as rows, for the width where a six-column table clips (the phone
 * lesson from d1d): the product leads, the sale's profit carries the polarity,
 * and his share sits under it as the reading the row exists for.
 */
export function RepSaleRows({ rows }: { rows: RepSaleRowData[] }) {
  return (
    <ul className="flex flex-col gap-2 px-4 pb-4 sm:hidden">
      {rows.map((r) => (
        <li
          key={r.id}
          className="clay-inset flex items-center gap-3 rounded-[var(--radius-lg)] p-3"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-fg">{r.productName}</span>
            <span className="mt-0.5 block text-[11px] text-subtle">{r.meta}</span>
            {r.stale && (
              <span className="mt-1 block text-[11px] text-muted" title={r.staleHint}>
                جُمّدت على قاعدة سابقة
              </span>
            )}
          </span>
          <span className="shrink-0 text-end">
            <Money className="block text-sm font-bold text-fg">{r.repShare}</Money>
            <Money polarity={r.polarity} className="mt-0.5 block text-[11px]">
              {r.netProfit}
            </Money>
          </span>
        </li>
      ))}
      {rows.length === 0 && (
        <li className="py-6 text-center text-sm text-muted">لا توجد عمليات منسوبة له بعد.</li>
      )}
    </ul>
  );
}
