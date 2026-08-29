import { cn } from "@/presentation/lib/cn";

/**
 * The RITM mark, redrawn from the client's original artwork by measurement:
 * four bars of ONE width at ONE pitch, at four heights. The supplied files were
 * SVG wrappers around embedded PNGs, so every number below comes from measuring
 * that bitmap and normalising it — bar 12.5px at pitch 19.7px in a 71px mark
 * gives width/pitch = 0.635, which is 4.2 at pitch 6.6 here.
 *
 * The heights are the rhythm: 32 / 29 / 26 / 14. Three bars step down by a
 * beat and the fourth drops, so the eye reads a measure, not a chart.
 *
 * It draws in `currentColor` at whatever size it is given — no tile, no plate,
 * no rounded square. The old mark was a tick inside an accent tile, which is
 * the single most common shape in the category.
 */
const MARK_VIEWBOX_W = 24;
const MARK_VIEWBOX_H = 39;

/** x, y, height. One width (4.2) and one pitch (6.6) for all four. */
const BARS: readonly [number, number, number][] = [
  [0, 7, 32],
  [6.6, 3.5, 29],
  [13.2, 0, 26],
  [19.8, 5.5, 14],
];

export function LogoMark({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      /* Width is the given size; height is derived, so the mark can never be
         squashed by a caller passing a square box. */
      width={size}
      height={Math.round((size * MARK_VIEWBOX_H) / MARK_VIEWBOX_W)}
      viewBox={`0 0 ${MARK_VIEWBOX_W} ${MARK_VIEWBOX_H}`}
      fill="currentColor"
      className={cn("shrink-0 text-accent", className)}
      aria-hidden
    >
      {BARS.map(([x, y, h]) => (
        <rect key={x} x={x} y={y} width={4.2} height={h} rx={2.1} />
      ))}
    </svg>
  );
}

/**
 * The wordmark is «رِتم» — the product's actual name, in the product's actual
 * language. The Latin "RITM" stays available for Latin contexts only; on an
 * Arabic surface it was a transliteration of a name nobody reads in Latin.
 */
export function LogoWord({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-bold leading-none tracking-normal text-fg", className)}>
      رِتم
    </span>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && <LogoWord />}
    </div>
  );
}
