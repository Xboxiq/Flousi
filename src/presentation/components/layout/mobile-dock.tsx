"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Receipt, UsersThree, ChartBar } from "@phosphor-icons/react";
import type { Capability } from "@/domain";
import { useAccess } from "@/presentation/hooks/use-access";
import { cn } from "@/presentation/lib/cn";

/**
 * The four destinations a phone gets, and they are not the first four of the
 * sidebar: a rail is a map of the product, a tab bar is the merchant's own
 * shortlist. On the road he is checking trips and people, not editing costs.
 */
const ITEMS: { label: string; href: string; icon: typeof House; needs?: Capability }[] = [
  { label: "الرئيسية", href: "/dashboard", icon: House, needs: "viewCosts" },
  { label: "الطلبيات", href: "/orders", icon: Receipt, needs: "viewProducts" },
  { label: "الفريق", href: "/reps", icon: UsersThree, needs: "viewTeam" },
  { label: "التقارير", href: "/reports", icon: ChartBar, needs: "viewReports" },
];

/**
 * The mobile bar, and it is never the desktop sidebar folded up.
 *
 * It replaces the floating dock, for two measured reasons rather than taste. The
 * dock carried its own «إضافة منتج» circle, which was the SECOND copy of a button
 * the top bar already showed — two primaries on one screen, and the rule is one.
 * And a floating pill hovering over content has to be dodged: a bar that sits in
 * the layout ends the page where the page ends.
 *
 * Every label is drawn, on every tab. Hiding three of four behind an icon saves
 * nothing at 390px and costs a merchant who does not know what a glyph means.
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
      className="sticky bottom-0 z-40 flex h-[calc(var(--h-tabbar)+env(safe-area-inset-bottom))] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5",
              "transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              active ? "text-accent" : "text-subtle",
            )}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
