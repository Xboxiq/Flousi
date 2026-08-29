import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileDock } from "./mobile-dock";
import { TopBar } from "./topbar";
import { PageChromeProvider } from "./page-chrome";

/**
 * The frame: a rail on the reading edge, a bar that belongs to the screen, and
 * the content column between them.
 *
 * The rail is the PRODUCT (what exists, who you are); the bar is the SCREEN
 * (where you are, what you can do here). A screen declares its own bar contents
 * with `<PageHeader>` and the provider carries them up — which is why no screen
 * draws a title of its own and every screen starts with its first card.
 *
 * The content column is a plain flex column with no bottom padding reserved for
 * navigation: the mobile bar sits IN the layout rather than floating over it, so
 * the last row of a screen can no longer end up trapped underneath it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PageChromeProvider>
      <div className="flex min-h-[100dvh] bg-bg">
        <Sidebar />
        <MobileNav />
        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-5">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
          <MobileDock />
        </div>
      </div>
    </PageChromeProvider>
  );
}
