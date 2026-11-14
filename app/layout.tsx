import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

// Geologica from npm, so the build never depends on Google Fonts.
const sans = localFont({
  src: "../node_modules/@fontsource-variable/geologica/files/geologica-latin-wght-normal.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fourcast — See every Pay in 4 before it lands",
  description:
    "All your Klarna, Afterpay and Affirm payments on one 6-week forecast from your paycheck, and a yes or no before you buy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppNav />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-8 sm:pt-10 sm:pb-12">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 pb-24 text-xs text-muted-foreground sm:pb-6">
          Not financial advice. Your data stays in your browser.
        </footer>
      </body>
    </html>
  );
}
