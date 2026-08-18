"use client";

import type { CommissionScheme } from "@/domain";
import { Badge, Money } from "@/presentation/components/ui";
import { cn } from "@/presentation/lib/cn";

/** How many bindings a tile can show before it starts counting in text. */
const SLOTS = 6;

interface Props {
  schemes: CommissionScheme[];
  /** Active bindings pointing at each scheme, by scheme id. */
  bindings: Map<string, number>;
  /** The scheme this account falls back to. */
  defaultId?: string;
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Each tile's own resolved example, already formatted. */
  example: (scheme: CommissionScheme) => string;
  exampleLabel: string;
  count: (n: number) => string;
}

/**
 * The scheme picker as bodies on a bench.
 *
 * Selection is carried by ELEVATION, not by a hue: the chosen tile is a raised,
 * rimmed moulded body and the others are carved wells, so the accent stays with
 * the one verb on the screen (VISUAL-LAW §6a) instead of competing with it.
 *
 * The corner cluster is a reading, not decoration: each filled dot is one active
 * binding that resolves to this scheme, and beyond six slots the tile counts in
 * text rather than shrinking the dots below countability. Every tile also prints
 * its own live example, so choosing a rule means choosing a visible number.
 */
export function SchemeTiles({
  schemes,
  bindings,
  defaultId,
  selectedId,
  onSelect,
  example,
  exampleLabel,
  count,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {schemes.map((scheme) => {
        const selected = scheme.id === selectedId;
        const used = bindings.get(scheme.id) ?? 0;
        return (
          <button
            key={scheme.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(scheme.id)}
            className={cn(
              "clay-press relative flex flex-col gap-2 rounded-[var(--radius-lg)] px-4 py-3 text-start",
              selected ? "molded molded-quiet" : "clay-inset",
            )}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">{scheme.name}</span>
                <span className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[11px] text-muted">{exampleLabel}</span>
                  <Money className="text-[13px] font-bold text-fg">{example(scheme)}</Money>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                {scheme.id === defaultId && <Badge tone="accent">الافتراضي</Badge>}
                {scheme.status === "archived" && <Badge>مؤرشف</Badge>}
              </span>
            </span>

            <span className="flex items-center gap-2">
              <span className="flex items-center gap-[3px]" aria-hidden>
                {Array.from({ length: SLOTS }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "size-[5px] rounded-[2px]",
                      i < Math.min(used, SLOTS) ? "bg-fg/55" : "bg-fg/15",
                    )}
                  />
                ))}
              </span>
              <span className="text-[11px] text-subtle">
                {used === 0 ? "بلا ارتباطات" : `${count(used)} ارتباطًا`}
                {used > SLOTS ? ` (+${count(used - SLOTS)})` : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
