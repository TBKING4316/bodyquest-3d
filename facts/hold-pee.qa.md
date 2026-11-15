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
