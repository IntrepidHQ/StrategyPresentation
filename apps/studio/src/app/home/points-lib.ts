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

// Crisp particle shaders: hard-edged sprites, strong light contrast, and a
// per-point luminance attribute.
export const VERT = /* glsl */ `
  uniform float uScale;
  attribute float aLum;
  varying float vL;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 lightDir = normalize(vec3(-0.4, 0.55, 0.82));
    vec3 wn = normalize(mat3(modelMatrix) * normal);
    float diff = max(dot(wn, lightDir), 0.0);
    vec3 vn = normalize(normalMatrix * normal);
    float rim = pow(1.0 - abs(vn.z), 2.2);
    vL = clamp(aLum * (0.4 + diff * 0.7 + rim * 0.55), 0.2, 1.0);
    // Uniform SMALL point (no size-by-brightness → crisp, not blurry);
    // shading is carried by brightness + density.
    gl_PointSize = uScale * 0.8 * (300.0 / max(60.0, -mv.z * 100.0));
    gl_Position = projectionMatrix * mv;
  }
`;
export const FRAG = /* glsl */ `
  varying float vL;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.42, d); // near-hard disc
    gl_FragColor = vec4(vec3(1.0), (0.12 + vL * 0.88) * edge);
  }
`;
