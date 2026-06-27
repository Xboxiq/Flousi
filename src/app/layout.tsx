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

export const metadata: Metadata = {
  title: {
    default: "فلوسي — صافي أرباح متجرك بدقّة",
    template: "%s · فلوسي",
  },
  description:
    "فلوسي يحسب صافي ربح كل منتج تبيعه: الإيراد والتكاليف والهامش ونقطة التعادل والعائد، في لوحة واحدة أنيقة.",
  applicationName: "Flousi",
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
