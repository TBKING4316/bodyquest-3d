// WHAT HAPPENS WHEN YOU CRACK YOUR KNUCKLES? : shot list (Deep Dive 3D).
// World flow: kitchen (real, knuckle-stretch) → INSIDE the knuckle (macro "MRI" world: two bones,
// synovial fluid, the gas cavity being born) → kitchen (the myth) → x-ray (the studies) →
// kitchen for the loop end, with one last joint visit to close the physics point.
// Facts: Kawchuk 2015 (PLoS ONE) cavity INCEPTION < 310 ms, ~20 min refractory; deWeber 2011 /
// Powers 2016 no OA link. Hands stay mittens at medium range — all close-ups are the joint world.
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
  const JLOOK = { aperture: 0.0022, maxblur: 0.012, bloom: 0.45, bloomThreshold: 0.42, vignette: 0.5 };

  // ── world A · kitchen ──────────────────────────────────────────────────
  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);

  // ── world B · x-ray stage ──────────────────────────────────────────────
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial(); xh.setBodyMaterial(xmat); const I = SETS.insides(); xh.spine.add(I.group); X.scene.add(xh.group);

  // ── world C · the knuckle (macro "MRI" view; bones along Y, stretch moves the top bone up)
  const J = (() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#04101C');
    const hemi = new THREE.HemisphereLight('#9FD9FF', '#05080F', 0.72); scene.add(hemi);
    const key = new THREE.DirectionalLight('#DDF4FF', 2.1); key.position.set(1.4, 1.1, 2.4); scene.add(key);
    const rim = new THREE.DirectionalLight('#4FD1E8', 1.15); rim.position.set(-1.6, 0.5, -1.4); scene.add(rim);
    const grid = new THREE.GridHelper(3.2, 16, '#1F6F88', '#123A4A'); grid.material.transparent = true; grid.material.opacity = 0.22; grid.position.y = -0.85; scene.add(grid);
    const bone = new THREE.MeshStandardMaterial({ color: '#EAF8FF', emissive: '#7FDDF2', emissiveIntensity: 0.3, roughness: 0.42 });
    const boneHead = new THREE.MeshStandardMaterial({ color: '#F2FCFF', emissive: '#9FE8FF', emissiveIntensity: 0.3, roughness: 0.35 });
    const fluidMat = new THREE.MeshPhysicalMaterial({ color: '#7FE4F7', transparent: true, opacity: 0.2, roughness: 0.12, emissive: '#4FD1E8', emissiveIntensity: 0.22, clearcoat: 1 });
    const gasMat = new THREE.MeshPhysicalMaterial({ color: '#EFFFFF', transparent: true, opacity: 0.92, emissive: '#BFF3FF', emissiveIntensity: 0.9, roughness: 0.05, clearcoat: 1 });
    const prox = new THREE.Group(), dist = new THREE.Group();
    const addM = (parent, geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.set(0, y, 0); parent.add(m); return m; };
    addM(prox, new THREE.CapsuleGeometry(0.045, 0.28, 8, 16), bone, -0.26);
    addM(prox, new THREE.SphereGeometry(0.08, 24, 18), boneHead, -0.02);      // knuckle head
    addM(dist, new THREE.SphereGeometry(0.088, 24, 18), boneHead, 0.15);      // socket side
    addM(dist, new THREE.CapsuleGeometry(0.04, 0.24, 8, 16), bone, 0.37);
    const fluid = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 18), fluidMat); fluid.position.set(0, 0.03, 0); fluid.scale.set(1.25, 0.75, 0.8); scene.add(fluid);
    const bub = new THREE.Mesh(new THREE.SphereGeometry(0.052, 28, 20), gasMat); bub.position.set(0, 0.045, 0); bub.scale.setScalar(0.001); scene.add(bub);
    scene.add(prox, dist);
    return { scene, dist, fluid, bub, gasMat, hemi, key, rim };
  })();
  const jReset = (k = 0, bk = 0, em = 0.9) => {           // pure-per-frame joint state
    J.dist.position.y = 0.09 * k;
    J.fluid.scale.set(1.25 + 0.3 * k, 0.75 + 0.15 * k, 0.8);
    J.bub.scale.setScalar(Math.max(0.001, bk));
    J.gasMat.emissiveIntensity = em; J.gasMat.opacity = 0.92;
    J.hemi.color.set('#9FD9FF'); J.key.color.set('#DDF4FF'); J.rim.color.set('#4FD1E8');
  };
  const jRender = (lookAt, extra = {}) => E.render(J.scene, cam, { ...JLOOK, focus: cam.position.distanceTo(lookAt), ...extra });

  const CYAN = new THREE.Color('#4FD1E8'), RED = new THREE.Color('#FF3B3B'), GREEN = new THREE.Color('#7CF29A'), WASH = new THREE.Color('#CFF6FF');
  const chest = (h, k) => h.parts[0].scale.set(1 + 0.03 * k, 1 + 0.012 * k, 1 + 0.08 * k);
  const reset = () => { hero.pose({}); chest(hero, 0); xh.pose({}); chest(xh, 0); xmat.uniforms.uCol.value.copy(CYAN); };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const xRender = (lookAt, extra = {}) => E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(lookAt), ...extra });
  const FACE = V3(0.1, 1.68, -0.6);                                   // kitchen hero head centre
  const HANDS = V3(0.08, 1.4, -0.42);                                 // hero hands at chest height
  // pull pose: arms forward, hands inward at the chest, elbows high (knuckle-stretch)
  const crackPose = (pull, bend = 78) => hero.pose({
    spine: [3, 0, 0], head: [13, 0, 0], lid: 0.25,
    shL: [46 + 5 * pull, 0, -17 - 3 * pull], shR: [46 + 5 * pull, 0, -17 - 3 * pull],
    elL: bend, elR: bend,
  });

  // 1 · HOOK: the stretch (kitchen, hands pull apart at the chest, camera drifts to the hands)
  { const st = cut(0);
    add({ id: 'S01', at: st, note: 'kitchen: hero knuckle-stretch at chest, camera drifts to hands', draw(lt, d, t, blit) {
      reset(); const pull = 0.5 + 0.5 * Math.sin(lt * 2.1 - 0.8);
      crackPose(pull, 72 + 9 * pull);
      cam.position.copy(lerpV(V3(0.3, 1.56, 0.98), V3(0.12, 1.44, 0.66), eio(lt / d))); cam.lookAt(HANDS);
      kitchenRender(cam.position.distanceTo(HANDS)); blit();
    } });
    cue(st + 0.15, 'whoosh'); }

  // 2 · it's not the bones (kitchen, head shake, red pill bottom)
  { const st = cut(1), pop = Wd('popping', 1) - st;
    add({ id: 'S02', at: st, note: 'kitchen: hero shakes head, NOT THE BONES pill', draw(lt, d, t, blit) {
      reset(); const sh = 6 * Math.sin(lt * 3.4) * eo(seg(lt, 0.15, 0.9));
      hero.pose({ spine: [2, 0, 0], head: [9, sh, 0], lid: 0.3, shL: [40, 0, -12], shR: [40, 0, -12], elL: 62, elR: 62 });
      cam.position.copy(lerpV(V3(-0.16, 1.5, 1.0), V3(0.02, 1.46, 0.72), eio(lt / d))); cam.lookAt(HANDS);
      kitchenRender(cam.position.distanceTo(HANDS)); blit();
      pill('NOT THE BONES', 540, 1180, eob(seg(lt, pop, pop + 0.3)), '#FF8A8A');
    } });
    cue(Math.max(st + 0.2, pop), 'pop', { gain: 0.3 }); }

  // 3 · stretch → gas cavity (JOINT: top bone rises, cavity flashes in on "cavity")
  { const st = cut(2), str = Wd('stretch', 2) - st, cav = Wd('cavity', 2) - st;
    add({ id: 'S03', at: st, note: 'joint macro: bones pull apart, synovial gap, cavity born', draw(lt, d, t, blit) {
      reset(); jReset();
      const k = eio(clamp(seg(lt, str, str + 0.9)));
      const bk = eio(clamp(seg(lt, cav, cav + 0.26)));
      jReset(k, 0.052 * bk, 0.9 + (lt >= cav ? 1.3 * Math.exp(-(lt - cav) * 3.2) : 0));
      cam.position.copy(lerpV(V3(0.16, 0.2, 1.95), V3(-0.07, 0.12, 1.5), eio(lt / d))); cam.lookAt(0, 0.06, 0);
      jRender(V3(0, 0.06, 0)); blit();
      label('SYNOVIAL FLUID', 800, 600, ...screen(V3(0.1, 0.02, 0), cam), eob(seg(lt, str + 0.25, str + 0.5)));
      label('GAS CAVITY', 800, 1330, ...screen(V3(0.0, 0.05, 0.05), cam), eob(seg(lt, Math.max(0.2, cav), cav + 0.3)));
    } });
    cue(st + 0.1, 'slide'); cue(Math.max(st + 0.2, str), 'bubbles', { dur: 1.4, gain: 0.3 }); cue(Math.max(st + 0.3, cav), 'pop', { gain: 0.6 }); }

  // 4 · caught live on MRI (JOINT orbit, scanline sweep, gold pill)
  { const st = cut(3), caught = Wd('caught', 3) - st, mri = Wd('MRI', 3) - st;
    add({ id: 'S04', at: st, note: 'joint macro: slow orbit, MRI scanline sweep, 2015 pill', draw(lt, d, t, blit) {
      reset(); jReset(1, 0.052);
      cam.position.copy(lerpV(V3(0.3, 0.14, 1.6), V3(-0.3, 0.07, 1.55), eio(lt / d))); cam.lookAt(0, 0.06, 0);
      jRender(V3(0, 0.06, 0)); blit();
      if (lt > 0.3) { const sy = H * (0.14 + 0.72 * ((lt * 0.5) % 1)); const a = 0.14 * clamp(seg(lt, 0.3, 0.7));
        ctx.save(); const g = ctx.createLinearGradient(0, sy - 60, 0, sy + 10); g.addColorStop(0, 'rgba(79,209,232,0)'); g.addColorStop(1, `rgba(79,209,232,${a})`);
        ctx.fillStyle = g; ctx.fillRect(0, sy - 60, W, 70); ctx.fillStyle = `rgba(207,246,255,${a * 1.6})`; ctx.fillRect(0, sy - 2, W, 2); ctx.restore(); }
      pill('MRI · 2015 ✓', 540, 240, eob(seg(lt, mri, mri + 0.3)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, mri), 'sparkle', { gain: 0.45 }); }

  // 5 · born, not bursting (JOINT close on the bubble: thump bigger, stays big)
  { const st = Wd('pop', 4) - 0.35, pop = Wd('pop', 4) - st, born = Wd('born', 4) - st;
    add({ id: 'S05', at: st, note: 'joint close: bubble thumps on the pop, then GROWS (born)', draw(lt, d, t, blit) {
      reset(); jReset(1, 0.052);
      const thump = lt >= pop ? 0.35 * Math.exp(-(lt - pop) * 4) : 0;
      const grow = eio(clamp(seg(lt, born, born + 0.5)));
      jReset(1, 0.052 * (1 + thump + 0.35 * grow), 0.9 + 0.5 * grow);
      cam.position.copy(lerpV(V3(0.03, 0.08, 1.18), V3(-0.02, 0.05, 0.94), eio(lt / d))); cam.lookAt(0, 0.05, 0);
      jRender(V3(0, 0.05, 0), { bloom: 0.4, bloomThreshold: 0.5 }); blit();
      label('BORN, NOT BURST', 800, 1330, ...screen(V3(0, 0.06, 0.04), cam), eob(seg(lt, Math.max(0.2, born), born + 0.3)));
    } });
    cue(Math.max(st + 0.3, pop), 'pop', { gain: 0.5 }); cue(Math.max(st + 0.4, born), 'bubbles', { dur: 1.0, gain: 0.25 }); }

  // 6 · twenty-minute recharge (JOINT wide, bubble dissolves, timer ticks)
  { const st = cut(5), agn = Wd('crack', 5) - st, min = Wd('minutes', 5) - st;
    add({ id: 'S06', at: st, note: 'joint wide: bubble dissolves, RECHARGE pill, ticks', draw(lt, d, t, blit) {
      reset(); jReset();
      const dk = eio(clamp(seg(lt, agn + 0.4, agn + 2.0)));
      jReset(1, 0.052 * (1 - 0.8 * dk));
      cam.position.copy(lerpV(V3(0.06, 0.12, 1.78), V3(0.22, 0.16, 2.0), eio(lt / d))); cam.lookAt(0, 0.05, 0);
      jRender(V3(0, 0.05, 0)); blit();
      pill('RECHARGE ≈ 20 MIN', 540, 240, eob(seg(lt, agn, agn + 0.3)), '#FFD43B');
      label('NO SECOND POP', 800, 1330, ...screen(V3(0, 0.16, 0.05), cam), eob(seg(lt, min, min + 0.3)));
    } });
    [0.25, 1.05, 1.85].forEach((o) => cue(st + Math.max(o, agn + 0.2 + o), 'tock', { gain: 0.4 })); }

  // 7 · so does it wreck your joints? (kitchen, flexing hands, warning)
  { const st = cut(6), wr = Wd('wreck', 6) - st;
    add({ id: 'S07', at: st, note: 'kitchen: hero flexes fingers, warning sign on wreck', draw(lt, d, t, blit) {
      reset(); const flex = Math.sin(lt * 4.6) * eo(seg(lt, 0.2, 1.5));
      crackPose(0.3, 70 + 8 * flex);
      cam.position.copy(lerpV(V3(-0.2, 1.48, 1.02), V3(-0.02, 1.44, 0.68), eio(lt / d))); cam.lookAt(HANDS);
      kitchenRender(cam.position.distanceTo(HANDS)); blit();
      warning(540, 1180, eob(seg(lt, Math.max(0.3, wr), wr + 0.35)) * 0.8);
    } });
    cue(Math.max(st + 0.3, wr), 'alarm', { dur: 0.8, gain: 0.3 }); }

  // 8 · researchers followed crackers for years (x-ray full body, gold pill)
  { const st = cut(7), rs = Wd('researchers', 7) - st;
    add({ id: 'S08', at: st, note: 'x-ray stage: full body reveal, STUDIED FOR YEARS pill', draw(lt, d, t, blit) {
      reset(); const k = eio(lt / d);
      xh.pose({ spine: [2 * k, 0, 0], lid: 0.4, shL: [6, 0, 5], shR: [6, 0, 5], elL: 14, elR: 14 });
      cam.position.copy(lerpV(V3(-0.9, 1.42, 2.1), V3(-0.2, 1.34, 1.72), k)); cam.lookAt(0, 1.3, 0); xRender(V3(0, 1.3, 0)); blit();
      pill('STUDIED FOR YEARS ✓', 540, 240, eob(seg(lt, rs, rs + 0.3)), '#FFD43B');
    } });
    cue(st, 'whoosh'); }

  // 9 · no link to arthritis. none. (kitchen, hero faces us, green pill)
  { const st = cut(8), nl = Wd('link', 8) - st, nn = Wd('none', 8) - st;
    add({ id: 'S09', at: st, note: 'kitchen: hero lifts head to camera, green NO LINK pill', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(lt / 0.8));
      hero.pose({ spine: [lerp(3, 0, k), 0, 0], head: [lerp(12, 1, k), 0, 0], lid: lerp(0.3, 0.16, k), shL: [lerp(44, 5, k), 0, -lerp(16, 5, k)], shR: [lerp(44, 5, k), 0, -lerp(16, 5, k)], elL: lerp(72, 14, k), elR: lerp(72, 14, k) });
      cam.position.copy(lerpV(V3(0.28, 1.56, 0.92), V3(0.06, 1.64, 0.6), k)); cam.lookAt(FACE); kitchenRender(cam.position.distanceTo(FACE)); blit();
      pill('NO LINK ✓', 540, 1180, eob(seg(lt, nl, nl + 0.35)), '#7CF29A');
    } });
    cue(Math.max(st + 0.3, nn), 'sparkle', { gain: 0.5 }); }

  // 10 · the sound is physics (JOINT return, green wash, intact joint)
  { const st = cut(9), ph = Wd('physics', 9) - st;
    add({ id: 'S10', at: st, note: 'joint macro: green wash, bones intact, PHYSICS label', draw(lt, d, t, blit) {
      reset(); jReset(0, 0.001);
      const k = eio(clamp(seg(lt, ph - 0.15, ph + 0.5)));
      J.hemi.color.set('#9FD9FF').lerp(GREEN, 0.45 * k); J.key.color.set('#DDF4FF').lerp(GREEN, 0.3 * k);
      cam.position.copy(lerpV(V3(-0.12, 0.1, 1.7), V3(0.1, 0.14, 1.35), eio(lt / d))); cam.lookAt(0, 0.04, 0);
      jRender(V3(0, 0.04, 0)); blit();
      label('PHYSICS, NOT DAMAGE', 680, 1250, ...screen(V3(0, 0.02, 0.05), cam), eob(seg(lt, ph, ph + 0.3)));
      pill('JOINTS: INTACT ✓', 540, 240, eob(seg(lt, ph + 0.25, ph + 0.55)), '#7CF29A');
    } });
    cue(Math.max(st + 0.2, Wd('sound', 9) - st), 'pop', { gain: 0.25 }); }

  // 11 · un-hear the myth (kitchen night, hero settles, gold pill, slow pull back)
  { const st = cut(10), mth = Wd('myth', 10) - st;
    add({ id: 'S11', at: st, note: 'kitchen night: hero relaxes to camera, UN-HEAR pill', draw(lt, d, t, blit) {
      reset(); const k = eio(clamp(lt / d));
      hero.pose({ spine: [1, 0, 0], head: [2, 0, 0], lid: 0.2, shL: [5, 0, 5], shR: [5, 0, 5], elL: 14, elR: 14 });
      cam.position.copy(lerpV(V3(0.1, 1.6, 0.86), V3(-0.08, 1.55, 1.12), k)); cam.lookAt(FACE);
      kitchenRender(cam.position.distanceTo(FACE), { exposure: lerp(1, 0.78, k), vignette: lerp(0.35, 0.55, k) }); blit();
      pill('UN-HEAR THE MYTH ✓', 540, 1180, eob(seg(lt, mth, mth + 0.35)), '#FFD43B');
    } });
    cue(Math.max(st + 0.3, mth), 'sparkle', { gain: 0.5 }); cue(st + 0.3, 'pop', { gain: 0.2 }); }

  return { shots: S, cues: CUES };
}
