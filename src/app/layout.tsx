import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic, IBM_Plex_Sans_Arabic, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/presentation/components/theme/theme-provider";

/**
 * Three roles, two skeletons, one voice.
 *
 * The pairing before this was Tajawal for everything and Archivo for figures, and the
 * client's verdict on it was «خطوط مخزية». The measurement agreed: Tajawal is the face
 * every Arabic template ships, it has almost no vertical drama, and at 10-11px — which
 * this product uses for labels and captions — its counters close up. A screen set
 * entirely in it has one texture, so nothing on it can be more important than anything
 * else by voice alone.
 *
 * What replaced it is the oldest working pairing in Arabic typography, not an invention:
 * KUFI for what is built and NASKH for what is read.
 *
 *   --font-display  Noto Kufi Arabic   titles, the wordmark, table heads, eyebrows.
 *                   Geometric, flat-based, architectural — the same construction as the
 *                   four-bar mark, which is why it belongs to THIS product rather than
 *                   to any product. Weights 100-900, so the ladder is real and not
 *                   synthesised. Reem Kufi was tried first and rejected on sight: it is
 *                   a display Kufi and its joins come apart below ~16px, which is most
 *                   of this app.
 *
 *   --font-sans     IBM Plex Sans Arabic   every word that is read rather than scanned.
 *                   Drawn for interfaces: open counters that survive 11px, seven real
 *                   weights, and a Latin companion cut from the same skeleton — so a
 *                   Latin word inside an Arabic sentence no longer switches design
 *                   mid-line, which it did on every screen with a product code in it.
 *
 *   --font-figure   IBM Plex Sans   standalone Latin and every number in the product.
 *                   The same superfamily as the text face, so the whole product is one
 *                   design plus one deliberate voice. It carries `tabular-nums`, which
 *                   is what actually makes a column of money line up — a monospace face
 *                   is not, and a Latin-only mono carries no Arabic at all, which cost
 *                   this project three separate glyph-fallback bugs.
 *
 * Swapping any of the three is a change to this block and to the three tokens in
 * globals.css, nowhere else.
 */
const kufi = Noto_Kufi_Arabic({
  variable: "--font-kufi",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: {
    default: "رِتم · صافي أرباح متجرك بدقّة",
    template: "%s · رِتم",
  },
  description:
    "رِتم يحسب صافي ربح كل منتج تبيعه: الإيراد والتكاليف والهامش ونقطة التعادل والعائد، في لوحة واحدة أنيقة.",
  applicationName: "RITM",
  /* Installable (P8): the merchant opens this daily on a phone, so it installs to
     the home screen like an app. ROOT paths with the base path baked in — a
     relative "./manifest.webmanifest" resolves against the PAGE, so on /dashboard/
     it pointed at /dashboard/manifest.webmanifest, a 404. Next does not apply
     basePath to metadata URLs, so it is prefixed here explicitly. Inside the
     manifest itself the paths stay relative: they resolve against the manifest's
     own URL, which is the correct base for both deployments. */
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" }],
    apple: [{ url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "رِتم",
  },
};

export const viewport: Viewport = {
  /* The browser chrome paints the app's own ground: paper in light, coal in
     dark. These two values are `--bg` from globals.css and must move with it —
     a themeColor that lags the ground shows as a seam above the header. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e11" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${kufi.variable} ${plexArabic.variable} ${plex.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
