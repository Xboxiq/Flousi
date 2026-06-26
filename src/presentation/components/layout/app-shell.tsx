import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { TopBar } from "./topbar";

/** Application chrome: sidebar (desktop) + drawer (mobile) + top bar + content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
