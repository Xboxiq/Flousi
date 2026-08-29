import type { Metadata, Viewport } from "next";
import { Tajawal, Archivo } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/presentation/components/theme/theme-provider";

/**
 * The identity's own pairing. Tajawal carries every Arabic word and the Latin that
 * sits inside an Arabic sentence; Archivo carries standalone Latin and, with
 * tabular figures, every number in the product.
 *
 * Archivo replaces IBM Plex Mono for figures deliberately: a monospace face is not
 * what makes a column of money line up — `font-variant-numeric: tabular-nums` is,
 * and Archivo has it. Plex Mono also carries no Arabic at all, which cost this
 * project three separate bugs where a header fell back glyph by glyph.
 *
 * Tajawal and Archivo stand in for the commercial Tajawal Next and Neue Montreal
 * until those are licensed; swapping them is a change to this block alone.
 */
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
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
      className={`${tajawal.variable} ${archivo.variable} h-full`}
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
