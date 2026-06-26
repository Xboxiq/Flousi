import type { Icon } from "@phosphor-icons/react";
import {
  House,
  Package,
  Calculator,
  Receipt,
  CalendarCheck,
  ChartBar,
  Gear,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Primary navigation, grouped per docs/IA-UX.md. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: House }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Calculator", href: "/calculator", icon: Calculator },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Periods", href: "/periods", icon: CalendarCheck },
      { label: "Reports", href: "/reports", icon: ChartBar },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Gear }],
  },
];
