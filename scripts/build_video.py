#!/usr/bin/env python3
"""Render an episode from storyboard.json: voice, scene cards, motion, captions, final MP4.

  python build_video.py episodes/2026-11-12-topic [--config channel-config.json] [--shorts] [--no-motion]

storyboard.json:
{
  "title": "...", "style": "flat-motion",
  "scenes": [
    {"heading": "Why it matters", "bullets": ["point one", "point two"],
     "narration": "What the voice says for this scene.",
     "image": "optional/path/to/art.png"}        # optional AI image or licensed asset, shown behind the text
  ]
}
Outputs: video.mp4, captions.srt, thumbnail.png (title card) in the episode folder.
This is the dependable baseline (slides and motion graphics with voiceover). Richer styles
(Remotion, Manim, AI clips) are in references/video-pipelines.md; they can replace the scene
cards while this script still handles voice, timing, captions and concat.
"""
import argparse, glob, json, os, re, subprocess, sys, textwrap
from PIL import Image, ImageDraw, ImageFont
from tts import synth, duration

FONT_CANDIDATES = [
    "{font}", "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
]


def load_font(path, size):
    for c in FONT_CANDIDATES:
        c = c.replace("{font}", path or "")
        if c and os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def hex2rgb(h, default):
    h = (h or "").lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) if len(h) == 6 else default


def wrap(draw, text, font, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    return lines + ([cur] if cur else [])


def card(scene, idx, total, W, H, brand, out):
    pal = brand.get("palette") or []
    bg = hex2rgb(pal[0] if len(pal) > 0 else "", (16, 20, 38))
    fg = hex2rgb(pal[1] if len(pal) > 1 else "", (245, 247, 255))
    ac = hex2rgb(pal[2] if len(pal) > 2 else "", (255, 176, 46))
    img = Image.new("RGB", (W, H), bg)
    if scene.get("image") and os.path.exists(scene["image"]):
        art = Image.open(scene["image"]).convert("RGB")
        r = max(W / art.width, H / art.height)
        art = art.resize((int(art.width * r), int(art.height * r)))
        art = art.crop(((art.width - W) // 2, (art.height - H) // 2, (art.width + W) // 2, (art.height + H) // 2))
        img = Image.blend(art, Image.new("RGB", (W, H), bg), 0.62)
    d = ImageDraw.Draw(img)
    pad = int(W * 0.07)
    hf = load_font(brand.get("font"), int(H * 0.085))
    bf = load_font(brand.get("font"), int(H * 0.048))
    # soft accent shape so cards without art are not empty
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    od.ellipse([int(W * 0.62), int(H * 0.45), int(W * 1.15), int(H * 1.25)], fill=ac + (38,))
    od.ellipse([int(W * 0.78), int(H * 0.05), int(W * 1.05), int(H * 0.38)], fill=ac + (22,))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB"); d = ImageDraw.Draw(img)
    hl = wrap(d, scene.get("heading", ""), hf, int((W - 2 * pad) * 0.8))[:3]
    bl = [wrap(d, b, bf, int((W - 2 * pad) * 0.7) - 60)[:2] for b in scene.get("bullets", [])[:5]]
    hh, lh, bgap = int(H * 0.105), int(H * 0.065), int(H * 0.02)
    block = len(hl) * hh + (int(H * 0.04) + sum(len(x) * lh + bgap for x in bl) if bl else 0)
    y = max(int(H * 0.12), (H - block) // 2)
    d.rectangle([pad, y - 34, pad + 140, y - 24], fill=ac)
    for line in hl:
        d.text((pad, y), line, font=hf, fill=fg); y += hh
    if bl:
        y += int(H * 0.04)
    for lines in bl:
        d.ellipse([pad, y + 16, pad + 20, y + 36], fill=ac)
        for ln in lines:
            d.text((pad + 50, y), ln, font=bf, fill=fg); y += lh
        y += bgap
    d.rectangle([0, H - 12, int(W * (idx + 1) / total), H], fill=ac)  # progress bar
    img.save(out)


def srt_time(t):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int((s % 1) * 1000):03}"


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("episode")
    p.add_argument("--config", default="channel-config.json")
    p.add_argument("--shorts", action="store_true", help="1080x1920 vertical")
    p.add_argument("--no-motion", action="store_true")
    a = p.parse_args()

    cfg = json.load(open(a.config, encoding="utf-8")) if os.path.exists(a.config) else {}
    sb = json.load(open(os.path.join(a.episode, "storyboard.json"), encoding="utf-8"))
    W, H = (1080, 1920) if a.shorts else (1920, 1080)
    fps = 30
    voice = cfg.get("voice", {})
    work = os.path.join(a.episode, "_build"); os.makedirs(work, exist_ok=True)
    clips, srt, t0, n = [], [], 0.0, len(sb["scenes"])

    for i, sc in enumerate(sb["scenes"]):
        png, mp3, mp4 = (os.path.join(work, f"s{i:02}.{e}") for e in ("png", "mp3", "mp4"))
        card(sc, i, n, W, H, cfg.get("brand", {}), png)
        dur = synth(sc["narration"], mp3, voice.get("provider", "edge"), voice.get("voice_id", "en-US-AndrewNeural"))
        dur = max(dur + 0.35, float(sc.get("min_seconds", 0)))
        frames = int(dur * fps)
        zoom = ("scale=8000:-1,zoompan=z='min(zoom+0.0004,1.08)':d=%d:s=%dx%d:fps=%d" % (frames, W, H, fps)
                if not a.no_motion else f"scale={W}:{H},fps={fps}")
        run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", png, "-i", mp3,
             "-vf", zoom + ",format=yuv420p", "-t", f"{dur:.2f}", "-af", "apad", "-shortest",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", mp4])
        ss = sentences(sc["narration"]); total_chars = sum(len(s) for s in ss) or 1; t = t0
        for s in ss:
            d_ = (dur - 0.35) * len(s) / total_chars
            srt.append((t, t + d_, s)); t += d_
        t0 += dur
        clips.append(mp4)
        print(f"scene {i + 1}/{n} done ({dur:.1f}s)", file=sys.stderr)

    lst = os.path.join(work, "list.txt")
    open(lst, "w").write("".join(f"file '{os.path.abspath(c)}'\n" for c in clips))
    out = os.path.join(a.episode, "video.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out])
    with open(os.path.join(a.episode, "captions.srt"), "w", encoding="utf-8") as f:
        for k, (s, e, txt) in enumerate(srt, 1):
            f.write(f"{k}\n{srt_time(s)} --> {srt_time(e)}\n{textwrap.fill(txt, 60)}\n\n")
    title_card = {"heading": sb.get("title", ""), "bullets": []}
    card(title_card, n - 1, n, 1280, 720, cfg.get("brand", {}), os.path.join(a.episode, "thumbnail.png"))
    print(json.dumps({"video": out, "seconds": round(t0, 1), "scenes": n}))


if __name__ == "__main__":
    main()
