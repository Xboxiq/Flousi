"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Package, Calculator, ChartBar, Plus } from "@phosphor-icons/react";
import type { Capability } from "@/domain";
import { useAccess } from "@/presentation/hooks/use-access";
import { cn } from "@/presentation/lib/cn";

const ITEMS: { label: string; href: string; icon: typeof House; needs?: Capability }[] = [
  { label: "الرئيسية", href: "/dashboard", icon: House, needs: "viewCosts" },
  { label: "المنتجات", href: "/products", icon: Package, needs: "viewProducts" },
  { label: "الحاسبة", href: "/calculator", icon: Calculator, needs: "viewCosts" },
  { label: "التقارير", href: "/reports", icon: ChartBar, needs: "viewReports" },
];

/**
 * A floating dock for phones (from the client's feedback: the raised pill nav).
 *
 * A lifted rail where the active destination sits in its own raised capsule —
 * the selection is a physical position, not a colour swap.
 *
 * Only the active key wears its label (RECIPES R44): it shows a FILLED icon and
 * the name inside the capsule, while the others are outline icons with the name
 * kept for assistive tech. Outline ⇄ filled is the whole state grammar — never a
 * different icon. At the rail's end sits the one verb worth a permanent button,
 * as a raised accent circle (R45). The active key is INK, not accent: with a
 * coloured primary on the same rail, two accents compete and neither points
 * (§6 — one spot deserves the colour). Being here is said by the seated capsule.
 *
 * The drawer is NOT repeated here: the topbar's own key already opens it, and
 * the duplicate cost the rail its fit next to the primary at 320px.
 *
 * Hidden from `lg` up, where the sidebar already does this job.
 */
export function MobileDock() {
  const pathname = usePathname();
  const access = useAccess();
  const items = ITEMS.filter((item) => !item.needs || access.can(item.needs));

  return (
    <nav
      aria-label="التنقّل السريع"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="dock flex items-center gap-1 p-1.5">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-full",
                  "transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                  active ? "dock-active min-w-11 px-3 text-fg" : "min-w-10 px-1.5 text-muted",
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} />
                {active ? (
                  <span className="text-[12px] font-bold">{item.label}</span>
                ) : (
                  <span className="sr-only">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
        {/* the one verb worth a permanent button: raised, round, accent (R45) */}
        <Link
          href="/products/new"
          aria-label="إضافة منتج"
          title="إضافة منتج"
          className="molded molded-accent flex size-13 items-center justify-center rounded-full text-accent-fg"
        >
          <Plus size={23} weight="bold" />
        </Link>
      </div>
    </nav>
  );
}
