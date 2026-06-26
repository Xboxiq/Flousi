"use client";

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

export function ProfitAreaChart({ data, currency, locale }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            }}
            labelStyle={{ color: "var(--muted)" }}
            formatter={(value, name) => [
              formatCurrency(Number(value), { currency, locale }),
              name === "revenue" ? "Revenue" : "Net profit",
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            stroke="var(--success)"
            strokeWidth={2}
            fill="url(#profitFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
