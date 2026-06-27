import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Tajawal, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/presentation/components/theme/theme-provider";

// Arabic-first type system. IBM Plex Sans Arabic keeps the data-trust DNA in
// Arabic; Tajawal is the distinctive display face; IBM Plex Mono for figures.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ar",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-display-ar",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
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
      className={`${plexArabic.variable} ${tajawal.variable} ${plexMono.variable} h-full`}
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
