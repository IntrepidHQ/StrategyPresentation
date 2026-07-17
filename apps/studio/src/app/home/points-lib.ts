// ============================================================
//  Shared particle-scene plumbing for the landing's WebGL art:
//  the chess-points loader and the crisp point-sprite shaders,
//  used by ChessHero (the planet), PieceScene (interactive
//  pieces on other slides), and CheckerWave (footer texture).
// ============================================================

export type PieceMeta = { name: string; count: number; baseR: number; maxR: number };
export type PieceData = { meta: PieceMeta; pos: Float32Array; nor: Float32Array };

let cache: Promise<Map<string, PieceData>> | null = null;

/** Loads + parses public/chess-points.bin once per page (shared promise). */
export function loadPoints(url = "/chess-points.bin"): Promise<Map<string, PieceData>> {
  if (cache) return cache;
  cache = (async () => {
    const buf = await (await fetch(url)).arrayBuffer();
    const dv = new DataView(buf);
    const hlen = dv.getUint32(0, true);
    const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hlen))) as { pieces: PieceMeta[] };
    let off = 4 + hlen;
    const out = new Map<string, PieceData>();
    for (const meta of header.pieces) {
      const pos = new Float32Array(meta.count * 3);
      const i16 = new Int16Array(buf, off, meta.count * 3);
      for (let i = 0; i < i16.length; i++) pos[i] = i16[i] / 20000;
      off += i16.byteLength;
      const nor = new Float32Array(meta.count * 3);
      const i8 = new Int8Array(buf, off, meta.count * 3);
      for (let i = 0; i < i8.length; i++) nor[i] = i8[i] / 127;
      off += i8.byteLength;
      out.set(meta.name, { meta, pos, nor });
    }
    return out;
  })();
  return cache;
}

/**
 * Densify a sampled point cloud: emit `factor`× points by cloning each source
 * point with a small jitter TANGENT to the surface (perpendicular to its
 * normal), so the extra particles stay ON the piece instead of fuzzing it.
 * This is how the art gets denser than the 4.2K points stored in the .bin.
 */
export function densify(data: PieceData, factor: number, jitter = 0.0035): PieceData {
  const f = Math.max(1, Math.round(factor));
  if (f === 1) return data;
  const n = data.meta.count * f;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < data.meta.count; i++) {
    const s = i * 3;
    const nx = data.nor[s], ny = data.nor[s + 1], nz = data.nor[s + 2];
    // Tangent basis around the normal.
    let tx = -ny, ty = nx, tz = 0;
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
    for (let k = 0; k < f; k++) {
      const d = (i * f + k) * 3;
      const a = k === 0 ? 0 : Math.random() * Math.PI * 2;
      const r = k === 0 ? 0 : Math.sqrt(Math.random()) * jitter;
      pos[d] = data.pos[s] + (tx * Math.cos(a) + bx * Math.sin(a)) * r;
      pos[d + 1] = data.pos[s + 1] + (ty * Math.cos(a) + by * Math.sin(a)) * r;
      pos[d + 2] = data.pos[s + 2] + (tz * Math.cos(a) + bz * Math.sin(a)) * r;
      nor[d] = nx; nor[d + 1] = ny; nor[d + 2] = nz;
    }
  }
  return { meta: { ...data.meta, count: n }, pos, nor };
}

// Crisp particle shaders: hard-edged sprites, strong light contrast, a
// per-point luminance attribute, and an ARMY COLOR uniform (uColor) so
// vignettes can field black pieces beside white ones. uRim lifts a white
// silhouette on dark pieces so they read against the blue sheet.
export const VERT = /* glsl */ `
  uniform float uScale;
  uniform vec3 uColor;
  uniform float uRim;
  attribute float aLum;
  varying float vL;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 lightDir = normalize(vec3(-0.4, 0.55, 0.82));
    vec3 wn = normalize(mat3(modelMatrix) * normal);
    float diff = max(dot(wn, lightDir), 0.0);
    vec3 vn = normalize(normalMatrix * normal);
    float rim = pow(1.0 - abs(vn.z), 2.2);
    vL = clamp(aLum * (0.55 + diff * 0.55 + rim * 0.45), 0.3, 1.0);
    vec3 col = uColor * (0.72 + diff * 0.36);
    vColor = mix(col, vec3(1.0), rim * uRim); // white silhouette edge
    // Uniform SMALL point (no size-by-brightness → crisp, not blurry);
    // shading is carried by brightness + density.
    gl_PointSize = uScale * 0.8 * (300.0 / max(60.0, -mv.z * 100.0));
    gl_Position = projectionMatrix * mv;
  }
`;
export const FRAG = /* glsl */ `
  varying float vL;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.44, d); // near-hard disc
    gl_FragColor = vec4(vColor, (0.2 + vL * 0.8) * edge);
  }
`;
