"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { CaretUpDown, SidebarSimple } from "@phosphor-icons/react";
import { visibleNavGroups } from "./nav-config";
import { LogoMark, LogoWord } from "./logo";
import { useUiStore } from "@/presentation/stores/ui-store";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { cn } from "@/presentation/lib/cn";

/**
 * Counts the nav is allowed to carry.
 *
 * A number beside a nav label is a promise that something is WAITING there. So
 * only two entries get one, and both are things the merchant has to go and do:
 * trips still on the road or still holding his cash, and reps he owes. A count
 * that merely says how many rows a screen has is decoration, and it trains the
 * eye to stop reading the ones that mean something.
 */
function useNavCounts(): Record<string, number> {
  const orders = useDataStore((s) => s.orders);
  const settlements = useDataStore((s) => s.settlements);

  return useMemo(() => {
    const open = orders.filter(
      (o) => o.status === "pending" || (o.status === "delivered" && o.collection === "withCourier"),
    ).length;
    /* Reps who have been settled at least once are not the count — the count is
       what is still outstanding, and that lives on the settlements screen. */
    const unsettled = orders.filter(
      (o) => o.status === "delivered" && o.collection === "collected",
    ).length;
    return {
      "/orders": open,
      "/settlements": settlements.length > 0 ? 0 : unsettled > 0 ? 1 : 0,
    };
  }, [orders, settlements]);
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const access = useAccess();
  const counts = useNavCounts();
  // Filtered from the same capability the screen itself checks, so an entry can
  // never be visible while its screen refuses (gate P3/G6).
  const groups = visibleNavGroups(access);

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-2 pb-4">
      {groups.map((group) => (
        <div key={group.label} className="pt-4">
          {/* A group label is a heading for the items under it, not a kicker over
              a heading — so it is Arabic, like everything the merchant reads. */}
          {!collapsed && <span className="r-navgroup-label">{group.label}</span>}
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const count = counts[item.href] ?? 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn("r-navitem", collapsed && "justify-center")}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && count > 0 && <span className="count">{count}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/**
 * Who is holding the device, at the foot of the rail.
 *
 * The boards put identity at the bottom of the spine rather than in the top bar,
 * and the reason is structural: the top bar belongs to the SCREEN (where you are,
 * what you can do here) and the rail belongs to the PRODUCT (what exists, who you
 * are). Mixing them is what makes a header fill up with unrelated chips.
 */
function SidebarFoot({ collapsed }: { collapsed: boolean }) {
  const access = useAccess();
  const reps = useDataStore((s) => s.reps);

  const boundRep = access.repId ? reps.find((r) => r.id === access.repId) : undefined;
  const name = boundRep?.name ?? (access.isOwner ? "صاحب المحل" : access.role.name);
  const role = boundRep ? "مندوب" : access.isOwner ? "مالك المحل" : access.role.name;
  const initial = name.trim().charAt(0) || "؟";

  if (collapsed) {
    return (
      <div className="mt-auto border-t border-line p-2">
        <div
          title={`${name} · ${role}`}
          className="mx-auto grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted"
        >
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t border-line p-2">
      <Link
        href="/access"
        className="flex items-center gap-2 rounded-[var(--radius-sm)] p-2 transition-colors hover:bg-surface-2"
      >
        <span className="grid size-8 flex-none place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{name}</span>
          <span className="block truncate text-[11px] text-subtle">{role}</span>
        </span>
        <CaretUpDown size={16} className="flex-none text-subtle" />
      </Link>
    </div>
  );
}

/** Desktop sidebar (lg+). */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-e border-line bg-surface lg:flex",
        sidebarCollapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex h-[60px] flex-none items-center gap-2 border-b border-line px-4",
          sidebarCollapsed && "justify-center px-0",
        )}
      >
        <LogoMark size={sidebarCollapsed ? 18 : 20} />
        {!sidebarCollapsed && (
          <>
            <LogoWord className="text-[22px]" />
            {/* The market this account keeps its books in. It is a fact about the
                product, so it sits with the wordmark and not in a settings row. */}
            <span
              className="r-num rounded-[4px] bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] text-subtle"
              aria-label="العراق"
            >
              IQ
            </span>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="طيّ الشريط الجانبي"
              className="ms-auto grid size-7 place-items-center rounded-[var(--radius-sm)] text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <SidebarSimple size={16} />
            </button>
          </>
        )}
      </div>
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="توسيع الشريط الجانبي"
          className="mx-auto mt-2 grid size-8 place-items-center rounded-[var(--radius-sm)] text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <SidebarSimple size={16} />
        </button>
      )}
      <SidebarNav collapsed={sidebarCollapsed} />
      <SidebarFoot collapsed={sidebarCollapsed} />
    </aside>
  );
}
