"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "@phosphor-icons/react";
import { CAPABILITY_LABELS } from "@/domain";
import { Button } from "@/presentation/components/ui";
import { useAccess } from "@/presentation/hooks/use-access";
import { capabilityForPath, firstAllowedHref } from "./nav-config";

/**
 * Refuses a route this session may not open, and SAYS SO (gate P3/G5).
 *
 * Not a blank page, not a silent redirect that reads as a bug, and not a crash. It
 * names the role, names what the route needs, and offers the nearest door this role
 * can actually open — because a refusal with no way forward is a dead end, and the
 * merchant on the other side of it has no support line to call.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const access = useAccess();
  const needs = capabilityForPath(pathname);

  if (!needs || access.can(needs)) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-[34rem] flex-col items-center gap-5 py-16 text-center">
      <span className="squircle size-14 text-muted" aria-hidden>
        <Lock size={24} weight="bold" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold text-fg">هذه الشاشة مغلقة في وضعك الحالي</h1>
        <p className="mt-3 leading-relaxed text-muted">
          أنت تستعرض التطبيق بدور «{access.role.name}»، وهذه الشاشة تحتاج صلاحية
          «{CAPABILITY_LABELS[needs]}».
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href={firstAllowedHref(access)}>الرجوع إلى ما يمكنك فتحه</Link>
        </Button>
        {/* The way back is only offered to a session that can actually take it: a
            limited role sees the sentence, not a button that would refuse it too. */}
        {access.can("manageAccess") && (
          <Button variant="secondary" asChild>
            <Link href="/access">الأدوار والوصول</Link>
          </Button>
        )}
      </div>
      {!access.can("manageAccess") && (
        <p className="text-sm text-subtle">
          للرجوع إلى وضع المالك، افتح «الأدوار والوصول» من جهاز المالك أو اطلب منه ذلك.
        </p>
      )}
    </div>
  );
}
