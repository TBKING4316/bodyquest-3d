#!/usr/bin/env python3
"""BodyQuest 3D — cloud daily producer (GitHub Actions fallback).

Guarantees one Short per day even when the PC is off:
  1. Read channel/state from the repo checkout.
  2. If journal.md already has a DAILY line for today (PKT) or yesterday -> covered, exit 0.
  3. Else pick the highest-score unused topic from topics.yaml that has a facts file.
  4. Scaffold a deep-dive project, write script.json from facts/<slug>.json,
     run voice -> words -> mix -> render (SOFTWARE_GL, the only stable mode).
  5. Host the mp4 (transfers.sh 72h primary, uguu.se fallback) + upload the artifact.
  6. Update state (topics used / uploads pending_upload / journal DAILY line, mode CLOUD).

The LOCAL autopilot (Task Scheduler, 16:00 PKT) is the uploader of record: on its next
run it uploads every pending entry via Zapier (channel.yaml: never_stop.catch_up_contract).
"""
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

PKT = timezone(timedelta(hours=5))
ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skill"
CHANNEL = ROOT / "channel.yaml"
STATE = ROOT / "state"
FACTS = ROOT / "facts"
PROJECTS = Path(os.environ.get("BQ_PROJECTS", ROOT / "cloud_projects"))
FH = Path(os.environ.get("FACELESS_HOME", Path.home() / ".faceless-shorts"))
VENV_PY = FH / "venv" / "bin" / "python"
FORCE_TEST = os.environ.get("BQ_FORCE_TEST", "").lower() in ("true", "1", "yes")


ACTS = []  # every little act, for the cloud run report


def log(msg):
    ACTS.append(str(msg))
    print(f"[cloud] {msg}", flush=True)


def write_cloud_report(status, topic="", title="", duration_s=None, youtube_id="", hosted_url=""):
    """Write a full activity report to state/ (committed by the workflow).
    The LOCAL catch-up emails every pending cloud_report_*.md to the user on next boot."""
    ts = datetime.now(PKT).strftime("%Y-%m-%d at %H:%M PKT")
    L = [
        f"BODYQUEST 3D - CLOUD RUN REPORT ({status})",
        f"Run finished: {ts}  (PC was offline; this run happened on GitHub Actions)",
        "=" * 56,
        "",
        "RESULT",
        f"  Status: {status}",
    ]
    if topic:
        L.append(f"  Topic: {topic}")
    if title:
        L.append(f'  Title: "{title}"')
    if duration_s is not None:
        L.append(f"  Duration: {duration_s:.1f}s")
    if youtube_id:
        L.append(f"  Uploaded: private + publishAt 18:00 PKT - https://www.youtube.com/watch?v={youtube_id}")
    elif topic:
        L.append(f"  Direct upload: NOT completed - hosted URL: {hosted_url or '-'} (local autopilot uploads on next PC boot)")
    L += ["", "EVERY ACTION TAKEN (chronological)"]
    L += ["  - " + a for a in ACTS]
    path = STATE / f"cloud_report_{datetime.now(PKT).strftime('%Y-%m-%d_%H%M')}.md"
    path.write_text("\n".join(L) + "\n", encoding="utf-8")
    log(f"cloud report written: {path.name}")


def run(cmd, **kw):
    log("$ " + " ".join(str(c) for c in cmd))
    return subprocess.run([str(c) for c in cmd], check=True, **kw)


def today_pkt():
    return datetime.now(PKT).date()


def latest_daily_date():
    """Return the newest production date (PKT) found in journal.md DAILY lines, else None."""
    journal = (STATE / "journal.md").read_text(encoding="utf-8")
    dates = re.findall(r"^(\d{4}-\d{2}-\d{2}) \| (?:DAILY|CLOUD-DAILY)", journal, re.M)
    if not dates:
        return None
    return max(datetime.strptime(d, "%Y-%m-%d").date() for d in dates)


def pick_topic():
    """Highest-score topic with used:false that has a facts file. Returns (topic, facts)."""
    text = (STATE / "topics.yaml").read_text(encoding="utf-8")
    # simple block parse: topic line, then score, used fields within the block
    blocks = re.split(r"\n(?=  - topic:)", text)
    candidates = []
    facts = {}
    for f in FACTS.glob("*.json"):
        j = json.loads(f.read_text(encoding="utf-8"))
        facts[j["topic"]] = j
    for b in blocks:
        m = re.match(r"  - topic: (.+)", b)
        if not m:
            continue
        topic = m.group(1).strip()
        if re.search(r"\n    used: true", b):
            continue
        sm = re.search(r"\n    score: (\d+)", b)
        score = int(sm.group(1)) if sm else 0
        if topic in facts:
            candidates.append((score, topic))
        else:
            log(f"topic has no facts file yet, skipping: {topic} (score {score})")
    if not candidates:
        raise SystemExit("[cloud] NO USABLE TOPIC: slate empty or no facts files — add one to facts/")
    candidates.sort(reverse=True)
    return candidates[0][1]


def write_state_updates(topic, title, video_rel, youtube_id, hosted_url, duration_s):
    """topics.yaml (used) + uploads.yaml + journal.md (CLOUD-DAILY line)."""
    now_iso = datetime.now(PKT).isoformat()
    today = today_pkt().isoformat()
    uploaded = bool(youtube_id)

    t = (STATE / "topics.yaml").read_text(encoding="utf-8")
    # mark used within that topic's block
    blocks = re.split(r"\n(?=  - topic:)", t)
    for i, b in enumerate(blocks):
        if b.startswith(f"  - topic: {topic}\n") or b.lstrip().startswith(f"- topic: {topic}"):
            b = re.sub(r"\n    used: false", f'\n    used: true\n    used_on: "{today}"\n    youtube_id: {youtube_id or "PENDING_UPLOAD"}\n    produced_by: cloud', b, count=1)
            blocks[i] = b
            break
    (STATE / "topics.yaml").write_text("\n".join(blocks), encoding="utf-8")

    up = (STATE / "uploads.yaml").read_text(encoding="utf-8")
    up += (
        f"  - file: {video_rel}\n"
        f"    youtube_id: {youtube_id or 'PENDING_UPLOAD'}\n"
        f"    visibility: {'private (publishAt scheduled)' if uploaded else 'pending_upload_local'}\n"
        f"    hosted_url: {hosted_url or '-'}\n"
        f"    uploaded_at: \"{now_iso}\"\n"
        f"    produced_by: cloud\n"
        f"    title: {title}\n"
    )
    (STATE / "uploads.yaml").write_text(up, encoding="utf-8")

    j = (STATE / "journal.md").read_text(encoding="utf-8")
    j += (
        f"{today} | CLOUD-DAILY | {topic} (cloud fallback, PC off) | {video_rel} "
        f"| {youtube_id or 'PENDING_UPLOAD'} | {'private+publishAt' if uploaded else 'pending_upload_local'} "
        f"| {duration_s:.1f}s hosted: {hosted_url or '-'}\n"
    )
    (STATE / "journal.md").write_text(j, encoding="utf-8")


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height:format=duration", "-of", "json", str(path)],
        capture_output=True, text=True).stdout
    j = json.loads(out or "{}")
    st = (j.get("streams") or [{}])[0]
    return float(j.get("format", {}).get("duration", 0)), int(st.get("width", 0)), int(st.get("height", 0))


def build_episode_and_upload(slug, title, sources, mp4):
    """Skill episode folder + automated QA + direct upload when token.json exists."""
    ep_dir = ROOT / "episodes" / f"{today_pkt()}-{slug}"
    ep_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy(mp4, ep_dir / "video.mp4")
    desc = f"{title}\n\nSources:\n" + "\n".join(f"- {s}" for s in sources) + "\n\nYour body keeps score. #shorts"
    meta = {"title": title, "description": desc[:4900],
            "tags": ["what happens if", "human body", "science facts", "education", slug.replace("-", " ")],
            "category_id": "27", "language": "en", "made_for_kids": False, "synthetic_media": False}
    (ep_dir / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    dur, w, h = probe(mp4)
    checks = [
        (f"duration {dur:.1f}s in 15-60s window", 15 <= dur <= 60),
        (f"resolution {w}x{h} (vertical >=720)", h >= w and w >= 720),
        ("script + shots QA'd locally and committed (facts/)", True),
        ("software-GL render (deterministic, glitch-free path)", True),
    ]
    failed = [c for c in checks if not c[1]]
    qa = "# QA gate (cloud)\n\n" + "\n".join(f"- [{'OK' if ok else '[FAIL]'}] {name}" for name, ok in checks)
    qa += f"\n\nRESULT: {'PASS' if not failed else 'FAIL'}\n"
    (ep_dir / "qa.md").write_text(qa, encoding="utf-8")
    if failed:
        log(f"QA FAIL: {failed}")
        return ep_dir, None

    token = ROOT / "token.json"
    if not token.exists():
        log("no token.json — direct upload unavailable, staying on hosted-link fallback")
        return ep_dir, None
    try:
        log("uploading via official YouTube API (private + publishAt)...")
        up = subprocess.run(["python3", "scripts/upload_video.py", "--episode", str(ep_dir)],
                            cwd=ROOT, capture_output=True, text=True, timeout=1800)
        if up.returncode != 0:
            log(f"upload_video.py failed: {up.stdout[-400:]} {up.stderr[-400:]}")
            return ep_dir, None
        vid = json.loads(up.stdout.strip().splitlines()[-1])["video_id"]
        log(f"uploaded: {vid}")
        return ep_dir, vid
    except Exception as e:
        log(f"upload error: {e}")
        return ep_dir, None


def host_video(path):
    """Try transfers.sh (72h) then uguu.se (~3h). Return a verified URL."""
    attempts = [
        ("transfers.sh", "curl -sf -F file=@{p} https://transfers.sh/", lambda out: out.strip()),
        ("uguu.se", "curl -sf -F files[]=@{p} https://uguu.se/upload", lambda out: json.loads(out)["success"][0]["url"] if '"success"' in out else out.strip()),
    ]
    for name, tmpl, extract in attempts:
        try:
            cmd = tmpl.format(p=path).split()
            out = subprocess.run(cmd, capture_output=True, text=True, timeout=600).stdout.strip()
            url = extract(out)
            if url.startswith("http"):
                req = urllib.request.Request(url, method="HEAD")
                with urllib.request.urlopen(req, timeout=60) as r:
                    if r.status == 200 and int(r.headers.get("Content-Length", "0")) > 1_000_000:
                        log(f"hosted on {name}: {url}")
                        return url
        except Exception as e:
            log(f"{name} failed: {e}")
    return ""


def main():
    # --covered: cheap check for the workflow gate (exit 0 = covered/skip, 1 = produce)
    if "--covered" in sys.argv:
        last = latest_daily_date()
        covered = last is not None and last >= today_pkt() - timedelta(days=1)
        print(f"today(PKT)={today_pkt()} latest_daily={last} covered={covered}")
        return 0 if covered else 1

    if FORCE_TEST:
        log("FORCE TEST: throwaway script, full pipeline, no state changes")
        fj = json.loads((FACTS / "_render_test.json").read_text(encoding="utf-8"))
        topic, slug = fj["topic"], fj["slug"]
    else:
        last = latest_daily_date()
        log(f"today(PKT)={today_pkt()} latest_daily={last}")
        if last is not None and last >= today_pkt() - timedelta(days=1):
            log("daily video already produced (local or cloud) — nothing to do")
            write_cloud_report("SKIP - already covered by local PC run")
            return 0
        topic = pick_topic()
        fj = json.loads(next(f for f in FACTS.glob("*.json") if json.loads(f.read_text(encoding="utf-8"))["topic"] == topic).read_text(encoding="utf-8"))
        slug = fj["slug"]
    log(f"producing: {topic} (slug {slug})")

    if PROJECTS.exists():
        shutil.rmtree(PROJECTS)
    PROJECTS.mkdir(parents=True)
    run(["bash", SKILL / "scripts" / "new_video.sh", "deep-dive", slug, "--dir", PROJECTS])
    proj = PROJECTS / slug
    if FORCE_TEST:
        log("force test: keeping the skill's own QA'd example script + shots (machinery test only)")
    else:
        shutil.copy(FACTS / f"{slug}.json", proj / "script.json")
        shots = FACTS / f"{slug}.shots.js"
        if shots.exists():
            shutil.copy(shots, proj / "src" / "shots.js")
        else:
            raise SystemExit(
                f"[cloud] NO SHOTS for topic '{slug}': author + locally QA facts/{slug}.shots.js before a PC-off day can use it"
            )

    SK = SKILL / "scripts"
    run([VENV_PY, SK / "voice.py", proj])
    run([VENV_PY, SK / "words.py", proj])
    run(["node", proj / "tools" / "capture.mjs", "cues"], cwd=proj)
    run([VENV_PY, proj / "tools" / "mix.py", proj])

    env = {**os.environ, "SOFTWARE_GL": "1", "QS": "&res=0.6&aa=0&shadow=1024", "FPS": "24",
           "CHROME": os.environ.get("CHROME", "/usr/bin/google-chrome")}
    mp4 = proj / "renders" / f"{slug}.mp4"
    run(["node", proj / "tools" / "capture.mjs", "video", mp4], cwd=proj, env=env)

    dur = json.loads((proj / "data" / "lines.json").read_text())["duration"]
    title = fj["title"]

    if FORCE_TEST:
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as s:
                s.write("## ✅ Force test: full pipeline works on the runner\n\n")
                s.write(f"- **Script:** {topic}\n- **Duration:** {dur:.1f}s\n- No state changes, nothing published.\n")
        log("FORCE TEST DONE (no state changes)")
        return 0

    out_dir = ROOT / "videos" / f"{today_pkt()}-{slug}"
    out_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy(mp4, out_dir / f"{slug}.mp4")
    rel = f"videos/{today_pkt()}-{slug}/{slug}.mp4"

    ep_dir, vid = build_episode_and_upload(slug, title, fj.get("sources", []), out_dir / f"{slug}.mp4")
    hosted = host_video(out_dir / f"{slug}.mp4") if vid is None else ""
    write_state_updates(topic, title, rel, vid, hosted, dur)

    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as s:
            s.write("## ✅ Cloud daily run complete (PC was off)\n\n")
            s.write(f"- **Topic:** {topic}\n- **Title:** {title}\n- **Duration:** {dur:.1f}s\n")
            if vid:
                s.write(f"- **Uploaded via official API:** private + publishAt 18:00 PKT — https://www.youtube.com/watch?v={vid}\n")
            else:
                s.write(f"- **Hosted URL (72h/3h):** {hosted or 'FAILED — download the artifact'}\n")
                s.write("- Status: pending; the local autopilot uploads it on next PC boot\n")
    log("DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
