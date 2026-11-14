import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import Watch from "./Watch";

// Where the watch stands in each section of the page (in order).
// x: left/right (-1..1 of half the screen), y: up/down, rx: tilt, ry: turn,
// size: how big, explode: 0 = closed, 1 = all parts apart
const POSES = [
  { x: 0, y: -0.04, rx: 0.12, ry: 0, size: 0.82, explode: 0, phoneY: -0.02, phoneSize: 0.85 }, // hero (phones: lower, a clear gap under the title)
  { x: 0.48, y: 0, rx: 0.42, ry: -0.5, size: 0.92, explode: 0, phoneY: 0.06, phoneSize: 1 }, // live time
  { x: 0.3, y: -0.02, rx: 0.32, ry: -1.05, size: 0.6, explode: 1, phoneY: 0.02, phoneSize: 1 }, // exploded view
  { x: -0.45, y: 0, rx: 0.15, ry: Math.PI - 0.25, size: 0.95, explode: 0, phoneY: 0.06, phoneSize: 1 }, // movement (from the back)
  { x: 0.45, y: 0, rx: 0.1, ry: Math.PI * 2 - 0.2, size: 0.95, explode: 0, phoneY: 0.25, phoneSize: 0.85 }, // configure (phones: watch at the top, choices below)
  { x: -0.48, y: 0, rx: 0.45, ry: Math.PI * 2 + 0.5, size: 0.85, explode: 0, phoneY: 0.06, phoneSize: 1 }, // specs
  { x: 0, y: -0.01, rx: 1.0, ry: Math.PI * 2 - 0.35, size: 0.46, explode: 0, box: 1, phoneY: 0.06, phoneSize: 1 }, // order: in its box
];

const mix = (a, b, t) => {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * t;
  return out;
};

// Moves the watch between the poses as you scroll
function Rig({ stage, spin, config, rtl, lang }) {
  const group = useRef();
  const explode = useRef(0);
  const boxed = useRef(0); // 1 = the watch lies in its presentation box
  const { viewport } = useThree();
  const phone = viewport.aspect < 0.9;
  const intro = useRef(0);

  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, 0.1);
    const g = group.current;
    intro.current = Math.min(1, intro.current + delta * 0.6);
    const ease = 1 - Math.pow(1 - intro.current, 3);

    const i = Math.min(POSES.length - 1, Math.floor(stage.current));
    const p = mix(POSES[i], POSES[Math.min(POSES.length - 1, i + 1)], stage.current - i);
    const base = (viewport.height * (phone ? 0.27 * p.phoneSize : 0.42)) / 2; // the case is 2 units wide

    const want = {
      x: phone ? 0 : p.x * viewport.width * 0.42 * (rtl ? -1 : 1),
      y: phone ? viewport.height * p.phoneY : p.y * viewport.height,
      s: base * p.size * (0.8 + 0.2 * ease),
      rx: Math.PI / 2 - p.rx, // the watch lies flat; turn it up to face us, then tilt
      ry: p.ry * (rtl ? -1 : 1) + spin.current + (1 - ease) * 1.4,
    };
    const k = Math.min(1, delta * 3.2);
    g.position.x += (want.x - g.position.x) * k;
    g.position.y += (want.y - g.position.y) * k;
    g.scale.setScalar(g.scale.x + (want.s - g.scale.x) * k);
    g.rotation.x += (want.rx - g.rotation.x) * k;
    g.rotation.y += (want.ry - g.rotation.y) * k;
    explode.current += (p.explode - explode.current) * k;
    boxed.current += ((p.box ?? 0) - boxed.current) * k; // poses without "box" mean 0
  });

  return (
    // The order of turns matters: first turn left/right (y), then tilt (x)
    <group ref={group} rotation-order="YXZ" scale={0.01}>
      <Watch config={config} explode={explode} boxed={boxed} />
    </group>
  );
}

// A photo studio built from light panels (no image to download):
// long soft strips make the polished metal show bright, clean reflections,
// and the dark room between them gives the metal its contrast
function Studio() {
  return (
    <Environment resolution={512}>
      <color attach="background" args={["#141210"]} />
      <Lightformer form="rect" intensity={1.2} color="#fff4e2" position={[0, -3, 4]} rotation-x={-Math.PI / 4} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={0.8} color="#c9a96e" position={[0, 2, -5]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer form="rect" intensity={2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[1, 6, 1]} />
      <Lightformer form="rect" intensity={2} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[1, 6, 1]} />
      <Lightformer form="ring" intensity={2.5} position={[2, 2, 5]} scale={1.5} />
    </Environment>
  );
}

const Fallback = () => null;

// The fixed 3D layer behind the whole page. Drag sideways to turn the watch.
export default function Stage({ stage, config, rtl, lang }) {
  const spin = useRef(0);
  const lastX = useRef(null);
  const [ready, setReady] = useState(false);

  // Start the 3D after the page text has appeared (faster first screen)
  useEffect(() => {
    const start = () => ("requestIdleCallback" in window ? requestIdleCallback(() => setReady(true), { timeout: 1200 }) : setReady(true));
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <div
      className="fixed inset-0 z-10 cursor-grab active:cursor-grabbing touch-pan-y"
      onPointerDown={(e) => (lastX.current = e.clientX)}
      onPointerMove={(e) => {
        if (lastX.current === null) return;
        spin.current += (e.clientX - lastX.current) * 0.01;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (lastX.current = null)}
      onPointerLeave={() => (lastX.current = null)}
      onPointerCancel={() => (lastX.current = null)}
    >
      {/* soft spotlight behind the watch */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] rounded-full blur-[140px] opacity-25 bg-[#b99a62] pointer-events-none" />
      {ready && (
        <Canvas camera={{ position: [0, 0, 10], fov: 30 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
          <Suspense fallback={<Fallback />}>
            <Studio />
            {/* direct light from the front, so the dial shows its color */}
            <ambientLight intensity={0.35} />
            <directionalLight position={[2, 3, 6]} intensity={1.6} color="#fff6ea" />
            <Rig stage={stage} spin={spin} config={config} rtl={rtl} lang={lang} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
