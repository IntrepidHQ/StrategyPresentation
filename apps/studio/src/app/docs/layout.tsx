import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../blog/blog.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.strategypresentation.com"),
  title: {
    default: "Docs — Strategy Presentation",
    template: "%s — Strategy Presentation Docs",
  },
  // Overrides the studio-wide noindex (root layout) for the public docs,
  // same as /home and /blog do for their surfaces.
  robots: "index, follow",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Blueprint brand faces, same set as the landing page and blog: Anton
          (condensed display), Instrument Serif (italic counterpoint),
          Inter (body + long-form reading). */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;600;700;800&display=swap"
      />
      {children}
    </>
  );
}
