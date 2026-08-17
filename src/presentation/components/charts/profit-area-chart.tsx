"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/presentation/lib/format";
import type { MonthlyPoint } from "@/application/analytics";

interface Props {
  data: MonthlyPoint[];
  currency: string;
  locale: string;
}

/**
 * Revenue / net-profit trend. Chart law (MASTER §5/§7): data being read does
 * not move — one mount-only reveal (350ms ease-out, 80ms series stagger),
 * disabled on data/filter re-renders and under prefers-reduced-motion.
 */
export function ProfitAreaChart({ data, currency, locale }: Props) {
  const reduce = useReducedMotion();
  const [animate, setAnimate] = useState(!reduce);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      // Any later data change re-renders without motion.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time flip after mount reveal
      setAnimate(false);
      return;
    }
    mounted.current = true;
    const t = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* RTL: the value axis sits on the trailing-start edge Arabic readers
            scan first — orientation="right" (SVG coords ignore dir). */}
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--subtle)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            orientation="right"
            tick={{ fill: "var(--subtle)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => formatCurrencyCompact(v, { currency, locale })}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--fg)",
              fontVariantNumeric: "tabular-nums",
            }}
            labelStyle={{ color: "var(--muted)" }}
            formatter={(value, name) => [
              formatCurrency(Number(value), { currency, locale }),
              name === "revenue" ? "الإيراد" : "صافي الربح",
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            isAnimationActive={animate}
            animationDuration={350}
            animationBegin={0}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            stroke="var(--success)"
            strokeWidth={2}
            fill="url(#profitFill)"
            isAnimationActive={animate}
            animationDuration={350}
            animationBegin={80}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
