"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductDetail } from "@/presentation/features/products/product-detail";
import { Skeleton } from "@/presentation/components/ui";

function ProductView() {
  const id = useSearchParams().get("id") ?? "";
  return <ProductDetail id={id} />;
}

export default function ProductViewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ProductView />
    </Suspense>
  );
}
