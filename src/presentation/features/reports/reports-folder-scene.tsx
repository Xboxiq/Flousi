"use client";

import { useMemo } from "react";
import { useDataStore } from "@/presentation/stores/data-store";
import { ReportFolder } from "@/presentation/components/objects/report-folder";

/**
 * The featured report card's scene: the store's folder of filed months (R30),
 * standing on the studio field. The sheet count is REAL — closed periods — so
 * the object says how much history the report has to draw on, and an empty
 * folder honestly shows a store with no filed months yet (§8).
 */
export function ReportsFolderScene() {
  const periods = useDataStore((s) => s.periods);
  const closedCount = useMemo(() => periods.filter((p) => p.status === "closed").length, [periods]);

  return (
    <div className="scene-field flex h-44 items-center justify-between !rounded-b-none px-7">
      <div className="stage stage-standing h-full w-40 shrink-0">
        <ReportFolder sheets={closedCount} />
      </div>
      <div className="text-end">
        <span className="block text-[13px] font-semibold text-fg/75">أشهر مؤرشفة</span>
        <bdi dir="ltr" className="mt-1 block font-figure text-[34px] leading-none font-bold tabular-nums text-fg">
          {closedCount}
        </bdi>
        <span className="mt-1 block text-[11px] text-muted">
          {closedCount === 0 ? "أغلق أول شهر ليبدأ الأرشيف" : "جاهزة للتقرير والتصدير"}
        </span>
      </div>
    </div>
  );
}
