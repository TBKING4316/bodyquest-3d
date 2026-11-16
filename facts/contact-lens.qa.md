# QA — facts/contact-lens (What Happens If You Sleep In Your Contacts?)

Author + local QA of `facts/contact-lens.shots.js` (MAX-level Deep Dive 3D production, user
mandates: posts PUBLIC immediately when QA passes; all assets copyright-free; no remakes of
hold-pee — this is brand-new content).

## Pipeline checks (local build C:\fsh\contact-lens)
- [x] voice.py: am_michael x1.0, 33.87 s narration (Shorts length — PASS)
- [x] words.py: Whisper heard 86/86 words; every Wd() anchor resolves (norm() strips punctuation)
- [x] mix.py: 33.87 s, voice yes, music tension, 19 cues, zero unknown-cue warnings
- [x] capture.mjs cues boots buildShots without error (12 shots, 3 worlds: kitchen / EYE macro /
      CORNEA micro — core + main.js + sheet.js + LuminosityHighPassShader.js carried over from the
      QA'd hold-pee project, so the NaN GPU-bloom fix + uSharp GRADE sharpening are in from day one)
- [x] Sheet QA iterations at MAX settings (&res=2&aa=8&shadow=4096, GPU):
      max.jpg → max9.jpg. Fixes across rounds: iris/pupil z-order (were hidden inside opaque
      sclera), CORNEA surface/camera geometry rebuilt on a radius-6 dome with surfY() conformity
      for tears/germs/ulcer/debris, lid radius+rotation, lens cap orientation (rot.x=PI/2),
      vessels moved outside the cornea dome + 14 arcs + brighter, iris #3E6275 emissive 0.7,
      ELOOK/CLOOK DOF cut + bloomThreshold raised, key lights tuned, oxygen dots dimmed/hidden
      during starvation shots (narratively correct — supply is cut).
- [x] **White-blob artifact root-caused empirically** with a temporary &hide= debug gate
      (bisect frames in review/dbg_*, b2_*, b3_*, b4_empty, b5_onlytears): tiny bright-red
      geometry (micro-tear slivers / ulcer ring at ~0 scale) → every bright pixel splatted by
      the BokehPass into huge overlapping additive discs → accumulation clips to white → giant
      blob. Fix at the root: visibility-gating of tears/germs/ring/debris/epi/surf states
      (t.visible = k > 0.02 etc., also applied to EYE vessels), dimmer tear material
      (#D24A4A/emissive 0.4/rough 0.9), CLOOK aperture 0.0006/maxblur 0.0035.
      Verified clean at t=13.5/14.5 (fix_blob3) and full sheet max9.jpg (34 frames).
- [x] S10 pill re-anchored 'transplant'(26.48s) → 'scar'(25.24s) so "RARE: SCAR / TRANSPLANT"
      is actually on screen during the shot (visible 25.5-26.5 in max9).
- [x] Final render: renders/contact-lens.mp4, 813 frames @24fps, 1080x1920, GPU, mix.wav muxed;
      ffprobe duration 33.866 s; MP4 spot frames 13.5/14.5 (blob corridor — CLEAN), 3.5
      (thumbnail candidate), 33.0 (end) all match the QA'd sheet.

## Fact discipline (against sources in contact-lens.json / contact-lens.claims.csv)
- [x] "cornea has no blood vessels" + oxygen dissolved in tears from the air — Wikipedia 'Cornea'
- [x] lens + closed eyelid cuts oxygen supply (overnight wear = hypoxic risk practice) —
      Wikipedia 'Keratitis' (risk practices) + 'Cornea' (neovascularization from O2 deprivation)
- [x] surface starves/weakens, micro-tears — consistent with hypoxic epithelial breakdown
      (Wikipedia 'Cornea': ulcer = epithelial disruption with stromal involvement)
- [x] Pseudomonas ~40% of bacterial keratitis in lens wearers, ~90% bacterial — Wikipedia
      'Keratitis'; enzymes digest the cornea (P. aeruginosa) — same source
- [x] red painful ulcer by morning; scar; rare transplant — Wikipedia 'Cornea'/'Keratitis'/
      'Acanthamoeba keratitis' (19% transplant in the Austrian study); script hedges with
      "rare cases" — no overclaim
- [x] never tap water — documented risk practice in both 'Keratitis' and
      'Acanthamoeba keratitis' (amoebae from tap water survive between lens and eye)
- [x] No medical advice; payoff is behavior-safe ("take your lenses out before bed")

## Copyright-free ledger (user mandate: everything monetization-safe)
- [x] Voice: Kokoro-82M ONNX, Apache-2.0, synthetic (am_michael), not a real-person clone
- [x] Music + SFX: procedural numpy/scipy synthesis, original, generated per-episode
- [x] Graphics: three.js (MIT) scenes, all geometry/materials procedural-original, no stock
- [x] Font: Inter (SIL OFL 1.1); full table in facts/copyright-free.md (committed 4431a4b)

RESULT: PASS
