"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Package, Calculator, ChartBar, DotsThree } from "@phosphor-icons/react";
import { useUiStore } from "@/presentation/stores/ui-store";
import { cn } from "@/presentation/lib/cn";

const ITEMS = [
  { label: "الرئيسية", href: "/dashboard", icon: House },
  { label: "المنتجات", href: "/products", icon: Package },
  { label: "الحاسبة", href: "/calculator", icon: Calculator },
  { label: "التقارير", href: "/reports", icon: ChartBar },
] as const;

/**
 * A floating dock for phones (from the client's feedback: the raised pill nav).
 *
 * A lifted rail where the active destination sits in its own raised capsule —
 * the selection is a physical position, not a colour swap. Reaches the four
 * daily destinations; everything else opens the full drawer through the last
 * key. Hidden from `lg` up, where the sidebar already does this job.
 */
export function MobileDock() {
  const pathname = usePathname();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <nav
      aria-label="التنقّل السريع"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="dock pointer-events-auto flex items-center gap-1 p-1.5">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5",
                "transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                active ? "dock-active text-accent" : "text-muted",
              )}
            >
              <Icon size={20} weight={active ? "fill" : "regular"} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="كل الأقسام"
          className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 text-muted"
        >
          <DotsThree size={20} weight="bold" />
          <span className="text-[10px] font-medium">المزيد</span>
        </button>
      </div>
    </nav>
  );
}
