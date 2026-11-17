// WHAT HAPPENS IF YOU DRINK TOO MUCH WATER? : shot list (Deep Dive 3D).
// World flow: x-ray FIGURE gulping from a water bottle (hook) → kidneys label + ONE LITER/HOUR pills
// → VEIN world (grey water bubbles flood the blood = backs up + diluted) → gold sodium dots fade out
// → CELL MACRO (blue water drops fly in, the big cell swells, holds: most cells cope) → SKULL world
// (translucent skull + brain: brain cells cannot, gold box = closed skull, brain swells, pressure
// glow, headache/confusion/seizures, warning: can be fatal) → x-ray figure chugs fast (marathon +
// contest deaths, hedged "proved it") → calm payoff (sip, don't flood).
// Facts: Wikipedia Water intoxication (accessed 2026-11-17: kidneys excrete ~800 mL-1 L/hour; fluid
// moves into cells to balance osmosis → cells swell; intracranial pressure → headache, confusion,
// seizures, death; contest + marathon deaths; 13% of 2002 Boston Marathon runners hyponatremic);
// Wikipedia Hyponatremia (sodium < 135 mmol/L, the salt balancing fluids); Almond NEJM 2005 (Boston
// Marathon study); US Army guidance (1-1.5 L/hour cap under heavy sweating).
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
  const VLOOK = { aperture: 0.0018, bloom: 0.5, bloomThreshold: 0.45, vignette: 0.5 };
  const CLOOK = { aperture: 0.002, maxblur: 0.012, bloom: 0.5, bloomThreshold: 0.42, vignette: 0.55 };
  const SLOOK = { aperture: 0.0016, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.5 };

  // ── world X · x-ray figure with a water bottle ────────────────────────
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial();
  xh.setBodyMaterial(xmat);
  X.scene.add(xh.group);
  xh.head.children.forEach((c) => { if (c.isMesh && Math.abs(c.position.x) < 0.01) c.material = xmat; });
  xh.head.traverse((c) => { if (c.isMesh && Math.abs(c.position.z - 0.091) < 0.01) { c.material = new THREE.MeshStandardMaterial({ color: '#9BE8FF', emissive: '#57C8F0', emissiveIntensity: 0.5 }); } });
  // water bottle: translucent body + neck + cap, held near the mouth
  const bottle = new THREE.Group();
  const bMat = new THREE.MeshPhysicalMaterial({ color: '#8ED8F2', transparent: true, opacity: 0.55, roughness: 0.15, clearcoat: 1, emissive: '#3F9FC8', emissiveIntensity: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.15, 20), bMat);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.035, 16), bMat);
  neck.position.y = 0.09;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.016, 16), new THREE.MeshStandardMaterial({ color: '#3FA8E8', emissive: '#1F78B8', emissiveIntensity: 0.5 }));
  cap.position.y = 0.115;
  bottle.add(body, neck, cap);
  bottle.position.set(0.13, 0.05, 0.15); bottle.rotation.z = -0.9; xh.head.add(bottle);
  // water drops inside the bottle that pour toward the mouth (glug)
  const drops = [];
  const dMat = new THREE.MeshPhysicalMaterial({ color: '#9FE8FF', emissive: '#4FC8F0', emissiveIntensity: 0.6, roughness: 0.2, clearcoat: 1 });
  for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.008 + 0.004 * R(i), 10, 8), dMat); d.userData.ph = R(i + 20) * 2; d.scale.setScalar(0.001); xh.head.add(d); drops.push(d); }
  const FACE3 = V3(0, 1.60, 0.10), TORSO3 = V3(0, 1.18, 0.02);
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const xReset = (o = {}) => {
    const { lid = 0.35, lean = 2, sway = 0, bottleK = 0 } = o;
    xh.pose({ spine: [lean, 0, sway], lid, shL: [6, 0, 5], shR: [40, 10, 20], elR: 60 });
    bottle.scale.setScalar(Math.max(0.001, bottleK * 1.3));
    bottle.rotation.x = -0.5 * bottleK;
  };

  // ── world V · blood vessel (water flood + sodium dots) ────────────────
  const V = SETS.vessel(E);
  const na = []; // sodium beads riding with the cells, fade out on "drops"
  const naMat = new THREE.MeshStandardMaterial({ color: '#FFD43B', emissive: '#D89E00', emissiveIntensity: 1.2 });
  for (let i = 0; i < 9; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), naMat); n.scale.setScalar(0.001); V.scene.add(n); na.push(n); }
  const vRender = (lookAt, extra = {}) => E.render(V.scene, cam, { ...VLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  // ── world C · cell macro (one big cell that swells) ───────────────────
  const C = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#2A0A14');
    scene.fog = new THREE.Fog('#2A0A14', 6, 11);
    scene.add(new THREE.HemisphereLight('#FFD9E2', '#2A0A14', 1.1));
    const key = new THREE.DirectionalLight('#FFF0E8', 1.25); key.position.set(1.6, 2.0, 2.8); scene.add(key);
    const rim = new THREE.DirectionalLight('#E87A9A', 0.9); rim.position.set(-2, 0.4, -1.6); scene.add(rim);
    // plasma backdrop
    const plasma = new THREE.Mesh(new THREE.SphereGeometry(6.5, 48, 32), new THREE.MeshStandardMaterial({ color: '#3A1220', roughness: 0.9, side: THREE.BackSide }));
    scene.add(plasma);
    // the cell: big translucent pink ball with a membrane + nucleus
    const cell = new THREE.Group();
    const membrane = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 36), new THREE.MeshPhysicalMaterial({ color: '#F0A8B8', transparent: true, opacity: 0.55, roughness: 0.25, clearcoat: 1, emissive: '#B86A80', emissiveIntensity: 0.18 }));
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#D87890', roughness: 0.4, clearcoat: 0.8, emissive: '#8A3A55', emissiveIntensity: 0.35 }));
    cell.add(membrane, nucleus); cell.position.set(0, -0.45, 0); scene.add(cell);
    // sodium dots (gold) sitting ON the membrane surface (true spherical coords)
    const na2 = [];
    for (let i = 0; i < 18; i++) {
      const phi = 0.2 + R(i + 31) * 1.1, th = R(i + 43) * Math.PI * 2;
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.075 + 0.035 * R(i + 51), 14, 10), new THREE.MeshStandardMaterial({ color: '#FFD43B', emissive: '#D89E00', emissiveIntensity: 1.2 }));
      n.userData.base = V3(1.52 * Math.sin(phi) * Math.cos(th), -0.45 + 1.52 * Math.cos(phi), 1.52 * Math.sin(phi) * Math.sin(th));
      scene.add(n); na2.push(n);
    }
    // water drops (blue) that fly into the cell
    const wat = [];
    const wMat = new THREE.MeshPhysicalMaterial({ color: '#9FE8FF', emissive: '#4FC8F0', emissiveIntensity: 0.7, roughness: 0.2, clearcoat: 1 });
    for (let i = 0; i < 10; i++) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.12 + 0.045 * R(i + 61), 12, 10), wMat); w.userData.from = V3((R(i + 71) * 2 - 1) * 0.9, 1.0 + R(i + 81) * 1.2, 2.4); w.userData.seed = R(i + 91) * 2.2; w.scale.setScalar(0.001); scene.add(w); wat.push(w); }
    // drifting particles
    const parts = [];
    const pMat = new THREE.MeshStandardMaterial({ color: '#E8B8C8', emissive: '#A86878', emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 20; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03 + 0.022 * R(i + 101), 8, 6), pMat); p.userData.b = [(R(i) * 2 - 1) * 2.4, -1 + R(i + 3) * 2.4, -0.3 - R(i + 6) * 1.6]; scene.add(p); parts.push(p); }
    return { scene, cell, na2, wat, parts };
  })();
  const cRender = (lookAt, extra = {}) => E.render(C.scene, cam, { ...CLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const cReset = (lt = 0, o = {}) => {
    const { sw = 1, naK = 1, watK = 0 } = o;
    C.cell.scale.setScalar(sw);
    C.na2.forEach((n, i) => {
      const bob = 0.04 * Math.sin(lt * 1.4 + i);
      n.position.copy(n.userData.base).multiplyScalar(sw).add(V3(0, bob, 0));
      n.scale.setScalar(Math.max(0.001, naK * (0.7 + 0.3 * Math.sin(lt * 2 + i))));
    });
    C.wat.forEach((w, i) => {
      const k = eio(clamp(seg(lt, w.userData.seed + i * 0.12, w.userData.seed + i * 0.12 + 0.5))) * watK;
      w.scale.setScalar(Math.max(0.001, k * (k > 0.92 ? (1 - k) * 12 : 1)));
      w.position.copy(w.userData.from).lerp(V3(0, -0.4, 1.5), k);
    });
    C.parts.forEach((p, i) => { const b = p.userData.b; p.position.set(b[0] + 0.15 * Math.sin(lt * 0.6 + i * 1.1), b[1] + 0.24 * Math.sin(lt * 0.45 + i * 1.3), b[2] + 0.15 * Math.cos(lt * 0.5 + i * 0.7)); });
  };

  // ── world S · skull (translucent skull + brain + closed box) ──────────
  const S2 = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07121F');
    scene.fog = new THREE.Fog('#07121F', 6, 12);
    scene.add(new THREE.HemisphereLight('#BFE8FF', '#07121F', 0.8));
    const key = new THREE.DirectionalLight('#E8F6FF', 1.4); key.position.set(1.6, 2.0, 2.6); scene.add(key);
    // translucent skull shell
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 36), new THREE.MeshPhysicalMaterial({ color: '#BFEBF8', transparent: true, opacity: 0.16, roughness: 0.2, clearcoat: 1, side: THREE.DoubleSide, emissive: '#4FA8C8', emissiveIntensity: 0.2 }));
    scene.add(skull);
    // brain: mauve dome inside
    const brain = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 36), new THREE.MeshPhysicalMaterial({ color: '#D895A5', roughness: 0.5, clearcoat: 0.6, emissive: '#8A4A62', emissiveIntensity: 0.22 }));
    brain.add(dome);
    const foldMat = new THREE.MeshStandardMaterial({ color: '#C2788E', roughness: 0.7, emissive: '#6A2E44', emissiveIntensity: 0.25 });
    for (let i = 0; i < 8; i++) {
      const phi = 0.25 + R(i + 11) * 0.75, th = R(i + 3) * Math.PI * 2;
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.2 + 0.16 * R(i), 0.032 + 0.02 * R(i + 7), 8, 32, 1.3 + 1.0 * R(i + 5)), foldMat);
      f.position.set(1.06 * Math.sin(phi) * Math.cos(th), 1.06 * Math.cos(phi), 1.06 * Math.sin(phi) * Math.sin(th));
      f.rotation.set(-Math.PI / 2 + phi, th + Math.PI / 2, R(i + 17) * Math.PI);
      brain.add(f);
    }
    brain.position.y = -0.12; scene.add(brain);
    // the closed box: gold wireframe cube around the skull
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.9, 2.9, 2.9)), new THREE.LineBasicMaterial({ color: '#FFD43B', transparent: true, opacity: 0 }));
    scene.add(box);
    // pressure glow: red inner ring that brightens as pressure builds
    const glow = new THREE.PointLight('#FF4A4A', 0, 8, 1.6); glow.position.set(0, 0, 0.8); scene.add(glow);
    // scale the whole world into the narrow vertical-video frustum
    const SG = new THREE.Group(); SG.scale.setScalar(0.58); SG.add(skull, brain, box, glow); scene.add(SG);
    return { scene, skull, brain, box, glow };
  })();
  const sRender = (lookAt, extra = {}) => E.render(S2.scene, cam, { ...SLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const sReset = (lt = 0, o = {}) => {
    const { sw = 1, boxK = 0, hot = 0 } = o;
    S2.brain.scale.setScalar(sw);
    S2.box.material.opacity = boxK * 0.85;
    S2.glow.intensity = hot * 30;
    S2.skull.material.emissiveIntensity = 0.2 + hot * 0.35;
  };

  // ─────────────────────────────────────────────────────────── shots ───
  // 1 · HOOK: drinking too much water (x-ray figure gulps, bottle tips up)
  { const st = cut(0), drk = Wd('drink', 0) - st, wtr = Wd('water', 0) - st;
    add({ id: 'S01', at: st, note: 'x-ray figure gulps from a tipped bottle, drops pour in, question pill', draw(lt, d, t, blit) {
      const bk = eio(clamp(seg(lt, 0.15, 0.5)));
      xReset({ lid: 0.3, bottleK: bk });
      drops.forEach((dr, i) => { const k = (lt * 1.4 + dr.userData.ph) % 1; dr.scale.setScalar(Math.max(0.001, bk * (1 - k * 0.6))); dr.position.set(0.09 - k * 0.045, 0.115 - k * 0.045, 0.115 - k * 0.01); });
      cam.position.copy(lerpV(V3(0.5, 1.72, 1.5), V3(0.3, 1.65, 1.1), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('TOO MUCH WATER?', 540, 1330, eob(seg(lt, Math.max(0.3, wtr), wtr + 0.35)), '#9FD9FF');
    } });
    cue(st + 0.2, 'whoosh'); [0.6, 0.95, 1.3].forEach((o) => cue(st + o, 'pop', { gain: 0.25 })); }

  // 2 · kidneys can only process so much (x-ray torso: KIDNEYS label pointer)
  { const st = cut(1), kdn = Wd('kidneys', 1) - st, prc = Wd('process', 1) - st;
    add({ id: 'S02', at: st, note: 'x-ray torso: label KIDNEYS with pointer to the lower torso, PROCESS pill', draw(lt, d, t, blit) {
      xReset({ lid: 0.4 });
      cam.position.copy(lerpV(V3(0.35, 1.75, 2.6), V3(-0.08, 1.5, 2.25), eio(lt / d))); cam.lookAt(V3(0, 1.18, 0));
      xRender(TORSO3); blit();
      label('KIDNEYS', 780, 620, ...screen(V3(0.05, 1.22, 0.1), cam), eob(seg(lt, Math.max(0.2, kdn), kdn + 0.35)));
      pill('CAN ONLY PROCESS SO MUCH', 540, 1330, eob(seg(lt, Math.max(0.3, prc), prc + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, kdn), 'slide', { gain: 0.4 }); }

  // 3 · one liter every hour (x-ray figure + bottle, gold pills)
  { const st = cut(2), ltr = Wd('liter', 2) - st, hr = Wd('hour', 2) - st;
    add({ id: 'S03', at: st, note: 'x-ray figure + bottle: ONE LITER / EVERY HOUR pills', draw(lt, d, t, blit) {
      const bk = eio(clamp(seg(lt, 0.1, 0.4)));
      xReset({ lid: 0.35, bottleK: bk });
      cam.position.copy(lerpV(V3(-0.4, 1.66, 1.35), V3(0.12, 1.6, 1.1), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('ABOUT ONE LITER', 540, 1180, eob(seg(lt, Math.max(0.25, ltr), ltr + 0.35)), '#FFD43B');
      pill('EVERY HOUR, AT BEST', 540, 1330, eob(seg(lt, Math.max(0.3, hr), hr + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, hr), 'thud', { gain: 0.4 }); }

  // 4 · water backs up into your blood (VEIN world: grey water bubbles flood)
  { const st = cut(3), fst = Wd('faster', 3) - st, bks = Wd('backs', 3) - st;
    add({ id: 'S04', at: st, note: 'vein world: red cells + flood of grey water bubbles on "backs up"', draw(lt, d, t, blit) {
      const cz = 0.5 - eio(lt / d) * 1.6;
      V.update(lt, cz, eio(clamp(seg(lt, Math.max(0.2, bks - 0.1), bks + 0.6))), 0);
      na.forEach((n, i) => { n.scale.setScalar(Math.max(0.001, 0.85)); const a = i * 2.4 + lt * 0.3; n.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.45, cz - 1.0 - i * 1.1); });
      cam.position.set(0, 0, cz); cam.lookAt(V3(0, 0.1, cz - 2));
      vRender(V3(0, 0.1, cz - 2)); blit();
      pill('DRINK FASTER', 540, 1180, eob(seg(lt, Math.max(0.25, fst), fst + 0.35)), '#9FD9FF');
      pill('WATER BACKS UP', 540, 1330, eob(seg(lt, Math.max(0.3, bks), bks + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, bks), 'sizzle', { dur: 1.0, gain: 0.3 }); }

  // 5 · blood gets diluted (VEIN world: washout - brighter wash, bubbles everywhere)
  { const st = cut(4), bld = Wd('blood', 4) - st, dlt = Wd('diluted', 4) - st;
    add({ id: 'S05', at: st, note: 'vein world: heavy water bubbles wash out the red, BLOOD GETS DILUTED pill', draw(lt, d, t, blit) {
      const cz = 0.3 - eio(lt / d) * 1.4;
      V.update(lt, cz, 1, 0);
      V.light.intensity = 60 + 40 * eio(clamp(lt / d));
      na.forEach((n, i) => { const a = i * 2.4 + lt * 0.3; n.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.45, cz - 1.0 - i * 1.1); });
      cam.position.set(0, 0, cz); cam.lookAt(V3(0, 0.1, cz - 2));
      vRender(V3(0, 0.1, cz - 2), { exposure: lerp(1, 1.18, eio(clamp(lt / d))) }); blit();
      pill('YOUR BLOOD', 540, 1180, eob(seg(lt, Math.max(0.25, bld), bld + 0.35)), '#9FD9FF');
      pill('GETS DILUTED', 540, 1330, eob(seg(lt, Math.max(0.3, dlt), dlt + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, dlt), 'sizzle', { dur: 0.8, gain: 0.3 }); }

  // 6 · sodium drops (VEIN world: gold sodium beads fade out)
  { const st = cut(5), sdm = Wd('Sodium', 5) - st, drp = Wd('drops', 5) - st;
    add({ id: 'S06', at: st, note: 'vein world: gold sodium beads dim and vanish on "drops", SODIUM label', draw(lt, d, t, blit) {
      const cz = 0.2 - eio(lt / d) * 1.3;
      const k = eio(clamp(seg(lt, Math.max(0.2, drp - 0.1), drp + 0.55)));
      V.update(lt, cz, 0.6, 0);
      V.light.intensity = 90;
      na.forEach((n, i) => { n.scale.setScalar(Math.max(0.001, 0.85 * (1 - k))); const a = i * 2.4 + lt * 0.3; n.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.45, cz - 1.0 - i * 1.1); });
      cam.position.set(0, 0, cz); cam.lookAt(V3(0, 0.1, cz - 2));
      vRender(V3(0, 0.1, cz - 2)); blit();
      label('SODIUM', 780, 500, ...screen(na[3].position.clone().add(V3(0, 0.2, 0)), cam), eob(seg(lt, Math.max(0.25, sdm), sdm + 0.35)));
      pill('THE SALT BALANCING YOUR FLUIDS DROPS', 540, 1330, eob(seg(lt, Math.max(0.3, drp), drp + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.35, drp), 'alarm', { dur: 0.8, gain: 0.3 }); }

  // 7 · water slides into your cells (CELL macro: blue drops fly into the cell)
  { const st = cut(6), wtr7 = Wd('Water', 6) - st, cls = Wd('cells', 6) - st;
    add({ id: 'S07', at: st, note: 'cell macro: blue water drops fly into the big cell, WATER SLIDES IN pill', draw(lt, d, t, blit) {
      cReset(lt, { sw: 1, naK: 1, watK: eio(clamp(seg(lt, Math.max(0.2, wtr7 - 0.1), wtr7 + 0.6))) });
      cam.position.copy(lerpV(V3(0.1, 0.25, 7.3), V3(-0.1, 0.2, 7.0), eio(lt / d))); cam.lookAt(V3(0, -0.1, 0));
      cRender(V3(0, -0.1, 0)); blit();
      pill('WATER SLIDES INTO', 540, 1180, eob(seg(lt, Math.max(0.25, wtr7), wtr7 + 0.35)), '#9FD9FF');
      pill('YOUR CELLS', 540, 1330, eob(seg(lt, Math.max(0.3, cls), cls + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.25, wtr7), 'slide', { gain: 0.45 }); }

  // 8 · your cells swell (CELL macro: the cell visibly inflates)
  { const st = cut(7), cl8 = Wd('cells', 7) - st, swl = Wd('swell', 7) - st;
    add({ id: 'S08', at: st, note: 'cell macro: the whole cell inflates on "swell", pill', draw(lt, d, t, blit) {
      cReset(lt, { sw: 1 + 0.28 * eio(clamp(seg(lt, Math.max(0.2, swl - 0.05), swl + 0.5))), naK: 1, watK: 1 });
      cam.position.copy(lerpV(V3(-0.1, 0.3, 8.4), V3(0.08, 0.25, 8.15), eio(lt / d))); cam.lookAt(V3(0, -0.15, 0));
      cRender(V3(0, -0.15, 0)); blit();
      pill('YOUR CELLS', 540, 1180, eob(seg(lt, Math.max(0.25, cl8), cl8 + 0.35)), '#FFD43B');
      pill('SWELL', 540, 1330, eob(seg(lt, Math.max(0.3, swl), swl + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, swl), 'boing', { gain: 0.4 }); }

  // 9 · most cells can take it (CELL macro: swollen cell holds steady, gold pill)
  { const st = cut(8), mst = Wd('Most', 8) - st, tk = Wd('take', 8) - st;
    add({ id: 'S09', at: st, note: 'cell macro: swollen cell holds, gold MOST CELLS CAN TAKE IT pill', draw(lt, d, t, blit) {
      cReset(lt, { sw: 1.26 + 0.02 * Math.sin(lt * 2), naK: 1, watK: 1 });
      cam.position.copy(lerpV(V3(0.1, 0.27, 8.6), V3(-0.06, 0.23, 8.4), eio(lt / d))); cam.lookAt(V3(0, -0.15, 0));
      cRender(V3(0, -0.15, 0)); blit();
      pill('MOST CELLS', 540, 1180, eob(seg(lt, Math.max(0.25, mst), mst + 0.35)), '#FFD43B');
      pill('CAN TAKE IT ✓', 540, 1330, eob(seg(lt, Math.max(0.3, tk), tk + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, tk), 'sparkle', { gain: 0.35 }); }

  // 10 · brain cells cannot (SKULL world: dim, brain fades teal-dark)
  { const st = cut(9), brn = Wd('Brain', 9) - st, cnn = Wd('cannot', 9) - st;
    add({ id: 'S10', at: st, note: 'skull world: brain inside translucent skull dims dark on "cannot"', draw(lt, d, t, blit) {
      sReset(lt, { sw: 1.05, boxK: 0, hot: 0 });
      S2.skull.material.emissiveIntensity = 0.2 - 0.12 * eio(clamp(seg(lt, Math.max(0.2, cnn), cnn + 0.4)));
      cam.position.copy(lerpV(V3(0.25, 0.35, 5.6), V3(-0.1, 0.3, 5.2), eio(lt / d))); cam.lookAt(V3(0, 0.1, 0));
      sRender(V3(0, 0.1, 0)); blit();
      pill('BRAIN CELLS', 540, 1180, eob(seg(lt, Math.max(0.25, brn), brn + 0.35)), '#FFD43B');
      pill('CANNOT', 540, 1330, eob(seg(lt, Math.max(0.3, cnn), cnn + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, cnn), 'alarm', { dur: 0.9, gain: 0.35 }); }

  // 11 · your skull is a closed box (SKULL world: gold box draws itself)
  { const st = cut(10), skl = Wd('skull', 10) - st, cls11 = Wd('closed', 10) - st;
    add({ id: 'S11', at: st, note: 'skull world: gold wireframe box draws around the skull, CLOSED BOX pill', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.2, cls11 - 0.1), cls11 + 0.5)));
      sReset(lt, { sw: 1.05, boxK: k, hot: 0 });
      S2.skull.material.emissiveIntensity = 0.08;
      cam.position.copy(lerpV(V3(-0.2, 0.32, 5.8), V3(0.12, 0.28, 5.5), eio(lt / d))); cam.lookAt(V3(0, 0.1, 0));
      sRender(V3(0, 0.1, 0)); blit();
      label('YOUR SKULL', 800, 520, ...screen(V3(0, 0.9, 0), cam), eob(seg(lt, Math.max(0.25, skl), skl + 0.35)));
      pill('IS A CLOSED BOX', 540, 1330, eob(seg(lt, Math.max(0.3, cls11), cls11 + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, cls11), 'thud', { gain: 0.45 }); }

  // 12 · swelling builds pressure (SKULL world: brain inflates against the box, red glow)
  { const st = cut(11), swl12 = Wd('Swelling', 11) - st, prs = Wd('pressure', 11) - st;
    add({ id: 'S12', at: st, note: 'skull world: brain inflates toward the gold box, red pressure glow rises', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.2, prs - 0.1), prs + 0.55)));
      sReset(lt, { sw: 1.05 + 0.3 * k, boxK: 1, hot: k });
      S2.skull.material.emissiveIntensity = 0.08 + 0.3 * k;
      cam.position.copy(lerpV(V3(0.15, 0.3, 6.0), V3(-0.08, 0.26, 5.7), eio(lt / d))); cam.lookAt(V3(0, 0.1, 0));
      sRender(V3(0, 0.1, 0)); blit();
      pill('SWELLING BUILDS', 540, 1180, eob(seg(lt, Math.max(0.25, swl12), swl12 + 0.35)), '#FFD43B');
      pill('PRESSURE INSIDE', 540, 1330, eob(seg(lt, Math.max(0.3, prs), prs + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, prs), 'alarm', { dur: 1.0, gain: 0.35 }); }

  // 13 · headache, confusion, seizures (SKULL world: flicker + warning)
  { const st = cut(12), hda = Wd('headache', 12) - st, szr = Wd('seizures', 12) - st;
    add({ id: 'S13', at: st, note: 'skull world: hot flicker, HEADACHE / CONFUSION / SEIZURES pills + warning', draw(lt, d, t, blit) {
      sReset(lt, { sw: 1.35 + 0.015 * Math.sin(lt * 9), boxK: 1, hot: 0.9 + 0.1 * Math.sin(lt * 7) });
      cam.position.copy(lerpV(V3(-0.1, 0.28, 6.1), V3(0.1, 0.24, 5.85), eio(lt / d))); cam.lookAt(V3(0, 0.1, 0));
      sRender(V3(0, 0.1, 0)); blit();
      pill('HEADACHE + CONFUSION', 540, 1180, eob(seg(lt, Math.max(0.25, hda), hda + 0.35)), '#FF8A8A');
      warning(540, 300, eob(seg(lt, Math.max(0.35, szr), szr + 0.4)) * 0.9);
      pill('SEIZURES', 540, 1330, eob(seg(lt, Math.max(0.3, szr), szr + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, hda), 'thud', { gain: 0.45 }); cue(Math.max(st + 0.35, szr), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 14 · it can even be fatal (SKULL world: dark + warning, hedged)
  { const st = cut(13), evn = Wd('even', 13) - st, ftl = Wd('fatal', 13) - st;
    add({ id: 'S14', at: st, note: 'skull world: heavy dim + warning + CAN EVEN BE FATAL pill (hedged "can")', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      sReset(lt, { sw: 1.35, boxK: 1, hot: 1 - 0.6 * k });
      S2.skull.material.emissiveIntensity = 0.38 - 0.25 * k;
      cam.position.copy(lerpV(V3(0.08, 0.26, 6.2), V3(-0.06, 0.22, 6.0), eio(lt / d))); cam.lookAt(V3(0, 0.1, 0));
      sRender(V3(0, 0.1, 0), { exposure: lerp(1, 0.82, k), vignette: lerp(0.5, 0.62, k) }); blit();
      warning(540, 300, eob(seg(lt, Math.max(0.3, ftl), ftl + 0.4)) * 0.9);
      pill('IT CAN EVEN BE FATAL', 540, 1330, eob(seg(lt, Math.max(0.3, ftl), ftl + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.35, ftl), 'alarm', { dur: 1.1, gain: 0.4 }); }

  // 15 · marathon runners + water contests proved it (x-ray figure chugs fast)
  { const st = cut(14), mrt = Wd('Marathon', 14) - st, prv = Wd('proved', 14) - st;
    add({ id: 'S15', at: st, note: 'x-ray figure chugs fast (shake), MARATHON RUNNERS + WATER CONTESTS pills', draw(lt, d, t, blit) {
      const bk = eio(clamp(seg(lt, 0.1, 0.4)));
      xReset({ lid: 0.3, bottleK: bk, sway: 2 * Math.sin(lt * 8) * eio(clamp(seg(lt, 0.2, 0.6))) });
      drops.forEach((dr, i) => { const k = (lt * 2.2 + dr.userData.ph) % 1; dr.scale.setScalar(Math.max(0.001, bk * (1 - k * 0.6))); dr.position.set(0.09 - k * 0.045, 0.115 - k * 0.045, 0.115 - k * 0.01); });
      cam.position.copy(lerpV(V3(0.42, 1.68, 1.4), V3(-0.14, 1.62, 1.12), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('MARATHON RUNNERS', 540, 1180, eob(seg(lt, Math.max(0.25, mrt), mrt + 0.35)), '#FFD43B');
      pill('WATER CONTESTS PROVED IT', 540, 1330, eob(seg(lt, Math.max(0.3, prv), prv + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, prv), 'thud', { gain: 0.45 }); }

  // 16 · payoff: sip, don't flood (x-ray figure calm, bottle down, gold pill)
  { const st = cut(15), sip = Wd('sip', 15) - st, fld = Wd('flood', 15) - st;
    add({ id: 'S16', at: st, note: 'x-ray figure calm, bottle lowered, gold SIP DON\'T FLOOD payoff pill', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      xReset({ lid: 0.35, lean: 2, bottleK: 1 - k });
      cam.position.copy(lerpV(V3(0.3, 1.66, 1.25), V3(-0.08, 1.6, 1.02), k)); cam.lookAt(FACE3);
      xRender(FACE3, { exposure: lerp(1, 0.86, k), vignette: lerp(0.45, 0.58, k) }); blit();
      pill("SIP, DON'T FLOOD ✓", 540, 1180, eob(seg(lt, Math.max(0.25, sip), sip + 0.4)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, sip), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
