import { AppShell } from "@/presentation/components/layout/app-shell";
import { DataBootstrap } from "@/presentation/components/data-bootstrap";
import { CommandPalette } from "@/presentation/components/command-palette";
import { LocaleSync } from "@/presentation/components/locale-sync";
import { RouteGuard } from "@/presentation/components/layout/route-guard";

/** Wraps all authenticated app pages in the RITM shell (sidebar + top bar). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DataBootstrap />
      <LocaleSync />
      <CommandPalette />
      {/* Every app route passes the guard: enforcement lives in ONE place rather
          than as a check each screen has to remember (gate P3/G5). */}
      <AppShell>
        <RouteGuard>{children}</RouteGuard>
      </AppShell>
    </>
  );
}
