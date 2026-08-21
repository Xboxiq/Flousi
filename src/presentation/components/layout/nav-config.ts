import type { Icon } from "@phosphor-icons/react";
import type { Capability, ResolvedAccess } from "@/domain";
import {
  House,
  Package,
  Receipt,
  Calculator,
  CalendarCheck,
  ChartBar,
  UsersThree,
  Target,
  HandCoins,
  ClockCounterClockwise,
  IdentificationBadge,
  Gear,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
  /**
   * The capability that opens this entry. Absent = always visible.
   *
   * The nav is filtered from the SAME capability the screen itself checks, so an
   * entry can never be visible while its screen refuses (gate P3/G6).
   */
  needs?: Capability;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Primary navigation, grouped per docs/IA-UX.md. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "نظرة عامة",
    items: [{ label: "لوحة التحكم", href: "/dashboard", icon: House, needs: "viewCosts" }],
  },
  {
    label: "الكتالوج",
    items: [
      { label: "المنتجات", href: "/products", icon: Package, needs: "viewProducts" },
      { label: "الطلبيات", href: "/orders", icon: Receipt, needs: "viewProducts" },
      { label: "الحاسبة", href: "/calculator", icon: Calculator, needs: "viewCosts" },
    ],
  },
  {
    label: "المالية",
    items: [
      // The team lives under المالية because what it reports is money owed, not
      // a directory of people. Its own child routes (/reps/view, /reps/schemes)
      // keep this entry active, so the split rule needs no second nav row.
      { label: "الفريق", href: "/reps", icon: UsersThree, needs: "viewTeam" },
      // «كم استهدف» · «منو دفع» · «شنو صار» — the three questions P2 answered.
      { label: "الأهداف", href: "/targets", icon: Target, needs: "viewTargets" },
      { label: "التسويات", href: "/settlements", icon: HandCoins, needs: "viewLedger" },
      { label: "السجل", href: "/ledger", icon: ClockCounterClockwise, needs: "viewLedger" },
      { label: "الفترات", href: "/periods", icon: CalendarCheck, needs: "closePeriods" },
      { label: "التقارير", href: "/reports", icon: ChartBar, needs: "viewReports" },
    ],
  },
  {
    label: "النظام",
    items: [
      { label: "الأدوار والوصول", href: "/access", icon: IdentificationBadge, needs: "manageAccess" },
      { label: "الإعدادات", href: "/settings", icon: Gear, needs: "manageSettings" },
    ],
  },
];

/**
 * The groups this session may actually open.
 *
 * A group whose every item was filtered out is DROPPED rather than rendered as an
 * empty heading — a lone «النظام» with nothing under it reads as a broken build.
 */
export function visibleNavGroups(access: Pick<ResolvedAccess, "can">): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.needs || access.can(item.needs)),
  })).filter((group) => group.items.length > 0);
}

/** Every route the nav knows, with what it needs — the route guard reads this. */
export const ROUTE_CAPABILITIES: { prefix: string; needs: Capability }[] = [
  { prefix: "/dashboard", needs: "viewCosts" },
  // Opening the catalogue is `viewProducts`; the create and edit surfaces inside it
  // check `manageProducts` for themselves.
  { prefix: "/orders", needs: "viewProducts" },
  { prefix: "/products/new", needs: "manageProducts" },
  { prefix: "/products", needs: "viewProducts" },
  { prefix: "/calculator", needs: "viewCosts" },
  { prefix: "/reps", needs: "viewTeam" },
  { prefix: "/targets", needs: "viewTargets" },
  { prefix: "/settlements", needs: "viewLedger" },
  { prefix: "/ledger", needs: "viewLedger" },
  { prefix: "/periods", needs: "closePeriods" },
  { prefix: "/reports", needs: "viewReports" },
  { prefix: "/access", needs: "manageAccess" },
  { prefix: "/settings", needs: "manageSettings" },
];

/** The capability a path needs, or undefined when anyone may open it. */
export function capabilityForPath(pathname: string): Capability | undefined {
  return ROUTE_CAPABILITIES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  )?.needs;
}

/** The first entry this session can open — where a refusal sends them. */
export function firstAllowedHref(access: Pick<ResolvedAccess, "can">): string {
  const groups = visibleNavGroups(access);
  return groups[0]?.items[0]?.href ?? "/dashboard";
}
