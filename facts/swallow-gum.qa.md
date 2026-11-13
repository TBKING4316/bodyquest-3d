# QA — facts/swallow-gum (What Happens If You Swallow Chewing Gum?)

Author + local QA of `facts/swallow-gum.shots.js` so a PC-off day can produce this topic in cloud
(`runner/daily.py` requires `facts/<slug>.json` + `facts/<slug>.shots.js` both QA'd).

## Pipeline checks (local build C:\fsh\swallow-gum)
- [x] voice.py: am_michael x1.0, 33.28 s narration (target 40 s ±20% — PASS)
- [x] words.py: Whisper heard 91/91 words; every Wd() anchor resolves (norm() strips punctuation — 'chewing,'/'myth.'/'it.' match)
- [x] mix.py: 33.28 s, voice yes, music tension, 18 cues, zero unknown-cue warnings
- [x] capture.mjs cues boots buildShots without error
- [x] Sheet review 1 (all.jpg, 33 frames): mass invisible (no emissive) in S09/S10; S08 camera drifted inside the cluster; "OUT IN ~2 DAYS" pill overstated the Mayo source
- [x] Sheet review 2 (all2.jpg): mass visible but overexposed + filled the frame (fov 30)
- [x] Sheet review 3 (all4.jpg, 33 frames): mass scaled 0.55 @ z 1.5, cameras pulled back — mass reads as a wedged clump; no text cut off; pills/labels off faces; captions match caps fields

## Fact discipline
- Every claim traced to facts/swallow-gum.claims.csv (Mayo Clinic; Milov 1998 Pediatrics; Sinopidis 2021).
- Pill copy matches sources: "OUT IN DAYS ✓" (not "~2 days"); "7 YEARS ✗ / JUST A MYTH"; surgery claim scoped to reported child cases.

## Worlds (3-world rhythm kept)
kitchen (hook + chew ending) → x-ray (transit + myth) → stomach macro (acid pool, floating piece) → gut macro (peristalsis ring, exit glow, pile-up, bezoar mass) → kitchen settle.
