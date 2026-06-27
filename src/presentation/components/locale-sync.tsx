"use client";

import { useEffect } from "react";
import { useDataStore } from "@/presentation/stores/data-store";

/** Keeps <html dir/lang> in sync with the chosen language (RTL Arabic by default). */
export function LocaleSync() {
  const language = useDataStore((s) => s.settings.language);
  useEffect(() => {
    const el = document.documentElement;
    el.lang = language === "en" ? "en" : "ar";
    el.dir = language === "en" ? "ltr" : "rtl";
  }, [language]);
  return null;
}
