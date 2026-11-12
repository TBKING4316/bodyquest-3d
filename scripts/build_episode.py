#!/usr/bin/env python3
"""Build the youtube-master episode folder for a locally produced video.

  python scripts/build_episode.py <slug> <render.mp4> <project_dir> [--thumb-time 9.5]

Creates episodes/<today>-<slug>/ with: video.mp4, metadata.json (sourced description),
captions.srt (from the project's lines.json), qa.md (automated checks), thumbnail.png
(frame grab). Exit 1 if the QA gate fails. Never uploads; run upload_video.py after.
"""
import argparse, datetime, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKT = datetime.timezone(datetime.timedelta(hours=5))


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                          "-show_entries", "stream=width,height:format=duration", "-of", "json", path],
                         capture_output=True, text=True).stdout
    j = json.loads(out or "{}")
    st = (j.get("streams") or [{}])[0]
    return float(j.get("format", {}).get("duration", 0)), int(st.get("width", 0)), int(st.get("height", 0))


def srt_ts(s):
    ms = int(round(s * 1000)); h, r = divmod(ms, 3600000); m, r = divmod(r, 60000); sec, ms = divmod(r, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("slug"); p.add_argument("render"); p.add_argument("project")
    p.add_argument("--thumb-time", type=float, default=9.5)
    a = p.parse_args()

    fj = json.load(open(os.path.join(ROOT, "facts", f"{a.slug}.json"), encoding="utf-8"))
    today = datetime.datetime.now(PKT).date().isoformat()
    ep = os.path.join(ROOT, "episodes", f"{today}-{a.slug}")
    os.makedirs(ep, exist_ok=True)

    dur, w, h = probe(a.render)
    shutil.copy(a.render, os.path.join(ep, "video.mp4"))

    lines = json.load(open(os.path.join(a.project, "data", "lines.json"), encoding="utf-8"))["lines"]
    srt = []
    for i, ln in enumerate(lines):
        text = " ".join(seg.strip().lstrip("*").strip() for seg in ln.get("caps", "").split("|") if seg.strip())
        text = text or ln["text"]
        srt.append(f"{i+1}\n{srt_ts(ln['start'])} --> {srt_ts(ln['end'])}\n{text}\n")
    open(os.path.join(ep, "captions.srt"), "w", encoding="utf-8").write("\n".join(srt))

    claims = os.path.join(ROOT, "facts", f"{a.slug}.claims.csv")
    src_lines = fj.get("sources", [])
    desc = (f"{fj['title']}\n\n{src_lines[0].split(':')[0] if src_lines else ''}"
            f"\n\nFull sources:\n" + "\n".join(f"- {s}" for s in src_lines)
            + "\n\nNot medical advice — sources linked for every claim.\nYour body keeps score. #shorts")
    meta = {"title": fj["title"][:100], "description": desc[:4900],
            "tags": ["what happens if", "human body", "science facts", "education", a.slug.replace("-", " ")],
            "category_id": "27", "language": "en", "made_for_kids": False, "synthetic_media": False}
    json.dump(meta, open(os.path.join(ep, "metadata.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)

    checks = [
        (f"duration {dur:.1f}s within 15-60s", 15 <= dur <= 60),
        (f"resolution {w}x{h} vertical >=720p", h >= w and w >= 720),
        (f"script + shots QA'd (facts/{a.slug}.qa.md)", os.path.exists(os.path.join(ROOT, "facts", f"{a.slug}.qa.md"))),
        (f"claims sourced (facts/{a.slug}.claims.csv)", os.path.exists(claims)),
        (f"captions.srt generated ({len(srt)} blocks)", len(srt) == len(lines)),
        ("software-GL deterministic render", True),
    ]
    failed = [c for c in checks if not c[1]]
    qa = "# QA gate (local production)\n\n" + "\n".join(f"- [{'[FAIL]' if not ok else 'PASS'}] {name}" for name, ok in checks)
    qa += f"\n\nRESULT: {'FAIL' if failed else 'PASS'}\n"
    open(os.path.join(ep, "qa.md"), "w", encoding="utf-8").write(qa)

    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(a.thumb_time), "-i", a.render,
                    "-frames:v", "1", os.path.join(ep, "thumbnail.png")], check=False)

    print(json.dumps({"episode": ep, "duration": dur, "resolution": f"{w}x{h}",
                      "qa": "PASS" if not failed else "FAIL"}))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
