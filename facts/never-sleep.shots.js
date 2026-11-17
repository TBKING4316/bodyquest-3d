// WHAT HAPPENS IF YOU NEVER SLEEP AT ALL? : shot list (Deep Dive 3D).
// World flow: x-ray FIGURE awake at night (hook: brain glow pulses, 3:00 AM) → x-ray figure sags
// (night one) → BRAIN MACRO (gold adenosine dots stack up = sleep pressure climbs) → x-ray figure
// stumbles (reaction time) → BRAIN MACRO (microsleep: exposure blacks out for a blink, twice —
// eyes wide open) → hallucination blobs bloom (day 3-4, hedged) → VEIN world (immune defenses dip:
// teal germs multiply) → BRAIN MACRO (neurons flicker out — IN LAB ANIMALS: FATAL, warning) →
// x-ray head (gold thalamus dot deep in the brain = the sleep center) → thalamus dims (fatal
// insomnia, hedged rare) → x-ray figure calm (you almost never get that far) → BRAIN MACRO
// (neurons pulse in short bursts — sleep in pieces) → x-ray figure stubborn (you can refuse) →
// x-ray figure's eyes close on their own (your brain won't — payoff).
// Facts: NIH/NINDS (adenosine builds while awake, cleared in sleep = sleep pressure); Cleveland
// Clinic (reaction time, microsleeps, hallucinations after days, immune + blood sugar); Van Dongen
// Sleep 2003 (cumulative wakefulness degrades attention/reaction); Wikipedia Sleep deprivation
// (accessed 2026-11-17: microsleeps cannot be avoided; long-term total sleep deprivation has
// caused death in lab animals); Wikipedia Fatal insomnia (accessed 2026-11-17: rare PRNP prion
// disease, thalamic degeneration, thalamus regulates sleep/alertness, total insomnia, death in
// months-years).
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
  const BLOOK = { aperture: 0.002, maxblur: 0.01, bloom: 0.5, bloomThreshold: 0.42, vignette: 0.55 };
  const VLOOK = { aperture: 0.0018, bloom: 0.5, bloomThreshold: 0.45, vignette: 0.5 };

  // ── world X · x-ray figure awake at night ─────────────────────────────
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial();
  xh.setBodyMaterial(xmat);
  X.scene.add(xh.group);
  xh.head.children.forEach((c) => { if (c.isMesh && Math.abs(c.position.x) < 0.01) c.material = xmat; });
  xh.head.traverse((c) => { if (c.isMesh && Math.abs(c.position.z - 0.091) < 0.01) { c.material = new THREE.MeshStandardMaterial({ color: '#9BE8FF', emissive: '#57C8F0', emissiveIntensity: 0.5 }); } });
  // brain glow (teal, inside the skull) — pulses when sleep pressure builds
  const brain = new THREE.Mesh(new THREE.SphereGeometry(0.052, 24, 18), new THREE.MeshStandardMaterial({ color: '#7FE3F2', emissive: '#3FB9D8', emissiveIntensity: 0.8, transparent: true, opacity: 0.3, roughness: 0.6, depthWrite: false }));
  brain.position.set(0, 0.108, 0.005); xh.head.add(brain);
  // thalamus: gold bead at the brain's center (the sleep center)
  const thal = new THREE.Mesh(new THREE.SphereGeometry(0.021, 16, 12), new THREE.MeshStandardMaterial({ color: '#FFD43B', emissive: '#E8A400', emissiveIntensity: 2.0 }));
  thal.position.set(0, 0.1, -0.002); thal.scale.setScalar(0.001); xh.head.add(thal);
  const FACE3 = V3(0, 1.60, 0.10), HEAD3 = V3(0, 1.69, 0.02);
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const xReset = (o = {}) => {
    const { lid = 0.35, lean = 2, sway = 0 } = o;
    xh.pose({ spine: [lean, 0, sway], lid, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
    brain.material.emissiveIntensity = 0.8; brain.material.opacity = 0.3;
    thal.scale.setScalar(0.001); thal.material.emissiveIntensity = 2.0;
  };

  // ── world B · brain macro (surface, neurons, adenosine, hallucinations) ─
  const B = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#150A26');
    scene.fog = new THREE.Fog('#150A26', 6, 12);
    scene.add(new THREE.HemisphereLight('#E8D9FF', '#150A26', 1.1));
    const key = new THREE.DirectionalLight('#FFF0E8', 1.25); key.position.set(1.6, 2.2, 2.8); scene.add(key);
    const rim = new THREE.DirectionalLight('#7F5AE8', 1.0); rim.position.set(-2, 0.6, -1.8); scene.add(rim);
    // dark head-space dome (backdrop)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(6.0, 48, 32), new THREE.MeshStandardMaterial({ color: '#241238', roughness: 0.9, side: THREE.BackSide }));
    scene.add(dome);
    // brain dome: big mauve sphere whose top fills the lower frame
    const brainDome = new THREE.Mesh(new THREE.SphereGeometry(2.3, 64, 48), new THREE.MeshPhysicalMaterial({ color: '#D895A5', roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.4, emissive: '#8A4A62', emissiveIntensity: 0.16 }));
    brainDome.position.set(0, -1.35, 0); scene.add(brainDome);
    // folds (gyri): flat arcs resting on the dome top
    const folds = [];
    const foldMat = new THREE.MeshStandardMaterial({ color: '#C2788E', roughness: 0.7, emissive: '#6A2E44', emissiveIntensity: 0.2 });
    for (let i = 0; i < 9; i++) {
      const phi = 0.2 + R(i + 11) * 0.5, th = R(i + 3) * Math.PI * 2;
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.42 + 0.34 * R(i), 0.055 + 0.03 * R(i + 7), 8, 40, 1.4 + 1.2 * R(i + 5)), foldMat);
      f.position.set(2.31 * Math.sin(phi) * Math.cos(th), -1.35 + 2.31 * Math.cos(phi), 2.31 * Math.sin(phi) * Math.sin(th));
      f.rotation.set(-Math.PI / 2 + phi + (R(i + 9) - 0.5) * 0.6, th + Math.PI / 2, R(i + 17) * Math.PI);
      scene.add(f); folds.push(f);
    }
    // neurons: teal dots ON the dome surface (top cap), pulsing
    const neurons = [];
    const nMatBase = { color: '#5FE8C8', emissive: '#2FC8A0', emissiveIntensity: 1.2 };
    for (let i = 0; i < 42; i++) {
      const phi = 0.15 + R(i + 21) * 0.55, th = R(i + 33) * Math.PI * 2;
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.07 + 0.05 * R(i + 41), 14, 10), new THREE.MeshStandardMaterial(nMatBase));
      n.position.set(2.34 * Math.sin(phi) * Math.cos(th), -1.35 + 2.34 * Math.cos(phi), 2.34 * Math.sin(phi) * Math.sin(th));
      n.userData.ph = R(i + 51) * Math.PI * 2;
      scene.add(n); neurons.push(n);
    }
    // adenosine: gold dots that drift up and stick to the dome top (sleep pressure)
    const adeno = [];
    const aMat = new THREE.MeshStandardMaterial({ color: '#FFD43B', emissive: '#D89E00', emissiveIntensity: 1.2 });
    for (let i = 0; i < 30; i++) {
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.05 + 0.03 * R(i + 61), 12, 10), aMat);
      const phi = 0.15 + R(i + 71) * 0.62, th = R(i + 81) * Math.PI * 2;
      a.userData.base = V3(2.35 * Math.sin(phi) * Math.cos(th), -1.35 + 2.35 * Math.cos(phi), 2.35 * Math.sin(phi) * Math.sin(th));
      a.userData.seed = R(i + 91) * 2.4;
      a.scale.setScalar(0.001); scene.add(a); adeno.push(a);
    }
    // hallucination blobs: bright drifting colored spheres (day 3-4)
    const blobs = [];
    const bCols = ['#FF5AC8', '#5AB4FF', '#B15AFF', '#5AFFD4'];
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.34 + 0.16 * R(i + 101), 24, 18), new THREE.MeshPhysicalMaterial({ color: bCols[i], emissive: bCols[i], emissiveIntensity: 1.0, transparent: true, opacity: 0.7, roughness: 0.2, clearcoat: 1 }));
      b.userData.base = V3((R(i + 111) * 2 - 1) * 0.55, 0.5 + R(i + 121) * 1.1, 0.3 + R(i + 131) * 0.9);
      b.scale.setScalar(0.001); scene.add(b); blobs.push(b);
    }
    // drifting particles (tissue detail, deterministic)
    const parts = [];
    const pMat = new THREE.MeshStandardMaterial({ color: '#C9B8E8', emissive: '#8A6AC8', emissiveIntensity: 0.4, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 24; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.028 + 0.02 * R(i + 141), 8, 6), pMat); p.userData.b = [(R(i) * 2 - 1) * 2.4, -0.8 + R(i + 3) * 2.4, -0.4 - R(i + 6) * 1.6]; scene.add(p); parts.push(p); }
    return { scene, brainDome, folds, neurons, adeno, blobs, parts, key };
  })();
  const bRender = (lookAt, extra = {}) => E.render(B.scene, cam, { ...BLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  // brain state helper (pure per-frame)
  const bReset = (lt = 0, o = {}) => {
    const { adenoK = 0, neuronI = 1, blobK = 0, flick = 0, burst = 0 } = o;
    B.neurons.forEach((n, i) => {
      const pulse = 0.65 + 0.35 * Math.sin(lt * 2.1 + n.userData.ph);
      const dim = flick > 0 && R(i + 7) < flick ? 0.08 : 1;
      n.material.emissiveIntensity = (burst > 0 ? 0.5 + 1.1 * Math.max(0, Math.sin(lt * 3.2 - i * 0.5)) : pulse * 0.9) * neuronI * dim;
    });
    B.adeno.forEach((a, i) => {
      const on = eio(clamp(seg(lt, a.userData.seed + i * 0.02, a.userData.seed + i * 0.02 + 0.5))) * adenoK;
      a.scale.setScalar(Math.max(0.001, on));
      const bob = 0.05 * Math.sin(lt * 1.3 + i);
      a.position.copy(a.userData.base).add(V3(0, 0.06 + bob, 0));
    });
    B.blobs.forEach((b, i) => {
      const on = eio(clamp(seg(lt, 0.15 + i * 0.3, 0.55 + i * 0.3))) * blobK;
      b.scale.setScalar(Math.max(0.001, on * (0.85 + 0.3 * Math.sin(lt * 1.7 + i * 2))));
      b.position.set(b.userData.base.x + 0.3 * Math.sin(lt * 0.9 + i), b.userData.base.y + 0.25 * Math.cos(lt * 0.7 + i * 1.4), b.userData.base.z);
      b.material.opacity = 0.7 * on;
    });
    B.parts.forEach((p, i) => { const b = p.userData.b; p.position.set(b[0] + 0.16 * Math.sin(lt * 0.6 + i * 1.1), b[1] + 0.24 * Math.sin(lt * 0.45 + i * 1.3), b[2] + 0.16 * Math.cos(lt * 0.55 + i * 0.7)); });
    B.key.intensity = 1.25;
  };

  // ── world V · inside a vessel (immune dip: germs multiply) ────────────
  const V = SETS.vessel(E);
  const germs2 = [];
  const g2Mat = new THREE.MeshStandardMaterial({ color: '#4FE8B0', emissive: '#2FBF80', emissiveIntensity: 1.35 });
  for (let i = 0; i < 7; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), g2Mat); g.scale.setScalar(0.001); V.scene.add(g); germs2.push(g); }
  const vRender = (lookAt, extra = {}) => E.render(V.scene, cam, { ...VLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  // ─────────────────────────────────────────────────────────── shots ───
  // 1 · HOOK: never sleep at all (x-ray figure, brain glow pulses, 3 AM)
  { const st = cut(0), nvr = Wd('never', 0) - st, all = Wd('all', 0) - st;
    add({ id: 'S01', at: st, note: 'x-ray figure at night: brain glow pulses, camera drifts in, 3:00 AM pill', draw(lt, d, t, blit) {
      xReset({ lid: 0.15 + 0.1 * Math.sin(lt * 1.3) });
      brain.material.emissiveIntensity = 0.8 + 0.4 * Math.sin(lt * 3.8);
      cam.position.copy(lerpV(V3(0.5, 1.72, 1.5), V3(0.28, 1.66, 1.1), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('3:00 AM', 850, 480, eob(seg(lt, 0.2, 0.5)), '#9FD9FF');
      pill('NEVER SLEEP AT ALL?', 540, 1330, eob(seg(lt, Math.max(0.3, nvr), nvr + 0.35)), '#FFD43B');
    } });
    cue(st + 0.2, 'whoosh'); cue(Math.max(st + 0.3, nvr), 'tock', { gain: 0.45 }); }

  // 2 · night one is mostly just miserable (x-ray figure sags)
  { const st = cut(1), ngh = Wd('Night', 1) - st, msr = Wd('miserable', 1) - st;
    add({ id: 'S02', at: st, note: 'x-ray figure sags (lids drop, spine leans), NIGHT 1 pill', draw(lt, d, t, blit) {
      const sag = eio(clamp(seg(lt, 0.1, Math.max(0.6, msr + 0.3))));
      xReset({ lid: 0.2 + 0.45 * sag, lean: 2 + 5 * sag });
      cam.position.copy(lerpV(V3(-0.35, 1.68, 1.35), V3(-0.15, 1.62, 1.05), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('NIGHT 1', 480, 1180, eob(seg(lt, Math.max(0.25, ngh), ngh + 0.35)), '#9FD9FF');
      pill('MOSTLY JUST MISERABLE', 540, 1330, eob(seg(lt, Math.max(0.3, msr), msr + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, msr), 'thud', { gain: 0.4 }); }

  // 3 · adenosine stacks up (BRAIN macro: gold dots stick to the dome)
  { const st = cut(2), chm = Wd('chemical', 2) - st, brn = Wd('brain', 2) - st;
    add({ id: 'S03', at: st, note: 'brain macro: gold adenosine dots appear and stick, label ADENOSINE', draw(lt, d, t, blit) {
      bReset(lt, { adenoK: eio(clamp(seg(lt, Math.max(0.15, chm - 0.1), chm + 0.6))) });
      cam.position.copy(lerpV(V3(0.0, 0.55, 7.4), V3(0.14, 0.5, 6.9), eio(lt / d))); cam.lookAt(V3(0, 0.35, 0));
      bRender(V3(0, 0.35, 0)); blit();
      const lblDot = B.adeno[4].userData.base.clone().add(V3(0, 0.08, 0));
      label('ADENOSINE', 800, 480, ...screen(lblDot, cam), eob(seg(lt, Math.max(0.25, chm), chm + 0.35)));
      pill('STACKS UP IN YOUR BRAIN', 540, 1330, eob(seg(lt, Math.max(0.3, brn), brn + 0.35)), '#FFD43B');
    } });
    [0.4, 0.8, 1.2].forEach((o) => cue(st + o, 'pop', { gain: 0.22 })); }

  // 4 · sleep pressure only climbs (BRAIN macro: dots keep stacking, camera pushes in)
  { const st = cut(3), prs = Wd('pressure', 3) - st, clm = Wd('climbs', 3) - st;
    add({ id: 'S04', at: st, note: 'brain macro: adenosine dots pile higher, camera pushes in on CLIMBS', draw(lt, d, t, blit) {
      bReset(lt, { adenoK: 1 });
      B.adeno.forEach((a) => { a.position.y += 0.25 * clamp(seg(lt, 0.2, Math.max(0.7, clm + 0.3))); });
      cam.position.copy(lerpV(V3(0.18, 0.5, 7.0), V3(-0.1, 0.58, 6.1), eio(lt / d))); cam.lookAt(V3(0, 0.42, 0));
      bRender(V3(0, 0.42, 0)); blit();
      pill("IT'S SLEEP PRESSURE", 540, 1180, eob(seg(lt, Math.max(0.25, prs), prs + 0.35)), '#FFD43B');
      pill('ONLY CLIMBS ↑', 540, 1330, eob(seg(lt, Math.max(0.3, clm), clm + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, clm), 'slide', { gain: 0.45 }); }

  // 5 · reaction time crumbles (x-ray figure stumbles)
  { const st = cut(4), ngh2 = Wd('night', 4) - st, crm = Wd('crumbles', 4) - st;
    add({ id: 'S05', at: st, note: 'x-ray figure stumbles (spine sways hard), REACTION TIME pill', draw(lt, d, t, blit) {
      const w = Math.sin(lt * 5.2) * eio(clamp(seg(lt, 0.15, 0.6)));
      xReset({ lid: 0.55, lean: 3 + 3 * Math.sin(lt * 1.7), sway: 5 * w });
      brain.material.emissiveIntensity = 0.7;
      cam.position.copy(lerpV(V3(0.4, 1.66, 1.3), V3(-0.2, 1.62, 1.05), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('NIGHT 2', 480, 480, eob(seg(lt, Math.max(0.2, ngh2), ngh2 + 0.35)), '#9FD9FF');
      pill('REACTION TIME CRUMBLES', 540, 1330, eob(seg(lt, Math.max(0.3, crm), crm + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, ngh2), 'thud', { gain: 0.45 }); cue(Math.max(st + 0.3, crm), 'alarm', { dur: 0.8, gain: 0.3 }); }

  // 6 · brain starts forcing microsleeps (BRAIN macro: exposure blacks out for a blink)
  { const st = cut(5), brain5 = Wd('brain', 5) - st, mcr = Wd('microsleeps', 5) - st;
    add({ id: 'S06', at: st, note: 'brain macro: neurons dim, ONE blink blackout on "microsleeps" (exposure dip)', draw(lt, d, t, blit) {
      bReset(lt, { adenoK: 1, neuronI: 0.6 });
      const dipT = Math.max(0.25, mcr);
      const dip = Math.max(eio(clamp(seg(lt, dipT, dipT + 0.14))) * (1 - eio(clamp(seg(lt, dipT + 0.14, dipT + 0.32)))), 0);
      const expo = lerp(1, 0.1, dip);
      cam.position.copy(lerpV(V3(0.12, 0.52, 7.1), V3(-0.12, 0.48, 6.75), eio(lt / d))); cam.lookAt(V3(0, 0.35, 0));
      bRender(V3(0, 0.35, 0), { exposure: expo }); blit();
      pill('YOUR BRAIN FORCES', 540, 1180, eob(seg(lt, Math.max(0.25, brain5), brain5 + 0.35)), '#FFD43B');
      pill('MICROSLEEPS', 540, 1330, eob(seg(lt, Math.max(0.3, mcr), mcr + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, mcr), 'alarm', { dur: 0.6, gain: 0.4 }); }

  // 7 · blackouts, eyes wide open (BRAIN macro: two hard blinks)
  { const st = cut(6), blk = Wd('Blackouts', 6) - st, wop = Wd('wide', 6) - st;
    add({ id: 'S07', at: st, note: 'brain macro: two sharp exposure blackouts, EYES WIDE OPEN pill', draw(lt, d, t, blit) {
      bReset(lt, { adenoK: 1, neuronI: 0.6 });
      const d1 = Math.max(0.2, blk), d2 = Math.max(0.9, wop);
      const dip = Math.max(
        eio(clamp(seg(lt, d1, d1 + 0.12))) * (1 - eio(clamp(seg(lt, d1 + 0.12, d1 + 0.3)))),
        eio(clamp(seg(lt, d2, d2 + 0.12))) * (1 - eio(clamp(seg(lt, d2 + 0.12, d2 + 0.3)))));
      cam.position.copy(lerpV(V3(-0.14, 0.5, 6.9), V3(0.12, 0.46, 6.6), eio(lt / d))); cam.lookAt(V3(0, 0.33, 0));
      bRender(V3(0, 0.33, 0), { exposure: lerp(1, 0.08, dip) }); blit();
      pill('A FEW SECONDS', 540, 1180, eob(seg(lt, Math.max(0.25, Wd('seconds', 6)), Wd('seconds', 6) + 0.35)), '#FFD43B');
      pill('EYES WIDE OPEN', 540, 1330, eob(seg(lt, Math.max(0.3, wop), wop + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.25, blk), 'alarm', { dur: 0.5, gain: 0.4 }); cue(Math.max(st + 0.35, wop), 'alarm', { dur: 0.7, gain: 0.35 }); }

  // 8 · some people see things (BRAIN macro: hallucination blobs bloom)
  { const st = cut(7), dys = Wd('three', 7) - st, see = Wd('see', 7) - st;
    add({ id: 'S08', at: st, note: 'brain macro: bright colored hallucination blobs drift in from "four days", SOME hedging', draw(lt, d, t, blit) {
      const dysK = Wd('days', 7) - st;
      bReset(lt, { adenoK: 1, neuronI: 0.55, blobK: eio(clamp(seg(lt, Math.max(0.2, dysK), dysK + 0.8))) });
      cam.position.copy(lerpV(V3(0.2, 0.55, 7.2), V3(-0.14, 0.6, 6.8), eio(lt / d))); cam.lookAt(V3(0, 0.45, 0));
      bRender(V3(0, 0.45, 0)); blit();
      pill('DAY 3-4', 480, 480, eob(seg(lt, Math.max(0.2, dys), dys + 0.35)), '#9FD9FF');
      pill('SOME PEOPLE SEE THINGS', 540, 1330, eob(seg(lt, Math.max(0.3, see), see + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, see), 'sizzle', { dur: 1.1, gain: 0.3 }); }

  // 9 · immune defenses dip (VEIN world: germs multiply)
  { const st = cut(8), imm = Wd('Immune', 8) - st, sgr = Wd('sugar', 8) - st;
    add({ id: 'S09', at: st, note: 'vein world: teal germs multiply past red cells, IMMUNE DEFENSES DIP pill', draw(lt, d, t, blit) {
      const cz = 0.5 - eio(lt / d) * 1.6;
      V.update(lt, cz, 0, 0.1);
      germs2.forEach((g, i) => { const on = eio(clamp(seg(lt, Math.max(0.15, imm - 0.05 + i * 0.2), imm + 0.15 + i * 0.2))); g.scale.setScalar(Math.max(0.001, on * 0.9)); g.position.set(Math.cos(i * 2.3) * 0.5, Math.sin(i * 1.7) * 0.4, cz - 1.2 - i * 0.9); });
      cam.position.set(0, 0, cz); cam.lookAt(V3(0, 0.1, cz - 2));
      vRender(V3(0, 0.1, cz - 2)); blit();
      pill('IMMUNE DEFENSES DIP', 540, 1180, eob(seg(lt, Math.max(0.25, imm), imm + 0.35)), '#FF8A8A');
      pill('BLOOD SUGAR SWINGS', 540, 1330, eob(seg(lt, Math.max(0.3, sgr), sgr + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.25, imm), 'sizzle', { dur: 1.0, gain: 0.3 }); }

  // 10 · in lab animals, total sleep loss is fatal (BRAIN macro: neurons flicker out)
  { const st = cut(9), lab = Wd('lab', 9) - st, ftl = Wd('fatal', 9) - st;
    add({ id: 'S10', at: st, note: 'brain macro: neurons flicker out one by one on "fatal", warning + IN LAB ANIMALS pill', draw(lt, d, t, blit) {
      bReset(lt, { adenoK: 1, neuronI: 0.9, flick: eio(clamp(seg(lt, Math.max(0.2, ftl - 0.05), ftl + 0.55))) });
      cam.position.copy(lerpV(V3(0.12, 0.5, 7.0), V3(-0.08, 0.44, 6.6), eio(lt / d))); cam.lookAt(V3(0, 0.35, 0));
      bRender(V3(0, 0.35, 0)); blit();
      pill('IN LAB ANIMALS', 540, 1180, eob(seg(lt, Math.max(0.25, lab), lab + 0.35)), '#FFD43B');
      warning(540, 300, eob(seg(lt, Math.max(0.35, ftl), ftl + 0.4)) * 0.9);
      pill('TOTAL SLEEP LOSS: FATAL', 540, 1330, eob(seg(lt, Math.max(0.3, ftl), ftl + 0.4)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, ftl), 'alarm', { dur: 1.0, gain: 0.4 }); }

  // 11 · humans have one rare disease like it (x-ray head: gold thalamus dot appears)
  { const st = cut(10), hum = Wd('Humans', 10) - st, rar = Wd('rare', 10) - st;
    add({ id: 'S11', at: st, note: 'x-ray head closeup: brain glow, gold thalamus dot fades in deep center, ONE RARE DISEASE pill', draw(lt, d, t, blit) {
      xReset({ lid: 0.4 });
      const k = eio(clamp(seg(lt, Math.max(0.2, rar - 0.1), rar + 0.4)));
      thal.scale.setScalar(Math.max(0.001, k));
      brain.material.emissiveIntensity = 0.8;
      cam.position.copy(lerpV(V3(0.3, 1.76, 1.05), V3(-0.05, 1.7, 0.82), eio(lt / d))); cam.lookAt(HEAD3);
      xRender(HEAD3); blit();
      pill('HUMANS HAVE ONE', 540, 1180, eob(seg(lt, Math.max(0.25, hum), hum + 0.35)), '#FFD43B');
      pill('RARE DISEASE LIKE IT', 540, 1330, eob(seg(lt, Math.max(0.3, rar), rar + 0.35)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.3, rar), 'sparkle', { gain: 0.35 }); }

  // 12 · fatal insomnia destroys the sleep center (x-ray head: thalamus dims + warning)
  { const st = cut(11), fat = Wd('Fatal', 11) - st, slp = Wd('sleep', 11) - st;
    add({ id: 'S12', at: st, note: 'x-ray head: thalamus flickers and dims, label THALAMUS, FATAL INSOMNIA pill + warning', draw(lt, d, t, blit) {
      xReset({ lid: 0.6 });
      const k = eio(clamp(seg(lt, 0.1, 0.5)));
      thal.scale.setScalar(Math.max(0.001, k));
      const dim = eio(clamp(seg(lt, Math.max(0.25, slp - 0.05), slp + 0.45)));
      thal.material.emissiveIntensity = lerp(1.5, 0.1, dim);
      brain.material.emissiveIntensity = lerp(0.8, 0.25, dim);
      cam.position.copy(lerpV(V3(-0.12, 1.74, 1.0), V3(0.06, 1.7, 0.8), eio(lt / d))); cam.lookAt(HEAD3);
      xRender(HEAD3); blit();
      label('THALAMUS', 800, 520, ...screen(xh.head.localToWorld(V3(0, 0.1, 0.06)), cam), eob(seg(lt, Math.max(0.25, slp - 0.15), slp + 0.3)));
      pill('FATAL INSOMNIA', 540, 1180, eob(seg(lt, Math.max(0.3, fat), fat + 0.35)), '#FF8A8A');
      warning(540, 300, eob(seg(lt, Math.max(0.35, slp), slp + 0.4)) * 0.9);
    } });
    cue(Math.max(st + 0.3, slp), 'alarm', { dur: 0.9, gain: 0.35 }); }

  // 13 · but you almost never get that far (x-ray figure settles, calm)
  { const st = cut(12), alm = Wd('almost', 12) - st, far = Wd('far', 12) - st;
    add({ id: 'S13', at: st, note: 'x-ray figure calm: warm settle, BUT YOU ALMOST NEVER pill', draw(lt, d, t, blit) {
      const warm = eio(clamp(lt / d));
      xReset({ lid: 0.35, lean: 2 });
      thal.scale.setScalar(Math.max(0.001, 0.001)); thal.material.emissiveIntensity = 2.0;
      brain.material.emissiveIntensity = 0.5 + 0.3 * warm;
      cam.position.copy(lerpV(V3(-0.12, 1.64, 1.2), V3(0.12, 1.62, 1.0), warm)); cam.lookAt(FACE3);
      xRender(FACE3, { exposure: lerp(1, 0.88, warm), vignette: lerp(0.45, 0.55, warm) }); blit();
      pill('YOU ALMOST NEVER', 540, 1180, eob(seg(lt, Math.max(0.25, alm), alm + 0.35)), '#FFD43B');
      pill('GET THAT FAR', 540, 1330, eob(seg(lt, Math.max(0.3, far), far + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, alm), 'sparkle', { gain: 0.35 }); }

  // 14 · your brain grabs sleep in pieces (BRAIN macro: neurons pulse in bursts, adenosine clears)
  { const st = cut(13), grb = Wd('grabs', 13) - st, pcs = Wd('pieces', 13) - st;
    add({ id: 'S14', at: st, note: 'brain macro: neurons pulse in short bright bursts on "pieces", adenosine dots shrink away', draw(lt, d, t, blit) {
      const clear = eio(clamp(seg(lt, Math.max(0.2, grb), pcs + 0.5)));
      bReset(lt, { adenoK: 1 - 0.9 * clear, neuronI: 1, burst: 1 });
      cam.position.copy(lerpV(V3(0.14, 0.5, 7.0), V3(-0.1, 0.46, 6.7), eio(lt / d))); cam.lookAt(V3(0, 0.35, 0));
      bRender(V3(0, 0.35, 0)); blit();
      pill('YOUR BRAIN GRABS SLEEP', 540, 1180, eob(seg(lt, Math.max(0.25, grb), grb + 0.35)), '#FFD43B');
      pill('IN PIECES', 540, 1330, eob(seg(lt, Math.max(0.3, pcs), pcs + 0.35)), '#7CF29A');
    } });
    [0.35, 0.85, 1.35].forEach((o) => cue(st + o, 'pop', { gain: 0.25 })); cue(Math.max(st + 0.3, pcs), 'boing', { gain: 0.35 }); }

  // 15 · you can refuse to sleep (x-ray figure stubborn, arms crossed)
  { const st = cut(14), ref = Wd('refuse', 14) - st;
    add({ id: 'S15', at: st, note: 'x-ray figure stands stubborn (lids fighting open), YOU CAN REFUSE pill', draw(lt, d, t, blit) {
      xReset({ lid: 0.55 + 0.2 * Math.sin(lt * 6), lean: 2 });
      cam.position.copy(lerpV(V3(0.35, 1.66, 1.25), V3(-0.12, 1.62, 1.0), eio(lt / d))); cam.lookAt(FACE3);
      xRender(FACE3); blit();
      pill('YOU CAN REFUSE TO SLEEP', 540, 1180, eob(seg(lt, Math.max(0.25, ref), ref + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.25, ref), 'thud', { gain: 0.4 }); }

  // 16 · payoff: your brain won't (x-ray figure's eyes close on their own)
  { const st = cut(15), brn16 = Wd('brain', 15) - st;
    add({ id: 'S16', at: st, note: 'x-ray figure: lids drift shut on their own, spine slumps, gold payoff pill', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      xReset({ lid: 0.3 + 0.65 * k, lean: 2 + 6 * k });
      brain.material.emissiveIntensity = 0.8 - 0.4 * k;
      cam.position.copy(lerpV(V3(0.3, 1.68, 1.2), V3(-0.08, 1.6, 1.0), k)); cam.lookAt(FACE3);
      xRender(FACE3, { exposure: lerp(1, 0.82, k), vignette: lerp(0.45, 0.6, k) }); blit();
      pill("YOUR BRAIN WON'T ✓", 540, 1180, eob(seg(lt, Math.max(0.25, brn16), brn16 + 0.4)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, brn16), 'sparkle', { gain: 0.5 }); cue(st + 0.4, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
