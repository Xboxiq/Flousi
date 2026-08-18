import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileDock } from "./mobile-dock";
import { TopBar } from "./topbar";

/**
 * Application chrome: sidebar (desktop) + drawer and floating dock (mobile)
 * + top bar + content. The content column reserves room for the dock so the
 * last row of any screen is never trapped underneath it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <Sidebar />
      <MobileNav />
      <MobileDock />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pt-6 pb-28 md:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
