# QA — facts/stare-at-sun (What Happens If You Stare At The Sun?)

Author + local QA of `facts/stare-at-sun.shots.js` (cloud ready-queue authoring run, 2026-11-17/18).
Local build: C:\Users\TB KING\faceless-shorts\stare-at-sun (deep-dive engine, core copied from the pop-pimple build).

## Pipeline checks (local build)
- [x] voice.py: am_michael x1.0, 45.46 s narration (target 40 s ±20% — PASS, within 15-60 s bound)
- [x] words.py: faster-whisper small.en, Whisper heard 118 words vs 115 script words (number
      spellings); every Wd() anchor resolves against data/words.txt (capture check CHECK OK)
- [x] mix.py: data/mix.wav 45.46 s, voice yes, music tension, 19 cues, zero unknown-cue warnings
- [x] capture.mjs check: boots buildShots without error; 16 shots, 45.46 s total; CHECK OK
- [x] Sheet review 1 (all.jpg, 32 frames every 1.4 s): eye macro reads beautifully (lens, iris,
      converging rays, sun dot, focus glow); retina wall + yellow→red macula progression reads —
      BUT the sun disc was never visible in the x-ray figure shots (positioned at x 0.5, outside
      the ±0.18 face-framing frustum — the eclipse payoff beat would not read) and the oxidation
      sparks were too small to spot — REJECTED
- [x] Fixes: sun disc moved near the head axis (0.2, 1.9, 0.4) + scaled 1.15; the three sun-beat
      shots (S01/S15/S16) cameras pulled back to z ≈ 1.55-1.65 so the disc fits; sparks radius
      up (0.07+), emissive up, flight path extended (z 2.2 → -0.25); non-damage cell dimming
      during the attack beat strengthened (0.35 → 0.55)
- [x] Sheet review 2 (all2.jpg): sun disc visible in every figure shot ✓; eye macro unchanged ✓;
      retina wall progression ✓; remaining: sheet sampling missed the S14 warning and the S15
      eclipse moment — moved to targeted full-size frames
- [x] Full-size frame t37.9 (S14): red damage spot on the retina wall + big warning triangle +
      SEVERE CASES / NEVER FULLY RECOVER pills — reads clean
- [x] Full-size frame t40.6 (S15): the eclipse — dark disc with a brilliant gold ring beside the
      x-ray head, AFTER EVERY ECLIPSE / EYE CLINICS SEE THE DAMAGE pills — reads clean
- [x] Final capture.mjs check after last edit: CHECK OK (16/16 shots, captions resolve)

## Fact discipline (against sources in stare-at-sun.json / stare-at-sun.claims.csv)
- [x] "your lens focuses sunlight onto your retina / like a magnifying glass on a leaf" — basic
      optics + sourced focusing framing (classic magnifying-glass analogy, no overclaim)
- [x] TWIST "it is not a burn / retina warms about four degrees" — Wikipedia Photic retinopathy:
      photochemical injury rather than thermal; ~4°C rise with a 3-mm pupil, insufficient to
      photocoagulate (this corrects the common misconception — the video's differentiator)
- [x] "oxidation attacks your photoreceptors" — light promotes oxidation, chemical reactions with
      unbonded oxygen molecules
- [x] "yellow spot on your macula / doctors see it turn red within days" — foveal yellow spot
      first days → reddish dot after a few days (clinical progression shown in order)
- [x] "blind spot that will not go away / vision drops to about 20/40, sometimes far worse" —
      sourced symptom + acuity range; hedged with "about" and "sometimes"
- [x] "usually in both eyes at once" — sourced ("usually in both eyes")
- [x] "usually heals within a month or two" — sourced (~2 months typical complete recovery);
      hedged "usually"
- [x] "severe cases never fully recover" — sourced ("may take longer, or not see complete
      recovery at all") + warning icon
- [x] "after every eclipse, eye clinics see the damage" — post-2017 eclipse case surge (JAMA
      Ophthalmology); phrased as clinics seeing damage, no specific count claimed
- [x] Payoff "never look directly ✓ use eclipse glasses" — AAO guidance; no brand/product claim
- [x] No medical advice beyond the universal safety rule; no recovery guarantee given

## Fact-vs-visual audit (no invented organs/claims on screen)
- [x] Eye macro world shows only: lens, iris, converging light rays, sun dot, hot spot on the
      retina dome, MACULA region — all maps to the sourced mechanism
- [x] Retina wall: pink rod / teal cone pegs, orange oxidation sparks, damage cluster changing
      color pink→yellow→red (the exact clinical progression), dimming then recovery re-light
- [x] X-ray world: figure + stylized sun disc that becomes an eclipse (dark disc + gold ring) —
      no invented anatomy; no injury gore shown
- [x] Fatal/heavy outcomes NOT claimed (solar retinopathy is not typically fatal) — worst shown
      is "never fully recover" (sourced, hedged "severe cases") + warning icon

RESULT: PASS — cloud-ready (facts json + QA'd shots.js committed to facts/)
