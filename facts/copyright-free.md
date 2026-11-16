# Copyright-free guarantee — BodyQuest 3D

Status: verified 2026-11-16. Every asset in every video is original or permissively
licensed for commercial use. Nothing third-party copyrighted enters any upload.

| Asset | Where it comes from | License |
|---|---|---|
| Narration voice | Kokoro-82M TTS, runs locally (`skill/scripts/voice.py`) | Apache-2.0; synthetic voice, not a clone of any real person |
| Music + sound effects | Synthesized procedurally with numpy/scipy in each project's `tools/mix.py` — no samples, no downloads | Original (created by this pipeline) |
| 3D graphics, animation, captions | Drawn in code per frame (three.js + project shaders), rendered locally | Original (created by this pipeline) |
| three.js | vendored per project | MIT |
| Font Inter | vendored per project | SIL Open Font License 1.1 (free commercial use) |
| Word timings | faster-whisper / Whisper small.en, local | MIT |
| Facts | Public medical literature (StatPearls/NCBI, Wikipedia cross-check, cited per episode in `facts/<slug>.json`) | Facts not copyrightable; sources cited on screen where relevant |

Explicit prohibitions (always apply):
- No stock footage, no AI video generators, no scraped images, no copyrighted music tracks.
- Never clone a real person's voice (also an upload_video.py / TOS requirement).
- If a future feature would import any external media, it must be verified royalty-free
  with a documented license BEFORE use, and logged here.
