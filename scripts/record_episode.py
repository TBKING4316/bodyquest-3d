#!/usr/bin/env python3
"""Record a finished episode into all ledgers: topics.yaml, uploads.yaml, journal.md, ledger.jsonl.

  python scripts/record_episode.py <slug> <video_id> <produced_by> [episode_dir]
"""
import datetime, hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKT = datetime.timezone(datetime.timedelta(hours=5))


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def main():
    slug, vid, by = sys.argv[1], sys.argv[2], sys.argv[3]
    ep = sys.argv[4] if len(sys.argv) > 4 else os.path.join(ROOT, "episodes", f"{datetime.datetime.now(PKT).date().isoformat()}-{slug}")
    video = os.path.join(ep, "video.mp4")
    fj = json.load(open(os.path.join(ROOT, "facts", f"{slug}.json"), encoding="utf-8"))
    title, topic = fj["title"], fj["topic"]
    now = datetime.datetime.now(PKT).isoformat()
    today = datetime.datetime.now(PKT).date().isoformat()

    # topics.yaml
    p = os.path.join(ROOT, "state", "topics.yaml")
    b = open(p, encoding="utf-8").read()
    i = b.find(f"  - topic: {topic}")
    j = b.find("\n  - topic:", i + 1)
    block = b[i:j if j > 0 else len(b)]
    new = re.sub(r"    used: false", f'    used: true\n    used_on: "{today}"\n    youtube_id: {vid}\n    produced_by: {by}', block, count=1)
    open(p, "w", encoding="utf-8").write(b[:i] + new + b[j:])

    # uploads.yaml
    p = os.path.join(ROOT, "state", "uploads.yaml")
    open(p, "a", encoding="utf-8").write(
        f"  - file: {os.path.relpath(video, ROOT).replace(os.sep, '/')}\n"
        f"    file_hash: {sha256(video)}\n"
        f"    youtube_id: {vid}\n"
        f"    visibility: private + publishAt (18:00 PKT slot)\n"
        f"    uploaded_at: \"{now}\"\n"
        f"    channel: Entertainment-with-king (UCLCWgg7WdcQ10JGh5X8XG7w)\n"
        f"    title: {title}\n")

    # journal.md
    p = os.path.join(ROOT, "state", "journal.md")
    open(p, "a", encoding="utf-8").write(
        f"{today} | DAILY | {slug} | {os.path.relpath(video, ROOT).replace(os.sep, '/')} | {vid} | private+publishAt | produced_by {by}\n")

    # ledger.jsonl (dedupe)
    p = os.path.join(ROOT, "ledger.jsonl")
    open(p, "a", encoding="utf-8").write(json.dumps({
        "date": today, "title": title, "slug": slug, "style": "deep-dive-3d",
        "pipeline": "faceless-shorts-deep-dive", "video_id": vid,
        "note": f"produced by {by}; facts bundle QA'd"}, ensure_ascii=False) + "\n")

    # episode.json
    json.dump({"date": today, "slug": slug, "title": title, "topic": topic,
               "style": "deep-dive-3d", "pipeline": "faceless-shorts-deep-dive",
               "status": "uploaded-private-awaiting-publish", "video_id": vid,
               "sources": fj.get("sources", []),
               "note": f"episode folder built by scripts/build_episode.py; produced by {by}"},
              open(os.path.join(ep, "episode.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"recorded: {slug} -> {vid} ({by})")


if __name__ == "__main__":
    main()
