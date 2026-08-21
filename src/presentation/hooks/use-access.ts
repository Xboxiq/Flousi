"use client";

import { useMemo } from "react";
import { AccessPolicy, type ResolvedAccess } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";

/**
 * The one place a component asks «ماذا يستطيع مستخدم هذا الجهاز الآن؟».
 *
 * Screens must not reason about roles themselves: they ask `can(...)` and read
 * `salesScope`. That keeps every rule inside `AccessPolicy` where it is tested, and
 * it means a new capability lands everywhere at once instead of only on the screens
 * somebody remembered.
 */
export function useAccess(): ResolvedAccess {
  const roles = useDataStore((s) => s.roles);
  const session = useDataStore((s) => s.session);
  return useMemo(() => AccessPolicy.resolve(roles, session), [roles, session]);
}
