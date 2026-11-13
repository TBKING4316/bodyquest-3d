#!/usr/bin/env python3
"""Upload the channel banner via channelBanners.insert, then set it with channels.update.

  python scripts/banner_upload.py            # upload brand/banner.png and apply
"""
import json, os
from googleapiclient.http import MediaFileUpload
from PIL import Image
from yt_auth import get_service

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "brand", "banner.png")
JPG = os.path.join(ROOT, "brand", "banner.jpg")


def main():
    # API-safe re-encode: RGB JPEG, <=6MB, 2560x1440 (min 2048x1152)
    Image.open(SRC).convert("RGB").save(JPG, "JPEG", quality=92)
    yt = get_service()
    ch = yt.channels().list(part="brandingSettings", mine=True).execute()["items"][0]
    bs = json.loads(json.dumps(ch.get("brandingSettings", {})))

    media = MediaFileUpload(JPG, mimetype="image/jpeg", resumable=True)
    up = yt.channelBanners().insert(media_body=media, body={}).execute()
    url = up["url"]
    print("banner uploaded:", url)

    bs.setdefault("image", {})["bannerExternalUrl"] = url
    yt.channels().update(part="brandingSettings", body={"id": ch["id"], "brandingSettings": bs}).execute()
    print("bannerExternalUrl set on channel")

    after = yt.channels().list(part="brandingSettings", mine=True).execute()
    print(json.dumps(after["items"][0].get("brandingSettings", {}).get("image", {}), indent=1))


if __name__ == "__main__":
    main()
