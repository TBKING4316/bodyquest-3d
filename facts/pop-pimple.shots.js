// WHAT HAPPENS IF YOU POP A PIMPLE? : shot list (Deep Dive 3D).
// World flow: x-ray FACE (hook: red pimple pulses on the cheek) → MACRO pore (oil + dead-skin
// clog, bacteria multiply, pus floods, fingers squeeze, pus shoved deeper, red halo blooms) →
// x-ray face (permanent scar dot) → x-ray face (danger triangle drawn, valveless veins glow
// toward the skull) → inside a VEIN (infection dots drift, rare clot forms, hedged) →
// x-ray face calm (patience) → MACRO (leave it alone: halo fades) → MACRO (benzoyl peroxide gel
// drops, clog shrinks) → x-ray face payoff (clear skin, gold pill).
// Facts: NHS Acne (reviewed 2026-09-22: clogged follicle → bacteria → pus; don't pick/squeeze);
// KidsHealth popzit (reviewed 2018-10: squeezing pushes pus deeper → swelling, scabs, permanent
// scars; 5% benzoyl peroxide dries it faster); Cureus 18(7):e112359 (2026-07-09: central-face
// danger triangle drains via valveless veins toward the cavernous sinus — rare intracranial
// complications); J Emerg Med 53(1):137 (2017 case report).
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { label, pill, warning } from './core/look2d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }
const R = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);
  const XLOOK = { aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.45 };
  const PLOOK = { aperture: 0.0022, maxblur: 0.012, bloom: 0.5, bloomThreshold: 0.42, vignette: 0.55 };
  const VLOOK = { aperture: 0.0018, bloom: 0.5, bloomThreshold: 0.45, vignette: 0.5 };

  // ── world X · x-ray face (human with full x-ray body + x-ray head) ────
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial();
  xh.setBodyMaterial(xmat);
  X.scene.add(xh.group);
  // head sculpt + hair → x-ray too (QA rule: the whole body reads x-ray)
  xh.head.children.forEach((c) => { if (c.isMesh && Math.abs(c.position.x) < 0.01) c.material = xmat; });
  xh.head.traverse((c) => { if (c.isMesh && Math.abs(c.position.z - 0.091) < 0.01) { c.material = new THREE.MeshStandardMaterial({ color: '#9BE8FF', emissive: '#57C8F0', emissiveIntensity: 0.9 }); } });
  // cheek anchor: a small red pimple dome on the left cheek (head-local coords)
  const pimPos = V3(0.07, 0.072, 0.088);
  const pim = new THREE.Mesh(new THREE.SphereGeometry(0.0115, 20, 14), new THREE.MeshPhysicalMaterial({ color: '#FF6B6B', emissive: '#D22A3A', emissiveIntensity: 1.0, roughness: 0.35, clearcoat: 0.8 }));
  pim.position.copy(pimPos); xh.head.add(pim);
  // scar dot (same spot, dark, appears later)
  const scar = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 12), new THREE.MeshStandardMaterial({ color: '#6B4A3A', emissive: '#3A241A', emissiveIntensity: 0.5 }));
  scar.position.copy(pimPos).multiplyScalar(1.02); scar.scale.setScalar(0.001); xh.head.add(scar);
  // danger-triangle anchors (head-local): nasal bridge + two mouth corners
  const TRI = [V3(0, 0.075, 0.104), V3(-0.05, -0.048, 0.088), V3(0.05, -0.048, 0.088)];
  const tw = (v) => xh.head.localToWorld(v.clone());
  // danger-triangle gold lines (3D tubes, opacity-gated)
  const mkMat = (c, e) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: 0, transparent: true, opacity: 0, depthWrite: false });
  const lineMat = mkMat('#FFD43B', '#FFD43B');
  const triLines = [];
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
    const va = TRI[a], vb = TRI[b], mid = va.clone().add(vb).multiplyScalar(0.5);
    const len = va.distanceTo(vb);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, len, 8), lineMat);
    t.position.copy(mid); t.quaternion.setFromUnitVectors(V3(0, 1, 0), vb.clone().sub(va).normalize());
    xh.head.add(t); triLines.push(t);
  }
  // valveless vein paths: 3 thin tubes rising from the triangle toward the skull (eye level)
  const veinMat = mkMat('#FFC96B', '#E8A24F');
  const VEIN_ENDS = [V3(-0.045, 0.125, 0.075), V3(0.0, 0.14, 0.05), V3(0.045, 0.125, 0.075)];
  const veins = TRI.map((a, i) => {
    const b = VEIN_ENDS[i], mid = a.clone().add(b).multiplyScalar(0.5);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, a.distanceTo(b), 8), veinMat);
    v.position.copy(mid); v.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
    xh.head.add(v); return v;
  });
  // brain-signal bead that rides the middle vein up on "toward your brain"
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), new THREE.MeshStandardMaterial({ color: '#FF8A5A', emissive: '#FF5A3A', emissiveIntensity: 1.2 }));
  bead.scale.setScalar(0.001); xh.head.add(bead);
  const FACE3 = V3(0, 1.60, 0.10);
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const xReset = (lineK = 0, veinK = 0) => {
    xh.pose({ spine: [2, 0, 0], lid: 0.35, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
    pim.material.emissiveIntensity = 1.0; pim.scale.setScalar(1);
    lineMat.opacity = lineK; veinMat.opacity = veinK;
    scar.scale.setScalar(0.001); bead.scale.setScalar(0.001);
    triLines.forEach((t) => t.scale.set(1, 1, 1)); veins.forEach((v) => v.scale.set(1, 1, 1));
  };

  // ── world P · inside the pore (macro) ─────────────────────────────────
  const P = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1E0A10');
    scene.add(new THREE.HemisphereLight('#FFD9C2', '#1E0A10', 1.15));
    const key = new THREE.DirectionalLight('#FFF0E0', 1.3); key.position.set(1.4, 1.8, 2.6); scene.add(key);
    const rim = new THREE.DirectionalLight('#E88A6A', 1.1); rim.position.set(-1.8, 0.5, -1.6); scene.add(rim);
    // skin tissue dome: big sphere behind the pore (smooth warm-pink backdrop)
    const wall = new THREE.Mesh(new THREE.SphereGeometry(3.0, 48, 32), new THREE.MeshStandardMaterial({ color: '#D98A76', roughness: 0.8, side: THREE.BackSide }));
    wall.position.z = -1.05; scene.add(wall);
    // pore mouth rim (skin-colored torus on the surface)
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 14, 48), new THREE.MeshStandardMaterial({ color: '#E09A85', roughness: 0.55 }));
    mouth.position.z = 1.98; scene.add(mouth);
    // inflamed red halo (glow ring, grows with swelling)
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 14, 48), new THREE.MeshStandardMaterial({ color: '#E8555F', emissive: '#B22A3A', emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }));
    halo.position.z = 2.06; scene.add(halo);
    // pore channel: dark tube from the surface down into the skin
    const channel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 1.5, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#4A221B', roughness: 0.9, side: THREE.DoubleSide }));
    channel.rotation.x = Math.PI / 2; channel.position.z = 1.25; scene.add(channel);
    // clog plug (oil + dead skin = one dark plug sitting INSIDE the channel mouth)
    const plug = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), new THREE.MeshPhysicalMaterial({ color: '#5A3A22', roughness: 0.75, clearcoat: 0.2 }));
    plug.scale.set(1, 1, 0.55); plug.position.z = 1.35; scene.add(plug);
    // sebum pool inside the channel (pale yellow, fills below the plug)
    const sebum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.7, 32), new THREE.MeshPhysicalMaterial({ color: '#E4D26A', transparent: true, opacity: 0.4, roughness: 0.2, emissive: '#B99A2A', emissiveIntensity: 0.08, clearcoat: 1 }));
    sebum.rotation.x = Math.PI / 2; sebum.position.z = 1.0; scene.add(sebum);
    // bacteria (teal dots; multiply on demand)
    const germs = [];
    const gMat = new THREE.MeshStandardMaterial({ color: '#4FE8B0', emissive: '#2FBF80', emissiveIntensity: 0.55 });
    for (let i = 0; i < 12; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), gMat); g.scale.setScalar(0.001); scene.add(g); germs.push(g); }
    // pus flood (yellow-white emissive glow rising around the plug)
    const pus = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 20), new THREE.MeshPhysicalMaterial({ color: '#EDE28A', emissive: '#C9B23A', emissiveIntensity: 0.4, transparent: true, opacity: 0.8, roughness: 0.25, clearcoat: 1 }));
    pus.scale.setScalar(0.001); pus.position.z = 1.3; scene.add(pus);
    // deep abscess blob (forms when pus is shoved deeper, at the channel end)
    const deep = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), new THREE.MeshPhysicalMaterial({ color: '#C43A4A', emissive: '#8A1428', emissiveIntensity: 0.95, roughness: 0.4 }));
    deep.position.z = 0.5; deep.scale.setScalar(0.001); scene.add(deep);
    // fingers: two pale capsules squeezing from upper left / right
    const fingerMat = new THREE.MeshPhysicalMaterial({ color: '#F2C9A8', roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#ffd6c2') });
    const fL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 8, 20), fingerMat), fR = fL.clone();
    scene.add(fL, fR);
    // benzoyl peroxide gel droplets (white, drop onto the plug)
    const drops = [];
    const dMat = new THREE.MeshPhysicalMaterial({ color: '#F4FBFF', roughness: 0.15, clearcoat: 1, emissive: '#BFD8E8', emissiveIntensity: 0.3 });
    for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.045 + 0.02 * R(i), 10, 8), dMat); d.scale.setScalar(0.001); d.userData = { x: (R(i + 30) * 2 - 1) * 0.18, y: 1.7 + R(i + 50) * 0.6, z: 1.48 }; scene.add(d); drops.push(d); }
    // tissue detail: faint folds + drifting particles (deterministic, behind the pore)
    const folds = [];
    const foldMat = new THREE.MeshStandardMaterial({ color: '#C0705A', roughness: 0.85, transparent: true, opacity: 0.4, emissive: '#6A2E1E', emissiveIntensity: 0.14 });
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.06 + 0.03 * R(i), 8, 40, 0.8 + 0.7 * R(i + 40)), foldMat); f.position.set((R(i + 7) * 2 - 1) * 1.2, -0.6 + R(i + 13) * 1.8, -0.9 - R(i + 21) * 0.8); f.rotation.set(R(i + 5) * 2.4 - 1.2, R(i + 11) * 2.4 - 1.2, i * 0.8); scene.add(f); folds.push(f); }
    const parts = [];
    const pMat = new THREE.MeshStandardMaterial({ color: '#F2D9A0', emissive: '#C8A86A', emissiveIntensity: 0.5, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 26; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03 + 0.024 * R(i + 60), 8, 6), pMat); p.userData.b = [(R(i) * 2 - 1) * 2.0, -1.4 + R(i + 3) * 2.6, -0.4 - R(i + 6) * 1.4]; scene.add(p); parts.push(p); }
    return { scene, halo, plug, sebum, germs, pus, deep, fL, fR, drops, folds, parts, key };
  })();
  const pRender = (lookAt, extra = {}) => E.render(P.scene, cam, { ...PLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  // pore state helper (pure per-frame)
  const pReset = (lt = 0, o = {}) => {
    const { plugZ = 1.35, plugK = 1, pusK = 0, pusZ = 1.3, haloI = 0.35, haloK = 1, deepK = 0, germShow = 0, germSeed = 0, finK = 0, gelK = 0, sebumO = 0.4 } = o;
    P.plug.position.z = plugZ; P.plug.scale.set(0.55 + 0.45 * plugK, 0.55 + 0.45 * plugK, 0.55 * plugK);
    P.sebum.material.opacity = sebumO;
    P.pus.scale.setScalar(Math.max(0.001, pusK)); P.pus.position.z = pusZ;
    P.deep.scale.setScalar(Math.max(0.001, deepK));
    P.halo.material.emissiveIntensity = haloI; P.halo.scale.setScalar(haloK);
    P.halo.material.opacity = haloI > 0.02 ? 0.9 : 0.0;
    P.germs.forEach((g, i) => { g.scale.setScalar(germShow ? (0.5 + 0.4 * Math.sin(i * 1.7)) * eio(clamp(seg(lt, 0.15 + i * 0.16 + germSeed, 0.45 + i * 0.16 + germSeed))) : 0.001); const a = i / 12 * Math.PI * 2; g.position.set(Math.cos(a) * (0.26 + (i % 3) * 0.05), Math.sin(a) * (0.24 + (i % 4) * 0.05), 0.95 + (i % 4) * 0.08); });
    const fin = finK;
    // fingers rest OFF-frame (upper sides), press inward toward the pore mouth as finK grows
    const aim = (f, sx) => { const p0 = V3(sx * 3.0, 1.5, 1.95), tip = V3(sx * 0.68, 0.14, 1.95); f.position.copy(p0).lerp(tip, fin); f.quaternion.setFromUnitVectors(V3(0, 1, 0), tip.clone().sub(p0).normalize()); };
    aim(P.fL, -1); aim(P.fR, 1);
    P.fL.visible = P.fR.visible = finK > 0.02;
    P.drops.forEach((d, i) => { const kk = gelK > 0 ? eio(clamp(seg(lt, gelK + i * 0.13, gelK + i * 0.13 + 0.35))) : 0; d.scale.setScalar(Math.max(0.001, kk)); d.position.set(d.userData.x, lerp(d.userData.y, 0.14, kk), d.userData.z); });
    P.parts.forEach((p, i) => { const b = p.userData.b; p.position.set(b[0] + 0.16 * Math.sin(lt * 0.7 + i * 1.1), b[1] + 0.28 * Math.sin(lt * 0.5 + i * 1.3), b[2] + 0.16 * Math.cos(lt * 0.6 + i * 0.7)); });
    P.key.intensity = 1.3;
  };

  // ── world V · inside a vein (infection travel + rare clot) ────────────
  const V = SETS.vessel(E);
  const germs2 = [];
  const g2Mat = new THREE.MeshStandardMaterial({ color: '#4FE8B0', emissive: '#2FBF80', emissiveIntensity: 1.35 });
  for (let i = 0; i < 7; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), g2Mat); g.scale.setScalar(0.001); V.scene.add(g); germs2.push(g); }
  const clot = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), new THREE.MeshPhysicalMaterial({ color: '#7A1030', emissive: '#4A0618', emissiveIntensity: 0.8, roughness: 0.5 }));
  clot.scale.setScalar(0.001); V.scene.add(clot);
  const vRender = (lookAt, extra = {}) => E.render(V.scene, cam, { ...VLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  // ─────────────────────────────────────────────────────────── shots ───
  // 1 · HOOK: the pimple (x-ray face, red dome pulses on the cheek)
  { const st = cut(0), pimW = Wd('pimple', 0) - st;
    add({ id: 'S01', at: st, note: 'x-ray face: red pimple pulses on the cheek, camera drifts in', draw(lt, d, t, blit) {
      xReset();
      pim.material.emissiveIntensity = 1.0 + 0.5 * Math.sin(lt * 4.2);
      cam.position.copy(lerpV(V3(0.5, 1.72, 1.5), V3(0.3, 1.64, 1.05), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.25, pimW), 'tock', { gain: 0.45 }); }

  // 2 · a pimple starts when a pore gets clogged (x-ray face: label anchored on the pimple)
  { const st = cut(1), por = Wd('pore', 1) - st, clg = Wd('clogged', 1) - st;
    add({ id: 'S02', at: st, note: 'x-ray face: PORE label anchored to the pimple, CLOGGED pill', draw(lt, d, t, blit) {
      xReset();
      pim.material.emissiveIntensity = 1.0 + 0.4 * Math.sin(lt * 3.4);
      cam.position.copy(lerpV(V3(0.38, 1.66, 1.15), V3(0.22, 1.63, 0.95), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      label('A PORE', 800, 560, ...screen(tw(pimPos), cam), eob(seg(lt, Math.max(0.2, por), por + 0.35)));
      pill('GETS CLOGGED', 540, 1180, eob(seg(lt, Math.max(0.3, clg), clg + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, clg), 'thud', { gain: 0.4 }); }

  // 3 · oil + dead skin plug it shut (PORE macro: plug drops into the channel)
  { const st = cut(2), dead = Wd('dead', 2) - st, sht = Wd('shut', 2) - st;
    add({ id: 'S03', at: st, note: 'pore macro: dark plug drops into the channel, OIL + DEAD SKIN pill', draw(lt, d, t, blit) {
      pReset(lt, { plugZ: lerp(2.7, 1.35, eio(clamp(seg(lt, 0.2, sht + 0.2)))), pusK: 0, haloI: 0.3, germShow: 0 });
      cam.position.copy(lerpV(V3(0.0, 0.25, 4.25), V3(0.0, 0.18, 3.95), eio(lt / d))); cam.lookAt(V3(0, 0.05, 1.35));
      pRender(V3(0, 0.05, 1.35)); blit();
      label('A PORE', 800, 400, ...screen(V3(0, 0.55, 1.98), cam), eob(seg(lt, 0.15, 0.4)));
      pill('OIL + DEAD SKIN', 540, 1330, eob(seg(lt, Math.max(0.25, dead), dead + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.25, sht), 'thud', { gain: 0.45 }); }

  // 4 · bacteria multiply (PORE macro: teal germs pop in around the plug)
  { const st = cut(3), bac = Wd('Bacteria', 3) - st, mlt = Wd('multiply', 3) - st;
    add({ id: 'S04', at: st, note: 'pore macro: teal germs multiply under the plug, MULTIPLY label', draw(lt, d, t, blit) {
      pReset(lt, { plugZ: 1.35, pusK: 0, haloI: 0.5, haloK: 1.06, germShow: 1, germSeed: Math.max(0.15, bac) - 0.15 });
      cam.position.copy(lerpV(V3(-0.25, 0.15, 3.8), V3(0.05, 0.12, 3.55), eio(lt / d))); cam.lookAt(V3(0, 0.05, 1.2));
      pRender(V3(0, 0.05, 1.2)); blit();
      label('INSIDE THE CLOG', 800, 400, ...screen(V3(0, 0.3, 1.15), cam), eob(seg(lt, Math.max(0.2, bac), bac + 0.35)));
      pill('BACTERIA MULTIPLY', 540, 1330, eob(seg(lt, Math.max(0.25, mlt), mlt + 0.35)), '#FF8A8A');
    } });
    [0.35, 0.75, 1.15].forEach((o) => cue(st + o, 'tock', { gain: 0.35 })); cue(Math.max(st + 0.3, mlt), 'alarm', { dur: 0.6, gain: 0.25 }); }

  // 5 · your body fights back with pus (PORE macro: pus floods in, halo flares)
  { const st = cut(4), fig = Wd('fights', 4) - st, ps = Wd('pus', 4) - st;
    add({ id: 'S05', at: st, note: 'pore macro: glowing pus floods the channel, halo flares red', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.2, ps - 0.15), ps + 0.5)));
      pReset(lt, { plugZ: 1.35, pusK: k, haloI: 0.5 + 0.6 * k, haloK: 1.06 + 0.1 * k, germShow: 1, germSeed: 0.2 });
      cam.position.copy(lerpV(V3(0.2, 0.2, 4.15), V3(-0.08, 0.15, 3.9), eio(lt / d))); cam.lookAt(V3(0, 0.08, 1.3));
      pRender(V3(0, 0.08, 1.3)); blit();
      pill('BODY MAKES PUS', 540, 1330, eob(seg(lt, Math.max(0.25, ps), ps + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.2, fig), 'sizzle', { dur: 1.2, gain: 0.3 }); }

  // 6 · so you squeeze it out (PORE macro: two fingers press in from the upper sides)
  { const st = cut(5), sqz = Wd('squeeze', 5) - st;
    add({ id: 'S06', at: st, note: 'pore macro: two fingers press the pore from upper sides', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, 0.1, Math.max(0.5, sqz + 0.3))));
      pReset(lt, { plugZ: 1.35 - 0.1 * k, pusK: 1, haloI: 1.05, haloK: 1.16, germShow: 1, germSeed: 0.2, finK: k });
      cam.position.copy(lerpV(V3(0.0, 0.3, 4.15), V3(0.0, 0.2, 3.9), eio(lt / d))); cam.lookAt(V3(0, 0.1, 1.5));
      pRender(V3(0, 0.1, 1.5)); blit();
      pill('SO YOU SQUEEZE IT', 540, 1330, eob(seg(lt, Math.max(0.2, sqz), sqz + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.25, sqz), 'slide', { gain: 0.4 }); }

  // 7 · squeezing pushes the pus deeper (PORE macro: fingers crush, deep blob grows on "deeper")
  { const st = cut(6), psh = Wd('pushes', 6) - st, dp = Wd('deeper', 6) - st;
    add({ id: 'S07', at: st, note: 'pore macro: fingers crush, pus squeezed down the channel, deep blob grows on "deeper"', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.15, psh), dp + 0.45)));
      pReset(lt, { plugZ: 1.3, pusK: Math.max(0.001, 1 - 0.95 * k), pusZ: lerp(1.3, 0.72, k), haloI: 1.2, haloK: 1.2, deepK: k * 1.3, finK: 0.8 + 0.25 * Math.sin(lt * 9), sebumO: 0.3 });
      cam.position.copy(lerpV(V3(0.3, 0.22, 4.0), V3(-0.12, 0.15, 3.75), eio(lt / d))); cam.lookAt(V3(0, 0.02, 1.05));
      pRender(V3(0, 0.02, 1.05)); blit();
      pill('PUS PUSHED DEEPER', 540, 1330, eob(seg(lt, Math.max(0.25, dp), dp + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, psh), 'thud', { gain: 0.5 }); cue(Math.max(st + 0.3, dp), 'alarm', { dur: 0.8, gain: 0.35 }); }

  // 8 · more swelling and redness (PORE macro: red halo blooms wide)
  { const st = cut(7), sw = Wd('swelling', 7) - st, rd = Wd('redness', 7) - st;
    add({ id: 'S08', at: st, note: 'pore macro: inflamed halo blooms wide and bright on "redness"', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, 0.1, Math.max(0.6, rd + 0.4))));
      pReset(lt, { plugZ: 1.3, pusK: 0.2, haloI: 0.8 + 0.7 * k, haloK: 1.2 + 0.35 * k, deepK: 0.9, germShow: 1, germSeed: 0.2 });
      cam.position.copy(lerpV(V3(-0.12, 0.28, 4.45), V3(0.1, 0.2, 4.15), eio(lt / d))); cam.lookAt(V3(0, 0.1, 1.35));
      pRender(V3(0, 0.1, 1.35)); blit();
      pill('MORE SWELLING + REDNESS', 540, 1330, eob(seg(lt, Math.max(0.25, rd), rd + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, rd), 'alarm', { dur: 0.9, gain: 0.35 }); }

  // 9 · permanent scar (x-ray face: dark dot stays where the pimple was)
  { const st = cut(8), lv = Wd('leave', 8) - st, sc = Wd('scar', 8) - st;
    add({ id: 'S09', at: st, note: 'x-ray face: scar dot fades in on the cheek, PERMANENT pill', draw(lt, d, t, blit) {
      xReset();
      const k = eio(clamp(seg(lt, Math.max(0.2, sc - 0.1), sc + 0.4)));
      scar.scale.setScalar(Math.max(0.001, k)); pim.scale.setScalar(Math.max(0.001, 1 - 0.7 * k));
      pim.material.emissiveIntensity = 1.0 - 0.7 * k;
      cam.position.copy(lerpV(V3(0.35, 1.68, 1.2), V3(0.24, 1.62, 0.98), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      label('SCAR', 770, 600, ...screen(tw(pimPos), cam), eob(seg(lt, Math.max(0.25, sc), sc + 0.35)));
      pill('PERMANENT', 540, 1180, eob(seg(lt, Math.max(0.3, sc), sc + 0.4)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, sc), 'thud', { gain: 0.45 }); }

  // 10 · one more reason to stop (x-ray face: gold danger triangle draws itself)
  { const st = cut(9), stp = Wd('stop', 9) - st;
    add({ id: 'S10', at: st, note: 'x-ray face: gold triangle lines glow between nose bridge and mouth corners', draw(lt, d, t, blit) {
      xReset(1);
      triLines.forEach((tl, i) => { const k = eio(clamp(seg(lt, 0.3 + i * 0.3, 0.75 + i * 0.3))); tl.scale.set(1, Math.max(0.001, k), 1); });
      pim.material.emissiveIntensity = 0.9;
      cam.position.copy(lerpV(V3(0.15, 1.62, 1.05), V3(-0.05, 1.6, 0.9), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('ONE MORE REASON TO STOP', 540, 1180, eob(seg(lt, Math.max(0.3, stp), stp + 0.35)), '#FFD43B');
    } });
    [0.5, 0.9].forEach((o) => cue(st + o, 'sparkle', { gain: 0.3 })); }

  // 11 · veins with no valves (x-ray face: gold vein tubes glow upward from the triangle)
  { const st = cut(10), vns = Wd('veins', 10) - st, vls = Wd('valves', 10) - st;
    add({ id: 'S11', at: st, note: 'x-ray face: three gold vein tubes glow from the triangle up toward the eyes', draw(lt, d, t, blit) {
      xReset(1, 0.35 + 0.65 * eio(clamp(seg(lt, Math.max(0.2, vls - 0.1), vls + 0.4))));
      triLines.forEach((tl) => tl.scale.set(1, 1, 1));
      veins.forEach((v, i) => { const k = eio(clamp(seg(lt, Math.max(0.2, vns + i * 0.15), vns + i * 0.15 + 0.45))); v.scale.set(1, Math.max(0.001, k), 1); });
      cam.position.copy(lerpV(V3(-0.2, 1.58, 1.0), V3(0.1, 1.6, 0.88), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('NO VALVES', 540, 1180, eob(seg(lt, Math.max(0.3, vls), vls + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, vns), 'slide', { gain: 0.45 }); }

  // 12 · straight toward your brain (x-ray face: bead rides a vein up to the eye level)
  { const st = cut(11), twd = Wd('toward', 11) - st, brn = Wd('brain', 11) - st;
    add({ id: 'S12', at: st, note: 'x-ray face: gold bead climbs the middle vein toward the skull, label CAVERNOUS SINUS', draw(lt, d, t, blit) {
      xReset(1, 1);
      triLines.forEach((tl) => tl.scale.set(1, 1, 1));
      veins.forEach((v) => v.scale.set(1, 1, 1));
      const kk = eio(clamp(seg(lt, Math.max(0.2, twd), brn + 0.35)));
      bead.scale.setScalar(Math.max(0.001, kk));
      bead.position.copy(TRI[1].clone().lerp(VEIN_ENDS[1], kk));
      cam.position.copy(lerpV(V3(0.15, 1.5, 1.15), V3(-0.05, 1.62, 0.92), eio(lt / d))); cam.lookAt(V3(0, 1.62, 0.1));
      xRender(V3(0, 1.62, 0.1)); blit();
      label('CAVERNOUS SINUS', 800, 520, ...screen(tw(VEIN_ENDS[1]), cam), eob(seg(lt, Math.max(0.3, brn), brn + 0.4)));
      pill('TOWARD YOUR BRAIN', 540, 1180, eob(seg(lt, Math.max(0.35, brn), brn + 0.4)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, twd), 'slide', { gain: 0.45 }); cue(Math.max(st + 0.35, brn), 'alarm', { dur: 0.8, gain: 0.35 }); }

  // 13 · very rarely spread inward (VEIN world: infection dots drift, rare clot forms — hedged)
  { const st = cut(12), rar = Wd('rarely', 12) - st, inw = Wd('inward', 12) - st;
    add({ id: 'S13', at: st, note: 'vein world: teal infection dots drift past red cells, ONE clot bead grows slowly + warning, VERY RARELY pill', draw(lt, d, t, blit) {
      const cz = 0.5 - eio(lt / d) * 1.6;
      V.update(lt, cz, 0, 0.15);
      germs2.forEach((g, i) => { const on = eio(clamp(seg(lt, Math.max(0.15, rar - 0.1 + i * 0.2), rar + 0.1 + i * 0.2))); g.scale.setScalar(Math.max(0.001, on * 0.9)); g.position.set(Math.cos(i * 2.3) * 0.5, Math.sin(i * 1.7) * 0.4, cz - 1.2 - i * 0.9); });
      const ck = eio(clamp(seg(lt, Math.max(0.3, inw - 0.05), inw + 0.5)));
      clot.scale.setScalar(Math.max(0.001, ck * 0.75)); clot.position.set(0, 0.15, cz - 1.35);
      cam.position.set(0, 0, cz); cam.lookAt(V3(0, 0.1, cz - 2));
      vRender(V3(0, 0.1, cz - 2)); blit();
      warning(540, 300, eob(seg(lt, Math.max(0.35, inw), inw + 0.4)) * 0.9);
      pill('VERY RARELY', 540, 1330, eob(seg(lt, Math.max(0.3, rar), rar + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.25, rar), 'sizzle', { dur: 1.0, gain: 0.3 }); cue(Math.max(st + 0.35, inw), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 14 · the real fix is patience (x-ray face calm, gold pill)
  { const st = cut(13), fx = Wd('fix', 13) - st, pat = Wd('patience', 13) - st;
    add({ id: 'S14', at: st, note: 'x-ray face calm: lines/veins fade, warm settle, THE FIX: PATIENCE pill', draw(lt, d, t, blit) {
      const warm = eio(clamp(lt / d));
      xReset(1 - warm, 1 - warm);
      triLines.forEach((tl) => tl.scale.set(1, 1, 1)); veins.forEach((v) => v.scale.set(1, 1, 1));
      pim.material.emissiveIntensity = 0.9 - 0.4 * warm;
      cam.position.copy(lerpV(V3(-0.1, 1.62, 1.15), V3(0.12, 1.6, 0.95), warm)); cam.lookAt(FACE3);
      xRender(FACE3, { exposure: lerp(1, 0.85, warm), vignette: lerp(0.45, 0.55, warm) }); blit();
      pill('THE FIX: PATIENCE', 540, 1180, eob(seg(lt, Math.max(0.25, pat), pat + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, pat), 'sparkle', { gain: 0.4 }); }

  // 15 · leave it alone, it heals (PORE macro: halo fades, plug softens, skin calms)
  { const st = cut(14), aln = Wd('alone', 14) - st, hls = Wd('heals', 14) - st;
    add({ id: 'S15', at: st, note: 'pore macro: red halo fades, sebum clears, tissue calms on "heals"', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.2, aln), hls + 0.5)));
      pReset(lt, { plugZ: 1.35, pusK: 0.25 * (1 - k), haloI: 0.5 * (1 - k), haloK: 1.06 - 0.06 * k, germShow: 0, sebumO: 0.4 - 0.3 * k });
      cam.position.copy(lerpV(V3(0.0, 0.25, 4.25), V3(0.0, 0.18, 3.95), eio(lt / d))); cam.lookAt(V3(0, 0.05, 1.35));
      pRender(V3(0, 0.05, 1.35)); blit();
      pill('LEAVE IT ALONE ✓', 540, 1180, eob(seg(lt, Math.max(0.25, aln), aln + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, hls), 'boing', { gain: 0.35 }); }

  // 16 · benzoyl peroxide dries it out faster (PORE macro: white gel drops fall, plug shrinks)
  { const st = cut(15), bzo = Wd('Benzoyl', 15) - st, fst = Wd('faster', 15) - st;
    add({ id: 'S16', at: st, note: 'pore macro: white gel droplets fall on the plug, plug shrinks + halo fades', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.2, bzo), fst + 0.5)));
      pReset(lt, { plugZ: 1.35, plugK: 1 - 0.55 * k, pusK: 0, haloI: 0.35 * (1 - k), haloK: 1.02, germShow: 0, sebumO: 0.4 * (1 - k), gelK: Math.max(0.25, bzo - 0.1) });
      cam.position.copy(lerpV(V3(0.0, 0.35, 4.3), V3(0.0, 0.25, 4.0), eio(lt / d))); cam.lookAt(V3(0, 0.1, 1.4));
      pRender(V3(0, 0.1, 1.4)); blit();
      label('BENZOYL PEROXIDE', 780, 400, ...screen(V3(0, 0.55, 1.98), cam), eob(seg(lt, Math.max(0.25, bzo), bzo + 0.35)));
      pill('DRIES IT OUT FASTER', 540, 1330, eob(seg(lt, Math.max(0.3, fst), fst + 0.35)), '#7CF29A');
    } });
    [0.4, 0.7, 1.0].forEach((o) => cue(st + o, 'pop', { gain: 0.25 })); cue(Math.max(st + 0.3, fst), 'sparkle', { gain: 0.35 }); }

  // 17 · payoff: your skin will thank you (x-ray face clear, gold pill)
  { const st = cut(16), thx = Wd('thank', 16) - st;
    add({ id: 'S17', at: st, note: 'x-ray face settle: pimple dot shrinks away, gold payoff pill', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      xReset();
      pim.scale.setScalar(Math.max(0.001, 1 - 0.95 * k)); pim.material.emissiveIntensity = 0.9 * (1 - k);
      cam.position.copy(lerpV(V3(0.28, 1.66, 1.2), V3(-0.08, 1.6, 1.0), k)); cam.lookAt(FACE3);
      xRender(FACE3, { exposure: lerp(1, 0.85, k), vignette: lerp(0.45, 0.55, k) }); blit();
      pill('YOUR SKIN THANKS YOU ✓', 540, 1180, eob(seg(lt, Math.max(0.25, thx), thx + 0.4)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, thx), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
