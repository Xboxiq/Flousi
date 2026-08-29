"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, MagnifyingGlass, CalendarBlank, CaretLeft } from "@phosphor-icons/react";
import { LogoMark } from "./logo";
import { NAV_GROUPS } from "./nav-config";
import { usePageChrome } from "./page-chrome";
import { ThemeToggle } from "@/presentation/components/theme/theme-toggle";
import { RoleMarker } from "./role-marker";
import { useUiStore } from "@/presentation/stores/ui-store";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";

/** The nav group a route belongs to — the first crumb, when a screen names none. */
function sectionForPath(pathname: string): string | undefined {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) return group.label;
    }
  }
  return undefined;
}

/**
 * The top bar carries the SCREEN: where you are, and what you can do here.
 *
 * It deliberately carries nothing about the product or the person — those live at
 * the two ends of the rail (the wordmark at its head, the user at its foot). That
 * split is the reason the bar stays one line at 60px on every screen instead of
 * filling with chips that belong somewhere else.
 */
export function TopBar() {
  const pathname = usePathname();
  const chrome = usePageChrome();
  const { setMobileNavOpen, setCommandOpen } = useUiStore();
  const periods = useDataStore((s) => s.periods);
  const access = useAccess();
  const activePeriod = periods.find((p) => p.status === "open");

  const section = chrome?.section ?? sectionForPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] flex-none items-center gap-3 border-b border-line bg-bg px-4 md:px-6">
      {/* Mobile: the drawer key and the mark, which is the whole brand at 390px */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="فتح القائمة"
        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
      >
        <List size={20} />
      </button>
      <span className="lg:hidden">
        <LogoMark size={16} />
      </span>

      {/* Where you are.
          Hidden below `sm` on purpose: at 390px the bar is the drawer key, the
          mark and the screen's own verb, and a crumb squeezed between them
          truncates to a single letter — which tells the merchant less than the
          bottom bar already does by lighting the tab he is standing on. */}
      <nav aria-label="مسار التنقّل" className="r-crumbs hidden min-w-0 sm:flex">
        {section && (
          <>
            <span className="hidden sm:inline">{section}</span>
            <CaretLeft size={11} className="sep hidden shrink-0 rotate-180 sm:inline" />
          </>
        )}
        <span aria-current="page" className="truncate">
          {chrome?.title ?? ""}
        </span>
      </nav>

      <div className="ms-auto flex min-w-0 shrink items-center gap-2">
        {/* The screen's own actions. One primary among them, never two. */}
        {chrome?.actions}

        {/* The accounting period everything on screen is measured inside. A link
            to a screen this role may not open would be a refusal one tap away,
            so for that role it becomes plain text rather than a dead door. */}
        {activePeriod &&
          (access.can("closePeriods") ? (
            <Link
              href="/periods"
              className="hidden h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2 md:inline-flex"
            >
              <CalendarBlank size={15} className="text-subtle" />
              <span className="r-num">{activePeriod.label}</span>
            </Link>
          ) : (
            <span className="hidden h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3 text-sm font-medium text-muted md:inline-flex">
              <CalendarBlank size={15} className="text-subtle" />
              <span className="r-num">{activePeriod.label}</span>
            </span>
          ))}

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="ابحث أو انتقل"
          title="ابحث أو انتقل · ⌘K"
          className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <MagnifyingGlass size={18} />
        </button>
        {/* Silent on the owner's session; present on every screen of a limited one. */}
        <RoleMarker />
        <ThemeToggle />
      </div>
    </header>
  );
}
