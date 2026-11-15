#!/usr/bin/env python3
"""Upload one episode to YouTube (official Data API v3).

  python upload_video.py --episode episodes/2026-11-12-topic [--public] [--synthetic]

Reads channel-config.json and <episode>/metadata.json. Default is private + a scheduled
publishAt, so the user reviews before anything goes live. Public is only used when the
config sets upload.auto_public = true (the user's own choice) or --public is passed.
Prints one JSON line with the video id. Never prints credentials.
"""
import argparse, datetime, json, os, sys
from yt_auth import get_service


def next_slot(hhmm):
    h, m = (int(x) for x in hhmm.split(":"))
    now = datetime.datetime.now(datetime.timezone.utc)
    t = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if t <= now + datetime.timedelta(minutes=15):
        t += datetime.timedelta(days=1)
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def occupied_slots(yt):
    """publishAt times of this channel's future-scheduled (private) videos."""
    now = datetime.datetime.now(datetime.timezone.utc)
    occ = []
    try:
        chan = yt.channels().list(part="contentDetails", mine=True).execute()
        up = chan["items"][0]["contentDetails"]["relatedPlaylists"].get("uploads")
        page = None
        while True:
            res = yt.playlistItems().list(part="contentDetails", playlistId=up,
                                          maxResults=50, pageToken=page).execute()
            ids = [i["contentDetails"]["videoId"] for i in res.get("items", [])]
            if ids:
                for v in yt.videos().list(part="status", id=",".join(ids)).execute().get("items", []):
                    st = v.get("status", {})
                    if st.get("privacyStatus") == "private" and st.get("publishAt"):
                        t = datetime.datetime.fromisoformat(st["publishAt"].replace("Z", "+00:00"))
                        if t > now:
                            occ.append(t)
            page = res.get("nextPageToken")
            if not page:
                break
    except Exception as e:
        print(f"slot check degraded ({e}); using next slot blind", file=sys.stderr)
    return occ


def pick_free_slot(yt, hhmm):
    """Next publish slot that is not already taken by another scheduled video."""
    h, m = (int(x) for x in hhmm.split(":"))
    now = datetime.datetime.now(datetime.timezone.utc)
    t = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if t <= now + datetime.timedelta(minutes=15):
        t += datetime.timedelta(days=1)
    occ = occupied_slots(yt)
    while any(abs((t - o).total_seconds()) < 3600 for o in occ):
        t += datetime.timedelta(days=1)
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def main():
    from googleapiclient.http import MediaFileUpload
    p = argparse.ArgumentParser()
    p.add_argument("--episode", required=True)
    p.add_argument("--config", default="channel-config.json")
    p.add_argument("--public", action="store_true")
    p.add_argument("--synthetic", action="store_true")
    p.add_argument("--publish-at")
    a = p.parse_args()

    cfg = json.load(open(a.config, encoding="utf-8"))
    ep = a.episode.rstrip("/\\")
    meta = json.load(open(os.path.join(ep, "metadata.json"), encoding="utf-8"))
    video = os.path.join(ep, "video.mp4")
    if not os.path.exists(video):
        sys.exit("video.mp4 not found; render first")
    qa = os.path.join(ep, "qa.md")
    qa_text = open(qa, encoding="utf-8").read().upper() if os.path.exists(qa) else ""
    if "RESULT: PASS" not in qa_text or "[FAIL]" in qa_text:
        sys.exit("QA gate not passed: qa.md must contain 'RESULT: PASS' and no '[FAIL]' items")

    up = cfg.get("upload", {})
    public = a.public or up.get("auto_public", False)
    publish_at = a.publish_at
    # FIX: --public / auto_public means publish NOW - only pick a slot when an explicit
    # --publish-at is absent AND the upload is not meant to be immediately public.
    if not publish_at and not public and up.get("use_publish_at", True):
        yt_probe = get_service()  # one connection also used for the insert below
        publish_at = pick_free_slot(yt_probe, cfg.get("publish_time_utc", "14:00"))

    status = {"selfDeclaredMadeForKids": bool(meta.get("made_for_kids", False))}
    if public and not publish_at:
        status["privacyStatus"] = "public"
    else:
        status["privacyStatus"] = "private"      # publishAt requires private
        if publish_at and (public or up.get("use_publish_at", True)):
            status["publishAt"] = publish_at
    if a.synthetic or meta.get("synthetic_media") or up.get("contains_synthetic_media"):
        status["containsSyntheticMedia"] = True

    body = {
        "snippet": {
            "title": meta["title"][:100],
            "description": meta.get("description", ""),
            "tags": meta.get("tags", []),
            "categoryId": str(meta.get("category_id", cfg.get("category_id", "27"))),
            "defaultLanguage": meta.get("language", cfg.get("language", "en")),
        },
        "status": status,
    }
    yt = get_service()
    req = yt.videos().insert(part="snippet,status", body=body,
                             media_body=MediaFileUpload(video, chunksize=8 * 1024 * 1024, resumable=True))
    resp = None
    while resp is None:
        prog, resp = req.next_chunk()
        if prog:
            print(f"uploaded {int(prog.progress() * 100)}%", file=sys.stderr)
    vid = resp["id"]

    thumb = os.path.join(ep, "thumbnail.png")
    if os.path.exists(thumb):
        try:
            yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(thumb)).execute()
        except Exception as e:  # thumbnails need a verified channel
            print(f"thumbnail not set: {e}", file=sys.stderr)
    srt = os.path.join(ep, "captions.srt")
    if os.path.exists(srt):
        try:
            yt.captions().insert(part="snippet", body={"snippet": {"videoId": vid, "language": meta.get("language", "en"),
                                 "name": "Captions", "isDraft": False}}, media_body=MediaFileUpload(srt)).execute()
        except Exception as e:
            print(f"captions not set: {e}", file=sys.stderr)

    out = {"video_id": vid, "studio_url": f"https://studio.youtube.com/video/{vid}/edit",
           "privacy": status["privacyStatus"], "publish_at": status.get("publishAt")}
    json.dump(out, open(os.path.join(ep, "upload.json"), "w"), indent=2)
    print(json.dumps(out))


if __name__ == "__main__":
    main()
