import type { Icon } from "@phosphor-icons/react";
import {
  House,
  Package,
  Calculator,
  CalendarCheck,
  ChartBar,
  UsersThree,
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
    label: "نظرة عامة",
    items: [{ label: "لوحة التحكم", href: "/dashboard", icon: House }],
  },
  {
    label: "الكتالوج",
    items: [
      { label: "المنتجات", href: "/products", icon: Package },
      { label: "الحاسبة", href: "/calculator", icon: Calculator },
    ],
  },
  {
    label: "المالية",
    items: [
      // The team lives under المالية because what it reports is money owed, not
      // a directory of people. Its own child routes (/reps/view, /reps/schemes)
      // keep this entry active, so the split rule needs no second nav row.
      { label: "الفريق", href: "/reps", icon: UsersThree },
      { label: "الفترات", href: "/periods", icon: CalendarCheck },
      { label: "التقارير", href: "/reports", icon: ChartBar },
    ],
  },
  {
    label: "النظام",
    items: [{ label: "الإعدادات", href: "/settings", icon: Gear }],
  },
];
