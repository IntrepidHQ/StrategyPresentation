"use client";

// ============================================================
//  CheckerWave — the closing texture strip under the footer:
//  a checkered flag made of particles, rolling in slow waves
//  (the reference: a classic "checkered motion background"
//  loop, rebuilt in the brand's particle language). Pure
//  decoration: aria-hidden, lazy-booted, paused off-screen,
//  frozen under prefers-reduced-motion.
// ============================================================

import { useEffect, useRef } from "react";

const WAVE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute float aLum;
  varying float vL;

  float waveZ(vec2 p) {
    return 0.16 * sin(p.x * 2.1 + uTime * 0.9)
         + 0.11 * sin(p.y * 3.4 - uTime * 0.7)
         + 0.05 * sin((p.x + p.y) * 5.0 + uTime * 1.3);
  }

  void main() {
    vec3 pos = position;
    pos.z = waveZ(position.xy);
    // Analytic-ish normal from neighboring samples.
    float e = 0.06;
    float zx = waveZ(position.xy + vec2(e, 0.0)) - pos.z;
    float zy = waveZ(position.xy + vec2(0.0, e)) - pos.z;
    vec3 n = normalize(vec3(-zx / e, -zy / e, 1.0));
    vec3 lightDir = normalize(vec3(-0.35, 0.5, 0.8));
    float diff = max(dot(n, lightDir), 0.0);
    vL = clamp(aLum * (0.25 + diff * 0.8), 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (0.7 + vL * 1.0) * uScale * (300.0 / max(60.0, -mv.z * 100.0));
    gl_Position = projectionMatrix * mv;
  }
`;
const WAVE_FRAG = /* glsl */ `
  varying float vL;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.46, d);
    gl_FragColor = vec4(vec3(1.0), (0.08 + vL * 0.85) * edge);
  }
`;

export function CheckerWave() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let started = false;
    let visible = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;

    async function start() {
      if (started || disposed) return;
      started = true;
      try {
        const THREE = await import("three");
        if (disposed) return;

        const W = () => host!.clientWidth || 1200;
        const H = () => host!.clientHeight || 300;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.setSize(W(), H());
        renderer.domElement.setAttribute("aria-hidden", "true");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, W() / H(), 0.1, 40);
        camera.position.set(0, 1.15, 4.4);
        camera.lookAt(0, -0.15, 0);

        // Particle cloth: NX×NY grid, checkered by cell parity.
        const NX = 190, NY = 64;
        const SPAN_X = 9.5, SPAN_Y = 3.1;
        const N = NX * NY;
        const pos = new Float32Array(N * 3);
        const lum = new Float32Array(N);
        let i = 0, j = 0;
        for (let gy = 0; gy < NY; gy++) {
          for (let gx = 0; gx < NX; gx++) {
            const x = (gx / (NX - 1) - 0.5) * SPAN_X + (Math.random() - 0.5) * 0.02;
            const y = (gy / (NY - 1) - 0.5) * SPAN_Y + (Math.random() - 0.5) * 0.02;
            pos[i] = x; pos[i + 1] = y; pos[i + 2] = 0;
            const cell = (Math.floor((gx / (NX - 1)) * 22) + Math.floor((gy / (NY - 1)) * 7)) % 2 === 0;
            lum[j] = cell ? (Math.random() > 0.93 ? 1 : 0.85) : 0.18;
            i += 3; j++;
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aLum", new THREE.BufferAttribute(lum, 1));
        const mat = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uScale: { value: H() * 0.012 } },
          vertexShader: WAVE_VERT,
          fragmentShader: WAVE_FRAG,
          transparent: true,
          depthWrite: false,
        });
        const cloth = new THREE.Points(geo, mat);
        cloth.rotation.x = -0.92; // lay it down, waves toward the camera
        scene.add(cloth);

        host!.appendChild(renderer.domElement);
        host!.classList.add("is-live");

        const clock = new THREE.Clock();
        let t = Math.random() * 20;
        function frame() {
          if (disposed) return;
          raf = requestAnimationFrame(frame);
          if (!visible) return; // parked off-screen
          if (!reduced) t += Math.min(clock.getDelta(), 0.05);
          else clock.getDelta();
          mat.uniforms.uTime.value = t;
          renderer!.render(scene, camera);
        }
        frame();

        const onResize = () => {
          if (!renderer) return;
          renderer.setSize(W(), H());
          camera.aspect = W() / H();
          camera.updateProjectionMatrix();
          mat.uniforms.uScale.value = H() * 0.012;
        };
        ro = new ResizeObserver(onResize);
        ro.observe(host!);
      } catch {
        /* decorative only */
      }
    }

    io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) void start();
      },
      { rootMargin: "300px" },
    );
    io.observe(host);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro?.disconnect();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="lp-wave" aria-hidden="true" />;
}
