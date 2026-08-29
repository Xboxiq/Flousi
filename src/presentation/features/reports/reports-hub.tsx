import Link from "next/link";
import {
  CalendarBlank,
  ChartLineUp,
  Package,
  Coins,
  Receipt,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr";
import { REPORT_META, type ReportType } from "@/application/reports";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Grid, Panel, Toolbar } from "@/presentation/components/structure";

const ICONS: Record<ReportType, React.ReactNode> = {
  monthly: <CalendarBlank size={20} />,
  yearly: <ChartLineUp size={20} />,
  product: <Package size={20} />,
  profit: <Coins size={20} />,
  expense: <Receipt size={20} />,
};

const ORDER: ReportType[] = ["monthly", "yearly", "product", "profit", "expense"];

/**
 * «التقارير» — the five sheets, as a list.
 *
 * It was a bento: one featured cell twice the width carrying an illustrated band,
 * four quiet cells beside it. The featured cell was not more important than the
 * others — it was first in an array — and a grid that promotes its first item by
 * size teaches the eye a hierarchy the data does not have. Five destinations of
 * equal weight are a list, and a list is also the one shape that survives a sixth
 * report being added.
 */
export function ReportsHub() {
  return (
    <>
      <PageHeader title="التقارير" />

      <Grid>
        <Panel span={6} title="ما هو التقرير هنا" bodyClassName="flex flex-col gap-3">
          <p className="text-[13px] leading-relaxed text-muted">
            كل تقرير قراءة واحدة من البيانات نفسها التي تراها في الشاشات: لا يُحسب شيء
            جديد هنا، وإنما يُرتَّب المحسوب في جدول يُصدَّر ويُطبع.
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            التقارير تُقرأ على الفترة المفتوحة وما قبلها من فترات مغلقة، فما جُمِّد يبقى
            على ما جُمِّد عليه.
          </p>
        </Panel>

        <Panel span={6} bare>
          <Toolbar title="اختر تقريراً">
            <span className="r-spacer" />
          </Toolbar>
          <div className="flex flex-col">
            {ORDER.map((type) => (
              <Link key={type} href={`/reports/${type}`} className="r-datarow">
                <span className="flex size-9 flex-none items-center justify-center rounded-[var(--radius-sm)] bg-surface-2 text-muted">
                  {ICONS[type]}
                </span>
                <span className="tx">
                  <b>{REPORT_META[type].title}</b>
                  <span>{REPORT_META[type].description}</span>
                </span>
                <ArrowLeft size={15} className="end flex-none text-subtle" />
              </Link>
            ))}
          </div>
        </Panel>
      </Grid>
    </>
  );
}
