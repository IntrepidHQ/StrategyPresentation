// apps/studio/src/app/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SP Studio",
  description: "strategypresentation.com internal tool",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
