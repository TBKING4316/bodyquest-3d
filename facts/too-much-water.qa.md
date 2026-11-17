# QA — facts/too-much-water (What Happens If You Drink Too Much Water?)

Author + local QA of `facts/too-much-water.shots.js` (cloud ready-queue authoring run, 2026-11-17).
Local build: C:\Users\TB KING\faceless-shorts\too-much-water (deep-dive engine, core copied from the pop-pimple build).

## Pipeline checks (local build)
- [x] voice.py: am_michael x1.0, 37.27 s narration (target 40 s ±20% — PASS, within 15-60 s bound)
- [x] words.py: faster-whisper small.en, Whisper heard 92/92 words; every Wd() anchor resolves
      against data/words.txt (capture check CHECK OK prints full caption list)
- [x] mix.py: data/mix.wav 37.27 s, voice yes, music tension, 21 cues, zero unknown-cue warnings
- [x] capture.mjs check: boots buildShots without error; 16 shots, 37.27 s total; CHECK OK
- [x] Sheet review 1 (all.jpg, 31 frames every 1.2 s): 3 issues — (a) S02 torso shot over-zoomed
      (camera ~1.2 units from the body → torso filled the frame as a featureless teal blob),
      (b) cell macro small/low with sodium dots floating INSIDE the membrane (squashed-y
      parametrization, same engine gotcha as never-sleep round 2), (c) skull world brain filled
      the frame as a flat mauve wall and the 2.9-wide gold box exceeded the frame half-width —
      REJECTED, fixes applied
- [x] Fixes: (a) S02 camera pulled back to ~2.4 units framing the full upper body, KIDNEYS label
      pointer verified on the flank; (b) sodium dots re-parametrized ON the sphere surface
      (y = -0.45 + 1.52·cos φ, no squash), membrane opacity 0.4 → 0.55, cell cameras reframed
      (lookAt (0,-0.1,0), z ≈ 7); (c) skull/brain/box/glow wrapped in a group scaled 0.58,
      YOUR SKULL label anchor updated to the scaled skull top (y 0.9); bottle scaled 1.3x +
      emissive boosted; hallucination of blue water drops: spawn points moved in front of the
      membrane (z 2.4), landing on the front pole, scaled up
- [x] Sheet review 2 (all2.jpg): torso fixed (full figure + KIDNEYS pointer), bottle visible,
      vein/sodium world reads, skull world fits with gold box visible, pressure glow + warning
      read — remaining check: blue water drops invisible in the cell world (flying BEHIND the
      membrane front surface) — REJECTED on drops only
- [x] Fix: drop path from z 2.4 → front pole (0,-0.4,1.5) so they stay in front of the membrane,
      drop radius up, S08/S09 cameras pulled back (z ≈ 8.2-8.6) so the swollen cell keeps its
      ball silhouette
- [x] Sheet review 3 (all3.jpg): blue drops visible flying into the cell (t≈17.4, 18.6, 21.0);
      sodium dots ride the surface; swollen cell reads as a ball; skull world + gold closed box +
      red pressure glow + warning + BE FATAL all read; hook + kidneys + payoff clean — PASS
- [x] Full-size frame t4.2 (S02): full x-ray figure front view, KIDNEYS label + pointer lands on
      the flank — reads clean (review-1 "back view" was just the over-zoom)
- [x] Final capture.mjs check after last edit: CHECK OK (16/16 shots, captions resolve)

## Fact discipline (against sources in too-much-water.json / too-much-water.claims.csv)
- [x] "kidneys can only process so much / about one liter every hour, at best" — Wikipedia Water
      intoxication (~800 mL-1 L/hr excretion) + US Army guidance (≤1-1.5 L/hr heavy sweating);
      "at best" hedges the range
- [x] "water backs up into your blood / blood gets diluted" — excess fluid moves into blood,
      solutes drop (osmotic dilution)
- [x] "sodium, the salt balancing your fluids, drops" — hyponatremia (< 135 mmol/L), sodium is
      the dominant balancing electrolyte
- [x] "water slides into your cells / cells swell" — osmotic shift into cells
- [x] "most cells can take it / brain cells cannot / skull is a closed box" — intracranial
      pressure mechanism; closed-box framing is the sourced explanation
- [x] "headache, confusion, seizures / it can EVEN be fatal" — sourced symptom ladder; fatal is
      hedged with "can even"
- [x] "marathon runners and water contests proved it" — Boston Marathon 13% hyponatremia
      (Almond NEJM 2005) + contest deaths; no named victims shown
- [x] "so sip, don't flood" — consistent with the excretion ceiling; no specific numeric advice
      given (no medical-advice overclaim)
- [x] No invented organs or claims on screen: kidneys label points at the flank of an
      un-detailed x-ray figure (the label carries the anatomy); vein world = red cells + grey
      water bubbles + gold sodium beads; cell world = membrane + nucleus + sodium dots + water
      drops; skull world = translucent skull + brain + gold box + red pressure glow

## Fact-vs-visual audit
- [x] Every visual element maps to a sourced claim (osmotic shift, dilution, closed skull,
      pressure, symptoms); the only numbers shown are ONE LITER / EVERY HOUR (sourced)
- [x] Fatal outcome always gated behind "can even" + warning icon; survivors framing absent
      because no survivors claim is made
- [x] Payoff is behavioral (sip, don't flood), not medical advice

RESULT: PASS — cloud-ready (facts json + QA'd shots.js committed to facts/)
