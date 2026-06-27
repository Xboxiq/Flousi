import Link from "next/link";
import {
  CalendarBlank,
  ChartLineUp,
  Package,
  Coins,
  Receipt,
  ArrowUpLeft,
} from "@phosphor-icons/react/dist/ssr";
import { REPORT_META, type ReportType } from "@/application/reports";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { cn } from "@/presentation/lib/cn";

const ICONS: Record<ReportType, React.ReactNode> = {
  monthly: <CalendarBlank size={26} weight="fill" />,
  yearly: <ChartLineUp size={26} weight="fill" />,
  product: <Package size={26} weight="fill" />,
  profit: <Coins size={26} weight="fill" />,
  expense: <Receipt size={26} weight="fill" />,
};

const ORDER: ReportType[] = ["monthly", "yearly", "product", "profit", "expense"];

export function ReportsHub() {
  return (
    <>
      <PageHeader title="التقارير" description="أنشئ وصدّر التقارير المالية." />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((type, i) => {
          const wide = i === 0;
          return (
            <Link
              key={type}
              href={`/reports/${type}`}
              className={cn(
                "bento-hover group block overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-sm",
                wide && "sm:col-span-2",
              )}
            >
              {/* Grainy mesh header (ref: bento use-case cards) */}
              <div
                className={cn(
                  "grainy mesh-aurora relative flex items-start justify-between p-5 text-white",
                  wide ? "h-44" : "h-32",
                )}
              >
                <span className="relative z-[2]">{ICONS[type]}</span>
                <span className="relative z-[2] flex size-9 items-center justify-center rounded-full bg-white/90 text-[#1b1c22] shadow-sm transition-transform group-hover:scale-110">
                  <ArrowUpLeft size={16} weight="bold" />
                </span>
              </div>
              {/* Body */}
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-fg">{REPORT_META[type].title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{REPORT_META[type].description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
