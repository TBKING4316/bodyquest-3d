# QA — facts/pop-pimple (What Happens If You Pop A Pimple?)

Author + local QA of `facts/pop-pimple.shots.js` (deep-dive engine, Mode B daily run 2026-11-15).

## Pipeline checks (local build C:\Users\TB KING\faceless-shorts\pop-pimple)
- [x] voice.py: am_michael x1.0, 39.64 s narration (target 40 s ±20% — PASS, within 15-60 s bound)
- [x] words.py: Whisper heard 111/111 words; every Wd() anchor resolves against data/words.txt
      (CHECK OK prints full caption list; norm() strips punctuation)
- [x] mix.py: data/mix.wav 39.64 s, voice yes, music tension, 28 cues, zero unknown-cue warnings
- [x] capture.mjs check: boots buildShots without error; 17 shots, 39.64 s total; CHECK OK
- [x] Sheet review 1 (all.jpg, 40 frames): pore-macro world broken (camera inside the wall sphere
      read as flat brown; plug filled the whole frame as a brown ball) — REJECTED, world rebuilt
- [x] Sheet review 2 (all2.jpg): pore world still mis-framed after first rebuild — REJECTED
- [x] Sheet review 3 (all3.jpg): x-ray face world, vessel world, captions, scar and danger
      triangle all read well; pore world still needed rework (plug/sebum/pus blowout) — REJECTED
- [x] Sheet review 4 (all4.jpg): geometry re-anchored (plug z 1.35, sebum z 1.0, pus z 1.3, deep
      blob z 0.5) but defects remained: gel drops leaked into every pore shot (ungated on gelK),
      plug washed white mid-drop (key light 2.1 too hot), pus blew out to a giant yellow ball,
      germs bloomed white, fingers read as giant cream wedges, red halo cropped out of frame
- [x] Sheet review 5 (all5.jpg): fixes landed (drop gating, key 1.3, smaller mouth/halo/channel/
      plug, farther cameras) — halo now visible, plug brown; remaining nits: sebum a constant
      thick gold ring, germs now too small, fingers still egg-like, no "deeper" motion in S07,
      S16 drops clumped like a teeth row
- [x] Sheet review 6 (all6.jpg, 40 frames, every 1 s): sebum dimmed (emissive 0.08, opacity 0.4,
      r 0.28/0.24), germs r 0.085, fingers r 0.09/len 0.5, S07 pus slides down the channel
      (pusZ 1.3→0.72) with deep abscess growing through the translucent pool, S16 drops smaller
      and staggered — ALL pore shots read; only nit left: fingertips landed on the gold ring
- [x] Sheet review 7 (all7.jpg, every 5 s + targeted): fingertip press points moved outside the
      halo rim (±0.68) — S06 reads as fingers squeezing around the pus ball; every world reads
      clean. ACCEPTED.
- [x] Final capture.mjs check after last edit: CHECK OK (17/17 shots, captions resolve)

## Fact discipline (against sources in pop-pimple.json / pop-pimple.claims.csv)
- [x] "pore gets clogged / oil + dead skin plug it shut" — NHS Acne (reviewed 2026-09-22):
      follicles blocked with excess oil and dead skin cells
- [x] "bacteria slip inside and multiply" — NHS Acne (2026-09-22): bacteria can grow in blocked
      follicles; KidsHealth Acne (reviewed 2021-11): bacteria multiply in trapped sebum
- [x] "your body fights back with pus" — NHS Acne (2026-09-22): inflammation and pus
- [x] "squeezing pushes the pus deeper / more swelling and redness" — KidsHealth 'Should I Pop My
      Pimple?' (reviewed 2018-10): "Squeezing can push the pus deeper into the skin, which might
      cause more swelling and redness"
- [x] "can leave a permanent scar" — KidsHealth 2018-10: "permanent pits or scars"; NHS:
      "do not pick or squeeze spots because this can cause scars" — "can leave" hedged, not "will"
- [x] "veins in this zone have no valves / run straight toward your brain" — Cureus 18(7):e112359
      (2026-07-09): central facial danger triangle drains via valveless venous communications
      with the cavernous sinus
- [x] "infection there can very rarely spread inward" — Cureus 2026-07-09: intracranial
      complications are UNCOMMON but carry significant morbidity; J Emerg Med 53(1):137 (2017)
      case report of septic cavernous sinus thrombosis. Doubly hedged ("very rarely") + on-screen
      VERY RARELY pill + red warning triangle — no scare overclaim
- [x] "the real fix is patience / leave it alone and it heals by itself" — KidsHealth 2018-10
      ("leave it alone"), NHS "do not pick or squeeze"
- [x] "benzoyl peroxide dries it out faster" — KidsHealth 2018-10: 5% benzoyl peroxide gel/cream
      dries a pimple up faster; NHS lists benzoyl peroxide as a pharmacist treatment
- [x] No medical advice given; payoff is neutral ("your skin will thank you")

## Fact-vs-visual audit (no invented organs/claims on screen)
- [x] Pore macro world shows only: pore mouth, clog plug (oil + dead skin), sebum, bacteria dots,
      pus, fingers, gel droplets, red inflammation halo — every element maps to a sourced claim
- [x] Danger triangle + valveless veins + cavernous sinus label match Cureus 2026 paper's anatomy
- [x] Vein world: clot hedged with "VERY RARELY" pill + warning icon, one clot (not a cascade)

RESULT: PASS
