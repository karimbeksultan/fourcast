import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Fourcast: know tonight if tomorrow's payment will clear",
  description:
    "Fourcast finds the Klarna, Afterpay and Affirm payments that won't make it before your paycheck lands, and tells you what to do the night before.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
