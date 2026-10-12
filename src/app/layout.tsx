import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Oswald } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/shared/ConfirmProvider";
import { SiteStateRealtimeBridge } from "@/components/shared/SiteStateRealtimeBridge";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CRICZONE — Live Turf Cricket Auctions",
    template: "%s · CRICZONE",
  },
  description:
    "CRICZONE — real-time, multi-tenant turf cricket tournament auction platform.",
  applicationName: "CRICZONE",
  authors: [{ name: "Arfat Momin" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "CRICZONE — Live Turf Cricket Auctions",
    description:
      "Run and watch turf cricket auctions in real time. Premium. Fast. Reliable.",
    type: "website",
    siteName: "CRICZONE",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B4332",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${oswald.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ConfirmProvider>
          <SiteStateRealtimeBridge />
          {children}
        </ConfirmProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}