"use client";

import { useEffect } from "react";
import { useDataStore } from "@/presentation/stores/data-store";

/** Initializes the local-first data store (seeds on first run). Renders nothing. */
export function DataBootstrap() {
  const init = useDataStore((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);
  return null;
}
