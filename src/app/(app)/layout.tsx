import { AppShell } from "@/presentation/components/layout/app-shell";

/** Wraps all authenticated app pages in the Flousi shell (sidebar + top bar). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
