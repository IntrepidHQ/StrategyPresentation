"use client";

// ============================================================
//  PieceScene — small interactive 3D particle chess vignettes
//  for the non-hero slides. Same real geometry + shaders as
//  the planet; flat-ground physics: click a piece, it topples
//  and rolls, then glides back. SVG fallback (passed as HTML)
//  stays for no-JS / no-WebGL / reduced-motion.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { FRAG, VERT, densify, loadPoints } from "./points-lib";

export type SceneCast = { name: string; x: number; z?: number; scale: number; rotY?: number };

export function PieceScene({
  cast,
  fallbackHtml,
  camY = 0.5,
  camZ = 2.6,
  className = "",
}: {
  cast: SceneCast[];
  fallbackHtml: string;
  camY?: number;
  camZ?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let started = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;

    async function start() {
      if (started || disposed) return;
      started = true;
      try {
        const [THREE, CANNON, points] = await Promise.all([
          import("three"),
          import("cannon-es"),
          loadPoints(),
        ]);
        if (disposed) return;

        const W = () => host!.clientWidth || 300;
        const H = () => host!.clientHeight || 300;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W(), H());
        renderer.domElement.className = "lp-chess-canvas";
        renderer.domElement.setAttribute("aria-hidden", "true");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, W() / H(), 0.1, 20);
        camera.position.set(0, camY, camZ);
        camera.lookAt(0, 0.42, 0);

        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.8, 0) });
        world.allowSleep = true;
        world.defaultContactMaterial.friction = 0.42;
        world.defaultContactMaterial.restitution = 0.28;
        const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
        ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(ground);

        const mats: import("three").ShaderMaterial[] = [];
        type Piece = {
          obj: import("three").Points;
          proxy: import("three").Mesh;
          body: import("cannon-es").Body;
          home: { x: number; z: number; rotY: number; h: number };
        };
        const pieces: Piece[] = [];

        for (const c of cast) {
          // 4× the stored samples (tight tangential densify) — solid surfaces.
          const data = densify(points.get(c.name)!, 4);
          const s = c.scale;
          const h = s;
          const half = h / 2;
          const z = c.z ?? 0;
          const rotY = c.rotY ?? 0;

          const pos = new Float32Array(data.pos.length);
          for (let i = 0; i < data.pos.length; i += 3) {
            pos[i] = data.pos[i] * s;
            pos[i + 1] = data.pos[i + 1] * s - half;
            pos[i + 2] = data.pos[i + 2] * s;
          }
          const lum = new Float32Array(data.meta.count).fill(0.92);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(data.nor.slice(), 3));
          geo.setAttribute("aLum", new THREE.BufferAttribute(lum, 1));
          const mat = new THREE.ShaderMaterial({
            uniforms: { uScale: { value: H() * 0.006 } },
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
          });
          mats.push(mat);
          const obj = new THREE.Points(geo, mat);
          scene.add(obj);

          const proxy = new THREE.Mesh(
            new THREE.CylinderGeometry(data.meta.maxR * s * 1.2, data.meta.baseR * s * 1.2, h * 1.05, 10),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
          );
          scene.add(proxy);

          const body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Cylinder(data.meta.maxR * s * 0.72, data.meta.baseR * s * 0.95, h, 10),
            position: new CANNON.Vec3(c.x, half + 0.001, z),
            angularDamping: 0.3,
            linearDamping: 0.18,
          });
          body.quaternion.setFromEuler(0, rotY, 0);
          body.allowSleep = true;
          body.sleepSpeedLimit = 0.25;
          body.sleepTimeLimit = 0.4;
          body.sleep();
          world.addBody(body);

          pieces.push({ obj, proxy, body, home: { x: c.x, z, rotY, h } });
        }

        host!.appendChild(renderer.domElement);
        setReady(true);

        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        let lastPokeAt = 0;
        let resetting = false;
        let resetStart = 0;
        const resetFrom: { p: import("three").Vector3; q: import("three").Quaternion }[] = [];

        function poke(ev: PointerEvent) {
          if (reduced || resetting) return;
          const r = renderer!.domElement.getBoundingClientRect();
          ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
          ray.setFromCamera(ndc, camera);
          const hits = ray.intersectObjects(pieces.map((p) => p.proxy));
          if (!hits.length) return;
          const hit = hits[0];
          const piece = pieces.find((p) => p.proxy === hit.object)!;
          piece.body.wakeUp();
          const dir = ray.ray.direction;
          const impulse = new CANNON.Vec3(dir.x * 1.5, 0.5, dir.z * 1.5 - 0.35);
          const rel = new CANNON.Vec3(
            hit.point.x - piece.body.position.x,
            Math.max(0.15, hit.point.y - piece.body.position.y),
            hit.point.z - piece.body.position.z,
          );
          piece.body.applyImpulse(impulse, rel);
          lastPokeAt = performance.now();
        }
        renderer.domElement.addEventListener("pointerdown", poke);
        renderer.domElement.style.cursor = reduced ? "default" : "pointer";

        function beginReset() {
          resetting = true;
          resetStart = performance.now();
          resetFrom.length = 0;
          for (const p of pieces) {
            p.body.sleep();
            resetFrom.push({ p: p.obj.position.clone(), q: p.obj.quaternion.clone() });
          }
        }

        const clock = new THREE.Clock();
        const homeQ = pieces.map((p) =>
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.home.rotY),
        );

        function frame() {
          if (disposed) return;
          raf = requestAnimationFrame(frame);
          const dt = Math.min(clock.getDelta(), 0.05);
          if (!resetting) {
            world.step(1 / 60, dt, 3);
            const anyAwake = pieces.some((p) => p.body.sleepState !== 2);
            for (const p of pieces) {
              p.obj.position.set(p.body.position.x, p.body.position.y, p.body.position.z);
              p.obj.quaternion.set(p.body.quaternion.x, p.body.quaternion.y, p.body.quaternion.z, p.body.quaternion.w);
              p.proxy.position.copy(p.obj.position);
              p.proxy.quaternion.copy(p.obj.quaternion);
            }
            if (lastPokeAt && (!anyAwake || performance.now() - lastPokeAt > 6500)) {
              lastPokeAt = 0;
              beginReset();
            }
          } else {
            const t = Math.min(1, (performance.now() - resetStart) / 1100);
            const e = 1 - Math.pow(1 - t, 3);
            pieces.forEach((p, i) => {
              p.obj.position.lerpVectors(resetFrom[i].p, new THREE.Vector3(p.home.x, p.home.h / 2 + 0.001, p.home.z), e);
              p.obj.quaternion.slerpQuaternions(resetFrom[i].q, homeQ[i], e);
              p.proxy.position.copy(p.obj.position);
              p.proxy.quaternion.copy(p.obj.quaternion);
            });
            if (t >= 1) {
              pieces.forEach((p, i) => {
                p.body.position.set(p.home.x, p.home.h / 2 + 0.001, p.home.z);
                p.body.quaternion.set(homeQ[i].x, homeQ[i].y, homeQ[i].z, homeQ[i].w);
                p.body.velocity.setZero();
                p.body.angularVelocity.setZero();
                p.body.sleep();
              });
              resetting = false;
            }
          }
          renderer!.render(scene, camera);
        }
        frame();

        const onResize = () => {
          if (!renderer) return;
          renderer.setSize(W(), H());
          camera.aspect = W() / H();
          camera.updateProjectionMatrix();
          mats.forEach((m) => (m.uniforms.uScale.value = H() * 0.006));
        };
        ro = new ResizeObserver(onResize);
        ro.observe(host!);
      } catch {
        // fallback SVG stays
      }
    }

    // Lazy: only boot WebGL when the vignette approaches the viewport.
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io?.disconnect();
          void start();
        }
      },
      { rootMargin: "400px" },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={hostRef} className={`lp-piece-scene ${className}${ready ? " is-live" : ""}`} aria-hidden="true">
      <div className="lp-chess-fallback" dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
    </div>
  );
}
