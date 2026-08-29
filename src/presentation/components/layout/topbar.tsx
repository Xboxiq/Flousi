"use client";

import Link from "next/link";
import { List, MagnifyingGlass, Plus, CalendarBlank } from "@phosphor-icons/react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/presentation/components/theme/theme-toggle";
import { RoleMarker } from "./role-marker";
import { Button } from "@/presentation/components/ui";
import { useUiStore } from "@/presentation/stores/ui-store";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";

export function TopBar() {
  const { setMobileNavOpen, setCommandOpen } = useUiStore();
  const periods = useDataStore((s) => s.periods);
  const access = useAccess();
  const activePeriod = periods.find((p) => p.status === "open");

  return (
    <header className="vibrancy sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-soft px-4 md:px-6">
      {/* Mobile: hamburger + logo */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="فتح القائمة"
        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
      >
        <List size={20} />
      </button>
      <div className="lg:hidden">
        <Logo collapsed />
      </div>

      {/* Period switcher — a link to a screen this role may not open would be a
          refusal one tap away, so it becomes plain text instead of a dead door. */}
      {access.can("closePeriods") ? (
      <Link
        href="/periods"
        className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 sm:inline-flex"
      >
        <CalendarBlank size={16} className="text-muted" />
        {activePeriod?.label ?? "لا توجد فترة مفتوحة"}
      </Link>
      ) : (
        <span className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-muted sm:inline-flex">
          <CalendarBlank size={16} className="text-subtle" />
          {activePeriod?.label ?? "لا توجد فترة مفتوحة"}
        </span>
      )}

      {/* Search → command palette */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="relative ms-auto hidden h-9 w-full max-w-xs items-center gap-2 rounded-full border border-border bg-bg ps-3 pe-2 text-sm text-subtle transition-colors hover:bg-surface-2 md:flex"
      >
        <MagnifyingGlass size={16} />
        <span>ابحث أو انتقل…</span>
        <kbd className="ms-auto rounded-md border border-border bg-surface px-1.5 py-0.5 font-figure text-[11px]">
          ⌘K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1 md:ms-3">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="فتح لوحة الأوامر"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg md:hidden"
        >
          <MagnifyingGlass size={18} />
        </button>
        {/* Silent on the owner's session; present on every screen of a limited one. */}
        <RoleMarker />
        <ThemeToggle />
        {/* «إضافة منتج» is the shell's one permanent verb, so it disappears for a role
            that would only be refused at the other end of it. */}
        {access.can("manageProducts") && (
          <Button asChild size="sm" leadingIcon={<Plus size={16} weight="bold" />} className="ms-1">
            <Link href="/products/new">إضافة منتج</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
