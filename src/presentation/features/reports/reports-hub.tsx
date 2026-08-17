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
import { ReportsFolderScene } from "./reports-folder-scene";
import { cn } from "@/presentation/lib/cn";

const ICONS: Record<ReportType, React.ReactNode> = {
  monthly: <CalendarBlank size={26} weight="fill" />,
  yearly: <ChartLineUp size={22} />,
  product: <Package size={22} />,
  profit: <Coins size={22} />,
  expense: <Receipt size={22} />,
};

const ORDER: ReportType[] = ["monthly", "yearly", "product", "profit", "expense"];

/**
 * Reports hub bento: exactly N cells for N report types. The featured monthly
 * report carries the screen's ONE mesh moment (SIGNATURE.md law #4); the rest
 * are deliberately quiet cards — the contrast is the aesthetic.
 */
export function ReportsHub() {
  return (
    <>
      <PageHeader title="التقارير" description="أنشئ وصدّر التقارير المالية." />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((type, i) => {
          const featured = i === 0;
          return (
            <Link
              key={type}
              href={`/reports/${type}`}
              className={cn(
                "bento-hover group block overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-card",
                featured && "sm:col-span-2",
              )}
            >
              {featured ? (
                /* the band is an OBJECT with real state (the folder of filed
                   months), replacing the old icon-on-mesh wash (R30, §1 §8) */
                <ReportsFolderScene />
              ) : (
                <div className="flex items-center justify-between p-5 pb-0">
                  <span className="text-muted">{ICONS[type]}</span>
                  <ArrowUpLeft
                    size={16}
                    weight="bold"
                    className="text-subtle opacity-0 transition-opacity duration-[var(--motion-fast)] group-hover:opacity-100"
                  />
                </div>
              )}
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
