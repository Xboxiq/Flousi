"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * A screen's tab or filter, kept in the URL instead of in component state.
 *
 * What that buys, concretely: a reload lands on the same reading, a shared link
 * carries the filter with it, and «التسويات فقط» can live in a bookmark. The value
 * is DERIVED from the URL every render — the URL is the single owner, so there is
 * no second copy to fall out of sync (Web Interface Guidelines: URL-sync filter and
 * tab state; the P3 lesson about seeding state from async data applies here too).
 *
 * Writes use `replace`, not `push`: flipping a filter five times must not bury the
 * previous PAGE five entries deep in the back button. The default value clears its
 * key so the address stays clean at rest.
 *
 * `allowed` guards the read: a hand-edited or stale URL falls back to the default
 * rather than smuggling an arbitrary string into a type the screen trusts.
 */
export function useUrlState<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (next: T) => void] {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const raw = params.get(key);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const set = useCallback(
    (next: T) => {
      const q = new URLSearchParams(params);
      if (next === fallback) q.delete(key);
      else q.set(key, next);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router, key, fallback],
  );

  return [value, set];
}
