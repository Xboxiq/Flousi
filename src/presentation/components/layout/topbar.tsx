"use client";

import Link from "next/link";
import { List, MagnifyingGlass, Plus, CalendarBlank } from "@phosphor-icons/react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/presentation/components/theme/theme-toggle";
import { Button } from "@/presentation/components/ui";
import { useUiStore } from "@/presentation/stores/ui-store";

export function TopBar() {
  const { setMobileNavOpen } = useUiStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
      {/* Mobile: hamburger + logo */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
      >
        <List size={20} />
      </button>
      <div className="lg:hidden">
        <Logo collapsed />
      </div>

      {/* Period switcher */}
      <button
        type="button"
        className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 sm:inline-flex"
      >
        <CalendarBlank size={16} className="text-muted" />
        June 2026
      </button>

      {/* Search */}
      <div className="relative ms-auto hidden w-full max-w-xs md:block">
        <MagnifyingGlass
          size={16}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-subtle"
        />
        <input
          type="search"
          placeholder="Search products, sales..."
          className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-bg ps-9 pe-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-focus"
        />
      </div>

      <div className="ms-auto flex items-center gap-1 md:ms-3">
        <ThemeToggle />
        <Button asChild size="sm" leadingIcon={<Plus size={16} weight="bold" />} className="ms-1">
          <Link href="/products/new">Add product</Link>
        </Button>
      </div>
    </header>
  );
}
