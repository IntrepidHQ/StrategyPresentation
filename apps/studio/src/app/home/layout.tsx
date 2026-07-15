import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./home.css";

const TITLE = "Strategy Presentation — turn any website into a boardroom-ready pitch deck";
const DESCRIPTION =
  "SP scans the public record — credibility, reputation, design, technical health — and builds an evidence-backed pitch deck in six accessible templates. Free to try.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.strategypresentation.com"),
  title: TITLE,
  description: DESCRIPTION,
  robots: "index, follow", // overrides the studio-wide noindex for the public landing
  alternates: { canonical: "https://www.strategypresentation.com/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.strategypresentation.com/",
    siteName: "Strategy Presentation",
    type: "website",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Fraunces is brand equity from the original site; system serif fallbacks
          keep the page fine if the font fails to load. */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;600;700&display=swap"
      />
      {children}
    </>
  );
}
