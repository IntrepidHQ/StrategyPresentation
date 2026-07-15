// ============================================================
//  SP Deck Engine — Generative cover artwork
//  apps/studio/src/lib/deck/art.ts
//
//  particleConstellation(seed) → inline SVG: a particle-brain
//  point cloud with near-neighbor threads, in the family of the
//  Brainztem landing art. Deterministic per seed (the client's
//  domain), so a client's deck art is unique but stable across
//  re-renders. Pure SVG, no scripts — safe inside the deck's
//  no-external-requests contract. Colors ride on currentColor /
//  var(--accent), so each template tints it natively.
// ============================================================

/** mulberry32 — tiny seeded PRNG; deterministic art per domain. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Pt = { x: number; y: number; r: number; tier: 0 | 1 | 2 };

/** Particles arranged as two overlapping lobes — a soft brain silhouette,
 *  denser at the core, sparse at the rim. */
function scatter(rand: () => number, count: number, w: number, h: number): Pt[] {
  const lobes = [
    { cx: w * 0.38, cy: h * 0.46, rx: w * 0.3, ry: h * 0.34 },
    { cx: w * 0.62, cy: h * 0.52, rx: w * 0.32, ry: h * 0.36 },
  ];
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const lobe = lobes[i % 2];
    // Bias toward the core: average two uniforms → triangular distribution.
    const ang = rand() * Math.PI * 2;
    const rad = (rand() + rand()) / 2;
    const x = lobe.cx + Math.cos(ang) * lobe.rx * rad;
    const y = lobe.cy + Math.sin(ang) * lobe.ry * rad;
    const tier = (rad < 0.45 ? 2 : rad < 0.8 ? 1 : 0) as 0 | 1 | 2;
    pts.push({ x, y, r: tier === 2 ? 2.6 : tier === 1 ? 1.8 : 1.1, tier });
  }
  return pts;
}

/** Connect each particle to its nearest few neighbors within reach —
 *  the "funnel thread" look. Deduped so each edge draws once. */
function threads(pts: Pt[], reach: number): [Pt, Pt][] {
  const edges: [Pt, Pt][] = [];
  const seen = new Set<string>();
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ q, j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
      .filter((e) => e.j !== i && e.d < reach * reach)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const e of near) {
      const key = i < e.j ? `${i}-${e.j}` : `${e.j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([p, e.q]);
      }
    }
  });
  return edges;
}

/**
 * The cover's ambient constellation. Rendered behind the content column,
 * tinted by the active template (stroke/fill use var(--accent)); opacity
 * tiers keep it atmospheric, never louder than the headline.
 */
export function particleConstellation(seed: string): string {
  const w = 640;
  const h = 560;
  const rand = prng(hashSeed(seed));
  const pts = scatter(rand, 84, w, h);
  const edges = threads(pts, 74);

  const lines = edges
    .map(
      ([a, b]) =>
        `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`,
    )
    .join("");
  const dots = pts
    .map(
      (p) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" class="pc-t${p.tier}"/>`,
    )
    .join("");

  return `<svg class="cover-constellation" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
  <g class="pc-threads">${lines}</g>
  <g class="pc-dots">${dots}</g>
</svg>`;
}
