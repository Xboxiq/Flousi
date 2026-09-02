"use client";

import { cn } from "@/presentation/lib/cn";

export interface ColumnBlock {
  key: string;
  label: string;
  /** Amount in major units. */
  amount: number;
}

interface PriceColumnProps {
  /** Selling price — the line the costs are stacking toward. */
  price: number;
  /** Cost lines, largest first is not required; order is preserved bottom-up. */
  costs: ColumnBlock[];
  /** price − totalCost. Positive fills the head of the column, negative overflows it. */
  netProfit: number;
  format: (n: number) => string;
  className?: string;
}

/** Rendered column height in px — the tallest of price / total cost maps to this. */
const H = 236;
/** Slabs thinner than this carry no inline label (their value stays in the title). */
const LABEL_MIN = 24;
/** A real cost is never invisible: the thinnest a plate may be milled. */
const SLAB_MIN = 15;

/**
 * عمود السعر — RITM's focal object (replaces the rejected coin).
 *
 * Not an illustration bolted onto data: the object IS the calculation. The
 * selling price is a fixed line; every cost is a milled slab stacked toward it;
 * what remains beneath the line is profit. When costs pass the line, the excess
 * keeps stacking ABOVE it as a hatched red slab — you watch the price get
 * overrun instead of reading a minus sign.
 *
 * Physics (VISUAL-LAW): overhead light only — each slab's top edge catches a
 * bright line, its body darkens downward, and the joint under it carries the
 * occlusion seam (§3 §5). The stack sits on a contact shadow with a cast shadow
 * beneath (§3). Nothing floats, nothing is engraved, nothing is decorative:
 * every slab's height is its share of the price (§8 §11).
 */
export function PriceColumn({
  price,
  costs,
  netProfit,
  format,
  className,
}: PriceColumnProps) {
  const totalCost = costs.reduce((s, c) => s + c.amount, 0);
  const scaleMax = Math.max(price, totalCost, 1);
  const px = (amount: number) => Math.max(0, (amount / scaleMax) * H);

  const visibleCosts = costs.filter((c) => c.amount > 0);
  const overrun = netProfit < 0;
  const empty = price <= 0 && totalCost <= 0;

  return (
    <div className={cn("relative", className)} data-part="stage">
      {/* cast shadow — reports how high the stack stands */}
      <span
        aria-hidden
        data-part="cast-shadow"
        className="absolute inset-x-6 bottom-0 h-3 rounded-[50%] blur-md"
        style={{ background: "rgb(18 26 38 / 0.22)" }}
      />
      {/* contact shadow — pins it to the ground */}
      <span
        aria-hidden
        data-part="contact-shadow"
        className="absolute inset-x-12 bottom-[6px] h-1 rounded-[50%] blur-[2px]"
        style={{ background: "rgb(18 26 38 / 0.4)" }}
      />

      <div
        className="relative mx-auto flex flex-col justify-end pb-3"
        style={{ height: H + 42, perspective: "900px" }}
      >
        <div
          className="relative flex flex-col-reverse"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(7deg)" }}
        >
          {/* costs stack bottom-up */}
          {visibleCosts.map((c, i) => (
            <Slab
              key={c.key}
              height={Math.max(px(c.amount), SLAB_MIN)}
              label={c.label}
              value={format(c.amount)}
              tone="cost"
              depth={i}
              capped={false}
            />
          ))}

          {/* the head of the column: profit under the line, or the overrun above it */}
          {!empty && (
            <Slab
              height={Math.max(px(Math.abs(netProfit)), 22)}
              label={overrun ? "تجاوز التكاليف" : "صافي الربح"}
              value={format(Math.abs(netProfit))}
              tone={overrun ? "overrun" : "profit"}
              depth={visibleCosts.length}
              capped
            />
          )}

          {empty && (
            <div className="rail h-[86px] w-full rounded-[10px]">
              <p className="flex h-full items-center justify-center px-4 text-center text-xs text-subtle">
                أدخل سعر البيع لترى العمود يتكوّن.
              </p>
            </div>
          )}
        </div>

        {/* The selling price line — a fixed measurement the stack is judged
            against. Its tag sits centred: slab names run along the leading edge
            and their figures along the trailing edge, so the middle is the one
            lane that is always clear. */}
        {price > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 flex items-center justify-center"
            style={{ bottom: px(price) + (overrun ? 0 : 26) }}
          >
            <span
              aria-hidden
              className="absolute inset-x-0 h-0 border-t border-dashed border-fg/35"
            />
            <span className="relative rounded-full bg-fg px-2 py-[3px] text-[10px] font-semibold text-bg shadow-sm">
              سعر البيع
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

type Tone = "cost" | "profit" | "overrun";

function Slab({
  height,
  label,
  value,
  tone,
  depth,
  capped,
}: {
  height: number;
  label: string;
  value: string;
  tone: Tone;
  depth: number;
  capped: boolean;
}) {
  const onMetal = tone === "cost";
  return (
    <div className="relative w-full" style={{ height }} title={`${label}: ${value}`}>
      <div
        className={cn(
          "r-band",
          tone === "profit" && "is-profit",
          tone === "overrun" && "is-overrun",
          capped ? "rounded-t-[11px] rounded-b-[2px]" : "rounded-[2px]",
          depth === 0 && "rounded-b-[11px]",
        )}
      >
        {/* the overrun plate is hatched: the excess is data, not decoration (§11) */}
        {tone === "overrun" && (
          <span
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.75) 0 1px, transparent 1px 6px)",
            }}
          />
        )}
        {height >= LABEL_MIN ? (
          <div className="relative flex h-full items-center justify-between gap-2 px-3">
            <span
              className={cn(
                "truncate text-[11px] font-semibold",
                onMetal ? "text-fg/80" : "text-white/95",
              )}
            >
              {label}
            </span>
            <bdi
              dir="ltr"
              className={cn(
                "font-figure text-[11px] tabular-nums",
                onMetal ? "text-fg/65" : "text-white/90",
              )}
            >
              {value}
            </bdi>
          </div>
        ) : (
          height >= SLAB_MIN && (
            /* Too thin for the two-column line, so both parts are set tight on
               ONE line: an amount without its name is a riddle, and a name
               without its amount is not a reading (§8). */
            <div className="relative flex h-full items-center justify-between gap-1.5 px-2.5">
              <span
                className={cn(
                  "truncate text-[9px] font-semibold",
                  onMetal ? "text-fg/70" : "text-white/90",
                )}
              >
                {label}
              </span>
              <bdi
                dir="ltr"
                className={cn(
                  "font-figure text-[9px] tabular-nums",
                  onMetal ? "text-fg/60" : "text-white/85",
                )}
              >
                {value}
              </bdi>
            </div>
          )
        )}
      </div>
    </div>
  );
}
