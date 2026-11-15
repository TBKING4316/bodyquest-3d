# QA — facts/hold-pee (What Happens If You Hold In Your Pee?)

Author + local QA of `facts/hold-pee.shots.js` (viral-targeted production, user mandate: posts
PUBLIC immediately when QA passes).

## Pipeline checks (local build C:\fsh\hold-pee)
- [x] voice.py: am_michael x1.0, 32.42 s narration (target 40 s ±20% — PASS)
- [x] words.py: Whisper heard 91/91 words; every Wd() anchor resolves (19/19 anchors checked
      individually against data/words.txt; norm() strips punctuation)
- [x] mix.py: 32.42 s, voice yes, music tension, 19 cues, zero unknown-cue warnings
- [x] capture.mjs cues boots buildShots without error (after installing hold-pee shots.js into
      src/shots.js — first boot failed on stale scaffold shots.js, expected, fixed)
- [x] Sheet review 1 (all.jpg, 32 frames): x-ray bladder too small/dim; S03 camera showed empty
      wall instead of the urine pool; S04 sensor ring off-frame; S08 germs invisible at 0.6 res
- [x] Sheet review 2 (all2.jpg, 32 frames): bladder reads clearly in S02/S06/S09/S11; urine pool
      fills frame on "It fills"; teal germ pops bright on "multiply"; sensors, band and warning
      visible; kitchen + payoff shots clean; minor accepted nits (S03 bloom-bright reads as
      intentional "fills"; one caption boundary artifact at the S05→S06 cut)
- [x] Final render: renders/hold-pee.mp4, 778 frames @24fps, 1080x1920, SOFTWARE_GL=1
      QS='&res=0.6&aa=0&shadow=1024', mix.wav muxed
      (SUPERSEDED for publishing by the HQ rework below)

## Quality rework round 3 (user feedback: graphics + details; 2026-11-15)
- [x] Root cause of soft look: renders used SOFTWARE_GL=1 (CPU SwiftShader) + res=0.6 + aa=0 +
      shadow=1024. GPU WebGL verified working -> HQ settings: res=1, aa=4, shadow=2048, 24fps
- [x] Detail pass: bladder-macro world gained organ-wall folds (8, deterministic pseudo-random
      R(n), render-safe) + 36 drifting depth particles; bladder radius 0.035->0.052, emissive
      up; S03/S04 camera re-aims; germs 0.085->0.13 brighter
- [x] Bug found + fixed during HQ verification: deterministic black-rectangle glitch at exactly
      t=27.5 (burst frame, ~2/3 of frame painted black) on the GPU path. Root cause: NaN emitted
      inside the GPU bloom blur chain at certain bright frames (NaN*0=NaN -> black); NaN enters
      the frame through the bloom composite. NOT present in the published software-GL video
      (review/pub27.jpg clean)
      Fix (two layers, defense in depth, committed 14fea22):
      1) GRADE shader sanitizes both inputs (NaN->0 via x!=x test, clamp to half-float-safe
         range) - src/core/engine.js
      2) Bloom high-pass shader clamps HDR input (min 60000) so Inf can never enter the blur
         chain - vendor/.../LuminosityHighPassShader.js
      Also restructured pass chain: Render->Bokeh->Bloom(composite only, no blend-back)->GRADE
      (adds bloom in linear space)->Output (only to-screen pass)
- [x] Verification: glitch frames 26.5/27.4583/27.5/27.5417/28.0 + full sheet all4.jpg (32
      frames) all CLEAN on GPU capture Chrome at res=1/aa=4/shadow=2048; glow present (bloom
      visibly working in x-ray shots)
- [x] HQ render: renders/hold-pee-hq.mp4, 778 frames @24fps, 1080x1920, NO SOFTWARE_GL,
      QS='&res=1&aa=4&shadow=2048', mix.wav muxed
      (uploaded as 355bfOd4i08 public; superseded for quality by the MAX round below)

## MAX-level round 4 (user: "extreme clear" / "max to max level"; 2026-11-15)
- [x] Render settings pushed to GPU max: res=2 (INTERNAL 2160x3840, downscaled = 2x
      supersampling), aa=8 (MSAA, GPU accepts it), shadow=4096
- [x] Unsharp-mask sharpening in GRADE shader (uSharp 0.6, scene-only so glow is not sharpened;
      NaN-safe neighbors via x!=x tests; operates at internal supersampled res, crisp after
      downscale)
- [x] Depth-of-field blur cut ~45% (KLOOK ap 0.003->0.0012/maxblur 0.005; XLOOK 0.0015->0.0007;
      BLOOK 0.0022->0.001/0.006) - details read sharp edge to edge, hint of depth kept
- [x] Film grain 0.025 -> 0.015 (cleaner fine detail)
- [x] Bump maps (deterministic noiseTex, sin-hash lattice, NO Math.random) added: bladder wall
      (512px, 5 octaves), urine surface ripples (256px), bladder + kidneys (small organs)
- [x] Sheet max.jpg at res=2/aa=8/shadow=4096: 32/32 frames clean, sharpening + fine bump detail
      visible, glitch fix holding (t=27.5 clean with glow)
- [x] MAX render: renders/hold-pee-max.mp4, 778 frames @24fps, 1080x1920, GPU, mix.wav muxed

## Fact discipline (against sources in hold-pee.json / hold-pee.claims.csv)
- [x] "half a liter" — StatPearls NBK538522: bladder capacity 400-600 mL (dated 2024)
- [x] stretch sensors → brain (micturition reflex) — Wikipedia/Urination, cross-checked vs
      StatPearls NBK538522 (2024)
- [x] occasional holding tolerated / body waits — consistent with sources (no overclaim: the
      script says "hold it once, and your body just waits", green pill)
- [x] habit → detrusor changes / wall muscle stretched & weak — chronic overdistension causes
      detrusor atrophy/hypertrophy (Wikipedia, 2026-11-14; medium confidence, tagged in claims)
- [x] stale urine → bacteria multiply → UTI → risk to kidneys — StatPearls NBK538522 (2024):
      urine stasis → UTI; chronic retention/obstruction → kidney failure, hydronephrosis
- [x] "rare extreme cases, the bladder can fail" — retention can cause bladder damage; script
      hedges with "rare" + "extreme" (StatPearls NBK538522, 2024)
- [x] "it won't burst from holding alone" — bladder rupture is rare and overwhelmingly
      trauma-related; voluntary holding by a healthy person is not a documented cause
      (StatPearls NBK513246, 2024) — myth explicitly busted, no scare overclaim
- [x] No medical advice given; payoff is neutral ("when you feel the urge, just go")

RESULT: PASS
