"""BodyQuest 3D - daily/weekly report generator.

Usage:
  python report.py daily    -> writes state/report_daily.md  (today's run summary + stats)
  python report.py weekly   -> writes state/report_weekly.md (7-day aggregate + trends)

Both pull live stats from the YouTube Data API (channel + recent videos),
append a daily stats snapshot to state/stats_history.jsonl, and derive
week-over-week deltas from that history. Designed to be emailed by the
daily autopilot agent (Zapier outbound) right after generation.
"""
import json
import re
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "scripts")
from yt_auth import get_service  # noqa: E402

ROOT = r"C:\Users\TB KING\youtube-master"
PKT = timezone(timedelta(hours=5))
CHANNEL_ID = "UCLCWgg7WdcQ10JGh5X8XG7w"


def now_pkt():
    return datetime.now(PKT)


def read(p):
    try:
        with open(p, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def journal_lines(day):
    """Lines in state/journal.md whose date matches YYYY-MM-DD."""
    out = []
    for line in read(ROOT + r"\state\journal.md").splitlines():
        if line.startswith(day):
            out.append(line)
    return out


def uploads_entries():
    """Crude but stable parse of state/uploads.yaml entries."""
    txt = read(ROOT + r"\state\uploads.yaml")
    entries = []
    cur = None
    for line in txt.splitlines():
        m = re.match(r"\s+- file: (.+)", line)
        if m:
            cur = {"file": m.group(1).strip()}
            entries.append(cur)
            continue
        if cur is not None:
            m2 = re.match(r"\s+([a-z_]+): (.+)", line)
            if m2 and m2.group(1) != "uploads":
                cur[m2.group(1)] = m2.group(2).strip()
    return entries


def fetch_youtube():
    yt = get_service()
    ch = yt.channels().list(part="snippet,statistics,contentDetails", id=CHANNEL_ID).execute()["items"][0]
    st = ch["statistics"]
    chan = {
        "title": ch["snippet"]["title"],
        "subs": int(st.get("subscriberCount", 0)),
        "views": int(st.get("viewCount", 0)),
        "videos": int(st.get("videoCount", 0)),
        "hidden_subs": bool(st.get("hiddenSubscriberCount")),
    }
    # recent uploads (last 10)
    uploads_pl = ch["contentDetails"]["relatedPlaylists"]["uploads"] if "contentDetails" in ch else None
    vids = []
    if uploads_pl:
        items = yt.playlistItems().list(part="contentDetails", playlistId=uploads_pl, maxResults=10).execute()["items"]
        ids = [i["contentDetails"]["videoId"] for i in items]
        if ids:
            r = yt.videos().list(part="snippet,status,statistics", id=",".join(ids)).execute()["items"]
            for v in r:
                vids.append({
                    "id": v["id"],
                    "title": v["snippet"].get("title", ""),
                    "status": v["status"].get("privacyStatus"),
                    "publishAt": v["status"].get("publishAt"),
                    "publishedAt": v["snippet"].get("publishedAt"),
                    "views": int(v["statistics"].get("viewCount", 0)),
                    "likes": int(v["statistics"].get("likeCount", 0)),
                    "comments": int(v["statistics"].get("commentCount", 0)),
                })
    return chan, vids


def append_stats_history(chan):
    path = ROOT + r"\state\stats_history.jsonl"
    day = now_pkt().strftime("%Y-%m-%d")
    lines = read(path).strip().splitlines()
    rec = {"date": day, "subs": chan["subs"], "views": chan["views"], "videos": chan["videos"],
           "ts": now_pkt().isoformat()}
    if lines and json.loads(lines[-1]).get("date") == day:
        lines[-1] = json.dumps(rec)  # replace today's snapshot with latest
    else:
        lines.append(json.dumps(rec))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return rec


def stats_delta(days):
    """Return (rec_now, rec_days_ago) from stats_history for delta math."""
    lines = [json.loads(l) for l in read(ROOT + r"\state\stats_history.jsonl").strip().splitlines() if l]
    if not lines:
        return None, None
    now = lines[-1]
    cutoff = (now_pkt() - timedelta(days=days)).strftime("%Y-%m-%d")
    old = next((r for r in lines if r["date"] >= cutoff), None) or (lines[0] if len(lines) < days else None)
    return now, old


def fmt_vid(v):
    pub = v.get("publishAt")
    if v["status"] == "private" and pub:
        t = datetime.fromisoformat(pub.replace("Z", "+00:00")).astimezone(PKT)
        state = f"scheduled public {t:%d %b %Y %H:%M} PKT"
    elif v["status"] == "public":
        state = "PUBLIC"
    else:
        state = v["status"] or "?"
    return f'- "{v["title"]}" ({v["id"]}) - {state} - {v["views"]} views, {v["likes"]} likes, {v["comments"]} comments'


def build_daily():
    day = now_pkt().strftime("%Y-%m-%d")
    chan, vids = fetch_youtube()
    rec = append_stats_history(chan)
    ups = uploads_entries()
    sched = [u for u in ups if "publishAt" in u.get("visibility", "")]

    L = []
    L.append(f"BODYQUEST 3D - DAILY REPORT - {day}")
    L.append("=" * 46)
    L.append("")
    L.append("CHANNEL")
    L.append(f'  {chan["title"]} (@bodyquest_3d)')
    L.append(f'  Subscribers: {chan["subs"]} | Total views: {chan["views"]} | Videos: {chan["videos"]}')
    L.append("")
    L.append("TODAY'S WORK (from journal)")
    jl = journal_lines(day)
    if jl:
        for line in jl:
            L.append("  " + line[:220])
    else:
        L.append("  (no journal lines today - daily run may not have executed yet)")
    L.append("")
    L.append("UPLOAD / PUBLISH PIPELINE")
    if sched:
        for u in sched[-3:]:
            L.append(f'  - "{u.get("title", "?")}" ({u.get("youtube_id", "?")}) | {u.get("visibility", "")}')
    L.append("")
    L.append("RECENT VIDEOS (live from YouTube)")
    for v in vids[:6]:
        L.append("  " + fmt_vid(v))
    L.append("")
    L.append("NEXT ACTIONS (automatic)")
    L.append("  - Today's video goes public at 18:00 PKT automatically (no action needed).")
    L.append("  - Tomorrow's run (16:00 PKT) produces/uploads video #4 into the next free slot.")
    L.append("")
    L.append(f"  report generated {rec['ts']}")
    txt = "\n".join(L)
    with open(ROOT + r"\state\report_daily.md", "w", encoding="utf-8") as f:
        f.write(txt + "\n")
    return txt


def build_weekly():
    day = now_pkt()
    chan, vids = fetch_youtube()
    now, old = stats_delta(7)
    wk_ago = day - timedelta(days=7)
    d_subs = (now["subs"] - old["subs"]) if now and old else 0
    d_views = (now["views"] - old["views"]) if now and old else 0

    week_lines = []
    for i in range(7):
        d = (wk_ago + timedelta(days=1)).strftime("%Y-%m-%d") if False else (day - timedelta(days=i)).strftime("%Y-%m-%d")
        week_lines += journal_lines(d)

    # top performer among recent videos
    top = max(vids, key=lambda v: v["views"]) if vids else None

    L = []
    L.append(f"BODYQUEST 3D - WEEKLY REPORT - week ending {day:%Y-%m-%d}")
    L.append("=" * 50)
    L.append("")
    L.append("GROWTH (7 days)")
    L.append(f'  Subscribers: {now["subs"] if now else chan["subs"]} ({d_subs:+d} this week)')
    L.append(f'  Total views: {now["views"] if now else chan["views"]} ({d_views:+d} this week)')
    L.append(f'  Videos: {now["videos"] if now else chan["videos"]}')
    L.append("")
    L.append("VIDEOS THIS WEEK (live stats)")
    week_titles = []
    for v in vids:
        if v.get("publishedAt") or v.get("publishAt"):
            week_titles.append("  " + fmt_vid(v))
    L.extend(week_titles[:8] if week_titles else ["  (none published yet - channel still ramping)"])
    L.append("")
    if top:
        L.append("TOP PERFORMER")
        L.append(f'  "{top["title"]}" - {top["views"]} views, {top["likes"]} likes')
    L.append("")
    L.append("WORK LOG (last 7 days, from journal)")
    if week_lines:
        for line in week_lines[-25:]:
            L.append("  " + line[:200])
    else:
        L.append("  (no journal lines found for the week)")
    L.append("")
    L.append("HEALTH / ISSUES")
    deferred = [l for l in week_lines if "DEFERRED" in l or "FAIL" in l.upper()]
    if deferred:
        for l in deferred[-5:]:
            L.append("  " + l[:200])
    else:
        L.append("  No open deferrals or QA failures in the last 7 days.")
    L.append("")
    L.append("PLAN")
    L.append("  - Daily Shorts continue at 18:00 PKT publish, 16:00 PKT production.")
    L.append("  - Facts backlog (swallow-gum etc.) keeps PC-off cloud production ready.")
    txt = "\n".join(L)
    with open(ROOT + r"\state\report_weekly.md", "w", encoding="utf-8") as f:
        f.write(txt + "\n")
    return txt


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "daily"
    print(build_weekly() if mode == "weekly" else build_daily())
