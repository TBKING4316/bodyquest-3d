# QA gate (local production)

- [PASS] duration 37.2s within 15-60s
- [PASS] resolution 1080x1920 vertical >=720p
- [PASS] script + shots QA'd (facts/too-much-water.qa.md)
- [PASS] claims sourced (facts/too-much-water.claims.csv)
- [PASS] captions.srt generated (16 blocks)
- [PASS] software-GL deterministic render

RESULT: PASS

## Visual QA (local MAX render, 2026-11-21)
- [PASS] Hook frames 40-55 frame-exact: no black NaN box, no bokeh splat over the face
- [PASS] Full sheet (37 frames, 1 fps): all 16 shots read; brain swelling + warning icon + closed-box outline visible
- [PASS] Long secondary pills auto-fit inside frame (THE SALT / BALANCING YOUR FLUIDS, MARATHON RUNNERS)
- [PASS] Render: 1080x1920, 24 fps, 894 frames, 37.25 s, 33.5 MB; audio = mix.wav (voice over tension bed)
- [FIX] Ported NaN-sanitized GRADE shader + unsharp mask from the contact-lens build; DOF disabled in x-ray and skull worlds (was causing white splats at 2.0 s)
