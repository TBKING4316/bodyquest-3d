#!/usr/bin/env python3
"""BodyQuest 3D brand kit: avatar.png (800x800) + banner.png (2560x1440), drawn with PIL.

Design system (channel-config.json brand): navy #0B1016 base, cyan #4FD1E8 x-ray glow,
gold #FFD43B heart accent, Inter Black / ExtraBold type. Flat premium icon look.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_BLACK = r"C:\fsh\crack-knuckles\fonts\Inter-Black.otf"
FONT_XB = r"C:\fsh\crack-knuckles\fonts\Inter-ExtraBold.otf"
NAVY, CYAN, CYAN_DIM, GOLD, WHITE = "#0B1016", "#4FD1E8", "#1E4E5C", "#FFD43B", "#F5F7FF"
RGB = lambda hexs: (*tuple(int(hexs[i:i + 2], 16) for i in (1, 3, 5)),)


def body(cx, cy, s):
    """Clean x-ray figure: skull disc, spine, 7 ribs, pelvis arc, arms out-down, legs."""
    P = []
    P.append(("disc", (cx, cy - 1.30 * s), 0.115 * s))
    P.append(("seg", [(cx, cy - 1.22 * s), (cx, cy + 0.40 * s)], 0.05 * s))
    for i in range(7):
        ry = cy - 1.05 * s + i * 0.16 * s
        w = 0.28 * s * (1 - 0.045 * i)
        P.append(("arc", (cx - w, ry - 0.07 * s, cx + w, ry + 0.07 * s), 195, 345, 0.035 * s))
    P.append(("arc", (cx - 0.17 * s, cy + 0.30 * s, cx + 0.17 * s, cy + 0.55 * s), 15, 165, 0.045 * s))
    for sgn in (-1, 1):
        P.append(("seg", [(cx + sgn * 0.14 * s, cy - 1.00 * s), (cx + sgn * 0.36 * s, cy - 0.62 * s),
                          (cx + sgn * 0.42 * s, cy - 0.18 * s)], 0.05 * s))
        P.append(("seg", [(cx + sgn * 0.09 * s, cy + 0.46 * s), (cx + sgn * 0.12 * s, cy + 0.74 * s),
                          (cx + sgn * 0.10 * s, cy + 1.02 * s)], 0.055 * s))
    return P


def draw_body(draw, col, cx, cy, s, scale=1.0, alpha=255):
    for p in body(cx, cy, s):
        w = max(2, int(p[2 if p[0] != "disc" else 1] * (0 if p[0] == "disc" else 1) * scale)) if p[0] != "disc" else 0
        if p[0] == "disc":
            r = p[2]
            draw.ellipse((p[1][0] - r, p[1][1] - r, p[1][0] + r, p[1][1] + r), fill=(*col, int(alpha * 0.25)),
                         outline=(*col, alpha), width=max(2, int(0.045 * s * scale)))
        elif p[0] == "seg":
            draw.line([(x, y) for x, y in p[1]], fill=(*col, alpha), width=max(2, int(p[2] * scale)), joint="curve")
        elif p[0] == "arc":
            draw.arc(p[1], start=p[2], end=p[3], fill=(*col, alpha), width=max(2, int(p[4] * scale)))


def glow_paste(img, cx, cy, s, scale, layers):
    """Cyan glow layers under the core figure."""
    W, H = img.size
    for blur, alpha, spread in layers:
        pad = int(s * 2.2)
        lay = Image.new("RGBA", (pad, pad), (0, 0, 0, 0))
        draw_body(ImageDraw.Draw(lay), RGB(CYAN), pad / 2, pad / 2, s, scale, alpha)
        lay = lay.filter(ImageFilter.GaussianBlur(blur))
        img.paste(lay, (int(cx - pad / 2), int(cy - pad / 2)), lay)


def heart(img, cx, cy, r):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for rr, a in ((r * 2.2, 70), (r * 1.5, 150), (r, 255)):
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=(*RGB(GOLD), a))
    soft = lay.filter(ImageFilter.GaussianBlur(r * 0.9))
    img.alpha_composite(soft); img.alpha_composite(lay)


def vignette(img, strength=0.5):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((-w * 0.12, -h * 0.12, w * 1.12, h * 1.12), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.3))
    dark = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dark.putalpha(Image.eval(mask, lambda v: int(255 * strength * (1 - v / 255))))
    return Image.alpha_composite(img.convert("RGBA"), dark)


def avatar():
    S = 800
    img = Image.new("RGBA", (S, S), (*RGB(NAVY), 255))
    cx, cy, s = S / 2, S * 0.46, S * 0.24
    # faint radial cyan backdrop so the figure lifts off the navy
    back = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(back).ellipse((cx - s * 1.5, cy - s * 2.0, cx + s * 1.5, cy + s * 2.0), fill=(*RGB(CYAN), 26))
    img.alpha_composite(back.filter(ImageFilter.GaussianBlur(S * 0.16)))
    glow_paste(img, cx, cy, s, 1.0, [(30, 130, 0), (10, 170, 0)])
    core = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw_body(ImageDraw.Draw(core), RGB(CYAN), cx, cy, s, 1.25, 255)
    img.alpha_composite(core)
    heart(img, cx, cy - 0.72 * s, S * 0.017)
    vignette(img, 0.35).convert("RGB").save(os.path.join(HERE, "avatar.png"))
    print("avatar.png done")


def banner():
    W, H = 2560, 1440
    img = Image.new("RGBA", (W, H), (*RGB(NAVY), 255))
    d = ImageDraw.Draw(img)
    for i in range(12):  # faint scanlines
        y = H * 0.5 - 240 + i * 44
        d.line([(0, y), (W, y)], fill=(*RGB(CYAN_DIM), 90), width=2)
    cx, cy, s = 1760, 745, 150   # whole figure stays inside YouTube's 1546x423 mobile-safe band
    back = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(back).ellipse((cx - s * 1.6, cy - s * 2.1, cx + s * 1.6, cy + s * 2.1), fill=(*RGB(CYAN), 22))
    img.alpha_composite(back.filter(ImageFilter.GaussianBlur(220)))
    glow_paste(img, cx, cy, s, 1.0, [(36, 120, 0), (14, 160, 0)])
    core = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_body(ImageDraw.Draw(core), RGB(CYAN), cx, cy, s, 1.25, 255)
    img.alpha_composite(core)
    heart(img, cx, cy - 0.72 * s, 8)

    d = ImageDraw.Draw(img)
    f_main = ImageFont.truetype(FONT_BLACK, 168)
    f_sub = ImageFont.truetype(FONT_XB, 60)
    main_t, sub_t = "BodyQuest 3D", "SEE WHAT HAPPENS INSIDE YOU"
    mb = d.textbbox((0, 0), main_t, font=f_main)
    sb = d.textbbox((0, 0), sub_t, font=f_sub)
    mx = 660 - (mb[2] - mb[0]) / 2
    d.text((mx, 552), main_t, font=f_main, fill=(*RGB(WHITE), 255))
    d.rounded_rectangle((mx - 8, 762, mx + (sb[2] - sb[0]) + 28, 852), radius=44, outline=(*RGB(GOLD), 255), width=4)
    d.text((mx + 10, 776), sub_t, font=f_sub, fill=(*RGB(GOLD), 255))
    vignette(img, 0.5).convert("RGB").save(os.path.join(HERE, "banner.png"))
    print("banner.png done")


if __name__ == "__main__":
    avatar(); banner()
