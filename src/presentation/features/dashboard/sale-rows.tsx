import { Package } from "@phosphor-icons/react/dist/ssr";
import { Money } from "@/presentation/components/ui";

export interface SaleRowData {
  id: string;
  productName: string;
  meta: string;
  revenue: string;
  netProfit: string;
  polarity: number;
}

/**
 * Recent sales as rows, for the width where a five-column table does not fit
 * (RECIPES R42 grammar, from the wallet reference: a tile, a name, a line of
 * meta, and the figure on the trailing edge).
 *
 * The two figures are ranked, not stacked at equal weight: net profit is the
 * reading, revenue is the context under it. Only profit carries polarity —
 * revenue is never red, because taking money is not an error (the lesson we did
 * take from a consumer wallet's neutral spend rows).
 */
export function SaleRows({ rows }: { rows: SaleRowData[] }) {
  return (
    <ul className="flex flex-col gap-2 px-4 pb-4 sm:hidden">
      {rows.map((r) => (
        <li key={r.id} className="clay-inset flex items-center gap-3 rounded-[var(--radius-lg)] p-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted shadow-xs">
            <Package size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-fg">{r.productName}</span>
            <span className="mt-0.5 block text-[11px] text-subtle">{r.meta}</span>
          </span>
          <span className="shrink-0 text-end">
            <Money polarity={r.polarity} className="block text-sm font-bold">
              {r.netProfit}
            </Money>
            <Money className="mt-0.5 block text-[11px] text-subtle">{r.revenue}</Money>
          </span>
        </li>
      ))}
    </ul>
  );
}
