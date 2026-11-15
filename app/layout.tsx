import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

// Geologica from npm, so the build never depends on Google Fonts.
const sans = localFont({
  src: "../node_modules/@fontsource-variable/geologica/files/geologica-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const TITLE = "Fourcast: know tonight if tomorrow's payment will clear";
const DESCRIPTION =
  "Fourcast finds the Klarna, Afterpay and Affirm payments that won't make it before your paycheck lands, and tells you what to do the night before.";

// The link preview image comes from app/opengraph-image.tsx (Next adds og:image and twitter:image itself).
export const metadata: Metadata = {
  metadataBase: new URL("https://fourcast-zimran.vercel.app"),
  // Screens set a short name ("Tonight"); the template adds the product.
  title: { default: TITLE, template: "%s · Fourcast" },
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "Fourcast", url: "/", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// "cover" lets the page reach under the phone's home indicator; the bottom bar pads itself with
// env(safe-area-inset-bottom) in components/app-shell.tsx.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
