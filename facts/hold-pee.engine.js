// Renderer + film look: ACES tone curve, soft shadows, environment light, bloom, depth of field, vignette + grain.
//   const E = makeEngine(canvas)   ·   E.render(scene, camera, { bloom, focus, aperture, maxblur, grade })
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const W = 1080, H = 1920;
/** render quality from the URL: ?res=0.6 renders 3D at 60% size (upscaled), ?aa=0 turns MSAA off, ?shadow=1024 */
const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
export const RES = +(Q.get('res') || 1), AA = +(Q.get('aa') ?? 4), SHADOW = +(Q.get('shadow') || 2048);
const GRADE = {
  uniforms: { tDiffuse: { value: null }, uBloomTex: { value: null }, uBloomAmt: { value: 1 }, uVig: { value: 0.35 }, uGrain: { value: 0.015 }, uTime: { value: 0 }, uWarm: { value: 0.04 }, uTexel: { value: new THREE.Vector2(1 / 1080, 1 / 1920) }, uSharp: { value: 0.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D uBloomTex; uniform float uVig, uGrain, uTime, uWarm, uBloomAmt, uSharp; uniform vec2 uTexel; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 7.13) * 43758.5453); }
    // GPU driver workaround (2026-11-15): on some GPUs the bloom mip chain can emit NaN/Inf at
    // certain frames (reproduced: hold-pee t=27.5 burst frame - black rectangle). NaN poisons the
    // final color (NaN * 0 = NaN, renders black), so sanitize both inputs before use.
    vec3 clean(vec3 c, float hi){ if (c.r != c.r) c.r = 0.0; if (c.g != c.g) c.g = 0.0; if (c.b != c.b) c.b = 0.0; return min(c, vec3(hi)); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; d.x *= 0.5625;
      vec3 base = clean(c.rgb, 60000.0);
      c.rgb = base + clean(texture2D(uBloomTex, vUv).rgb, 8.0) * uBloomAmt;
      // unsharp mask (ultra-clarity): adds back the local high-pass of the SCENE (not the glow),
      // so tiny details (sensors, folds, particles, teeth of the captions) read razor sharp.
      vec3 avg = (clean(texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb, 60000.0)
                + clean(texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.0)).rgb, 60000.0)
                + clean(texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb, 60000.0)
                + clean(texture2D(tDiffuse, vUv - vec2(0.0, uTexel.y)).rgb, 60000.0)) * 0.25;
      vec3 hi = base - avg;
      if (hi.r != hi.r) hi.r = 0.0; if (hi.g != hi.g) hi.g = 0.0; if (hi.b != hi.b) hi.b = 0.0;
      c.rgb += hi * uSharp;
      c.rgb *= 1.0 - uVig * smoothstep(0.25, 0.75, length(d) * 1.4);
      c.rgb += (h(vUv * 1000.0) - 0.5) * uGrain; c.r += uWarm * 0.5; c.b -= uWarm * 0.5; gl_FragColor = c; }`,
};

export function makeEngine(canvas, { w = W, h = H, samples = 4, shadowSize = 2048 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer), envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples });
  renderer.userData = { shadowSize };
  const composer = new EffectComposer(renderer, rt); composer.setSize(w, h);
  const rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(rp);
  const bokeh = new BokehPass(rp.scene, rp.camera, { focus: 3, aperture: 0.002, maxblur: 0.008 }); composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.35, 0.6, 0.85); composer.addPass(bloom);
  const grade = new ShaderPass(GRADE); composer.addPass(grade);
  composer.addPass(new OutputPass());
  // GPU driver workaround (verified empirically on this machine, 2026-11-15): UnrealBloomPass's
  // final additive blend-back corrupts later to-screen passes on some GPU/chrome combos, painting
  // a black rectangle (reproduced: hold-pee frame t=27.5; software GL and bloom-off are clean).
  // Fix: run bloom's chain UP TO the composite (never blending into the read buffer), add the
  // composite inside GRADE (linear space, before vignette), and make OutputPass the only pass
  // that renders to the screen.
  bloom.render = function (renderer, writeBuffer, readBuffer) {
    renderer.getClearColor(this._oldClearColor); this.oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear; renderer.autoClear = false;
    renderer.setClearColor(this.clearColor, 0);
    this.highPassUniforms['tDiffuse'].value = readBuffer.texture;
    this.highPassUniforms['luminosityThreshold'].value = this.threshold;
    this.fsQuad.material = this.materialHighPassFilter;
    renderer.setRenderTarget(this.renderTargetBright); renderer.clear(); this.fsQuad.render(renderer);
    let input = this.renderTargetBright;
    for (let i = 0; i < this.nMips; i++) {
      this.fsQuad.material = this.separableBlurMaterials[i];
      this.separableBlurMaterials[i].uniforms['colorTexture'].value = input.texture;
      this.separableBlurMaterials[i].uniforms['direction'].value = UnrealBloomPass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]); renderer.clear(); this.fsQuad.render(renderer);
      this.separableBlurMaterials[i].uniforms['colorTexture'].value = this.renderTargetsHorizontal[i].texture;
      this.separableBlurMaterials[i].uniforms['direction'].value = UnrealBloomPass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetsVertical[i]); renderer.clear(); this.fsQuad.render(renderer);
      input = this.renderTargetsVertical[i];
    }
    this.fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms['bloomStrength'].value = this.strength;
    this.compositeMaterial.uniforms['bloomRadius'].value = this.radius;
    this.compositeMaterial.uniforms['bloomTintColors'].value = this.bloomTintColors;
    renderer.setRenderTarget(this.renderTargetsHorizontal[0]); renderer.clear(); this.fsQuad.render(renderer);
    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha); renderer.autoClear = oldAutoClear;
  };
  grade.uniforms.uBloomTex.value = bloom.renderTargetsHorizontal[0].texture;
  grade.uniforms.uTexel.value.set(1 / w, 1 / h); // sharpen operates at the INTERNAL render res (supersampled)
  return {
    renderer, envMap, composer,
    /** look = { bloom, bloomThreshold, focus (m), aperture (0 = all sharp), maxblur, exposure, vignette, grain, warm, t } */
    render(scene, camera, look = {}) {
      rp.scene = scene; rp.camera = camera; bokeh.scene = scene; bokeh.camera = camera;
      bokeh.enabled = (look.aperture ?? 0.0015) > 0;
      bokeh.uniforms.focus.value = look.focus ?? 3; bokeh.uniforms.aperture.value = look.aperture ?? 0.0015; bokeh.uniforms.maxblur.value = look.maxblur ?? 0.006;
      bloom.strength = look.bloom ?? 0.3; bloom.threshold = look.bloomThreshold ?? 0.85; bloom.radius = 0.6;
      renderer.toneMappingExposure = look.exposure ?? 1.0;
      grade.uniforms.uVig.value = look.vignette ?? 0.35; grade.uniforms.uGrain.value = look.grain ?? 0.02; grade.uniforms.uWarm.value = look.warm ?? 0.03; grade.uniforms.uTime.value = look.t ?? 0;
      composer.render();
    },
  };
}
/** the default light rig: warm key with soft shadow, cool fill, rim, sky/ground bounce. Returns { key, rim, group } */
export function lightRig(scene, { key = '#FFE2C2', keyI = 3.2, keyPos = [2.5, 4, 3], rimCol = '#BFD8FF', rimI = 2.2, sky = '#FFF4E6', ground = '#8C6E55', hemiI = 0.9, shadowBox = 3, target = [0, 1, 0] } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const k = new THREE.DirectionalLight(key, keyI); k.position.set(...keyPos); k.target.position.set(...target); k.castShadow = true;
  k.shadow.mapSize.set(SHADOW, SHADOW); k.shadow.bias = -0.0004; k.shadow.normalBias = 0.02; k.shadow.radius = 6;
  Object.assign(k.shadow.camera, { left: -shadowBox, right: shadowBox, top: shadowBox, bottom: -shadowBox, near: 0.1, far: 20 }); k.shadow.camera.updateProjectionMatrix();
  g.add(k, k.target);
  const r = new THREE.DirectionalLight(rimCol, rimI); r.position.set(-3, 3, -3); g.add(r);
  g.add(new THREE.HemisphereLight(sky, ground, hemiI));
  return { key: k, rim: r, group: g };
}
export function camera(fov = 30) { return new THREE.PerspectiveCamera(fov, W / H, 0.05, 120); }
