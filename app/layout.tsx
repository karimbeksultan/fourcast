import type { Metadata } from "next";
import localFont from "next/font/local";
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
    "All your Klarna, Afterpay and Affirm payments on one 6-week timeline from your paycheck, and a yes or no before you buy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
