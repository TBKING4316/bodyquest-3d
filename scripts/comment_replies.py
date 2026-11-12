#!/usr/bin/env python3
"""Fetch comments and post approved replies (official YouTube API).

  python comment_replies.py fetch --video-id ID [--out comments.json] [--max 200]
  python comment_replies.py post  --replies replies.json [--config channel-config.json]

replies.json: [{"comment_id": "...", "reply": "...", "category": "thanks", "approved": true}]
A reply is posted only if approved is true, or if comments.auto_post is true in the config AND
its category is in comments.reply_categories_allowed and not in comments.escalate.
"""
import argparse, json
from yt_auth import get_service


def fetch(a):
    yt = get_service()
    out, page = [], None
    while len(out) < a.max:
        r = yt.commentThreads().list(part="snippet", videoId=a.video_id, maxResults=100, order="time",
                                     textFormat="plainText", pageToken=page).execute()
        for it in r["items"]:
            top = it["snippet"]["topLevelComment"]; s = top["snippet"]
            out.append({"comment_id": top["id"], "author": s["authorDisplayName"], "text": s["textDisplay"],
                        "likes": s.get("likeCount", 0), "reply_count": it["snippet"]["totalReplyCount"],
                        "published_at": s["publishedAt"]})
        page = r.get("nextPageToken")
        if not page:
            break
    json.dump(out[: a.max], open(a.out, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"saved {len(out[: a.max])} comments to {a.out}")


def post(a):
    cfg = json.load(open(a.config, encoding="utf-8")) if a.config else {}
    c = cfg.get("comments", {})
    ok_cats, no_cats = set(c.get("reply_categories_allowed", [])), set(c.get("escalate", []))
    yt = get_service()
    done = skipped = 0
    for r in json.load(open(a.replies, encoding="utf-8")):
        cat = r.get("category", "")
        allowed = r.get("approved") is True or (c.get("auto_post") and cat in ok_cats and cat not in no_cats)
        if not allowed or not r.get("reply", "").strip():
            skipped += 1
            continue
        yt.comments().insert(part="snippet", body={"snippet": {"parentId": r["comment_id"], "textOriginal": r["reply"]}}).execute()
        done += 1
    print(f"posted {done}, held for review {skipped}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch"); f.add_argument("--video-id", required=True)
    f.add_argument("--out", default="comments.json"); f.add_argument("--max", type=int, default=200); f.set_defaults(fn=fetch)
    q = sub.add_parser("post"); q.add_argument("--replies", required=True)
    q.add_argument("--config", default="channel-config.json"); q.set_defaults(fn=post)
    a = p.parse_args(); a.fn(a)
