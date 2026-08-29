import { Suspense } from "react";
import { OrdersView } from "@/presentation/features/orders/orders-view";

export const metadata = { title: "الطلبيات" };

/**
 * The Suspense boundary exists for `useSearchParams` under `output: "export"`:
 * the trip filter lives in the URL, and a statically exported shell cannot know
 * the query at build time. The view renders its own skeleton while the store
 * loads, so no second fallback is drawn here.
 */
export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
