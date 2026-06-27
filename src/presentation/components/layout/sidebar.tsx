"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { NAV_GROUPS } from "./nav-config";
import { Logo } from "./logo";
import { useUiStore } from "@/presentation/stores/ui-store";
import { cn } from "@/presentation/lib/cn";

export function SidebarNav({
  collapsed = false,
  idPrefix = "nav",
}: {
  collapsed?: boolean;
  idPrefix?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <span className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-subtle">
              {group.label}
            </span>
          )}
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center",
                  active ? "text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`${idPrefix}-active`}
                    className="absolute inset-0 rounded-[var(--radius-md)] bg-accent-soft"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={cn("relative z-[1] flex items-center gap-3", collapsed && "gap-0")}>
                  <Icon size={20} weight={active ? "fill" : "regular"} />
                  {!collapsed && item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Desktop sidebar (lg+). */
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-e border-border bg-surface lg:flex",
        sidebarCollapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          sidebarCollapsed && "justify-center px-0",
        )}
      >
        <Logo collapsed={sidebarCollapsed} />
      </div>
      <SidebarNav collapsed={sidebarCollapsed} idPrefix="desktop" />
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
        className="m-3 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <CaretLeft
          size={16}
          className={cn("transition-transform", sidebarCollapsed && "rotate-180")}
        />
        {!sidebarCollapsed && "طيّ"}
      </button>
    </aside>
  );
}
