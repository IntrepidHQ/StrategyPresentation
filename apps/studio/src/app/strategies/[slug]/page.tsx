import { notFound } from "next/navigation";
import { getStrategyBySlug } from "@/lib/db";
import { isLive } from "@/lib/lifecycle";

// Cache the rendered HTML for 60s. Edits in the studio will be visible
// shortly after publish; intermediate caching reduces Supabase pressure.
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StrategySubdomainPage({ params }: Props) {
  const { slug } = await params;
  const strategy = await getStrategyBySlug(slug);

  if (!strategy || !strategy.current_html || !isLive(strategy.status)) {
    notFound();
  }

  // Bypass Next.js body wrapping by returning the raw document via
  // dangerouslySetInnerHTML on a stripped-down element. The HTML already
  // contains its own <!DOCTYPE>, <html>, <head>, <body>; we render it as-is.
  return (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: strategy.current_html }}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const strategy = await getStrategyBySlug(slug);
  if (!strategy) return { title: "Strategy" };
  return {
    title: `${strategy.client_name} — Strategy`,
    robots: { index: false, follow: false },
  };
}
