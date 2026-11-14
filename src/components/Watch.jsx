import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { brand, cases, dials, find, straps } from "../data/watch";
import { boxLogoTexture, dialTexture, genevaTexture, grainTexture, perlageTexture } from "./textures";

// ---------------------------------------------------------------------------
// The watch, built piece by piece in code (no 3D file).
// It is modelled lying flat with the dial facing UP (+y), 12 o'clock toward -z.
// The parent turns it to face the camera.
//
// explode (0 → 1) moves the layers apart for the exploded view:
// crystal, bezel and hands go up, the movement and the caseback go down.
// ---------------------------------------------------------------------------

const LAYERS = {
  crystal: 1.75,
  bezel: 1.35,
  hands: 1.0,
  dial: 0.62,
  movement: -0.7,
  rotor: -1.05,
  caseback: -1.45,
};

// A round shape turned on a lathe (like a potter's wheel): [radius, height] points
const lathe = (points, segments = 160) => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);

// Dauphine hand: a long thin diamond, pointing to 12, lying flat
function handGeometry(length, width, tail) {
  const s = new THREE.Shape();
  s.moveTo(0, -tail);
  s.lineTo(width, length * 0.12);
  s.lineTo(0, length);
  s.lineTo(-width, length * 0.12);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2); // lay it flat, pointing to 12 (-z)
  return g;
}

// A gear wheel with teeth and four round windows
function gearGeometry(radius, teeth) {
  const s = new THREE.Shape();
  const inner = radius * 0.9;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    const pts = [
      [inner, a],
      [radius, a + step * 0.15],
      [radius, a + step * 0.45],
      [inner, a + step * 0.6],
    ];
    pts.forEach(([r, b], j) => (i === 0 && j === 0 ? s.moveTo(Math.cos(b) * r, Math.sin(b) * r) : s.lineTo(Math.cos(b) * r, Math.sin(b) * r)));
  }
  s.closePath();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    const hole = new THREE.Path();
    hole.absarc(Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5, radius * 0.22, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.016, bevelEnabled: false, curveSegments: 8 });
  g.rotateX(Math.PI / 2);
  return g;
}

// A strap: a band that leaves the lugs and bends down around the wrist.
// Built as a long box that follows a curve, getting a little narrower at the end.
// wrapped = the shape it takes in the box: hugging the ends of the cushion and going down into it
function strapGeometry(direction, wrapped = false) {
  const d = direction; // -1 = 12 o'clock side, +1 = 6 o'clock side
  const points = wrapped
    ? [[-0.07, 0.98], [-0.15, 1.12], [-0.3, 1.24], [-0.55, 1.27], [-0.85, 1.22]]
    : [[-0.07, 0.98], [-0.11, 1.4], [-0.36, 1.85], [-0.82, 2.17], [-1.4, 2.32]];
  const curve = new THREE.CatmullRomCurve3(points.map(([y, z]) => new THREE.Vector3(0, y, d * z)));
  const steps = 60;
  const pos = [], uv = [], index = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const side = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(side, tan).normalize().multiplyScalar(d < 0 ? -1 : 1);
    const half = 0.5 - t * 0.07; // narrower toward the end
    const th = 0.045;
    // four corners of the cut through the strap
    [
      [-half, th],
      [half, th],
      [half, -th],
      [-half, -th],
    ].forEach(([x, y], k) => {
      const v = p.clone().addScaledVector(side, x).addScaledVector(up, y);
      pos.push(v.x, v.y, v.z);
      uv.push(k === 0 || k === 3 ? 0 : 1, t);
    });
  }
  for (let i = 0; i < steps; i++) {
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, e = b + 4;
      index.push(a, c, b, b, c, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

export default function Watch({ config, explode, boxed }) {
  const caseOpt = find(cases, config.case);
  const dialOpt = find(dials, config.dial);
  const strapOpt = find(straps, config.strap);

  // ---------- Materials ----------
  const metal = useMemo(() => new THREE.MeshPhysicalMaterial({ metalness: 1, clearcoat: 0.3, clearcoatRoughness: 0.1, side: THREE.DoubleSide }), []);
  // Hands and markers: the case metal, but steel on the black case (so they can be seen)
  const accent = useMemo(() => new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.12 }), []);
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        transmission: 1,
        roughness: 0,
        thickness: 0.02,
        ior: 1.2,
        specularIntensity: 0.15, // anti-reflective coating, like real watch crystals
        envMapIntensity: 0.25,
      }),
    []
  );
  const grain = useMemo(() => grainTexture(), []);
  const leather = useMemo(() => new THREE.MeshPhysicalMaterial({ bumpMap: grain, bumpScale: 1.2, sheen: 0.4, transparent: true }), [grain]);
  const leatherBoxed = useMemo(() => leather.clone(), [leather]); // same strap, wrapped around the cushion
  const dialMap = useMemo(() => dialTexture(dialOpt.color, dialOpt.ink, brand.name), [dialOpt]);
  const movement = useMemo(
    () => ({
      plate: new THREE.MeshPhysicalMaterial({ map: perlageTexture(), metalness: 0.85, roughness: 0.38 }),
      rotor: new THREE.MeshPhysicalMaterial({ map: genevaTexture(), metalness: 0.9, roughness: 0.28 }),
      gold: new THREE.MeshPhysicalMaterial({ color: "#e2bd6d", metalness: 1, roughness: 0.22 }),
      ruby: new THREE.MeshPhysicalMaterial({ color: "#c0122f", roughness: 0.05, clearcoat: 1, transmission: 0.4, thickness: 0.05 }),
      steel: new THREE.MeshPhysicalMaterial({ color: "#cfd3da", metalness: 1, roughness: 0.18 }),
    }),
    []
  );

  // Presentation box materials: black leather outside, gold-logo satin inside, velvet cushion
  const boxMats = useMemo(() => {
    const leatherOut = new THREE.MeshPhysicalMaterial({ color: "#141416", roughness: 0.55, bumpMap: grain, bumpScale: 0.8, sheen: 0.3, transparent: true });
    const lidTop = new THREE.MeshPhysicalMaterial({ map: boxLogoTexture(false), roughness: 0.5, bumpMap: grain, bumpScale: 0.5, transparent: true });
    const lidInside = new THREE.MeshPhysicalMaterial({ map: boxLogoTexture(true), roughness: 0.55, sheen: 0.8, sheenColor: "#fff3df", transparent: true });
    const velvet = new THREE.MeshPhysicalMaterial({ color: "#cdbfa6", roughness: 1, sheen: 1, sheenColor: "#fff1d8", sheenRoughness: 0.5, transparent: true });
    const goldTrim = new THREE.MeshPhysicalMaterial({ color: "#d4b06a", metalness: 1, roughness: 0.2, transparent: true });
    return [leatherOut, lidTop, lidInside, velvet, goldTrim];
  }, [grain]);
  const [leatherOut, lidTop, lidInside, velvet, goldTrim] = boxMats;

  // The chosen case metal and strap: colors glide softly to the new choice
  const target = useMemo(() => ({ metal: new THREE.Color(), accent: new THREE.Color(), strap: new THREE.Color() }), []);
  useEffect(() => {
    target.metal.set(caseOpt.color);
    target.accent.set(caseOpt.id === "black" ? "#d9dce2" : caseOpt.color);
    target.strap.set(strapOpt.color);
    metal.roughness = caseOpt.rough;
    leather.roughness = strapOpt.rough;
    leather.sheen = strapOpt.id === "sand" ? 1 : 0.3; // suede is soft and velvety
  }, [caseOpt, strapOpt, target, metal, leather]);

  // ---------- Shapes (made once) ----------
  const geo = useMemo(
    () => ({
      caseMid: lathe([
        [0.8, -0.2], [0.93, -0.205], [0.985, -0.17], [1.012, -0.09], [1.014, 0.06], [0.997, 0.14], [0.96, 0.165], [0.88, 0.165], [0.876, 0.06],
      ]),
      bezel: lathe([[0.862, 0.165], [0.868, 0.205], [0.9, 0.236], [0.95, 0.242], [0.984, 0.218], [0.996, 0.172], [0.96, 0.165]]),
      caseback: lathe([[0.8, -0.2], [0.822, -0.232], [0.79, -0.262], [0.6, -0.27], [0.57, -0.252]]),
      hour: handGeometry(0.46, 0.045, 0.07),
      minute: handGeometry(0.72, 0.038, 0.09),
      gearA: gearGeometry(0.21, 36),
      gearB: gearGeometry(0.16, 28),
      gearC: gearGeometry(0.12, 22),
      gearD: gearGeometry(0.09, 16),
      rotor: (() => {
        const s = new THREE.Shape();
        s.absarc(0, 0, 0.76, Math.PI * 0.05, Math.PI * 0.95, false);
        s.absarc(0, 0, 0.16, Math.PI * 0.95, Math.PI * 0.05, true);
        const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 48 });
        g.rotateX(Math.PI / 2);
        // picture coordinates so the stripes cover the rotor
        const p = g.attributes.position, uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.6 + 0.5, -p.getZ(i) / 1.6 + 0.5);
        return g;
      })(),
      hairspring: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => {
          const a = i * 0.45, r = 0.02 + i * 0.0012;
          return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
        })),
        200, 0.003, 4
      ),
      strapTop: strapGeometry(-1),
      strapBottom: strapGeometry(1),
      strapTopBoxed: strapGeometry(-1, true),
      strapBottomBoxed: strapGeometry(1, true),
    }),
    []
  );

  // ---------- Animation ----------
  const layer = useRef({}); // the groups that move apart in the exploded view
  const hand = useRef({});
  const wheel = useRef({});

  useFrame((state, delta) => {
    const k = Math.min(1, delta * 6);
    metal.color.lerp(target.metal, k);
    accent.color.lerp(target.accent, k);
    leather.color.lerp(target.strap, k);

    // Live time: the hands show the visitor's real time. The seconds hand sweeps smoothly.
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    hand.current.hour.rotation.y = -(h / 12) * Math.PI * 2;
    hand.current.minute.rotation.y = -(m / 60) * Math.PI * 2;
    hand.current.second.rotation.y = -(s / 60) * Math.PI * 2;

    // The movement is alive: gears turn, the balance wheel swings 4 times a second, the rotor spins
    const t = state.clock.elapsedTime;
    wheel.current.a.rotation.y = t * 0.6;
    wheel.current.b.rotation.y = -t * 0.8;
    wheel.current.c.rotation.y = t * 1.2;
    wheel.current.d.rotation.y = -t * 1.8;
    wheel.current.balance.rotation.y = Math.sin(t * Math.PI * 8) * 1.1;
    wheel.current.rotor.rotation.y = t * 0.35;

    // Exploded view
    const e = explode.current;
    for (const [name, offset] of Object.entries(LAYERS)) layer.current[name].position.y = offset * e;
    // the straps fade out when the watch opens (to see the parts) or lies in its box
    const b = boxed.current;
    leather.opacity = Math.max(0, 1 - Math.max(e * 2.2, b * 2.5));
    // the presentation box rises in, then its lid opens
    const box = layer.current.box;
    box.visible = b > 0.01;
    box.position.y = -0.6 * (1 - b);
    box.scale.setScalar(0.85 + 0.15 * b);
    boxMats.forEach((m) => (m.opacity = Math.min(1, b * 1.6)));
    layer.current.lid.rotation.x = -0.25 - 1.55 * Math.min(1, Math.max(0, (b - 0.3) / 0.7));
    layer.current.straps.visible = leather.opacity > 0.01;
    // in the box the strap is shown wrapped around the cushion instead
    leatherBoxed.color.copy(leather.color);
    leatherBoxed.roughness = leather.roughness;
    leatherBoxed.sheen = leather.sheen;
    leatherBoxed.opacity = Math.min(1, Math.max(0, (b - 0.45) * 2.5));
    layer.current.strapsBoxed.visible = leatherBoxed.opacity > 0.01;
  });

  const setLayer = (name) => (el) => (layer.current[name] = el);

  return (
    <group>
      {/* ---------- Presentation box (only in the order section) ---------- */}
      <group ref={setLayer("box")} visible={false}>
        {/* base, black leather */}
        <RoundedBox args={[3, 0.5, 3.2]} radius={0.08} smoothness={4} position={[0, -0.72, 0.1]} material={leatherOut} />
        {/* four low walls make it a tray, with a thin gold line on top */}
        {[
          [0, 1.65, 3, 0.1],
          [0, -1.45, 3, 0.1],
          [1.45, 0.1, 0.1, 3.2],
          [-1.45, 0.1, 0.1, 3.2],
        ].map(([x, z, w, d]) => (
          <group key={`${x}${z}`}>
            <mesh position={[x, -0.35, z]} material={leatherOut}>
              <boxGeometry args={[w, 0.26, d]} />
            </mesh>
            <mesh position={[x, -0.215, z]} material={goldTrim}>
              <boxGeometry args={[w + 0.005, 0.012, d + 0.005]} />
            </mesh>
          </group>
        ))}
        {/* velvet lining */}
        <mesh position={[0, -0.46, 0.1]} material={velvet}>
          <boxGeometry args={[2.8, 0.04, 3.0]} />
        </mesh>
        {/* the cushion: the strap bends around its two ends */}
        <RoundedBox args={[1.3, 0.5, 2.3]} radius={0.22} smoothness={8} position={[0, -0.52, 0]} material={velvet} />
        {/* lid, hinged at the back edge; gold logo on the satin inside */}
        <group ref={setLayer("lid")} position={[0, -0.27, -1.5]}>
          <RoundedBox args={[3, 0.18, 3.2]} radius={0.07} smoothness={4} position={[0, 0.09, 1.6]} material={leatherOut} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.185, 1.6]} material={lidTop}>
            <planeGeometry args={[2.8, 3]} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[0, -0.005, 1.6]} material={lidInside}>
            <planeGeometry args={[2.8, 3]} />
          </mesh>
        </group>
      </group>

      {/* ---------- Case: middle, lugs, crown ---------- */}
      <mesh geometry={geo.caseMid} material={metal} />
      {[
        [-0.6, -1],
        [0.6, -1],
        [-0.6, 1],
        [0.6, 1],
      ].map(([x, z]) => (
        <RoundedBox key={`${x}${z}`} args={[0.16, 0.13, 0.4]} radius={0.04} smoothness={4} position={[x, -0.03, z * 0.9]} rotation-x={z * 0.22} material={metal} />
      ))}
      <group position={[1.04, -0.01, 0]}>
        <mesh rotation-z={Math.PI / 2} position={[0.05, 0, 0]} material={metal}>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 36]} />
        </mesh>
        <mesh rotation-z={Math.PI / 2} position={[-0.01, 0, 0]} material={metal}>
          <cylinderGeometry args={[0.05, 0.05, 0.06, 20]} />
        </mesh>
      </group>

      {/* ---------- Straps wrapped around the cushion (in the box) ---------- */}
      <group ref={setLayer("strapsBoxed")} visible={false}>
        <mesh geometry={geo.strapTopBoxed} material={leatherBoxed} />
        <mesh geometry={geo.strapBottomBoxed} material={leatherBoxed} />
      </group>

      {/* ---------- Straps ---------- */}
      <group ref={setLayer("straps")}>
        <mesh geometry={geo.strapTop} material={leather} />
        <mesh geometry={geo.strapBottom} material={leather} />
      </group>

      {/* ---------- Sapphire crystal ---------- */}
      <group ref={setLayer("crystal")}>
        <mesh position={[0, 0.22, 0]} material={glass}>
          <cylinderGeometry args={[0.858, 0.858, 0.02, 128]} />
        </mesh>
      </group>

      {/* ---------- Bezel ---------- */}
      <group ref={setLayer("bezel")}>
        <mesh geometry={geo.bezel} material={metal} />
      </group>

      {/* ---------- Hands ---------- */}
      <group ref={setLayer("hands")}>
        <mesh ref={(el) => (hand.current.hour = el)} geometry={geo.hour} material={accent} position-y={0.135} />
        <mesh ref={(el) => (hand.current.minute = el)} geometry={geo.minute} material={accent} position-y={0.152} />
        <group ref={(el) => (hand.current.second = el)} position-y={0.17}>
          <mesh position={[0, 0, -0.27]} material={accent}>
            <boxGeometry args={[0.012, 0.006, 0.98]} />
          </mesh>
          <mesh position={[0, 0, 0.17]} material={accent}>
            <cylinderGeometry args={[0.03, 0.03, 0.008, 24]} />
          </mesh>
        </group>
        <mesh position-y={0.17} material={accent}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 24]} />
        </mesh>
      </group>

      {/* ---------- Dial + applied hour markers ---------- */}
      <group ref={setLayer("dial")}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.104}>
          <circleGeometry args={[0.874, 128]} />
          <meshPhysicalMaterial map={dialMap} metalness={0.2} roughness={0.42} clearcoat={0.15} clearcoatRoughness={0.35} envMapIntensity={0.6} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r = 0.66;
          return i === 0 ? (
            [-0.035, 0.035].map((dx) => (
              <mesh key={dx} position={[dx, 0.115, -r]} material={accent}>
                <boxGeometry args={[0.04, 0.025, 0.17]} />
              </mesh>
            ))
          ) : (
            <mesh key={i} position={[Math.sin(a) * r, 0.115, -Math.cos(a) * r]} rotation-y={-a} material={accent}>
              <boxGeometry args={[0.045, 0.025, 0.15]} />
            </mesh>
          );
        })}
      </group>

      {/* ---------- Movement (the engine of the watch) ---------- */}
      <group ref={setLayer("movement")}>
        <mesh position-y={-0.1} material={movement.plate}>
          <cylinderGeometry args={[0.79, 0.79, 0.03, 96]} />
        </mesh>
        <mesh ref={(el) => (wheel.current.a = el)} geometry={geo.gearA} material={movement.gold} position={[0.3, -0.118, 0.2]} />
        <mesh ref={(el) => (wheel.current.b = el)} geometry={geo.gearB} material={movement.gold} position={[-0.22, -0.118, 0.33]} />
        <mesh ref={(el) => (wheel.current.c = el)} geometry={geo.gearC} material={movement.gold} position={[0.02, -0.118, -0.36]} />
        <mesh ref={(el) => (wheel.current.d = el)} geometry={geo.gearD} material={movement.gold} position={[-0.4, -0.118, -0.18]} />
        {/* Balance wheel with its hairspring: the heartbeat of the watch */}
        <group ref={(el) => (wheel.current.balance = el)} position={[0.42, -0.13, -0.3]}>
          <mesh rotation-x={Math.PI / 2} material={movement.gold}>
            <torusGeometry args={[0.15, 0.014, 12, 64]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation-y={(i / 3) * Math.PI * 2} position-y={0} material={movement.gold}>
              <boxGeometry args={[0.3, 0.008, 0.012]} />
            </mesh>
          ))}
          <mesh geometry={geo.hairspring} material={movement.steel} position-y={-0.01} />
        </group>
        {/* Rubies (the "jewels" the gears turn on) */}
        {[
          [0.3, 0.2], [-0.22, 0.33], [0.02, -0.36], [-0.4, -0.18], [0.42, -0.3], [0, 0],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.128, z]} material={movement.ruby}>
            <sphereGeometry args={[0.02, 16, 12]} />
          </mesh>
        ))}
      </group>

      {/* ---------- Rotor (the half-moon that winds the watch as you move) ---------- */}
      <group ref={setLayer("rotor")}>
        <mesh ref={(el) => (wheel.current.rotor = el)} geometry={geo.rotor} material={movement.rotor} position-y={-0.16} />
      </group>

      {/* ---------- Caseback with a sapphire window ---------- */}
      <group ref={setLayer("caseback")}>
        <mesh geometry={geo.caseback} material={metal} />
        <mesh position-y={-0.258} material={glass}>
          <cylinderGeometry args={[0.6, 0.6, 0.012, 64]} />
        </mesh>
      </group>
    </group>
  );
}
