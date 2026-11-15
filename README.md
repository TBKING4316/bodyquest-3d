# BodyQuest 3D — never-stop channel autopilot

Daily faceless YouTube Shorts about the human body ("what happens if..."), 3D x-ray style,
all facts sourced. VIRAL SPRINT (2026-11-15): 2 videos/day, uploads go **PUBLIC immediately**
after QA PASS (say "review mode" to restore the private+18:00-PKT review flow), and every
video is mirrored to the Facebook Page.

## How it runs (three layers)

1. **Local PC (primary, uploads to YouTube):** Windows Task Scheduler task
   `BodyQuest 3D - Daily Autopilot` runs daily 16:00 PKT via `run_daily.cmd`
   (OpenCode + youtube-master-autopilot skill). Missed schedule → runs at next boot
   (StartWhenAvailable). Produces AND uploads (private).
2. **Cloud fallback (GitHub Actions):** `.github/workflows/daily.yml` runs at 01:00 PKT.
   If the repo state shows yesterday+today already covered → skips. Otherwise it renders
   the next topic in the slate from `facts/*.json` (verified, sourced scripts), hosts the
   MP4, commits state, uploads a 30-day artifact. It cannot upload to YouTube (no OAuth
   there) — the local catch-up uploads the pending entry on the next PC boot
   (see `channel.yaml → never_stop.catch_up_contract`).
3. **State ledger (single source of truth):** `state/topics.yaml` (topic rotation, never
   reuse), `state/uploads.yaml` (dedupe + pending uploads), `state/journal.md` (run log),
   `state/notifications.yaml` (email/WhatsApp channels).

## Repo map

- `channel.yaml` — approved channel config (niche, style, voice, visibility, publish time)
- `facts/` — ready-to-shoot script.json per upcoming topic, every line backed by sources
- `skill/` — the faceless-shorts production engine (deep-dive 3D style, Kokoro voice,
  Whisper word timing, software-GL renderer) — vendored, no npm install needed
- `runner/` — cloud glue: `setup.sh` (env + models), `daily.py` (orchestrator)
- `videos/` — finished MP4s (ignored by git; artifacts + hosted links carry them)

## Rules

- Render **only** with `SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024' FPS=24` — the GPU
  path glitches black rectangles on some Intel iGPUs (documented in skill STYLE.md).
- Uploads go **PUBLIC immediately** during the sprint (was: private + 18:00 PKT slot); `#shorts` in description; sources listed.
- Topics are never reused; new scripts get fact-checked (PubMed/CDC/NIH) before filming.
- **Viral sprint (2026-11-15):** 2 videos/day, topic slate rebuilt around proven viral archetypes
  (fear + real case reports, gross-but-fascinating, myth-busts, body mysteries) — see
  `channel-config.json → viral_sprint` and the 10 new scored topics in `state/topics.yaml`.
- **Facebook mirror (since 2026-11-15):** every video, once PUBLIC on YouTube, is also uploaded as a native
  video to the Facebook Page "Body quest 3d" (page id 1507545225771564) via Zapier, with the YouTube link in
  the description. Dedupe via `fb_posted` in `state/uploads.yaml`; wired into `run_daily.cmd` step (7).
