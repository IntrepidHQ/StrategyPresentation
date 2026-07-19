import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SP Studio",
  description: "Strategy Presentation Studio",
  icons: {
    // Explicit `apple` entry: an `icons` metadata object opts OUT of Next's
    // automatic file-convention merging for any field it doesn't list, so
    // apple-icon.png silently drops from <head> unless named here. `icon`
    // stays just the SVG — Next still auto-adds favicon.ico's own <link>
    // for browsers/crawlers that only look for that file by convention.
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
