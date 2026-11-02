import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Backdrop } from "@/components/Backdrop";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PrivacyRibbon } from "@/components/PrivacyRibbon";
import { COUNTS } from "@/lib/calculators/data";
import { buildSearchIndex } from "@/lib/search-index";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "thedigitalwit: free ad KPI calculators and media tools",
    template: "%s · thedigitalwit",
  },
  description:
    `${COUNTS.total} free KPI calculators for media buyers and publishers, plus media mix modelling, GTM planning, creative specs and a 50-format Creative Studio. No login needed.`,
  openGraph: { type: "website", siteName: "thedigitalwit", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only z-[60] bg-red px-4 py-2 font-display font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Backdrop />
        <AuthProvider>
          <Header searchIndex={buildSearchIndex()} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <PrivacyRibbon />
      </body>
    </html>
  );
}
