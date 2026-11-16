// WHAT HAPPENS IF YOU SLEEP IN YOUR CONTACT LENSES? : shot list (Deep Dive 3D).
// World flow: kitchen (hero crashes in lenses, sleepy) → EYE macro (cornea, oxygen drifting in) →
// EYE (lid closes + lens lands: oxygen cut) → CORNEA surface micro (epithelium starves, micro-tears,
// Pseudomonas rods land, enzymes digest → ulcer) → EYE morning (red vessels + cloud) →
// kitchen payoff (take them out) → EYE (lens lifts away, oxygen returns, never tap water).
// Facts (script.json sources): cornea has no blood vessels, oxygen dissolves in tears and diffuses
// (Wikipedia 'Cornea'); ~90% of lens-wearer keratitis is bacterial, Pseudomonas ~40%, enzymes digest
// the cornea; overnight wear + tap water are documented risk practices (Wikipedia 'Keratitis');
// 89% of Acanthamoeba keratitis patients are lens wearers, 19% needed a transplant (Wikipedia 'AK').
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob, rnd } from './core/lib.js';
import { L, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { label, pill, warning } from './core/look2d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }

/** tileable value-noise bump texture. Fully deterministic (sin-hash lattice, NO Math.random)
 *  so every render is identical. Used for cornea / tissue micro-detail (max pass). */
function noiseTex(size = 256, oct = 4, seed = 7) {
  const R = (n) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  const val = (x, y, f) => {
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
  // max clarity: DOF blur cut hard, sharpen does the crispness in GRADE
  const KLOOK = { aperture: 0.0012, maxblur: 0.005, bloom: 0.2 }, ELOOK = { aperture: 0.0006, maxblur: 0.004, bloom: 0.35, bloomThreshold: 0.42, vignette: 0.5 };
  const CLOOK = { aperture: 0.0006, maxblur: 0.0035, bloom: 0.5, bloomThreshold: 0.6, vignette: 0.55 };

  // ── world A · kitchen ──────────────────────────────────────────────────
  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);

  // ── world B · EYE macro (eyeball, cornea dome, lid, lens, oxygen) ─────
  const EYE = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A1A22');
    const hemi = new THREE.HemisphereLight('#CFE8FF', '#0A1A22', 0.85); scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFFFFF', 1.7); key.position.set(1.4, 1.6, 2.4); scene.add(key);
    const rim = new THREE.DirectionalLight('#7FD8F0', 0.9); rim.position.set(-2.0, 0.5, -1.4); scene.add(rim);
    // sclera (eyeball white; slightly dimmed so it never blows out)
    const sclBump = noiseTex(256, 4, 41); sclBump.repeat.set(6, 4);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(1.6, 96, 64), new THREE.MeshPhysicalMaterial({ color: '#DDE4E0', roughness: 0.5, clearcoat: 0.35, bumpMap: sclBump, bumpScale: 0.012 }));
    scene.add(sclera);
    // cornea dome (clear bulge on the front, +z; front face at z≈1.69)
    const corBump = noiseTex(256, 4, 53); corBump.repeat.set(3, 3);
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.62, 96, 48), new THREE.MeshPhysicalMaterial({ color: '#BFE6F2', transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, bumpMap: corBump, bumpScale: 0.008, emissive: '#5FA8C8', emissiveIntensity: 0.18, depthWrite: false }));
    cornea.position.set(0, 0, 1.18); cornea.scale.set(1, 1, 0.82); scene.add(cornea);
    // iris + pupil (just OUTSIDE the sclera front z=1.6, inside the clear cornea dome, so they read)
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.36, 64), new THREE.MeshStandardMaterial({ color: '#3E6275', roughness: 0.35, emissive: '#24505F', emissiveIntensity: 0.7 }));
    iris.position.set(0, 0, 1.60); scene.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.15, 64), new THREE.MeshStandardMaterial({ color: '#06090C', roughness: 0.9 }));
    pupil.position.set(0, 0, 1.615); scene.add(pupil);
    // upper eyelid (skin cap that slides down over the front)
    const lidBump = noiseTex(128, 3, 61); lidBump.repeat.set(4, 2);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(1.58, 48, 24, 0, Math.PI * 2, 0, 1.05), new THREE.MeshPhysicalMaterial({ color: '#E8B48F', roughness: 0.6, sheen: 0.4, bumpMap: lidBump, bumpScale: 0.02, side: THREE.DoubleSide }));
    lid.rotation.x = -1.55; scene.add(lid);
    // contact lens (shallow clear cap hugging the cornea front; cap pole rotated to +z)
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.68, 64, 32, 0, Math.PI * 2, 0, 0.5), new THREE.MeshPhysicalMaterial({ color: '#CDEEFF', transparent: true, opacity: 0.45, roughness: 0.08, clearcoat: 1, emissive: '#8FD4E8', emissiveIntensity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
    lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.04, 1.7); lens.visible = false; scene.add(lens);
    // oxygen dots (cyan, drift down in front of the cornea)
    const R = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const oxy = [];
    const oMat = new THREE.MeshStandardMaterial({ color: '#7FE8FF', emissive: '#4FC8F0', emissiveIntensity: 1.3 });
    for (let i = 0; i < 34; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.032 + 0.018 * R(i + 9), 12, 10), oMat); p.userData.b = [(R(i) * 2 - 1) * 1.05, 0.55 + R(i + 3) * 1.8, 0.95 + R(i + 6) * 0.7]; scene.add(p); oxy.push(p); }
    // red vessels (thin arcs hugging the cornea rim ON the eye surface, for the morning shot)
    const vessels = [];
    const vMat = new THREE.MeshStandardMaterial({ color: '#FF3A3A', emissive: '#E02020', emissiveIntensity: 1.2 });
    for (let i = 0; i < 14; i++) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.55 + 0.15 * R(i + 20), 0.024, 8, 32, 0.6 + 0.7 * R(i + 31)), vMat); const a = R(i + 41) * Math.PI * 2; v.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 1.72); v.rotation.set(R(i + 51) * 0.6 - 0.3, R(i + 61) * 0.6 - 0.3, a); v.scale.setScalar(0.001); scene.add(v); vessels.push(v); }
    // cloud patch (scar / opacity, white cap in front of the cornea)
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.30, 48, 24), new THREE.MeshStandardMaterial({ color: '#E8EEF2', transparent: true, opacity: 0.0, roughness: 0.65, emissive: '#9FB4C0', emissiveIntensity: 0.15, depthWrite: false }));
    cloud.position.set(0.02, -0.04, 1.66); cloud.scale.set(1, 0.85, 0.4); scene.add(cloud);
    return { scene, lid, lens, cornea, iris, oxy, vessels, cloud, key, hemi };
  })();

  // ── world C · CORNEA surface micro (epithelium, tears, bacteria, ulcer) ──
  const COR = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0E2228');
    const hemi = new THREE.HemisphereLight('#DFF4FF', '#0E2228', 1.15); scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFFFFF', 1.35); key.position.set(1.1, 1.8, 1.6); scene.add(key);
    const rim = new THREE.DirectionalLight('#7FD8F0', 0.85); rim.position.set(-1.6, 0.4, -1.2); scene.add(rim);
    const R = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    // cornea surface (radius-6 dome seen from just above; top at y=-0.45)
    const surfBump = noiseTex(512, 5, 71); surfBump.repeat.set(7, 7);
    const surf = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 64), new THREE.MeshPhysicalMaterial({ color: '#AFCEDD', roughness: 0.62, clearcoat: 0.12, clearcoatRoughness: 0.7, bumpMap: surfBump, bumpScale: 0.03, emissive: '#3E7A8C', emissiveIntensity: 0.16 }));
    surf.position.y = -6.45; scene.add(surf);
    const surfY = (x, z) => -6.45 + Math.sqrt(Math.max(0.01, 36 - x * x - z * z));
    // epithelium layer (soft glowing sheet 0.15 above the surface; dims when starved)
    const epi = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 40, 0, Math.PI * 2, 0, 0.7), new THREE.MeshStandardMaterial({ color: '#8FE8D8', transparent: true, opacity: 0.35, roughness: 0.85, emissive: '#4FC8B0', emissiveIntensity: 0.75, depthWrite: false }));
    epi.position.y = -6.3; scene.add(epi);
    // lens overhead (translucent ceiling disc seen from below)
    const lensOver = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshPhysicalMaterial({ color: '#DFF6FF', transparent: true, opacity: 0.14, roughness: 0.1, clearcoat: 1, emissive: '#8FD4E8', emissiveIntensity: 0.05, side: THREE.DoubleSide }));
    lensOver.position.set(0, 1.8, 0); lensOver.rotation.x = Math.PI / 2; lensOver.visible = false; scene.add(lensOver);
    // oxygen dots drifting down (fade at the surface)
    const oxy = [];
    const oMat = new THREE.MeshStandardMaterial({ color: '#7FE8FF', emissive: '#4FC8F0', emissiveIntensity: 1.35 });
    for (let i = 0; i < 44; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.04 + 0.02 * R(i + 9), 12, 10), oMat); p.userData.b = [(R(i) * 2 - 1) * 2.2, 0.55 + R(i + 3) * 1.7, (R(i + 6) * 2 - 1) * 1.15]; scene.add(p); oxy.push(p); }
    // micro-tears (thin red cracks lying ON the surface)
    const tears = [];
    const tMat = new THREE.MeshStandardMaterial({ color: '#D24A4A', emissive: '#A62A2A', emissiveIntensity: 0.4, roughness: 0.9 });
    for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.6 + 0.5 * R(i), 0.02, 0.04), tMat); const tx = (R(i + 7) * 2 - 1) * 1.4, tz = -0.8 + R(i + 13) * 0.8; t.position.set(tx, surfY(tx, tz) + 0.012, tz); t.rotation.y = R(i + 21) * Math.PI; t.scale.setScalar(0.001); scene.add(t); tears.push(t); }
    // bacteria (green rods - Pseudomonas are bacilli), descend and stick
    const germs = [];
    const gMat = new THREE.MeshStandardMaterial({ color: '#5FE87A', emissive: '#2FBF60', emissiveIntensity: 1.2 });
    for (let i = 0; i < 14; i++) { const g = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 8, 16), gMat); const gx = (R(i + 40) * 2 - 1) * 1.7, gz = (R(i + 48) * 2 - 1) * 1.15 - 0.35; g.userData.b = [gx, surfY(gx, gz) + 0.09, gz]; g.scale.setScalar(0.001); scene.add(g); germs.push(g); }
    // ulcer: dark dent + angry red ring + rising debris (all ON the surface)
    const ulcer = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshStandardMaterial({ color: '#5A1E28', roughness: 0.75, emissive: '#3A0E16', emissiveIntensity: 0.4, transparent: true, opacity: 0.0 }));
    ulcer.rotation.x = -Math.PI / 2; ulcer.position.set(0.1, surfY(0.1, 0.15) + 0.018, 0.15); scene.add(ulcer);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 12, 64), new THREE.MeshStandardMaterial({ color: '#FF6A4A', emissive: '#C83A20', emissiveIntensity: 1.0 }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(ulcer.position); ring.position.y += 0.02; ring.scale.setScalar(0.001); scene.add(ring);
    const debris = [];
    const dMat = new THREE.MeshStandardMaterial({ color: '#F2D9A0', emissive: '#C8A86A', emissiveIntensity: 0.6, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 40; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03 + 0.026 * R(i + 60), 10, 8), dMat); const dx = (R(i) * 2 - 1) * 2.0, dz = (R(i + 6) * 2 - 1) * 1.6; p.userData.b = [dx, surfY(dx, dz) + 0.05 + R(i + 3) * 1.1, dz]; scene.add(p); debris.push(p); }
    return { scene, epi, surf, lensOver, oxy, tears, germs, ulcer, ring, debris, key };
  })();

  const eyeRender = (lookAt, extra = {}) => E.render(EYE.scene, cam, { ...ELOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const corRender = (lookAt, extra = {}) => E.render(COR.scene, cam, { ...CLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const FACE = V3(0.1, 1.68, -0.6);
  const CYAN = new THREE.Color('#4FD1E8');
  const reset = () => { hero.pose({}); };
  // EYE state helper (pure per-frame): lidC 0(open)..1(closed), lensOn, oxyF (flow 0..1), redK, cloudK
  const eyeReset = (lidC = 0, lensOn = false, oxyF = 1, redK = 0, cloudK = 0, lensLift = 0, lt = 0) => {
    EYE.lid.rotation.x = -1.55 + 2.15 * lidC;             // -1.55 (back) → 0.6 (covers front-top)
    EYE.lens.visible = lensOn && lensLift < 0.95;
    EYE.lens.position.y = 0.05 + 0.1 * lidC + lensLift * 2.4;
    EYE.lens.material.opacity = 0.3 * (1 - lensLift);
    EYE.oxy.forEach((p, i) => { const b = p.userData.b; const y = b[1] - ((lt * (0.35 + 0.2 * (i % 3))) % 1) * 2.3 * oxyF; p.position.set(b[0], y, b[2]); p.material.emissiveIntensity = 1.0 + 0.6 * Math.sin(lt * 4 + i); });
    EYE.vessels.forEach((v, i) => { const k = clamp(redK * 1.3 - i * 0.06); v.visible = k > 0.02; v.scale.setScalar(Math.max(0.001, k)); v.material.emissiveIntensity = 0.6 + 1.2 * k; });
    EYE.cloud.material.opacity = 0.85 * cloudK; EYE.cloud.scale.set(0.6 + 0.5 * cloudK, 0.5 + 0.42 * cloudK, 0.4);
    EYE.cornea.material.emissiveIntensity = 0.18 + 0.25 * cloudK;
  };
  // CORNEA state helper: epiK (health 1→0), tearK, germK, germDrop (0 land..1 stuck), ulcerK, lensOn, lt
  const corReset = (epiK = 1, tearK = 0, germK = 0, ulcerK = 0, lensOn = false, lt = 0, oxyF = 1) => {
    COR.epi.material.emissiveIntensity = 0.15 + 0.6 * epiK; COR.epi.material.opacity = 0.12 + 0.25 * epiK;
    COR.surf.material.emissiveIntensity = 0.09 + 0.12 * epiK;
    COR.tears.forEach((t, i) => { const k = clamp(tearK * 1.4 - i * 0.09); t.visible = k > 0.02; t.scale.set(Math.max(0.001, k), 1, k); });
    COR.germs.forEach((g, i) => { const b = g.userData.b; const k = clamp(germK * 1.5 - i * 0.075); g.visible = k > 0.02; g.scale.setScalar(Math.max(0.001, k)); g.position.set(b[0], b[1] + 1.4 * (1 - k) + 0.06 * Math.sin(lt * 3 + i), b[2]); g.rotation.set(Math.PI / 2 + 0.25 * Math.sin(i * 2.1), 0, R1(i) * 0.9 - 0.45); });
    COR.ulcer.visible = ulcerK > 0.01;
    COR.ulcer.material.opacity = 0.85 * ulcerK;
    COR.ring.visible = ulcerK > 0.02;
    COR.ring.scale.setScalar(Math.max(0.001, ulcerK)); COR.ring.material.emissiveIntensity = 0.5 + 1.0 * ulcerK;
    COR.lensOver.visible = lensOn;
    COR.oxy.forEach((p, i) => { p.visible = oxyF > 0.05; const b = p.userData.b; const y = b[1] - ((lt * (0.35 + 0.2 * (i % 3)) * (0.2 + 0.8 * oxyF)) % 1) * 2.0; p.position.set(b[0], y, b[2]); p.material.emissiveIntensity = (0.25 + 1.1 * oxyF) * (0.8 + 0.4 * Math.sin(lt * 4 + i)); });
    COR.debris.forEach((p, i) => { const b = p.userData.b; const up = ((lt * (0.3 + 0.15 * (i % 3))) % 1); const op = 0.7 * (1 - up) * Math.min(1, ulcerK * 1.6); p.visible = op > 0.05; p.position.set(b[0], b[1] + up * 1.6, b[2]); p.material.opacity = op; });
    // temporary debug gate: "&hide=oxy,tears,germs,debris,epi,lens" hides suspects for bisecting artifacts
    const HIDE = new URLSearchParams(location.search).get('hide') || '';
    const hideSet = (n, arr) => { if (HIDE.includes(n)) arr.forEach((o) => { o.visible = false; }); };
    hideSet('oxy', COR.oxy); hideSet('tears', COR.tears); hideSet('germs', COR.germs); hideSet('debris', COR.debris);
    if (HIDE.includes('epi')) COR.epi.visible = false;
    if (HIDE.includes('lens')) COR.lensOver.visible = false;
    if (HIDE.includes('surf')) COR.surf.visible = false;
    if (HIDE.includes('ulcer')) { COR.ulcer.visible = false; COR.ring.visible = false; }
  };
  const R1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // hero poses
  const sleepyPose = (h) => h.pose({ spine: [2, 0, 0], head: [7, 0, 0], lid: 0.92, shL: [-34, 0, 6], elL: 112, shR: [7, 0, 6], elR: 15 });
  const rubPose = (h, k) => h.pose({ spine: [1 + 2 * k, 0, 0], head: [4 - 2 * k, 0, 0], lid: 0.85 - 0.45 * k, shL: [-40, 0, -8 - 6 * k], elL: 126 + 6 * k, shR: [7, 0, 6], elR: 15 });
  const alertPose = (h) => h.pose({ spine: [-2, 0, 0], head: [-4, 0, 0], lid: 0.14, shL: [9, 0, 8], shR: [9, 0, 8], elL: 18, elR: 18 });

  // 1 · HOOK: crashed in lenses (kitchen: sleepy hero rubs eye, camera drifts in)
  { const st = cut(0), sl = Wd('sleep', 0) - st;
    add({ id: 'S01', at: st, note: 'kitchen: hero sleepy, rubbing eye, SLEPT IN LENSES pill', draw(lt, d, t, blit) {
      reset(); const k = 0.5 + 0.5 * Math.sin(lt * 3.6);
      rubPose(hero, k * 0.4);
      cam.position.copy(lerpV(V3(0.55, 1.62, 1.2), V3(0.22, 1.52, 0.8), eio(lt / d))); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE)); blit();
      pill('SLEPT IN YOUR LENSES…', 540, 300, eob(seg(lt, Math.max(0.25, sl), sl + 0.4)), '#FFD43B');
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.3, sl), 'tock', { gain: 0.45 }); }

  // 2 · the cornea (EYE: front view of the dome, NO BLOOD VESSELS)
  { const st = cut(1), cor = Wd('cornea', 1) - st, vss = Wd('vessels', 1) - st;
    add({ id: 'S02', at: st, note: 'eye macro: cornea dome front view, CORNEA label, NO BLOOD VESSELS pill', draw(lt, d, t, blit) {
      reset(); eyeReset(0, false, 1, 0, 0, 0, lt);
      cam.position.copy(lerpV(V3(0.35, 0.3, 4.3), V3(0.0, 0.05, 3.3), eio(lt / d))); cam.lookAt(V3(0, 0, 1.5));
      eyeRender(V3(0, 0, 1.5)); blit();
      label('YOUR CORNEA', 800, 500, ...screen(V3(0, 0.5, 1.6), cam), eob(seg(lt, Math.max(0.2, cor), cor + 0.35)));
      pill('NO BLOOD VESSELS', 540, 1330, eob(seg(lt, Math.max(0.25, vss), vss + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.25, cor), 'plop', { gain: 0.4 }); }

  // 3 · oxygen from the air (EYE: cyan dots drift into the cornea)
  { const st = cut(2), oxy = Wd('oxygen', 2) - st, air = Wd('air', 2) - st;
    add({ id: 'S03', at: st, note: 'eye macro: cyan oxygen dots rain into the cornea, OXYGEN label + pill', draw(lt, d, t, blit) {
      reset(); eyeReset(0, false, 1, 0, 0, 0, lt);
      cam.position.copy(lerpV(V3(-0.6, 0.8, 3.4), V3(0.05, 0.3, 2.75), eio(lt / d))); cam.lookAt(V3(0, 0.12, 1.5));
      eyeRender(V3(0, 0.12, 1.5)); blit();
      label('OXYGEN', 760, 430, ...screen(V3(-0.35, 0.8, 1.45), cam), eob(seg(lt, Math.max(0.2, oxy), oxy + 0.35)));
      pill('STRAIGHT FROM THE AIR', 540, 1330, eob(seg(lt, Math.max(0.25, air), air + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.2, oxy), 'sparkle', { gain: 0.45 }); }

  // 4 · lid + lens = oxygen cut (EYE: eyelid slides down, lens lands, dots stop)
  { const st = cut(3), ln = Wd('lens', 3) - st, of = Wd('off', 3) - st;
    add({ id: 'S04', at: st, note: 'eye macro: lid closes + lens lands on "lens", oxygen dots freeze, pill', draw(lt, d, t, blit) {
      reset();
      const lidC = eio(clamp(seg(lt, 0.15, Math.max(0.7, of))));
      const lensOn = lt >= Math.max(0.3, ln - 0.1);
      const oxyF = 1 - eio(clamp(seg(lt, Math.max(0.4, ln), Math.max(0.9, of + 0.3))));
      eyeReset(lidC, lensOn, oxyF, 0, 0, 0, lt);
      cam.position.copy(lerpV(V3(0.4, 0.45, 4.6), V3(-0.05, 0.12, 3.8), eio(lt / d))); cam.lookAt(V3(0, 0, 1.5));
      eyeRender(V3(0, 0, 1.5)); blit();
      pill('LID + LENS = OXYGEN CUT', 540, 1330, eob(seg(lt, Math.max(0.25, of), of + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.15, ln), 'slide', { gain: 0.45 }); cue(Math.max(st + 0.35, of), 'thud', { gain: 0.5 }); }

  // 5 · the surface starves (CORNEA: epithelium glow dies away)
  { const st = cut(4), str = Wd('starves', 4) - st;
    add({ id: 'S05', at: st, note: 'cornea micro: epithelium dims, background darkens, STARVING pill', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      corReset(1 - 0.85 * k, 0, 0, 0, true, lt, 0.5);
      COR.key.intensity = 1.9 - 0.5 * k;
      cam.position.copy(lerpV(V3(0.45, 0.55, 2.9), V3(0.0, 0.32, 2.05), eio(lt / d))); cam.lookAt(V3(0, -0.3, 0.3));
      corRender(V3(0, -0.3, 0.3)); blit();
      pill('CORNEA STARVING', 540, 1330, eob(seg(lt, Math.max(0.25, str), str + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, str), 'slide', { gain: 0.4 }); }

  // 6 · micro-tears open (CORNEA: red cracks pop across the surface)
  { const st = cut(5), op = Wd('open', 5) - st;
    add({ id: 'S06', at: st, note: 'cornea micro: red micro-cracks scale in one by one, MICRO-TEARS pill', draw(lt, d, t, blit) {
      reset(); corReset(0.25, eio(clamp(seg(lt, Math.max(0.2, op - 0.1), op + 0.9))), 0, 0, true, lt, 0.03);
      cam.position.copy(lerpV(V3(-0.6, 0.5, 2.55), V3(0.1, 0.32, 1.9), eio(lt / d))); cam.lookAt(V3(0, -0.3, 0.3));
      corRender(V3(0, -0.3, 0.3)); blit();
      pill('MICRO-TEARS OPEN', 540, 1330, eob(seg(lt, Math.max(0.2, op), op + 0.35)), '#FF8A8A');
    } });
    [0.3, 0.65, 1.0].forEach((o) => cue(st + o, 'tock', { gain: 0.4 })); }

  // 7 · bacteria move in (CORNEA: green rods rain down and stick)
  { const st = cut(6), psd = Wd('pseudomonas', 6) - st, mv = Wd('move', 6) - st;
    add({ id: 'S07', at: st, note: 'cornea micro: green Pseudomonas rods descend + stick, label + pill', draw(lt, d, t, blit) {
      reset(); corReset(0.2, 1, eio(clamp(seg(lt, Math.max(0.2, psd), mv + 1.1))), 0, true, lt, 0.03);
      cam.position.copy(lerpV(V3(0.75, 0.6, 2.35), V3(-0.1, 0.3, 1.75), eio(lt / d))); cam.lookAt(V3(0, -0.3, 0.3));
      corRender(V3(0, -0.3, 0.3)); blit();
      label('PSEUDOMONAS', 540, 430, ...screen(V3(0.9, -0.1, 0.4), cam), eob(seg(lt, Math.max(0.2, psd), psd + 0.35)));
      pill('BACTERIA MOVE IN', 540, 1330, eob(seg(lt, Math.max(0.25, mv), mv + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, psd), 'bubbles', { dur: 1.1, gain: 0.35 }); }

  // 8 · enzymes digest (CORNEA: ulcer crater + red ring grows, debris rises)
  { const st = cut(7), dg = Wd('digest', 7) - st, fs = Wd('fast', 7) - st;
    add({ id: 'S08', at: st, note: 'cornea micro: ulcer crater + ring grow, debris rises, ENZYMES pill', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(seg(lt, Math.max(0.2, dg), fs + 0.7)));
      corReset(0.12, 1, 1, k, true, lt, 0.03);
      cam.position.copy(lerpV(V3(-0.4, 0.45, 2.1), V3(0.18, 0.3, 1.55), eio(lt / d))); cam.lookAt(V3(0.08, -0.35, 0.2));
      corRender(V3(0.08, -0.35, 0.2)); blit();
      label('ULCER FORMING', 830, 500, ...screen(V3(0.1, -0.25, 0.4), cam), eob(seg(lt, Math.max(0.25, dg), dg + 0.35)));
      pill('ENZYMES DIGEST IT — FAST', 540, 1330, eob(seg(lt, Math.max(0.2, fs), fs + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, dg), 'sizzle', { dur: 1.3, gain: 0.4 }); cue(Math.max(st + 0.35, fs), 'alarm', { dur: 0.6, gain: 0.3 }); }

  // 9 · morning: red painful ulcer (EYE: vessels red, cornea clouding)
  { const st = cut(8), mrn = Wd('morning', 8) - st, ul = Wd('ulcer', 8) - st;
    add({ id: 'S09', at: st, note: 'eye macro: red vessels crawl in, white cloud on the cornea, pill', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      eyeReset(0, true, 0.25, k, 0.55 * k, 0, lt);
      cam.position.copy(lerpV(V3(0.3, 0.35, 3.5), V3(-0.05, 0.08, 2.9), eio(lt / d))); cam.lookAt(V3(0, 0, 1.5));
      eyeRender(V3(0, 0, 1.5)); blit();
      pill('RED, PAINFUL ULCER', 540, 1330, eob(seg(lt, Math.max(0.25, ul), ul + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, mrn), 'alarm', { dur: 0.8, gain: 0.4 }); }

  // 10 · rare: scar / transplant (EYE: cloud opaque, warning sign)
  { const st = cut(9), re = Wd('rare', 9) - st, tr = Wd('scar', 9) - st;
    add({ id: 'S10', at: st, note: 'eye macro: opacity covers the cornea, warning sign, RARE pill', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      eyeReset(0, true, 0.1, 1, 0.35 + 0.5 * k, 0, lt);
      EYE.key.intensity = 1.7 - 0.7 * k;
      cam.position.copy(lerpV(V3(-0.25, 0.25, 3.3), V3(0.08, 0.05, 2.75), eio(lt / d))); cam.lookAt(V3(0, 0, 1.5));
      eyeRender(V3(0, 0, 1.5)); blit();
      warning(540, 1180, eob(seg(lt, Math.max(0.2, re), re + 0.4)) * 0.9);
      pill('RARE: SCAR / TRANSPLANT', 540, 300, eob(seg(lt, Math.max(0.25, tr), tr + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, tr), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 11 · payoff: take them out (kitchen: hero alert, green pill)
  { const st = cut(10), bd = Wd('bed', 10) - st;
    add({ id: 'S11', at: st, note: 'kitchen settle: hero alert + fresh, TAKE THEM OUT pill green', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(lt / d));
      alertPose(hero);
      cam.position.copy(lerpV(V3(0.3, 1.6, 1.0), V3(-0.12, 1.55, 1.2), k)); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE), { exposure: lerp(1, 0.82, k), vignette: lerp(0.35, 0.55, k) }); blit();
      pill('TAKE THEM OUT BEFORE BED ✓', 540, 1180, eob(seg(lt, Math.max(0.2, bd), bd + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.25, bd), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  // 12 · never tap water (EYE: lens lifts away, oxygen returns)
  { const st = cut(11), wtr = Wd('water', 11) - st;
    add({ id: 'S12', at: st, note: 'eye macro: lens lifts off, oxygen dots return, NEVER TAP WATER pill', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(seg(lt, 0.2, Math.max(1.0, wtr + 0.3))));
      eyeReset(0, true, 0.25 + 0.75 * k, 0, 0, k, lt);
      cam.position.copy(lerpV(V3(-0.4, 0.55, 3.6), V3(0.05, 0.2, 3.05), eio(lt / d))); cam.lookAt(V3(0, 0.15, 1.5));
      eyeRender(V3(0, 0.15, 1.5), { exposure: lerp(0.9, 1.05, k) }); blit();
      pill('NEVER TAP WATER ✗', 540, 1330, eob(seg(lt, Math.max(0.2, wtr), wtr + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.2, wtr), 'zip', { gain: 0.35 }); cue(st + 0.5, 'sparkle', { gain: 0.45 }); }

  return { shots: S, cues: CUES };
}
