# QA — facts/never-sleep (What Happens If You Never Sleep At All?)

Author + local QA of `facts/never-sleep.shots.js` (cloud ready-queue authoring run, 2026-11-17).
Local build: C:\Users\TB KING\faceless-shorts\never-sleep3d (deep-dive engine, core copied from the pop-pimple build).

## Pipeline checks (local build)
- [x] voice.py: am_michael x1.0, 45.15 s narration (target 40 s ±20% — PASS, within 15-60 s bound)
- [x] words.py: faster-whisper small.en reinstalled (venv had lost it), Whisper heard 103/112 words;
      every Wd() anchor resolves against data/words.txt (capture check CHECK OK prints full caption list)
- [x] mix.py: data/mix.wav 45.15 s, voice yes, music tension, 25 cues, zero unknown-cue warnings
- [x] capture.mjs check: boots buildShots without error; 16 shots, 45.15 s total; CHECK OK
- [x] Sheet review 1 (all.jpg, 32 frames every 1.4 s): brain-macro world broken — camera too close,
      dome filled the frame as a flat pink wall; neurons/adenosine/folds invisible; REJECTED, world reframed
- [x] Sheet review 2 (all2.jpg): dome curve now reads, but neurons + adenosine + folds still invisible —
      ROOT CAUSE: points parametrized INSIDE the dome sphere (squashed-y ellipsoid under the surface);
      thalamus hidden inside the near-opaque brain sphere; blob ramp too late — REJECTED
- [x] Fixes: neurons/adenosine/folds re-parametrized ON the dome surface (proper spherical cap),
      brain glow opacity 0.85 → 0.3 (thalamus reads through it), thalamus r 0.021 + emissive 2.0,
      blob bases constrained into the vertical-video frustum (|x| ≤ 0.55), eye glow dimmed 0.9 → 0.5
- [x] Sheet review 3 (all3.jpg): brain world reads (teal neurons + gold adenosine stacking + folds +
      ADENOSINE label pointer on a real dot); vessel world good; x-ray figure good; remaining checks
      moved to targeted full-size frames
- [x] Full-size frame t16.45 (S06): brain macro closeup + YOUR BRAIN FORCES MICROSLEEPS — reads clean
- [x] Full-size frame t21.9 → blobs still missing (spawned outside the narrow frustum) → FIXED (bases
      constrained), re-verified t22.3: blue + pink blobs bloom on the dome, DAY 3-4 + SOME PEOPLE SEE
      THINGS pills — reads clean
- [x] Full-size frame t18.85 (S07): mid-blackout — whole brain world dimmed dark on "EYES WIDE OPEN"
      (microsleep exposure dip working; two dips per shot)
- [x] Full-size frames t31.6 / t34.9 (S11/S12): gold thalamus dot glows deep in the x-ray head, label
      THALAMUS + pointer line lands on it, warning + FATAL INSOMNIA pill — reads clean
- [x] Final capture.mjs check after last edit: CHECK OK (16/16 shots, captions resolve)

## Fact discipline (against sources in never-sleep.json / never-sleep.claims.csv)
- [x] "adenosine stacks up / sleep pressure only climbs" — NIH/NINDS Brain Basics
- [x] "reaction time crumbles by night two" — Van Dongen et al., Sleep 2003 (cumulative wakefulness)
- [x] "brain starts forcing microsleeps / blackouts of a few seconds, eyes wide open" — Wikipedia Sleep
      deprivation: "it appears that brief microsleeps cannot be avoided"; PVT lapses = microsleeps
- [x] "after three or four days SOME people see things" — Cleveland Clinic; hedged with "some people"
- [x] "immune defenses dip, blood sugar swings" — cytokine evidence (Wikipedia) + Cleveland Clinic
- [x] "IN LAB ANIMALS total sleep loss is fatal" — Wikipedia Sleep deprivation ("has caused death in lab
      animals"); on-screen pill says LAB ANIMALS + red warning; never claims humans die from sleeplessness
- [x] "humans have ONE RARE disease like it / fatal insomnia destroys the sleep center" — Wikipedia Fatal
      insomnia (PRNP prion disease, thalamic degeneration, thalamus regulates sleep, total insomnia,
      death in months-years); framed as the DISEASE destroying the brain region, not sleeplessness killing
- [x] "you almost never get that far / your brain grabs sleep in pieces without asking / your brain won't"
      — microsleeps cannot be avoided; payoff is the twist, no overclaim
- [x] No medical advice given

## Fact-vs-visual audit (no invented organs/claims on screen)
- [x] Brain macro world shows only: brain dome surface, folds, neurons, gold adenosine dots, colored
      hallucination blobs (hedged "some people") — every element maps to a sourced claim
- [x] Vein world: teal germs multiply (immune dip) — no invented "defense cells" dying on screen
- [x] X-ray world: brain glow, thalamus bead labeled with correct anatomy (deep center of the brain);
      blackout = exposure dip (microsleep), no invented visuals
- [x] Lab-animal fatality hedged with LAB ANIMALS pill + warning icon; rare disease hedged with
      "one rare disease" + FATAL INSOMNIA naming (the disease, not sleeplessness, is the killer)

RESULT: PASS — cloud-ready (facts json + QA'd shots.js committed to facts/)
