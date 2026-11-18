// WHAT HAPPENS IF YOU STARE AT THE SUN? : shot list (Deep Dive 3D).
// World flow: x-ray FIGURE with a pulsing sun disc (hook) → EYE MACRO (lens focuses sunlight rays
// onto the retina dome; sun dot rides the axis like a magnifying glass; TWIST: not a burn) →
// RETINA WALL (cells warm only +4°C — calm; orange oxidation sparks fly in on "chemical
// reactions"; cells dim out; central cluster turns YELLOW = macula spot, then RED within days) →
// x-ray figure (blind spot, vision 20/40, both eyes) → RETINA WALL (cells re-light: heals in
// months; severe cases: some stay dark + warning) → x-ray figure (sun goes dark: ECLIPSE, clinics
// see the damage) → payoff (never look directly — eclipse glasses ✓).
// Facts: Wikipedia Photic retinopathy (accessed 2026-11-17: macula damage from solar radiation;
// photochemical injury NOT thermal — only ~4°C rise with a 3-mm pupil, insufficient to
// photocoagulate; light promotes oxidation with unbonded oxygen molecules; blind spot + blurring
// + pain; usually both eyes; 20/20 → 20/40 or 20/60 or worse; foveal yellow spot first days →
// reddish dot after a few days; usually recovers within ~2 months, no reliable treatment, severe
// cases may never fully recover); AAO eclipse-safety guidance (never look directly; ISO 12312-2
// eclipse glasses; post-2017-eclipse retinopathy cases, JAMA Ophthalmology).
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
  const ELOOK = { aperture: 0.0018, bloom: 0.6, bloomThreshold: 0.42, vignette: 0.5 };
  const RLOOK = { aperture: 0.002, maxblur: 0.012, bloom: 0.55, bloomThreshold: 0.42, vignette: 0.55 };

  // ── world X · x-ray figure + sun disc ─────────────────────────────────
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial();
  xh.setBodyMaterial(xmat);
  X.scene.add(xh.group);
  xh.head.children.forEach((c) => { if (c.isMesh && Math.abs(c.position.x) < 0.01) c.material = xmat; });
  xh.head.traverse((c) => { if (c.isMesh && Math.abs(c.position.z - 0.091) < 0.01) { c.material = new THREE.MeshStandardMaterial({ color: '#9BE8FF', emissive: '#57C8F0', emissiveIntensity: 0.5 }); } });
  // the sun: gold disc + ring + light, floating beside the head
  const sun = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 28), new THREE.MeshStandardMaterial({ color: '#FFD43B', emissive: '#E8A400', emissiveIntensity: 1.6 }));
  disc.rotation.x = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 10, 40), new THREE.MeshStandardMaterial({ color: '#FFE87A', emissive: '#D89800', emissiveIntensity: 1.2, transparent: true, opacity: 0 }));
  const sunLight = new THREE.PointLight('#FFC84A', 6, 4, 1.8);
  sun.add(disc, ring, sunLight);
  sun.position.set(0.2, 1.9, 0.4); sun.scale.setScalar(1.15); X.scene.add(sun);
  const FACE3 = V3(0, 1.60, 0.10);
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const xReset = (o = {}) => {
    const { lid = 0.35, lean = 2, sway = 0 } = o;
    xh.pose({ spine: [lean, 0, sway], lid, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
    disc.material.emissiveIntensity = 1.6; disc.material.color.set('#FFD43B');
    ring.material.opacity = 0; sunLight.color.set('#FFC84A');
    sun.scale.setScalar(1);
  };

  // ── world E · eye macro (lens + converging rays + retina dome) ────────
  const Ey = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#160B0E');
    scene.fog = new THREE.Fog('#160B0E', 6, 11);
    scene.add(new THREE.HemisphereLight('#FFE8D9', '#160B0E', 1.0));
    const key = new THREE.DirectionalLight('#FFF0E8', 1.2); key.position.set(1.6, 2.0, 2.8); scene.add(key);
    // retina dome: curved red wall at the back (inner surface faces the camera)
    const retina = new THREE.Mesh(new THREE.SphereGeometry(2.4, 48, 32), new THREE.MeshStandardMaterial({ color: '#7A2430', roughness: 0.75, emissive: '#3A0E16', emissiveIntensity: 0.3, side: THREE.BackSide }));
    retina.position.set(0, 0, -1.6); scene.add(retina);
    // macula patch: faint darker oval on the retina axis
    const macula = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshStandardMaterial({ color: '#8A3A2A', roughness: 0.8, emissive: '#4A1A10', emissiveIntensity: 0.4, transparent: true, opacity: 0.75 }));
    macula.position.set(0, 0, 0.79); scene.add(macula);
    // lens: translucent squashed sphere near the front
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.72, 40, 28), new THREE.MeshPhysicalMaterial({ color: '#BFE8F8', transparent: true, opacity: 0.28, roughness: 0.15, clearcoat: 1, emissive: '#4FA8C8', emissiveIntensity: 0.2 }));
    lens.scale.z = 0.32; lens.position.set(0, 0, 1.55); scene.add(lens);
    // iris ring around the lens
    const iris = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.05, 12, 48), new THREE.MeshStandardMaterial({ color: '#3A7A8A', roughness: 0.5, emissive: '#1F4A58', emissiveIntensity: 0.5 }));
    iris.position.copy(lens.position); scene.add(iris);
    // sun rays: thin gold beams from the front ring converging on the retina axis
    const rays = [];
    const rayMat = new THREE.MeshStandardMaterial({ color: '#FFE04A', emissive: '#D8A400', emissiveIntensity: 1.1, transparent: true, opacity: 0.7 });
    const rayFrom = [[-0.55, 0.42], [0.55, 0.42], [-0.55, -0.42], [0.55, -0.42], [0, 0.52], [0, -0.52]];
    const focusP = V3(0, 0, 0.82);
    rayFrom.forEach(([rx, ry], i) => {
      const a = V3(rx, ry, 3.0), b = focusP.clone();
      const len = a.distanceTo(b);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, len, 8, 1, true), rayMat);
      r.position.copy(a).add(b).multiplyScalar(0.5);
      r.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize());
      r.scale.setScalar(0.001); r.userData.i = i;
      scene.add(r); rays.push(r);
    });
    // sun dot riding the axis into the eye (the "magnifying glass" beat)
    const sunDot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshStandardMaterial({ color: '#FFE87A', emissive: '#FFC400', emissiveIntensity: 1.8 }));
    sunDot.scale.setScalar(0.001); scene.add(sunDot);
    // the hot spot where everything converges
    const focusGlow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), new THREE.MeshStandardMaterial({ color: '#FFF6D8', emissive: '#FFD84A', emissiveIntensity: 2.2, transparent: true, opacity: 0.95 }));
    focusGlow.position.copy(focusP); focusGlow.scale.setScalar(0.001); scene.add(focusGlow);
    const focusLight = new THREE.PointLight('#FFC84A', 0, 4, 1.8); focusLight.position.copy(focusP).add(V3(0, 0, 0.15)); scene.add(focusLight);
    // drifting particles (humour detail)
    const parts = [];
    const pMat = new THREE.MeshStandardMaterial({ color: '#C9B8E8', emissive: '#8A6AC8', emissiveIntensity: 0.35, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.026 + 0.02 * R(i + 101), 8, 6), pMat); p.userData.b = [(R(i) * 2 - 1) * 2.2, -0.9 + R(i + 3) * 2.2, 0.2 - R(i + 6) * 2.2]; scene.add(p); parts.push(p); }
    return { scene, lens, iris, rays, sunDot, focusGlow, focusLight, parts, rayMat };
  })();
  const eRender = (lookAt, extra = {}) => E.render(Ey.scene, cam, { ...ELOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const eReset = (lt = 0, o = {}) => {
    const { raysK = 0, dotZ = 3.0, dotK = 0, hot = 0 } = o;
    Ey.rays.forEach((r, i) => { const k = eio(clamp(seg(lt, 0.1 + i * 0.09, 0.5 + i * 0.09))) * raysK; r.scale.setScalar(Math.max(0.001, k)); });
    Ey.sunDot.scale.setScalar(Math.max(0.001, dotK * 1));
    Ey.sunDot.position.set(0, 0, dotZ);
    Ey.focusGlow.scale.setScalar(Math.max(0.001, eio(clamp(hot)) * (0.9 + 0.25 * Math.sin(lt * 6))));
    Ey.focusLight.intensity = eio(clamp(hot)) * 26;
    Ey.rayMat.opacity = 0.7 * (0.8 + 0.2 * Math.sin(lt * 3));
    Ey.parts.forEach((p, i) => { const b = p.userData.b; p.position.set(b[0] + 0.15 * Math.sin(lt * 0.6 + i * 1.1), b[1] + 0.22 * Math.sin(lt * 0.45 + i * 1.3), b[2] + 0.15 * Math.cos(lt * 0.5 + i * 0.7)); });
  };

  // ── world R · retina wall (photoreceptor cells + oxidation attack) ────
  const Rw = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#150A10');
    scene.fog = new THREE.Fog('#150A10', 6, 11);
    scene.add(new THREE.HemisphereLight('#FFD9E2', '#150A10', 1.0));
    const key = new THREE.DirectionalLight('#FFF0E8', 1.2); key.position.set(1.6, 1.8, 2.8); scene.add(key);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(6.2, 48, 32), new THREE.MeshStandardMaterial({ color: '#241016', roughness: 0.9, side: THREE.BackSide }));
    scene.add(dome);
    // photoreceptor wall: pegs pointing at the camera, pink rods + teal cones
    const cells = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
      const x = (col - 2.5) * 0.3, y = (row - 1.5) * 0.34;
      const cone = (col + row) % 3 === 0;
      const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.1, 6, 14), new THREE.MeshStandardMaterial({ color: cone ? '#7FE3F2' : '#F0A8B8', roughness: 0.5, emissive: cone ? '#2F9AB0' : '#B86A80', emissiveIntensity: 0.4 }));
      c.position.set(x, y, -0.45 + 0.06 * (x * x + y * y));
      c.rotation.x = Math.PI / 2;
      c.userData = { base: c.position.clone(), cone, dmg: false, ph: R(row * 6 + col) * 6.28 };
      scene.add(c); cells.push(c);
    }
    // the damage cluster: cells nearest the center (the fovea)
    const dmgCells = cells.slice().sort((a, b) => a.userData.base.lengthSq() - b.userData.base.lengthSq()).slice(0, 3);
    dmgCells.forEach((c) => { c.userData.dmg = true; });
    // oxidation sparks: orange dots that fly from the camera side into the wall
    const sparks = [];
    const sMat = new THREE.MeshStandardMaterial({ color: '#FF8A3A', emissive: '#E85A10', emissiveIntensity: 1.8 });
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.07 + 0.025 * R(i + 61), 10, 8), sMat); s.userData = { tgt: dmgCells[i % 3], seed: R(i + 71) * 2.4, off: V3((R(i + 81) * 2 - 1) * 0.25, (R(i + 91) * 2 - 1) * 0.25, 0) }; s.scale.setScalar(0.001); scene.add(s); sparks.push(s); }
    // drifting particles
    const parts = [];
    const pMat = new THREE.MeshStandardMaterial({ color: '#E8B8C8', emissive: '#A86878', emissiveIntensity: 0.35, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 16; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.026 + 0.02 * R(i + 101), 8, 6), pMat); p.userData.b = [(R(i) * 2 - 1) * 2.2, -0.9 + R(i + 3) * 2.2, -0.2 - R(i + 6) * 1.8]; scene.add(p); parts.push(p); }
    return { scene, cells, dmgCells, sparks, parts };
  })();
  const rRender = (lookAt, extra = {}) => E.render(Rw.scene, cam, { ...RLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  // state: dimK = attacked cells dimmed, atk = sparks flying, spot = 0 normal / 1 yellow / 2 red, healK, deadForever
  const rReset = (lt = 0, o = {}) => {
    const { dimK = 0, atk = 0, spot = 0, healK = 0, deadK = 0 } = o;
    Rw.cells.forEach((c, i) => {
      let em = 0.4 + 0.15 * Math.sin(lt * 1.8 + c.userData.ph);
      if (c.userData.dmg) em = lerp(em, 0.08, dimK * (1 - healK));
      else em = lerp(em, 0.12, dimK * 0.55 * (1 - healK));
      if (c.userData.dmg && deadK > 0) em = lerp(em, 0.06, deadK);
      c.material.emissiveIntensity = em;
    });
    // damage cluster color: normal pink → yellow → red (clinical progression)
    const dmgCol = spot >= 2 ? '#E8452A' : spot >= 1 ? '#FFD43B' : (Rw.dmgCells[0].userData.cone ? '#7FE3F2' : '#F0A8B8');
    Rw.dmgCells.forEach((c) => { c.material.color.set(dmgCol); c.material.emissive.set(spot >= 2 ? '#8A1A0A' : spot >= 1 ? '#D8A400' : (c.userData.cone ? '#2F9AB0' : '#B86A80')); });
    Rw.sparks.forEach((s, i) => {
      const k = eio(clamp(seg(lt, s.userData.seed + i * 0.14, s.userData.seed + i * 0.14 + 0.55))) * atk;
      s.scale.setScalar(Math.max(0.001, k * (k > 0.88 ? (1 - k) * 8 : 1)));
      const tgt = s.userData.tgt.userData.base;
      s.position.set(tgt.x + s.userData.off.x * (1 - k), tgt.y + s.userData.off.y * (1 - k), lerp(2.2, -0.25, k));
    });
    Rw.parts.forEach((p, i) => { const b = p.userData.b; p.position.set(b[0] + 0.14 * Math.sin(lt * 0.6 + i * 1.1), b[1] + 0.22 * Math.sin(lt * 0.45 + i * 1.3), b[2] + 0.14 * Math.cos(lt * 0.5 + i * 0.7)); });
  };

  // ─────────────────────────────────────────────────────────── shots ───
  // 1 · HOOK: stare at the sun (x-ray figure + pulsing sun disc)
  { const st = cut(0), str = Wd('stare', 0) - st, sn = Wd('sun', 0) - st;
    add({ id: 'S01', at: st, note: 'x-ray figure, gold sun disc pulses in, question pill', draw(lt, d, t, blit) {
      xReset();
      const k = eio(clamp(seg(lt, 0.15, 0.6)));
      sun.scale.setScalar(Math.max(0.001, k * (1 + 0.05 * Math.sin(lt * 5))));
      sunLight.intensity = 6 * k;
      cam.position.copy(lerpV(V3(0.42, 1.72, 1.55), V3(-0.08, 1.66, 1.65), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('STARE AT THE SUN?', 540, 1330, eob(seg(lt, Math.max(0.3, str), str + 0.35)), '#FFD43B');
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.3, sn), 'tock', { gain: 0.45 }); }

  // 2 · lens focuses sunlight onto your retina (EYE macro: rays converge)
  { const st = cut(1), lns = Wd('lens', 1) - st, rtn = Wd('retina', 1) - st;
    add({ id: 'S02', at: st, note: 'eye macro: lens + iris, gold rays converge onto the retina dome, LENS/RETINA labels', draw(lt, d, t, blit) {
      eReset(lt, { raysK: eio(clamp(seg(lt, Math.max(0.2, lns - 0.1), lns + 0.6))), hot: eio(clamp(seg(lt, Math.max(0.5, rtn - 0.1), rtn + 0.6))) });
      cam.position.copy(lerpV(V3(0.14, 0.2, 6.3), V3(-0.1, 0.14, 6.0), eio(lt / d))); cam.lookAt(V3(0, 0.05, 0.6));
      eRender(V3(0, 0.05, 0.6)); blit();
      label('LENS', 640, 420, ...screen(V3(-0.5, 0.28, 1.55), cam), eob(seg(lt, Math.max(0.25, lns), lns + 0.35)));
      label('RETINA', 720, 460, ...screen(V3(-0.62, -0.42, 0.4), cam), eob(seg(lt, Math.max(0.3, rtn), rtn + 0.35)));
    } });
    cue(Math.max(st + 0.3, rtn), 'slide', { gain: 0.45 }); }

  // 3 · like a magnifying glass on a leaf (EYE macro: sun dot rides the axis in)
  { const st = cut(2), mgn = Wd('magnifying', 2) - st, lef = Wd('leaf', 2) - st;
    add({ id: 'S03', at: st, note: 'eye macro: bright sun dot travels down the axis through the lens to the retina hot spot', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.2, mgn - 0.1), mgn + 0.8)));
      eReset(lt, { raysK: 1, dotK: k, dotZ: lerp(3.0, 1.15, k), hot: 0.6 + 0.4 * k });
      cam.position.copy(lerpV(V3(-0.12, 0.18, 6.1), V3(0.1, 0.14, 5.85), eio(lt / d))); cam.lookAt(V3(0, 0.05, 0.6));
      eRender(V3(0, 0.05, 0.6)); blit();
      pill('LIKE A MAGNIFYING GLASS', 540, 1180, eob(seg(lt, Math.max(0.25, mgn), mgn + 0.35)), '#FFD43B');
      pill('ON A LEAF', 540, 1330, eob(seg(lt, Math.max(0.3, lef), lef + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, mgn), 'sizzle', { dur: 1.0, gain: 0.3 }); }

  // 4 · twist: it is not a burn (EYE macro: everything calms, gold pill)
  { const st = cut(3), tws = Wd('twist', 3) - st, brn = Wd('burn', 3) - st;
    add({ id: 'S04', at: st, note: 'eye macro: rays dim back, focus glow softens, TWIST + NOT A BURN pills', draw(lt, d, t, blit) {
      eReset(lt, { raysK: 1 - 0.5 * eio(clamp(seg(lt, 0.3, 0.8))), dotK: 0, hot: lerp(1, 0.25, eio(clamp(seg(lt, 0.3, 0.8)))) });
      cam.position.copy(lerpV(V3(0.1, 0.18, 6.2), V3(-0.08, 0.14, 5.95), eio(lt / d))); cam.lookAt(V3(0, 0.05, 0.6));
      eRender(V3(0, 0.05, 0.6)); blit();
      pill('THE TWIST:', 540, 1180, eob(seg(lt, Math.max(0.25, tws), tws + 0.35)), '#FFD43B');
      pill("IT'S NOT A BURN", 540, 1330, eob(seg(lt, Math.max(0.3, brn), brn + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, brn), 'boing', { gain: 0.4 }); }

  // 5 · retina warms about four degrees (RETINA wall: calm, cells soft)
  { const st = cut(4), rtn5 = Wd('retina', 4) - st, dgr = Wd('degrees', 4) - st;
    add({ id: 'S05', at: st, note: 'retina wall: calm pink/teal cells, ONLY +4°C pill', draw(lt, d, t, blit) {
      rReset(lt, { dimK: 0, atk: 0 });
      cam.position.copy(lerpV(V3(0.1, 0.08, 5.7), V3(-0.08, 0.04, 5.5), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4)); blit();
      pill('YOUR RETINA WARMS', 540, 1180, eob(seg(lt, Math.max(0.25, rtn5), rtn5 + 0.35)), '#FFD43B');
      pill('ONLY ABOUT +4°C', 540, 1330, eob(seg(lt, Math.max(0.3, dgr), dgr + 0.35)), '#9FD9FF');
    } });
    cue(Math.max(st + 0.3, dgr), 'tock', { gain: 0.4 }); }

  // 6 · the light triggers chemical reactions (RETINA wall: orange sparks appear)
  { const st = cut(5), lgt = Wd('light', 5) - st, rct = Wd('reactions', 5) - st;
    add({ id: 'S06', at: st, note: 'retina wall: orange oxidation sparks fade in among the cells', draw(lt, d, t, blit) {
      rReset(lt, { atk: eio(clamp(seg(lt, Math.max(0.2, rct - 0.1), rct + 0.7))) * 0.5 });
      cam.position.copy(lerpV(V3(-0.1, 0.06, 5.8), V3(0.08, 0.02, 5.6), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4)); blit();
      pill('THE LIGHT TRIGGERS', 540, 1180, eob(seg(lt, Math.max(0.25, lgt), lgt + 0.35)), '#FFD43B');
      pill('CHEMICAL REACTIONS', 540, 1330, eob(seg(lt, Math.max(0.3, rct), rct + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, rct), 'sizzle', { dur: 1.0, gain: 0.3 }); }

  // 7 · oxidation attacks your photoreceptors (RETINA wall: sparks strike, cells dim)
  { const st = cut(6), ox = Wd('Oxidation', 6) - st, atk = Wd('attacks', 6) - st;
    add({ id: 'S07', at: st, note: 'retina wall: orange sparks slam into the wall, cells dim out on "attacks", alarm', draw(lt, d, t, blit) {
      rReset(lt, { dimK: eio(clamp(seg(lt, Math.max(0.25, atk - 0.05), atk + 0.6))), atk: 1 });
      cam.position.copy(lerpV(V3(0.08, 0.06, 5.75), V3(-0.06, 0.02, 5.55), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4)); blit();
      pill('OXIDATION ATTACKS', 540, 1180, eob(seg(lt, Math.max(0.25, ox), ox + 0.35)), '#FF8A8A');
      pill('YOUR PHOTORECEPTORS', 540, 1330, eob(seg(lt, Math.max(0.3, atk), atk + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, atk), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 8 · a yellow spot on your macula (RETINA wall: central cells turn yellow)
  { const st = cut(7), ylw = Wd('yellow', 7) - st, mcl = Wd('macula', 7) - st;
    add({ id: 'S08', at: st, note: 'retina wall: the central damage cluster turns YELLOW, label MACULA', draw(lt, d, t, blit) {
      rReset(lt, { dimK: 1, atk: 0.4, spot: eio(clamp(seg(lt, Math.max(0.2, ylw - 0.05), ylw + 0.5))) });
      cam.position.copy(lerpV(V3(-0.06, 0.05, 5.9), V3(0.06, 0.02, 5.7), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4)); blit();
      pill('A YELLOW SPOT', 540, 1180, eob(seg(lt, Math.max(0.25, ylw), ylw + 0.35)), '#FFD43B');
      label('MACULA', 780, 500, ...screen(V3(0.35, 0.42, -0.35), cam), eob(seg(lt, Math.max(0.3, mcl), mcl + 0.35)));
    } });
    cue(Math.max(st + 0.3, mcl), 'thud', { gain: 0.45 }); }

  // 9 · doctors see it turn red within days (RETINA wall: spot goes red)
  { const st = cut(8), dct = Wd('Doctors', 8) - st, rd = Wd('red', 8) - st;
    add({ id: 'S09', at: st, note: 'retina wall: yellow spot turns RED on "red", DOCTORS SEE pill', draw(lt, d, t, blit) {
      const sp = eio(clamp(seg(lt, Math.max(0.2, rd - 0.05), rd + 0.5)));
      rReset(lt, { dimK: 1, atk: 0.3, spot: 1 + sp });
      cam.position.copy(lerpV(V3(0.06, 0.05, 5.95), V3(-0.06, 0.02, 5.75), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4)); blit();
      pill('DOCTORS SEE IT', 540, 1180, eob(seg(lt, Math.max(0.25, dct), dct + 0.35)), '#FFD43B');
      pill('TURN RED WITHIN DAYS', 540, 1330, eob(seg(lt, Math.max(0.3, rd), rd + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, rd), 'alarm', { dur: 0.8, gain: 0.35 }); }

  // 10 · a blind spot that will not go away (x-ray figure)
  { const st = cut(9), bld = Wd('blind', 9) - st, gwy = Wd('away', 9) - st;
    add({ id: 'S10', at: st, note: 'x-ray figure: BLIND SPOT + NOT GO AWAY pills, uneasy sway', draw(lt, d, t, blit) {
      xReset({ lid: 0.5, sway: 2.5 * Math.sin(lt * 1.9) });
      cam.position.copy(lerpV(V3(0.38, 1.68, 1.35), V3(-0.1, 1.62, 1.08), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('A BLIND SPOT', 540, 1180, eob(seg(lt, Math.max(0.25, bld), bld + 0.35)), '#FF8A8A');
      pill("THAT WON'T GO AWAY", 540, 1330, eob(seg(lt, Math.max(0.3, gwy), gwy + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, bld), 'thud', { gain: 0.45 }); }

  // 11 · vision drops to about 20/40 (x-ray figure, stats pills)
  { const st = cut(10), vis = Wd('drops', 10) - st, wrs = Wd('worse', 10) - st;
    add({ id: 'S11', at: st, note: 'x-ray figure: VISION 20/40 pill + SOMETIMES FAR WORSE pill', draw(lt, d, t, blit) {
      xReset({ lid: 0.55 });
      cam.position.copy(lerpV(V3(-0.35, 1.66, 1.3), V3(0.1, 1.6, 1.05), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('VISION DROPS TO 20/40', 540, 1180, eob(seg(lt, Math.max(0.25, vis), vis + 0.35)), '#9FD9FF');
      pill('SOMETIMES FAR WORSE', 540, 1330, eob(seg(lt, Math.max(0.3, wrs), wrs + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, wrs), 'alarm', { dur: 0.7, gain: 0.3 }); }

  // 12 · usually in both eyes at once (x-ray figure, both-eyes pills)
  { const st = cut(11), bth = Wd('both', 11) - st, onc = Wd('once', 11) - st;
    add({ id: 'S12', at: st, note: 'x-ray figure: BOTH EYES AT ONCE pill', draw(lt, d, t, blit) {
      xReset({ lid: 0.5 });
      cam.position.copy(lerpV(V3(0.32, 1.68, 1.28), V3(-0.08, 1.62, 1.05), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('USUALLY IN', 540, 1180, eob(seg(lt, Math.max(0.25, bth), bth + 0.35)), '#FFD43B');
      pill('BOTH EYES AT ONCE', 540, 1330, eob(seg(lt, Math.max(0.3, onc), onc + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, onc), 'thud', { gain: 0.4 }); }

  // 13 · it usually heals within a month or two (RETINA wall: cells re-light)
  { const st = cut(12), hls = Wd('heals', 12) - st, mnt = Wd('month', 12) - st;
    add({ id: 'S13', at: st, note: 'retina wall: dimmed cells re-light gradually, gold HEALS pill', draw(lt, d, t, blit) {
      rReset(lt, { dimK: 1, atk: 0, healK: eio(clamp(seg(lt, Math.max(0.2, hls - 0.05), hls + 0.8))), spot: 2 });
      cam.position.copy(lerpV(V3(-0.08, 0.05, 5.8), V3(0.06, 0.02, 5.6), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4)); blit();
      pill('IT USUALLY HEALS', 540, 1180, eob(seg(lt, Math.max(0.25, hls), hls + 0.35)), '#7CF29A');
      pill('WITHIN A MONTH OR TWO', 540, 1330, eob(seg(lt, Math.max(0.3, mnt), mnt + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, hls), 'sparkle', { gain: 0.4 }); }

  // 14 · but severe cases never fully recover (RETINA wall: some cells stay dark)
  { const st = cut(13), svr = Wd('severe', 13) - st, rcv = Wd('recover', 13) - st;
    add({ id: 'S14', at: st, note: 'retina wall: damage cluster dims back to dead + warning, SEVERE CASES pill', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.25, rcv - 0.05), rcv + 0.6)));
      rReset(lt, { dimK: 1, atk: 0, spot: 2, deadK: k });
      cam.position.copy(lerpV(V3(0.06, 0.05, 5.9), V3(-0.06, 0.02, 5.7), eio(lt / d))); cam.lookAt(V3(0, 0, -0.4));
      rRender(V3(0, 0, -0.4), { exposure: lerp(1, 0.85, k), vignette: lerp(0.55, 0.65, k) }); blit();
      warning(540, 300, eob(seg(lt, Math.max(0.3, rcv), rcv + 0.4)) * 0.9);
      pill('SEVERE CASES', 540, 1180, eob(seg(lt, Math.max(0.25, svr), svr + 0.35)), '#FF8A8A');
      pill('NEVER FULLY RECOVER', 540, 1330, eob(seg(lt, Math.max(0.3, rcv), rcv + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.35, rcv), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 15 · after every eclipse, clinics see the damage (x-ray figure: sun goes dark)
  { const st = cut(14), ecl = Wd('eclipse', 14) - st, dmg = Wd('damage', 14) - st;
    add({ id: 'S15', at: st, note: 'x-ray figure: the sun disc turns into a dark eclipse with a gold ring, clinics pill', draw(lt, d, t, blit) {
      const k = eio(clamp(seg(lt, Math.max(0.15, ecl - 0.1), ecl + 0.5)));
      xReset({ lid: 0.4 });
      disc.material.emissiveIntensity = lerp(1.6, 0.06, k);
      disc.material.color.set(k > 0.5 ? '#14141C' : '#FFD43B');
      ring.material.opacity = k * 0.95;
      sunLight.intensity = lerp(6, 1.2, k); sunLight.color.set('#9FD9FF');
      cam.position.copy(lerpV(V3(0.4, 1.7, 1.5), V3(-0.08, 1.65, 1.6), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('AFTER EVERY ECLIPSE', 540, 1180, eob(seg(lt, Math.max(0.25, ecl), ecl + 0.35)), '#9FD9FF');
      pill('EYE CLINICS SEE THE DAMAGE', 540, 1330, eob(seg(lt, Math.max(0.3, dmg), dmg + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, ecl), 'whoosh'); cue(Math.max(st + 0.35, dmg), 'alarm', { dur: 0.8, gain: 0.3 }); }

  // 16 · payoff: never look directly, use eclipse glasses (x-ray figure)
  { const st = cut(15), nvr = Wd('never', 15) - st, gls = Wd('glasses', 15) - st;
    add({ id: 'S16', at: st, note: 'x-ray figure calm, gold payoff pill: NEVER LOOK DIRECTLY ✓ ECLIPSE GLASSES', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      xReset({ lid: 0.35, lean: 2 });
      disc.material.emissiveIntensity = lerp(0.06, 1.6, k); disc.material.color.set(k > 0.5 ? '#FFD43B' : '#14141C');
      ring.material.opacity = (1 - k) * 0.95;
      sunLight.intensity = lerp(1.2, 6, k);
      cam.position.copy(lerpV(V3(0.3, 1.68, 1.5), V3(-0.06, 1.62, 1.55), k)); cam.lookAt(FACE3);
      xRender(FACE3, { exposure: lerp(1, 0.86, k), vignette: lerp(0.45, 0.58, k) }); blit();
      pill('NEVER LOOK DIRECTLY ✓', 540, 1180, eob(seg(lt, Math.max(0.25, nvr), nvr + 0.4)), '#FFD43B');
      pill('USE ECLIPSE GLASSES', 540, 1330, eob(seg(lt, Math.max(0.3, gls), gls + 0.4)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, nvr), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
