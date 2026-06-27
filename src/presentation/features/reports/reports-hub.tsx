import Link from "next/link";
import {
  CalendarBlank,
  ChartLineUp,
  Package,
  Coins,
  Receipt,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { REPORT_META, type ReportType } from "@/application/reports";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Card } from "@/presentation/components/ui";

const ICONS: Record<ReportType, React.ReactNode> = {
  monthly: <CalendarBlank size={22} />,
  yearly: <ChartLineUp size={22} />,
  product: <Package size={22} />,
  profit: <Coins size={22} />,
  expense: <Receipt size={22} />,
};

const ORDER: ReportType[] = ["monthly", "yearly", "product", "profit", "expense"];

export function ReportsHub() {
  return (
    <>
      <PageHeader title="التقارير" description="أنشئ وصدّر التقارير المالية." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((type) => (
          <Link key={type} href={`/reports/${type}`} className="group">
            <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
              <div className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
                {ICONS[type]}
              </div>
              <h3 className="mt-4 text-base font-semibold text-fg">{REPORT_META[type].title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{REPORT_META[type].description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                عرض التقرير
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
