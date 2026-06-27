"use client";

import { create } from "zustand";

interface UiState {
  /** Desktop: collapse the sidebar to an icon rail. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  /** Mobile: drawer open state. */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  /** Command palette (⌘K). */
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
}));
