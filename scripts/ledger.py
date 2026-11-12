#!/usr/bin/env python3
"""Topic ledger: stops repeat videos and records what was made.
The check is word-overlap only, a safety net. Also compare meaning against recent titles yourself.

  python ledger.py check "Title or idea"        # exit 1 if too similar to a past topic
  python ledger.py add --title T --slug S --style STYLE --pipeline P [--video-id ID]
  python ledger.py recent [N]
"""
import argparse, datetime, json, re, sys

LEDGER = "ledger.jsonl"
STOP = set("the a an of to in on for and or is are was how why what with your you this that it its from by at as be".split())


def toks(s):
    return {w for w in re.findall(r"[a-z0-9]+", s.lower()) if w not in STOP and len(w) > 2}


def load():
    try:
        return [json.loads(l) for l in open(LEDGER, encoding="utf-8") if l.strip()]
    except FileNotFoundError:
        return []


def similarity(a, b):
    a, b = toks(a), toks(b)
    return len(a & b) / len(a | b) if a and b else 0.0


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check"); c.add_argument("idea"); c.add_argument("--threshold", type=float, default=0.3)
    a_ = sub.add_parser("add")
    for k in ("title", "slug", "style", "pipeline", "video_id", "note"):
        a_.add_argument("--" + k.replace("_", "-"), default="")
    r = sub.add_parser("recent"); r.add_argument("n", nargs="?", type=int, default=7)
    a = p.parse_args()

    rows = load()
    if a.cmd == "check":
        hits = [(similarity(a.idea, r["title"]), r["title"]) for r in rows]
        hits = [h for h in hits if h[0] >= a.threshold]
        if hits:
            for s, t in sorted(hits, reverse=True):
                print(f"TOO SIMILAR ({s:.2f}): {t}")
            sys.exit(1)
        print("ok: no near-duplicate")
    elif a.cmd == "add":
        row = {"date": datetime.date.today().isoformat(), **{k: v for k, v in vars(a).items() if k not in ("cmd",) and v}}
        with open(LEDGER, "a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print("added")
    else:
        for r_ in rows[-a.n:]:
            print(json.dumps(r_, ensure_ascii=False))
