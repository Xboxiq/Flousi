import Link from "next/link";
import { Plus, Calculator, ChartBar, CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/presentation/components/ui";

/** Every verb here goes somewhere that exists — no action is decoration. */
const SIBLINGS = [
  { href: "/calculator", label: "حاسبة سريعة", icon: Calculator },
  { href: "/reports", label: "التقارير", icon: ChartBar },
  { href: "/periods", label: "الفترات", icon: CalendarCheck },
] as const;

/**
 * The page's verbs (RECIPES R42, fifth feedback batch): ONE labelled primary in
 * the accent material beside icon-only siblings in graphite, all the same height.
 *
 * The reference wallets put a wide "Add Money" pill next to three dark icon keys —
 * the hierarchy is carried by the material and the label, not by size. Each
 * icon-only key names itself for assistive tech and on hover, because an icon
 * alone is a label for the eye only.
 */
export function QuickActions() {
  return (
    <div className="flex items-center gap-2.5">
      <Button asChild className="flex-1 sm:flex-none" leadingIcon={<Plus size={17} weight="bold" />}>
        <Link href="/products/new">إضافة منتج</Link>
      </Button>
      {SIBLINGS.map((s) => {
        const Icon = s.icon;
        return (
          <Button
            key={s.href}
            asChild
            variant="graphite"
            size="icon"
            aria-label={s.label}
            title={s.label}
          >
            <Link href={s.href}>
              <Icon size={19} />
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
