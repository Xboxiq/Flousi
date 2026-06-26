import { PageHeader } from "@/presentation/components/layout/page-header";
import { Card } from "@/presentation/components/ui";

export const metadata = { title: "Dashboard" };

/** Placeholder dashboard. Full KPIs, charts and feeds land in Phase 8. */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your store's profit at a glance."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Net profit", "Revenue", "Expenses", "Margin"].map((label) => (
          <Card key={label} className="p-5">
            <span className="text-sm font-medium text-muted">{label}</span>
            <div className="mt-3 h-7 w-28 rounded bg-surface-2" />
          </Card>
        ))}
      </div>
      <Card className="mt-4 flex h-72 items-center justify-center text-sm text-muted">
        Charts and recent activity arrive in Phase 8.
      </Card>
    </>
  );
}
