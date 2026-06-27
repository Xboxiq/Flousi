import { AppShell } from "@/presentation/components/layout/app-shell";
import { DataBootstrap } from "@/presentation/components/data-bootstrap";
import { CommandPalette } from "@/presentation/components/command-palette";
import { LocaleSync } from "@/presentation/components/locale-sync";

/** Wraps all authenticated app pages in the Flousi shell (sidebar + top bar). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DataBootstrap />
      <LocaleSync />
      <CommandPalette />
      <AppShell>{children}</AppShell>
    </>
  );
}
