import { Suspense } from "react";
import { LedgerView } from "@/presentation/features/ledger/ledger-view";

export const metadata = { title: "السجل" };

/**
 * The Suspense boundary exists for `useSearchParams` under `output: "export"`:
 * the screen's tab lives in the URL (P8), and a statically exported shell cannot
 * know the query at build time. The view renders its own skeleton while the store
 * loads, so no second fallback is drawn here.
 */
export default function LedgerPage() {
  return (
    <Suspense>
      <LedgerView />
    </Suspense>
  );
}
