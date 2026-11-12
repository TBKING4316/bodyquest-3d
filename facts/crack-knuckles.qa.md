# QA — facts/crack-knuckles (What Happens When You Crack Your Knuckles?)

Author + local QA of `facts/crack-knuckles.shots.js` so a PC-off day can produce this topic in cloud
(`runner/daily.py` requires `facts/<slug>.json` + `facts/<slug>.shots.js` both QA'd).

## Pipeline checks (local build C:\fsh\crack-knuckles)
- [x] voice.py: am_michael x1.0, 33.80 s narration (target 40 s ±20% → PASS)
- [x] words.py: Whisper heard 84/84 words; every Wd() anchor resolves (one bad anchor 'again' caught by the boot gate — line 5 narration says "can't crack the same knuckle"; re-anchored to 'crack' @18.5s)
- [x] mix.py: 33.80 s, voice yes, music tension, 17 cues, zero unknown-cue warnings
- [x] capture.mjs check/cues boots buildShots without error
- [x] Sheet review 1: found NO-LINK pill invisible (~0.3s), PHYSICS label clipped at right edge, joint world over-bloomed
- [x] Sheet review 2 (all2.jpg, 34 frames): all three fixed and verified; no text cut off; pills/labels off faces; captions match caps fields

## QA gate (youtube-master skill)
- [x] Not a near-duplicate — `ledger.py check "What happens when you crack your knuckles?"` → ok; distinct angle (myth-bust physics vs prior sleep/sneeze)
- [x] Every claim sourced — facts/crack-knuckles.claims.csv: 5/5 claims with dated sources (Kawchuk 2015 PLoS ONE; Roston & Haines 1947; deWeber 2011 PMID 21383216; Powers 2016 PMID 27846331)
- [x] Original assets — engine-rendered 3D, procedural SFX/music, original script; no third-party footage/audio
- [x] Title matches delivery — question answered directly with the 2015 MRI finding
- [x] Hook lands in first seconds — the question is the first caption over the stretch
- [x] Health claims conservative — myth-bust says "no link to arthritis" per studies, not medical advice
- [x] made_for_kids false; no synthetic-realistic content (stylized 3D)
- [x] Metadata built at production by runner/daily.py (title, description with sources, tags, cat 27)

RESULT: PASS
