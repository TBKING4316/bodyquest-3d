#!/usr/bin/env python3
"""Schedule already-uploaded private videos to auto-publish at the next free slots.

  python schedule_videos.py VIDEO_ID [VIDEO_ID ...] [--hold]

Each video keeps private status but gets publishAt = next free 18:00 PKT slot
(13:00 UTC), skipping slots already taken by other scheduled videos.
Pass --hold instead to cancel a scheduled publish (video stays private).
Never prints credentials.
"""
import argparse, json, os, sys
from yt_auth import get_service
from upload_video import pick_free_slot

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video_ids", nargs="+")
    p.add_argument("--hold", action="store_true", help="cancel scheduled publish; keep private")
    a = p.parse_args()

    cfg = json.load(open(os.path.join(ROOT, "channel-config.json"), encoding="utf-8"))
    hhmm = cfg.get("publish_time_utc", "13:00")
    yt = get_service()

    for vid in a.video_ids:
        cur = yt.videos().list(part="status", id=vid).execute()
        if not cur.get("items"):
            print(json.dumps({"video_id": vid, "error": "not found or not accessible"}))
            continue
        status = cur["items"][0]["status"]
        if status.get("uploadStatus") != "processed":
            print(json.dumps({"video_id": vid, "error": f"uploadStatus={status.get('uploadStatus')}"}))
            continue

        if a.hold:
            status.pop("publishAt", None)
            action = "hold (stays private, no auto-publish)"
        else:
            if status.get("privacyStatus") != "private":
                print(json.dumps({"video_id": vid, "error": f"privacyStatus={status.get('privacyStatus')}, refusing to touch"}))
                continue
            status["publishAt"] = pick_free_slot(yt, hhmm)
            action = "scheduled"

        yt.videos().update(part="status", body={"id": vid, "status": status}).execute()
        print(json.dumps({"video_id": vid, "action": action,
                          "publish_at": status.get("publishAt"),
                          "privacy": status.get("privacyStatus")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
