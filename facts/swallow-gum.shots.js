// WHAT HAPPENS IF YOU SWALLOW CHEWING GUM? : shot list (Deep Dive 3D).
// World flow: kitchen (hero chews, gulps it down) → x-ray (the ball slides to the stomach) →
// INSIDE the stomach (acid pool, the rubber piece floats untouched) → INSIDE the gut (peristalsis
// ring pushes the gum to the golden exit) → x-ray (the 7-years myth) → gut (the daily pile-up and
// the hardened mass) → kitchen (chew, don't swallow; the gut forgives once).
// Facts: Mayo Clinic — gum base is indigestible but passes through, usually within a few days;
// Milov 1998 (Pediatrics) / Sinopidis 2021 — daily swallowing → gum bezoars, one child needed surgery.
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

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);
  const KLOOK = { aperture: 0.003, maxblur: 0.01, bloom: 0.2 }, XLOOK = { aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.45 };
  const SLOOK = { aperture: 0.0022, maxblur: 0.012, bloom: 0.5, bloomThreshold: 0.42, vignette: 0.55 };
  const GLOOK = { aperture: 0.0022, maxblur: 0.012, bloom: 0.45, bloomThreshold: 0.45, vignette: 0.5 };

  // ── world A · kitchen ──────────────────────────────────────────────────
  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);

  // ── world B · x-ray stage ──────────────────────────────────────────────
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial(); xh.setBodyMaterial(xmat); const I = SETS.insides(); xh.spine.add(I.group); X.scene.add(xh.group);
  // the swallowed ball (lives in organ-local coords; esophagus → stomach)
  const xb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), new THREE.MeshStandardMaterial({ color: '#7FE8B0', emissive: '#3FBF80', emissiveIntensity: 0.9 })); I.group.add(xb);
  const iw = (v) => I.group.localToWorld(v.clone());                   // organ-local → world

  // ── world C · the stomach (macro: pink cavity, acid pool, the gum floats) ──
  const ST = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#3A0A14');
    const hemi = new THREE.HemisphereLight('#FF9AA8', '#2A0508', 0.85); scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFD9DF', 1.7); key.position.set(1.2, 1.4, 2.2); scene.add(key);
    const rim = new THREE.DirectionalLight('#E8657A', 1.0); rim.position.set(-1.8, 0.4, -1.6); scene.add(rim);
    const wall = new THREE.Mesh(new THREE.SphereGeometry(2.6, 48, 32), new THREE.MeshStandardMaterial({ color: '#B24A5E', roughness: 0.75, side: THREE.BackSide }));
    wall.scale.set(1, 0.8, 1.1); scene.add(wall);
    const foldM = new THREE.MeshStandardMaterial({ color: '#C4586C', roughness: 0.7 });
    for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(1.7 + (i % 2) * 0.45, 0.2, 12, 40), foldM); f.position.set((i - 2) * 0.5, -0.35 - (i % 3) * 0.3, -1.1 + (i % 2) * 0.6); f.rotation.set(Math.PI / 2 + 0.3, 0, 0.4 * (i - 2)); scene.add(f); }
    const acid = new THREE.Mesh(new THREE.SphereGeometry(2.0, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#D8E84A', transparent: true, opacity: 0.34, roughness: 0.15, emissive: '#9DB42A', emissiveIntensity: 0.35, clearcoat: 1 }));
    acid.scale.set(1, 0.16, 0.9); acid.position.y = -0.95; scene.add(acid);
    return { scene, acid, hemi, key, rim };
  })();
  // the gum piece (shared builder; mint rubber, lumpy)
  const gumMat = () => new THREE.MeshPhysicalMaterial({ color: '#7FE8B0', transparent: true, opacity: 0.82, roughness: 0.25, emissive: '#3FBF80', emissiveIntensity: 0.28, clearcoat: 1 });
  const gumPiece = (r = 0.16) => {
    const g = new THREE.Group();
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), gumMat()); blob.scale.set(1.25, 0.8, 0.95); g.add(blob);
    for (const [x, y, z, s] of [[r * 0.8, r * 0.3, r * 0.2, r * 0.55], [-r * 0.75, r * 0.2, -r * 0.3, r * 0.5], [r * 0.1, r * 0.55, -r * 0.5, r * 0.42]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(s, 18, 14), gumMat()); b.position.set(x, y, z); g.add(b); }
    return g;
  };
  const sg = gumPiece(0.17); sg.position.set(0, -0.52, 0); ST.scene.add(sg);

  // ── world D · the gut (macro tube: peristalsis ring pushes the gum to the exit) ──
  const GT = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#40101A');
    scene.fog = new THREE.FogExp2('#551622', 0.13);
    const hemi = new THREE.HemisphereLight('#FFA8B8', '#2A0508', 0.95); scene.add(hemi);
    const key = new THREE.DirectionalLight('#FFD9DF', 2.1); key.position.set(1, 1, 2.5); scene.add(key);
    const geo = new THREE.CylinderGeometry(1.35, 1.35, 30, 64, 160, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x);
      const n = 1 + 0.09 * Math.sin(a * 7 + y * 2.1) + 0.05 * Math.sin(a * 13 - y * 3.7);
      pos.setXYZ(i, x * n, y, z * n); }
    geo.computeVertexNormals();
    const tube = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#C25B6E', roughness: 0.6, clearcoat: 0.7, side: THREE.BackSide, emissive: '#6E1E2E', emissiveIntensity: 0.35 }));
    tube.rotation.x = Math.PI / 2; scene.add(tube);                    // tube now runs along z
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.13, 14, 48), new THREE.MeshStandardMaterial({ color: '#D97A8A', roughness: 0.5, emissive: '#B24458', emissiveIntensity: 0.35 }));
    scene.add(ring);
    const exit = new THREE.PointLight('#FFE9A0', 2.4, 9); exit.position.set(0, 0, 7); scene.add(exit);
    return { scene, ring, exit, hemi, key };
  })();
  const gg = gumPiece(0.19); gg.scale.setScalar(0.001); GT.scene.add(gg);   // travelling gum
  const pieces = []; for (let i = 0; i < 7; i++) { const p = gumPiece(0.15); p.scale.setScalar(0.001); GT.scene.add(p); pieces.push(p); }
  const mass = (() => {                                                   // the hardened bezoar mass
    const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#B08A5E', roughness: 0.85, emissive: '#7A5530', emissiveIntensity: 0.2 });
    for (const [x, y, z, s] of [[0, 0, 0, 0.34], [0.24, 0.1, 0.05, 0.24], [-0.22, 0.08, -0.06, 0.22], [0.05, -0.16, 0.1, 0.2], [-0.05, 0.2, -0.1, 0.18]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 16), m); b.position.set(x, y, z); g.add(b); }
    g.scale.setScalar(0.001); GT.scene.add(g); return g;
  })();
  const gtReset = (gumZ = 0.6, squeeze = 0, show = 'gum') => {              // pure-per-frame gut state
    const k = squeeze;
    GT.ring.position.z = gumZ - 0.55; GT.ring.scale.set(1 - 0.22 * k, 1 - 0.16 * k, 1);
    gg.scale.setScalar(show === 'gum' ? 1 : 0.001); gg.position.z = gumZ; gg.position.y = -0.06; gg.rotation.z = gumZ * 1.4;
    GT.exit.intensity = 2.4;
    pieces.forEach((p, i) => { const on = show === 'pile' || (show === 'mass' && false);
      p.scale.setScalar(on ? 1 : 0.001);
      if (on) { const a = i / pieces.length * Math.PI * 2; p.position.set(Math.cos(a) * 0.28, -0.12 + Math.sin(a) * 0.14, 0.25 + (i % 3) * 0.55); p.rotation.z = a; } });
    mass.scale.setScalar(show === 'mass' ? 0.55 : 0.001); mass.position.z = 1.5; mass.position.y = -0.08;
  };
  const gtRender = (lookAt, extra = {}) => E.render(GT.scene, cam, { ...GLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  const stRender = (lookAt, extra = {}) => E.render(ST.scene, cam, { ...SLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  const CYAN = new THREE.Color('#4FD1E8'), RED = new THREE.Color('#FF3B3B'), GREEN = new THREE.Color('#7CF29A');
  const chest = (h, k) => h.parts[0].scale.set(1 + 0.03 * k, 1 + 0.012 * k, 1 + 0.08 * k);
  const reset = () => { hero.pose({}); chest(hero, 0); xh.pose({}); chest(xh, 0); xmat.uniforms.uCol.value.copy(CYAN); };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const FACE = V3(0.1, 1.68, -0.6);
  const chewPose = (ch, lid = 0.2) => hero.pose({ spine: [1.5, 0, 0], head: [6 + 3.5 * ch, 0, 0], lid, shL: [8, 0, 6], shR: [8, 0, 6], elL: 16, elR: 16 });

  // 1 · HOOK: chewing (kitchen, jaw-bob head, camera drifts in)
  { const st = cut(0), gul = Wd('swallow', 0) - st + 0.35;
    add({ id: 'S01', at: st, note: 'kitchen: hero chews, camera drifts to face; gulp at "swallow"', draw(lt, d, t, blit) {
      reset(); const ch = 0.5 + 0.5 * Math.sin(lt * 7.5);
      chewPose(ch * 0.4, 0.16);
      cam.position.copy(lerpV(V3(0.52, 1.62, 1.15), V3(0.2, 1.54, 0.74), eio(lt / d))); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE)); blit();
      pill('GULP…', 540, 240, eob(seg(lt, gul, gul + 0.3)), '#FFD43B');
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.4, gul), 'gulp', { gain: 0.6 }); }

  // 2 · down it goes (x-ray: the ball slides the esophagus into the stomach)
  { const st = cut(1), dig = Wd('digest', 1) - st, itm = Wd('it.', 1) - st;
    add({ id: 'S02', at: st, note: 'x-ray: mint ball rides down the chest, lands in stomach on "digest"', draw(lt, d, t, blit) {
      reset();
      const k = eio(clamp(seg(lt, Math.max(0.15, dig - 0.5), dig + 0.25)));
      xb.position.set(lerp(0, 0.03, k), lerp(0.34, 0.15, k), lerp(0.03, 0.02, k));
      xh.pose({ spine: [2, 0, 0], lid: 0.35, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      cam.position.copy(lerpV(V3(-0.5, 1.44, 1.6), V3(-0.12, 1.28, 1.18), eio(lt / d))); cam.lookAt(0, 1.28, 0);
      xRender(V3(0, 1.28, 0)); blit();
      label('DOWN IT GOES', 760, 480, ...screen(iw(xb.position), cam), eob(seg(lt, 0.25, 0.5)));
      pill("CAN'T DIGEST IT", 540, 1180, eob(seg(lt, Math.max(0.2, dig), dig + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, dig - 0.4), 'slide', { gain: 0.4 }); cue(Math.max(st + 0.3, dig), 'plop', { gain: 0.5 }); }

  // 3 · rubber in the acid (STOMACH: the piece floats, untouched, labels)
  { const st = cut(2), rub = Wd('rubber', 2) - st, ig = Wd('ignores', 2) - st;
    add({ id: 'S03', at: st, note: 'stomach macro: gum bobs in the acid pool, RUBBER + IGNORED labels', draw(lt, d, t, blit) {
      reset(); const bob = Math.sin(lt * 1.9) * 0.05;
      sg.position.y = -0.52 + bob; sg.rotation.y = lt * 0.7;
      cam.position.copy(lerpV(V3(0.9, -0.22, 1.75), V3(-0.45, -0.18, 1.45), eio(lt / d))); cam.lookAt(sg.position);
      stRender(sg.position); blit();
      label('SYNTHETIC RUBBER', 800, 480, ...screen(sg.position, cam), eob(seg(lt, Math.max(0.2, rub), rub + 0.35)));
      pill('ACID: IGNORES IT', 540, 1330, eob(seg(lt, Math.max(0.25, ig), ig + 0.35)), '#FFD43B');
    } });
    cue(st + 0.3, 'sizzle', { dur: 1.2, gain: 0.3 }); }

  // 4 · not stuck (STOMACH: wide float, NOT STUCK label)
  { const st = cut(3), st4 = Wd('stuck', 3) - st;
    add({ id: 'S04', at: st, note: 'stomach macro: gum floats free, NOT STUCK label on the word', draw(lt, d, t, blit) {
      reset(); const bob = Math.sin(lt * 1.6 + 1) * 0.06;
      sg.position.y = -0.5 + bob; sg.rotation.y = lt * 0.5;
      cam.position.copy(lerpV(V3(-0.7, -0.1, 1.9), V3(0.15, -0.25, 1.5), eio(lt / d))); cam.lookAt(sg.position);
      stRender(sg.position); blit();
      label('NOT STUCK', 800, 1330, ...screen(sg.position, cam), eob(seg(lt, Math.max(0.2, st4), st4 + 0.3)));
      pill('JUST FLOATING ✓', 540, 240, eob(seg(lt, 0.3, 0.6)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, st4), 'boing', { gain: 0.35 }); }

  // 5 · the muscle wave (GUT: peristalsis ring pushes the gum through)
  { const st = cut(4), push = Wd('push', 4) - st, thr = Wd('through', 4) - st;
    add({ id: 'S05', at: st, note: 'gut tube: ring squeezes behind the gum, pushes it forward on "push"', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(seg(lt, Math.max(0.15, push), thr + 0.3)));
      const g = lerp(0.4, 2.1, k);
      gtReset(g, seg(lt, Math.max(0.2, push), push + 0.7), 'gum');
      cam.position.set(0.06, 0.1, g - 1.55); cam.lookAt(gg.position);
      gtRender(gg.position); blit();
      label('MUSCLE WAVE', 760, 520, ...screen(GT.ring.position, cam), eob(seg(lt, Math.max(0.25, push), push + 0.35)));
      pill('PUSHED THROUGH', 540, 1330, eob(seg(lt, Math.max(0.3, thr), thr + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.25, push), 'slide', { gain: 0.45 }); }

  // 6 · out in days (GUT: gum exits into the golden light)
  { const st = cut(5), lv = Wd('leaves', 5) - st, dys = Wd('days', 5) - st;
    add({ id: 'S06', at: st, note: 'gut tube: gum rides to the golden exit glow, OUT IN DAYS pill', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(seg(lt, Math.max(0.2, lv - 0.3), dys + 0.5)));
      const g = lerp(2.0, 4.6, k);
      gtReset(g, 0, 'gum');
      cam.position.set(0.04, 0.12, g - 1.6); cam.lookAt(0, 0, g + 1.2);
      gtRender(V3(0, 0, g + 1.2)); blit();
      pill('OUT IN DAYS ✓', 540, 240, eob(seg(lt, Math.max(0.25, dys), dys + 0.35)), '#FFD43B');
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.3, dys), 'sparkle', { gain: 0.5 }); }

  // 7 · the seven-years myth (x-ray full body, red MYTH pill)
  { const st = cut(6), sev = Wd('seven', 6) - st, mth = Wd('myth.', 6) - st;
    add({ id: 'S07', at: st, note: 'x-ray full body: 7 YEARS struck out, MYTH pill red', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      xh.pose({ spine: [2, 0, 0], lid: 0.35, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      xb.position.set(0.03, 0.15, 0.02);
      cam.position.copy(lerpV(V3(-1.0, 1.5, 2.2), V3(-0.25, 1.34, 1.72), k)); cam.lookAt(0, 1.3, 0); xRender(V3(0, 1.3, 0)); blit();
      pill('7 YEARS ✗', 540, 300, eob(seg(lt, Math.max(0.2, sev), sev + 0.3)), '#FF8A8A');
      pill('JUST A MYTH', 540, 1220, eob(seg(lt, Math.max(0.3, mth), mth + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, mth), 'sparkle', { gain: 0.5 }); }

  // 8 · every day piles up (GUT: a cluster of pieces collects)
  { const st = cut(7), ev = Wd('every', 7) - st, pl = Wd('pile', 7) - st;
    add({ id: 'S08', at: st, note: 'gut tube: gum pieces drop in one by one, PILES UP label', draw(lt, d, t, blit) {
      reset(); gtReset(0.9, 0, 'pile');
      pieces.forEach((p, i) => { const on = eio(clamp(seg(lt, 0.15 + i * 0.22, 0.4 + i * 0.22))); p.position.y = -0.12 + (1 - on) * 1.6; p.scale.setScalar(on); });
      cam.position.copy(lerpV(V3(0.05, 0.14, -1.3), V3(0.0, 0.05, -0.55), eio(lt / d))); cam.lookAt(V3(0, -0.08, 0.85));
      gtRender(V3(0, -0.08, 0.85)); blit();
      label('EVERY DAY', 760, 480, ...screen(V3(0, 0.1, 0.5), cam), eob(seg(lt, Math.max(0.2, ev), ev + 0.3)));
      pill('IT PILES UP', 540, 1330, eob(seg(lt, Math.max(0.25, pl), pl + 0.3)), '#FF8A8A');
    } });
    [0.3, 0.75, 1.2].forEach((o) => cue(st + o, 'tock', { gain: 0.35 })); }

  // 9 · the hardened mass (GUT: the bezoar blocks the tube)
  { const st = cut(8), hrd = Wd('hard', 8) - st, mss = Wd('masses', 8) - st;
    add({ id: 'S09', at: st, note: 'gut tube: hard grey-brown mass wedged in the tube, camera closes in', draw(lt, d, t, blit) {
      reset(); gtReset(0.7, 0, 'mass');
      cam.position.copy(lerpV(V3(0.12, 0.16, -0.62), V3(-0.05, 0.05, -0.28), eio(lt / d))); cam.lookAt(mass.position);
      gtRender(mass.position); blit();
      label('HARD GUM MASS', 760, 480, ...screen(mass.position, cam), eob(seg(lt, Math.max(0.2, mss), mss + 0.3)));
      pill('WON\'T MOVE', 540, 1330, eob(seg(lt, Math.max(0.3, hrd), hrd + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, hrd), 'thud', { gain: 0.45 }); }

  // 10 · surgery (GUT mass close + warning + alarm)
  { const st = cut(9), sur = Wd('surgery', 9) - st;
    add({ id: 'S10', at: st, note: 'gut mass close: warning sign, SURGERY pill red, ring squeezes in vain', draw(lt, d, t, blit) {
      reset(); gtReset(0.7, 0.6 + 0.4 * Math.sin(lt * 3.2), 'mass');
      cam.position.copy(lerpV(V3(-0.06, 0.06, -0.32), V3(0.1, 0.13, -0.62), eio(lt / d))); cam.lookAt(mass.position);
      gtRender(mass.position); blit();
      warning(540, 1180, eob(seg(lt, Math.max(0.2, sur), sur + 0.4)) * 0.9);
      pill('SURGERY NEEDED', 540, 300, eob(seg(lt, Math.max(0.25, sur), sur + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, sur), 'alarm', { dur: 0.9, gain: 0.4 }); }

  // 11 · chew, don't swallow (kitchen: hero chews happy, green pill)
  { const st = cut(10), chw = Wd('chewing', 10) - st;
    add({ id: 'S11', at: st, note: 'kitchen: hero faces us chewing, CHEW DON\'T SWALLOW pill green', draw(lt, d, t, blit) {
      reset(); const ch = 0.5 + 0.5 * Math.sin(lt * 6.5);
      chewPose(ch * 0.35, 0.16);
      cam.position.copy(lerpV(V3(0.3, 1.6, 0.95), V3(0.06, 1.62, 0.62), eio(lt / d))); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE)); blit();
      pill("CHEW, DON'T SWALLOW ✓", 540, 1180, eob(seg(lt, Math.max(0.2, chw), chw + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, chw), 'sparkle', { gain: 0.45 }); }

  // 12 · the gut forgives once (kitchen settle, gold pill, slow pull back)
  { const st = cut(11), onc = Wd('once', 11) - st;
    add({ id: 'S12', at: st, note: 'kitchen settle: hero relaxed, GUT FORGIVES ONCE pill, night ramp', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(lt / d));
      hero.pose({ spine: [1, 0, 0], head: [2, 0, 0], lid: 0.18, shL: [5, 0, 5], shR: [5, 0, 5], elL: 14, elR: 14 });
      cam.position.copy(lerpV(V3(0.12, 1.62, 0.8), V3(-0.1, 1.56, 1.1), k)); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE), { exposure: lerp(1, 0.78, k), vignette: lerp(0.35, 0.55, k) }); blit();
      pill('GUT: FORGIVES ONCE', 540, 1180, eob(seg(lt, Math.max(0.2, onc), onc + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, onc), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
