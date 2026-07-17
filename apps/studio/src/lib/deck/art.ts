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

// ── Per-template cover art ───────────────────────────────────
// One art SYSTEM per template, not one tint. Every function returns an
// inline SVG with class "cover-constellation <variant>" so the base
// positioning/animation CSS applies; strokes/fills ride currentColor so
// the theme's cascade tints it. All deterministic per seed.

const W = 640, H = 560;

function svgOpen(variant: string): string {
  return `<svg class="cover-constellation ca-${variant}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">`;
}

/** Summit — an engraved rosette: concentric arcs + radial ticks, banknote energy. */
function artRosette(rand: () => number): string {
  const cx = W * 0.55, cy = H * 0.48;
  let g = `<g fill="none" stroke="currentColor">`;
  for (let i = 0; i < 9; i++) {
    const r = 60 + i * 26 + rand() * 8;
    const dash = 3 + rand() * 9;
    g += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" stroke-width="0.8" stroke-dasharray="${dash.toFixed(1)} ${(dash * (0.6 + rand())).toFixed(1)}" opacity="${(0.34 - i * 0.028).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r0 = 292 + (i % 2) * 8, r1 = r0 + 12;
    g += `<line x1="${(cx + Math.cos(a) * r0).toFixed(1)}" y1="${(cy + Math.sin(a) * r0).toFixed(1)}" x2="${(cx + Math.cos(a) * r1).toFixed(1)}" y2="${(cy + Math.sin(a) * r1).toFixed(1)}" stroke-width="0.8" opacity="0.22"/>`;
  }
  return g + `</g>`;
}

/** Signal — dashboard telemetry: a faint dot matrix + one glowing data sweep. */
function artRadar(rand: () => number): string {
  let dots = `<g fill="currentColor">`;
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 13; x++) {
      const px = 40 + x * 46 + (rand() - 0.5) * 6, py = 30 + y * 44 + (rand() - 0.5) * 6;
      dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.4" opacity="${(0.10 + rand() * 0.12).toFixed(2)}"/>`;
    }
  dots += `</g>`;
  // The sweep: a rising cubic with waypoint nodes — "the score climbing".
  const pts = Array.from({ length: 6 }, (_, i) => ({ x: 60 + i * 104, y: 430 - i * 62 - rand() * 40 }));
  const path = pts.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(" ");
  let sweep = `<path d="${path}" fill="none" stroke="currentColor" stroke-width="2" opacity="0.45"/>`;
  sweep += pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="currentColor" opacity="0.7"/>`).join("");
  return dots + sweep;
}

/** Editorial — print furniture: registration circle, hairline cross, scattered daggers. */
function artFolio(rand: () => number): string {
  const cx = W * 0.6, cy = H * 0.44;
  let g = `<g stroke="currentColor" fill="none">`;
  g += `<circle cx="${cx}" cy="${cy}" r="215" stroke-width="1" opacity="0.4"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="222" stroke-width="0.6" opacity="0.25"/>`;
  g += `<line x1="${cx - 260}" y1="${cy}" x2="${cx + 260}" y2="${cy}" stroke-width="0.6" opacity="0.3"/>`;
  g += `<line x1="${cx}" y1="${cy - 260}" x2="${cx}" y2="${cy + 260}" stroke-width="0.6" opacity="0.3"/>`;
  g += `</g><g fill="currentColor" font-family="Georgia,serif" font-size="22">`;
  const marks = ["✦", "†", "❡", "§", "*"];
  for (let i = 0; i < 9; i++) {
    g += `<text x="${(30 + rand() * 580).toFixed(0)}" y="${(40 + rand() * 500).toFixed(0)}" opacity="${(0.16 + rand() * 0.2).toFixed(2)}">${marks[Math.floor(rand() * marks.length)]}</text>`;
  }
  return g + `</g>`;
}

/** Monospace — an ASCII scatterplot: '+' grid, square markers, a step line. */
function artPlot(rand: () => number): string {
  let g = `<g stroke="currentColor" fill="none">`;
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 11; x++) {
      const px = 50 + x * 54, py = 40 + y * 52;
      g += `<path d="M${px - 3} ${py} h6 M${px} ${py - 3} v6" stroke-width="0.8" opacity="0.14"/>`;
    }
  let lx = 60, ly = 440;
  let step = `M${lx} ${ly}`;
  for (let i = 0; i < 8; i++) {
    lx += 60; step += ` H${lx}`;
    ly -= 20 + rand() * 46; step += ` V${ly.toFixed(0)}`;
  }
  g += `<path d="${step}" stroke-width="1.6" opacity="0.5"/>`;
  g += `</g><g fill="currentColor">`;
  for (let i = 0; i < 14; i++) {
    g += `<rect x="${(40 + rand() * 560).toFixed(0)}" y="${(30 + rand() * 480).toFixed(0)}" width="5" height="5" opacity="${(0.2 + rand() * 0.3).toFixed(2)}"/>`;
  }
  return g + `</g>`;
}

/** Gallery — sculpture wire: three vast offset ellipses and a few pebbles. */
function artOrbits(rand: () => number): string {
  let g = `<g fill="none" stroke="currentColor">`;
  for (let i = 0; i < 3; i++) {
    g += `<ellipse cx="${(W * (0.4 + rand() * 0.3)).toFixed(0)}" cy="${(H * (0.35 + rand() * 0.3)).toFixed(0)}" rx="${(200 + rand() * 90).toFixed(0)}" ry="${(120 + rand() * 80).toFixed(0)}" stroke-width="1" opacity="${(0.3 - i * 0.07).toFixed(2)}" transform="rotate(${(rand() * 60 - 30).toFixed(0)} ${W / 2} ${H / 2})"/>`;
  }
  g += `</g><g fill="currentColor">`;
  for (let i = 0; i < 7; i++) {
    g += `<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * H).toFixed(0)}" r="${(2 + rand() * 3.4).toFixed(1)}" opacity="${(0.24 + rand() * 0.3).toFixed(2)}"/>`;
  }
  return g + `</g>`;
}

/** Beacon — the sunrise: concentric dawn arcs rising from below. */
function artSunrise(rand: () => number): string {
  const cx = W * 0.5, cy = H * 1.06;
  let g = `<g fill="none" stroke="currentColor" stroke-linecap="round">`;
  for (let i = 0; i < 8; i++) {
    const r = 150 + i * 52 + rand() * 10;
    g += `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" stroke-width="${(2.4 - i * 0.22).toFixed(2)}" opacity="${(0.4 - i * 0.042).toFixed(2)}"/>`;
  }
  g += `<circle cx="${cx}" cy="${cy - 118}" r="10" fill="currentColor" stroke="none" opacity="0.55"/>`;
  return g + `</g>`;
}

/** Voltage — halftone ramp: print dots swelling across the corner. */
function artHalftone(rand: () => number): string {
  let g = `<g fill="currentColor">`;
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < 16; x++) {
      const px = 20 + x * 40 + (y % 2) * 20, py = 20 + y * 38;
      const t = Math.max(0, (px / W + py / H) / 2 - 0.18);
      const r = t * 7.5 + rand() * 0.6;
      if (r < 0.7) continue;
      g += `<circle cx="${px}" cy="${py}" r="${r.toFixed(1)}" opacity="${Math.min(0.5, 0.14 + t * 0.5).toFixed(2)}"/>`;
    }
  return g + `</g>`;
}

/**
 * Per-template cover artwork. Blueprint keeps the house constellation;
 * every other template gets its own system.
 */
export function coverArt(templateId: string, seed: string): string {
  const rand = prng(hashSeed(seed + ":" + templateId));
  switch (templateId) {
    case "summit": return svgOpen("rosette") + artRosette(rand) + `</svg>`;
    case "signal": return svgOpen("radar") + artRadar(rand) + `</svg>`;
    case "editorial": return svgOpen("folio") + artFolio(rand) + `</svg>`;
    case "monospace": return svgOpen("plot") + artPlot(rand) + `</svg>`;
    case "gallery": return svgOpen("orbits") + artOrbits(rand) + `</svg>`;
    case "beacon": return svgOpen("sunrise") + artSunrise(rand) + `</svg>`;
    case "voltage": return svgOpen("halftone") + artHalftone(rand) + `</svg>`;
    default: return particleConstellation(seed); // blueprint = the house art
  }
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
