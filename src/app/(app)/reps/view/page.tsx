"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RepDetail } from "@/presentation/features/reps/rep-detail";
import { Skeleton } from "@/presentation/components/ui";

/* `?id=` rather than `[id]`: next.config.ts sets output "export", so a dynamic
   segment would need every rep id at build time — and reps are created by the
   merchant at runtime. Same reason products/view uses a search param. */
function RepView() {
  const id = useSearchParams().get("id") ?? "";
  return <RepDetail id={id} />;
}

export default function RepViewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <RepView />
    </Suspense>
  );
}
