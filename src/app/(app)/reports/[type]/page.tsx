import { notFound } from "next/navigation";
import { REPORT_META, type ReportType } from "@/application/reports";
import { ReportView } from "@/presentation/features/reports/report-view";

export function generateStaticParams() {
  return Object.keys(REPORT_META).map((type) => ({ type }));
}

export default async function ReportTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!(type in REPORT_META)) notFound();
  return <ReportView type={type as ReportType} />;
}
