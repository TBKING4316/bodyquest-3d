// WHAT HAPPENS IF YOU HOLD IN YOUR PEE? : shot list (Deep Dive 3D).
// World flow: kitchen (hero desperate, holding it) → x-ray (the bladder lights up in the pelvis) →
// INSIDE the bladder (urine level rises, stretch sensors fire, brain signal) → kitchen (once: it waits) →
// x-ray (habit) → INSIDE the bladder (wall muscle sagging, bacteria multiply in stale urine) →
// x-ray (infection climbs to the kidneys) → bladder (rare failure) → x-ray (BURST myth-bust) → kitchen payoff (go).
// Facts: StatPearls NBK538522 (capacity 400-600 mL; chronic retention → UTI, bladder damage, kidney failure,
// hydronephrosis); StatPearls NBK513246 (rupture is rare, trauma-related — "bursting from holding" is a myth).
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

/** tileable value-noise bump texture. Fully deterministic (sin-hash lattice, NO Math.random)
 *  so every render is identical. Used for organ wall / liquid surface micro-detail (ultra pass). */
function noiseTex(size = 256, oct = 4, seed = 7) {
  const R = (n) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  const val = (x, y, f) => { // value noise on an f×f lattice, tileable, smoothstep interp
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf);
    const h = (i, j) => R((((i % f) + f) % f) * 57 + (((j % f) + f) % f) * 131 + f * 7);
    const a = h(xi, yi), b = h(xi + 1, yi), cc = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, amp = 0.5, f = 8;
    for (let o = 0; o < oct; o++) { v += val(x / size * f, y / size * f, f) * amp; amp *= 0.5; f *= 2; }
    const p = (y * size + x) * 4, q = Math.round(v * 255);
    img.data[p] = img.data[p + 1] = img.data[p + 2] = q; img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);
  const KLOOK = { aperture: 0.003, maxblur: 0.01, bloom: 0.2 }, XLOOK = { aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.45 };
  const BLOOK = { aperture: 0.0022, maxblur: 0.012, bloom: 0.5, bloomThreshold: 0.42, vignette: 0.55 };

  // ── world A · kitchen ──────────────────────────────────────────────────
  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);

  // ── world B · x-ray stage (bladder + kidneys added into the insides) ──
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial(); xh.setBodyMaterial(xmat); const I = SETS.insides(); xh.spine.add(I.group); X.scene.add(xh.group);
  // the bladder (pelvic organ, organ-local coords: pelvis sits ~y -0.06 in I)
  const bladMat = () => new THREE.MeshPhysicalMaterial({ color: '#E8D24F', emissive: '#C9B42F', emissiveIntensity: 0.85, roughness: 0.35, clearcoat: 0.8, transparent: true, opacity: 0.9 });
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.052, 48, 36), bladMat()); bladder.scale.set(1.2, 1.0, 0.9); bladder.position.set(0.0, -0.05, 0.06); I.group.add(bladder);
  // kidneys (two beans, flank level) + ureters (thin tubes down to the bladder)
  const kidMat = () => new THREE.MeshPhysicalMaterial({ color: '#D6606E', emissive: '#B23A46', emissiveIntensity: 0.4, roughness: 0.4, clearcoat: 0.6 });
  const kid = (s) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.026, 28, 22), kidMat()); b.scale.set(0.72, 1.25, 0.62); g.add(b); return g; };
  const kidL = kid(-1), kidR = kid(1); kidL.position.set(-0.075, 0.26, -0.02); kidR.position.set(0.075, 0.26, -0.02); I.group.add(kidL, kidR);
  const ureterMat = new THREE.MeshStandardMaterial({ color: '#E8C46A', emissive: '#B8942F', emissiveIntensity: 0.35 });
  const ureter = (s) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.28, 8), ureterMat); t.position.set(s * 0.06, 0.09, 0.02); t.rotation.z = s * 0.16; return t; };
  I.group.add(ureter(-1), ureter(1));
  const iw = (v) => I.group.localToWorld(v.clone());                   // organ-local → world

  // ── world C · inside the bladder (macro: stretchy wall, urine pool rises) ──
  const BL = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#241006');
    const hemi = new THREE.HemisphereLight('#FFE0A8', '#241006', 0.9); scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFF0C8', 1.8); key.position.set(1.2, 1.4, 2.2); scene.add(key);
    const rim = new THREE.DirectionalLight('#E8A24F', 1.0); rim.position.set(-1.8, 0.4, -1.6); scene.add(rim);
    // stretchy wall (soft balloon, warm pink) - ultra: high tessellation + deterministic noise bump
    const wallBump = noiseTex(256, 4, 7); wallBump.repeat.set(9, 6);
    const wall = new THREE.Mesh(new THREE.SphereGeometry(2.6, 96, 64), new THREE.MeshStandardMaterial({ color: '#C88A6A', roughness: 0.72, side: THREE.BackSide, bumpMap: wallBump, bumpScale: 0.05 }));
    wall.scale.set(1, 0.85, 1.1); scene.add(wall);
    // detrusor muscle band around the wall
    const band = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.16, 24, 96), new THREE.MeshStandardMaterial({ color: '#D9707E', roughness: 0.55, emissive: '#A8404E', emissiveIntensity: 0.4 }));
    band.rotation.x = Math.PI / 2 + 0.25; scene.add(band);
    // urine pool (pale yellow-green, emissive, rises by scaling + lifting) - subtle surface ripple bump
    const urineBump = noiseTex(128, 3, 31); urineBump.repeat.set(4, 3);
    const urine = new THREE.Mesh(new THREE.SphereGeometry(2.0, 80, 48), new THREE.MeshPhysicalMaterial({ color: '#E4E86A', transparent: true, opacity: 0.55, roughness: 0.15, emissive: '#B9C22E', emissiveIntensity: 0.65, clearcoat: 1, bumpMap: urineBump, bumpScale: 0.012 }));
    urine.scale.set(1, 0.16, 0.9); urine.position.y = -0.95; scene.add(urine);
    // stretch sensors (small glowing dots on the wall)
    const sensors = [];
    const sMat = new THREE.MeshStandardMaterial({ color: '#FFD43B', emissive: '#FFD43B', emissiveIntensity: 1.1 });
    for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), sMat); const a = i / 10 * Math.PI * 2; s.position.set(Math.cos(a) * 1.55, -0.3 + (i % 3) * 0.4, Math.sin(a) * 0.9 - 0.25); scene.add(s); sensors.push(s); }
    // nerve signal (a bead line running up and out)
    const nerveMat = new THREE.MeshStandardMaterial({ color: '#9BE8FF', emissive: '#57C8F0', emissiveIntensity: 1.0 });
    const beads = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), nerveMat); b.scale.setScalar(0.001); scene.add(b); beads.push(b); }
    // bacteria (teal dots; multiply on demand)
    const germs = [];
    const gMat = new THREE.MeshStandardMaterial({ color: '#4FE8B0', emissive: '#2FBF80', emissiveIntensity: 1.25 });
    for (let i = 0; i < 12; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), gMat); g.scale.setScalar(0.001); scene.add(g); germs.push(g); }
    // organ detail: wall folds (deterministic pseudo-random) + drifting particles for depth
    const R = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const folds = [];
    const foldMat = new THREE.MeshStandardMaterial({ color: '#B0654E', roughness: 0.85, transparent: true, opacity: 0.5, emissive: '#6A2E1E', emissiveIntensity: 0.18 });
    for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.045 + 0.03 * R(i), 12, 64, 0.8 + 0.7 * R(i + 40)), foldMat); f.position.set((R(i + 7) * 2 - 1) * 0.7, -0.5 + R(i + 13) * 1.4, (R(i + 21) * 2 - 1) * 0.9 - 0.3); f.rotation.set(R(i + 5) * 2.4 - 1.2, R(i + 11) * 2.4 - 1.2, i * 0.8); scene.add(f); folds.push(f); }
    const parts = [];
    const pMat = new THREE.MeshStandardMaterial({ color: '#F2D9A0', emissive: '#C8A86A', emissiveIntensity: 0.55, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 60; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.024 + 0.022 * R(i + 60), 12, 10), pMat); p.userData.b = [(R(i) * 2 - 1) * 1.7, -1.3 + R(i + 3) * 2.6, (R(i + 6) * 2 - 1) * 1.3]; scene.add(p); parts.push(p); }
    return { scene, band, urine, sensors, beads, germs, folds, parts, hemi, key, rim };
  })();

  const blRender = (lookAt, extra = {}) => E.render(BL.scene, cam, { ...BLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  const CYAN = new THREE.Color('#4FD1E8'), RED = new THREE.Color('#FF3B3B'), GREEN = new THREE.Color('#7CF29A');
  const reset = () => { hero.pose({}); xh.pose({}); xmat.uniforms.uCol.value.copy(CYAN); bladder.material.emissiveIntensity = 0.8; kidL.children[0].material.emissiveIntensity = 0.4; kidR.children[0].material.emissiveIntensity = 0.4; };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const FACE = V3(0.1, 1.68, -0.6);
  // bladder state helper (pure per-frame)
  const blReset = (fill = 0, sag = 0, show = 'calm', lt = 0) => {
    BL.band.position.y = -0.15 + 0.25 * sag; BL.band.rotation.z = 0.12 * sag;
    BL.band.scale.setScalar(1 - 0.06 * sag);
    BL.urine.scale.set(1, 0.16 + 0.5 * fill, 0.9); BL.urine.position.y = -0.95 + 0.55 * fill;
    BL.sensors.forEach((s, i) => { s.scale.setScalar(show === 'calm' || show === 'full' || show === 'sag' ? 0.7 + 0.5 * fill : 0.4); });
    BL.germs.forEach((g, i) => { g.scale.setScalar(show === 'germs' ? 0.55 + 0.45 * Math.sin(i * 1.7) : 0.001); const a = i / 12 * Math.PI * 2; g.position.set(Math.cos(a) * (0.35 + (i % 3) * 0.35), -0.35 + (i % 4) * 0.26, 0.3 + (i % 3) * 0.5); });
    BL.beads.forEach((b) => b.scale.setScalar(0.001));
    BL.parts.forEach((p, i) => { const b = p.userData.b; p.position.set(b[0] + 0.16 * Math.sin(lt * 0.7 + i * 1.1), b[1] + 0.28 * Math.sin(lt * 0.5 + i * 1.3), b[2] + 0.16 * Math.cos(lt * 0.6 + i * 0.7)); });
  };
  // hero poses
  const holdPose = (h, k, lid = 0.3) => h.pose({ spine: [3 + 2 * k, 0, 0], head: [-6 - 2 * k, 0, 0], lid, shL: [-4, 0, 10 + 6 * k], shR: [-4, 0, 10 + 6 * k], elL: 26 + 10 * k, elR: 26 + 10 * k });
  const reliefPose = (h) => h.pose({ spine: [-2, 0, 0], head: [4, 0, 0], lid: 0.12, shL: [10, 0, 8], shR: [10, 0, 8], elL: 18, elR: 18 });

  // 1 · HOOK: holding it (kitchen, desperate squeeze, camera drifts in)
  { const st = cut(0), pee = Wd('pee', 0) - st + 0.2;
    add({ id: 'S01', at: st, note: 'kitchen: hero squeezes legs-crossed, HOLDING IT pill', draw(lt, d, t, blit) {
      reset(); const k = 0.5 + 0.5 * Math.sin(lt * 5.2);
      holdPose(hero, k * 0.5, 0.38);
      cam.position.copy(lerpV(V3(0.55, 1.6, 1.2), V3(0.22, 1.5, 0.78), eio(lt / d))); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE)); blit();
      pill('HOLDING IT…', 540, 300, eob(seg(lt, 0.25, 0.55)), '#FFD43B');
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.3, pee), 'tock', { gain: 0.45 }); }

  // 2 · the bladder (x-ray: pelvic balloon lights up)
  { const st = cut(1), blad = Wd('bladder', 1) - st, bll = Wd('balloon', 1) - st;
    add({ id: 'S02', at: st, note: 'x-ray: bladder sphere pulses in the pelvis, MUSCLE BALLOON pill', draw(lt, d, t, blit) {
      reset();
      xh.pose({ spine: [2, 0, 0], lid: 0.35, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      bladder.material.emissiveIntensity = 0.8 + 0.4 * Math.sin(lt * 3);
      cam.position.copy(lerpV(V3(-0.5, 1.3, 1.7), V3(-0.1, 1.05, 1.3), eio(lt / d))); cam.lookAt(0, 1.05, 0);
      xRender(V3(0, 1.05, 0)); blit();
      label('YOUR BLADDER', 780, 640, ...screen(iw(bladder.position), cam), eob(seg(lt, Math.max(0.2, blad), blad + 0.35)));
      pill('A MUSCLE BALLOON', 540, 1180, eob(seg(lt, Math.max(0.3, bll), bll + 0.35)), '#FFD43B');
    } });
    cue(st + 0.25, 'boing', { gain: 0.35 }); }

  // 3 · it fills (BLADDER macro: urine level rises to half a liter)
  { const st = cut(2), fil = Wd('fills', 2) - st, lit = Wd('liter', 2) - st;
    add({ id: 'S03', at: st, note: 'bladder macro: urine pool rises on "fills", HALF A LITER pill on "liter"', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(seg(lt, Math.max(0.15, fil - 0.2), lit + 0.4)));
      blReset(0.35 + 0.5 * k, 0, 'calm', lt);
      cam.position.copy(lerpV(V3(0.0, 0.55, 2.05), V3(-0.15, 0.35, 1.65), eio(lt / d))); cam.lookAt(V3(0, -0.55, 0));
      blRender(V3(0, -0.45, 0)); blit();
      label('URINE RISING', 790, 480, ...screen(BL.urine.position.clone().add(V3(0, 0.3, 0)), cam), eob(seg(lt, Math.max(0.2, fil), fil + 0.35)));
      pill('UP TO ½ LITER', 540, 1330, eob(seg(lt, Math.max(0.25, lit), lit + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.2, fil), 'sizzle', { dur: 1.2, gain: 0.3 }); }

  // 4 · sensors scream (BLADDER: wall dots flash, signal beads run up)
  { const st = cut(3), sen = Wd('sensors', 3) - st, brn = Wd('brain', 3) - st;
    add({ id: 'S04', at: st, note: 'bladder macro: sensor dots strobe, signal beads climb the wall on "brain"', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      blReset(0.85, 0, 'full', lt);
      BL.sensors.forEach((s, i) => { s.material.emissiveIntensity = 0.7 + 0.9 * Math.sin(lt * 9 + i); });
      BL.beads.forEach((b, i) => { const kk = clamp(seg(lt, Math.max(0.1, sen + 0.2 + i * 0.12), brn + 0.5)); b.scale.setScalar(kk); b.position.set(lerp(-0.4, 0.5, i / 5), lerp(-0.6, 1.5, kk), 0.6); });
      cam.position.copy(lerpV(V3(0.55, -0.1, 1.55), V3(-0.3, 0.2, 1.35), k)); cam.lookAt(V3(0, -0.05, 0.2));
      blRender(V3(0, 0.25, 0)); blit();
      label('STRETCH SENSORS', 800, 480, ...screen(BL.sensors[4].position, cam), eob(seg(lt, Math.max(0.2, sen), sen + 0.35)));
      pill('BRAIN: GO NOW', 540, 1330, eob(seg(lt, Math.max(0.25, brn), brn + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, sen), 'sparkle', { gain: 0.4 }); cue(Math.max(st + 0.35, brn), 'alarm', { dur: 0.7, gain: 0.3 }); }

  // 5 · once: it just waits (kitchen, hero holding, green pill)
  { const st = cut(4), wts = Wd('waits', 4) - st;
    add({ id: 'S05', at: st, note: 'kitchen: hero holds it in, body tense, ONCE: IT JUST WAITS pill', draw(lt, d, t, blit) {
      reset(); const k = 0.5 + 0.5 * Math.sin(lt * 4.6);
      holdPose(hero, 0.25 + 0.15 * k, 0.42);
      cam.position.copy(lerpV(V3(0.35, 1.56, 1.0), V3(0.1, 1.5, 0.68), eio(lt / d))); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE)); blit();
      pill('ONCE: IT JUST WAITS ✓', 540, 1180, eob(seg(lt, Math.max(0.25, wts), wts + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.25, wts), 'boing', { gain: 0.35 }); }

  // 6 · habit (x-ray: bladder refills fast, HOLDING = HABIT red pill)
  { const st = cut(5), hb = Wd('habit', 5) - st;
    add({ id: 'S06', at: st, note: 'x-ray: bladder refills on loop, HOLDING = HABIT pill red', draw(lt, d, t, blit) {
      reset();
      xh.pose({ spine: [2, 0, 0], lid: 0.35, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      const pulse = 0.8 + 0.3 * Math.sin(lt * 5.5);
      bladder.material.emissiveIntensity = pulse;
      cam.position.copy(lerpV(V3(0.5, 1.2, 1.55), V3(-0.15, 1.02, 1.25), eio(lt / d))); cam.lookAt(0, 1.05, 0);
      xRender(V3(0, 1.05, 0)); blit();
      pill('HOLDING = HABIT', 540, 480, eob(seg(lt, Math.max(0.2, hb), hb + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, hb), 'thud', { gain: 0.45 }); }

  // 7 · wall muscle stretched out and weak (BLADDER: band sags)
  { const st = cut(6), wk = Wd('weak', 6) - st;
    add({ id: 'S07', at: st, note: 'bladder macro: detrusor band droops, WALL MUSCLE label, WEAK pill', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      blReset(1.0, k, 'sag', lt);
      BL.band.material.emissiveIntensity = 0.4 - 0.25 * k;
      cam.position.copy(lerpV(V3(0.15, -0.05, 2.05), V3(-0.2, 0.12, 1.62), k)); cam.lookAt(V3(0, 0.05, 0));
      blRender(V3(0, 0.05, 0)); blit();
      label('WALL MUSCLE', 780, 520, ...screen(BL.band.position.clone().add(V3(0.4, 0, 1.2)), cam), eob(seg(lt, 0.3, 0.55)));
      pill('STRETCHED & WEAK', 540, 1330, eob(seg(lt, Math.max(0.25, wk), wk + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, wk), 'slide', { gain: 0.4 }); }

  // 8 · bacteria multiply (BLADDER: teal germs pop in one by one)
  { const st = cut(7), bac = Wd('bacteria', 7) - st, mlt = Wd('multiply', 7) - st;
    add({ id: 'S08', at: st, note: 'bladder macro: teal germs pop in over stale urine, MULTIPLY label', draw(lt, d, t, blit) {
      reset(); blReset(0.9, 0.25, 'germs', lt);
      BL.germs.forEach((g, i) => { const on = eio(clamp(seg(lt, 0.15 + i * 0.18, 0.45 + i * 0.18))); g.scale.setScalar((0.5 + 0.4 * Math.sin(i * 2.1)) * on); });
      cam.position.copy(lerpV(V3(0.05, 0.14, -1.25), V3(0.0, 0.02, -0.6), eio(lt / d))); cam.lookAt(V3(0, -0.15, 0.75));
      blRender(V3(0, -0.15, 0.75)); blit();
      label('STALE URINE', 760, 480, ...screen(V3(0, 0.2, 0.4), cam), eob(seg(lt, 0.25, 0.5)));
      pill('BACTERIA MULTIPLY', 540, 1330, eob(seg(lt, Math.max(0.2, bac), bac + 0.3)), '#FF8A8A');
    } });
    [0.35, 0.8, 1.25].forEach((o) => cue(st + o, 'tock', { gain: 0.35 })); cue(Math.max(st + 0.3, mlt), 'alarm', { dur: 0.6, gain: 0.25 }); }

  // 9 · up to the kidneys (x-ray: kidneys flare red, ureters glow)
  { const st = cut(8), clm = Wd('climb', 8) - st, kds = Wd('kidneys', 8) - st;
    add({ id: 'S09', at: st, note: 'x-ray: infection dot rides the ureter up, kidneys flare red on "kidneys"', draw(lt, d, t, blit) {
      reset();
      xh.pose({ spine: [2, 0, 0], lid: 0.35, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      const kk = eio(clamp(seg(lt, Math.max(0.2, clm), kds + 0.4)));
      const dot = iw(V3(lerp(0.0, 0.06, kk), lerp(-0.05, 0.24, kk), 0.02));
      ureterMat.emissiveIntensity = 0.35 + 0.85 * kk;
      const flare = kk; kidL.children[0].material.emissiveIntensity = 0.4 + 1.1 * flare; kidR.children[0].material.emissiveIntensity = 0.4 + 1.1 * flare;
      bladder.material.emissiveIntensity = 0.8;
      cam.position.copy(lerpV(V3(0.15, 1.15, 1.6), V3(-0.05, 1.15, 1.15), eio(lt / d))); cam.lookAt(0, 1.15, 0);
      xRender(V3(0, 1.15, 0)); blit();
      label('UP TO THE KIDNEYS', 830, 430, ...screen(iw(V3(0, 0.26, -0.02)), cam), eob(seg(lt, Math.max(0.25, kds), kds + 0.35)));
      pill('KIDNEYS AT RISK', 540, 1330, eob(seg(lt, Math.max(0.3, kds), kds + 0.4)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, clm), 'slide', { gain: 0.45 }); cue(Math.max(st + 0.35, kds), 'alarm', { dur: 0.9, gain: 0.4 }); }

  // 10 · rare: the bladder can fail (BLADDER: dim, sagging, warning)
  { const st = cut(9), fl = Wd('fail', 9) - st;
    add({ id: 'S10', at: st, note: 'bladder macro: wall dim + sagged, warning sign, RARE BUT REAL pill', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      blReset(1.0, 0.9, 'sag', lt);
      BL.band.material.emissiveIntensity = 0.15; BL.urine.material.emissiveIntensity = 0.15;
      BL.key.intensity = 1.8 - 1.0 * k;
      cam.position.copy(lerpV(V3(-0.1, 0.1, -0.35), V3(0.12, 0.02, -0.65), k)); cam.lookAt(V3(0, 0, 0.3));
      blRender(V3(0, 0, 0.3)); blit();
      warning(540, 1180, eob(seg(lt, Math.max(0.2, fl), fl + 0.4)) * 0.9);
      pill('RARE: BLADDER FAILURE', 540, 300, eob(seg(lt, Math.max(0.25, fl), fl + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, fl), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 11 · the burst myth (x-ray: BURST struck out, NOT FROM HOLDING)
  { const st = cut(10), brs = Wd('burst', 10) - st, aln = Wd('alone', 10) - st;
    add({ id: 'S11', at: st, note: 'x-ray calm: BURST ✗ struck out, NOT FROM HOLDING ✓ pill green', draw(lt, d, t, blit) {
      reset();
      xh.pose({ spine: [2, 0, 0], lid: 0.3, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      bladder.material.emissiveIntensity = 0.8;
      cam.position.copy(lerpV(V3(-0.8, 1.35, 1.9), V3(-0.2, 1.1, 1.45), eio(lt / d))); cam.lookAt(0, 1.1, 0);
      xRender(V3(0, 1.1, 0)); blit();
      pill('BURST ✗', 540, 480, eob(seg(lt, Math.max(0.2, brs), brs + 0.3)), '#FF8A8A');
      pill('NOT FROM HOLDING ✓', 540, 1180, eob(seg(lt, Math.max(0.3, aln), aln + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, aln), 'sparkle', { gain: 0.5 }); }

  // 12 · payoff: just go (kitchen: hero relaxed, walks off, gold pill)
  { const st = cut(11), urg = Wd('urge', 11) - st;
    add({ id: 'S12', at: st, note: 'kitchen settle: hero relieved, WHEN YOU FEEL IT, GO pill, warm ramp', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(lt / d));
      reliefPose(hero);
      cam.position.copy(lerpV(V3(0.12, 1.6, 0.85), V3(-0.12, 1.56, 1.15), k)); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE), { exposure: lerp(1, 0.8, k), vignette: lerp(0.35, 0.55, k) }); blit();
      pill('WHEN YOU FEEL IT, GO ✓', 540, 1180, eob(seg(lt, Math.max(0.2, urg), urg + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, urg), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
