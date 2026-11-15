// The page itself is a client component, so its title lives here, in a server layout.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Forecast" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
