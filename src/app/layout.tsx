import type { Metadata, Viewport } from "next";
import { Cairo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/presentation/components/theme/theme-provider";

/**
 * Type system (grounded in the reference screens — Apple SF Pro / Linear / Stripe):
 * Cairo is a precise geometric Arabic+Latin grotesk (the closest open equivalent
 * to SF Pro Arabic) used for every UI and display weight. IBM Plex Mono carries
 * the financial figures with tabular precision. Deliberately NOT a rounded/bubbly
 * display face — restraint is what reads as senior, not playfulness.
 */
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: {
    default: "فلوسي · صافي أرباح متجرك بدقّة",
    template: "%s · فلوسي",
  },
  description:
    "فلوسي يحسب صافي ربح كل منتج تبيعه: الإيراد والتكاليف والهامش ونقطة التعادل والعائد، في لوحة واحدة أنيقة.",
  applicationName: "Flousi",
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
    title: "فلوسي",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
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
      className={`${cairo.variable} ${plexMono.variable} h-full`}
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
