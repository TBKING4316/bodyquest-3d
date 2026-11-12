#!/usr/bin/env python3
"""Inspect (or patch) the metadata of uploaded videos. Read-only unless --patch-desc is given.
  python scripts/inspect_video.py VIDEO_ID [VIDEO_ID...]
"""
import json, os, sys
from yt_auth import get_service

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    yt = get_service()
    for vid in sys.argv[1:]:
        r = yt.videos().list(part="snippet,status", id=vid).execute()
        for v in r.get("items", []):
            s, st = v["snippet"], v["status"]
            out = {
                "video_id": vid,
                "title": s.get("title"),
                "description_chars": len(s.get("description", "")),
                "description": s.get("description", "")[:500],
                "tags": s.get("tags", []),
                "category_id": s.get("categoryId"),
                "privacy": st.get("privacyStatus"),
                "publish_at": st.get("publishAt"),
                "made_for_kids": st.get("madeForKids"),
            }
            print(json.dumps(out, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
