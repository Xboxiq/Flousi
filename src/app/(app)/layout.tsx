import { AppShell } from "@/presentation/components/layout/app-shell";
import { DataBootstrap } from "@/presentation/components/data-bootstrap";

/** Wraps all authenticated app pages in the Flousi shell (sidebar + top bar). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DataBootstrap />
      <AppShell>{children}</AppShell>
    </>
  );
}
