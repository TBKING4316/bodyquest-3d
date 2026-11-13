#!/usr/bin/env python3
"""Channel branding: inspect (default) or update description/keywords/country (+title attempt).
  python scripts/branding.py            # inspect
  python scripts/branding.py --apply    # apply the elite rebrand
"""
import json, os, sys
from yt_auth import get_service

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DESCRIPTION = """Your body is stranger than you think.

BodyQuest 3D shows what actually happens inside you, one scenario at a time: hold in a sneeze, sleep five hours, crack your knuckles, swallow gum. Every episode is a short 3D journey through the human body - built from published medical research, with every source listed in the description.

What you get here:
- Real anatomy and physiology, rendered in 3D
- Myth-busting backed by studies, not opinions
- One new episode every day at 6:00 PM PKT

See what happens inside you."""

KEYWORDS = ("what happens if, human body, 3d anatomy, body science, medical facts, "
            "physiology, health myths, myth busting, inside the body, science shorts, "
            "what happens inside you, human body facts")


def main():
    apply = "--apply" in sys.argv
    yt = get_service()
    cur = yt.channels().list(part="brandingSettings,snippet", mine=True).execute()
    ch = cur["items"][0]
    b = ch.get("brandingSettings", {})
    print(json.dumps({"channel": ch["snippet"].get("title"),
                      "custom_url": ch["snippet"].get("customUrl"),
                      "country": ch["snippet"].get("country"),
                      "description_head": (b.get("channel", {}).get("description", "") or ch["snippet"].get("description", ""))[:200],
                      "keywords": (b.get("channel", {}).get("keywords", ""))[:200]}, ensure_ascii=False, indent=1))

    if not apply:
        return

    bs = json.loads(json.dumps(b))  # deep copy of current branding
    bs.setdefault("channel", {})
    bs["channel"]["description"] = DESCRIPTION
    bs["channel"]["keywords"] = KEYWORDS
    bs["channel"]["country"] = "PK"
    bs["channel"]["title"] = "BodyQuest 3D"   # may be rejected; empirical test
    try:
        yt.channels().update(part="brandingSettings", body={"id": ch["id"], "brandingSettings": bs}).execute()
        print("APPLIED: description/keywords/country set; title accepted" )
    except Exception as e:
        msg = str(e)
        print(f"APPLY PARTIAL: {msg[:300]}")
        # retry without title if title was the problem
        try:
            bs["channel"].pop("title", None)
            yt.channels().update(part="brandingSettings", body={"id": ch["id"], "brandingSettings": bs}).execute()
            print("APPLIED without title (title is not API-settable)")
        except Exception as e2:
            print(f"APPLY FAILED: {str(e2)[:300]}")


if __name__ == "__main__":
    main()
