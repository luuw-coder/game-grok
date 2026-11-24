"""Palette-locked Endless Runner share cards. Staged under .grok, not public/."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

CREAM = (0xF3, 0xE2, 0xB8)       # cream sandstone #F3E2B8
CREAM_HI = (0xFF, 0xF6, 0xE2)
BROWN = (0x8B, 0x5A, 0x32)        # canyon brown #8B5A32
BROWN_DARK = (0x5C, 0x38, 0x1C)
DUST = (0xC4, 0x84, 0x4A)         # trail dust #C4844A
DUST_DEEP = (0xA0, 0x62, 0x30)
SHIRT = (0x5E, 0x9A, 0x3A)        # shirt green #5E9A3A
SHIRT_DARK = (0x3E, 0x70, 0x24)
SHIRT_HI = (0x86, 0xC0, 0x58)
SAGE = SHIRT
SAGE_DARK = SHIRT_DARK
FAR = (0xE6, 0xC8, 0x9A)
FAR_SIDE = (0xC4, 0x9A, 0x68)
SKY_TOP = (0xD4, 0xEE, 0xF8)
SKY = (0x7E, 0xC8, 0xE8)          # sky blue #7EC8E8
SKY_DEEP = (0x5A, 0xB4, 0xD6)
HAZE = (0xF3, 0xE2, 0xB8)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(w, h, stops):
    col = Image.new("RGB", (1, h))
    px = col.load()
    for y in range(h):
        t = y / (h - 1)
        colr = stops[-1][1]
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t <= t1 or i == len(stops) - 2:
                u = 0 if t1 == t0 else (t - t0) / (t1 - t0)
                colr = lerp(c0, c1, max(0.0, min(1.0, u)))
                break
        px[0, y] = colr
    return col.resize((w, h), Image.Resampling.BILINEAR).convert("RGBA")


def font(size):
    return ImageFont.truetype(FONT_PATH, size)


def ink_bbox(text, size, xy, anchor="ls"):
    """Return the ink box of stroked text without drawing it on the card."""
    probe = Image.new("L", (1600, 800), 0)
    d = ImageDraw.Draw(probe)
    d.text(xy, text, font=font(size), fill=255, anchor=anchor, stroke_width=8, stroke_fill=255)
    return probe.point(lambda p: 255 if p else 0).getbbox()


def draw_title(base, lines, stroke=8, shadow=(5, 6)):
    """lines: list of (text, size, xy, anchor). Returns union ink bbox."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    boxes = []
    for text, size, xy, anchor in lines:
        f = font(size)
        sx, sy = shadow
        d.text(
            (xy[0] + sx, xy[1] + sy),
            text,
            font=f,
            fill=BROWN_DARK + (210,),
            anchor=anchor,
            stroke_width=stroke,
            stroke_fill=BROWN_DARK + (210,),
        )
        d.text(
            xy,
            text,
            font=f,
            fill=CREAM + (255,),
            anchor=anchor,
            stroke_width=stroke,
            stroke_fill=BROWN + (255,),
        )
        boxes.append(ink_bbox(text, size, xy, anchor))
    base.alpha_composite(layer)
    xs0 = min(b[0] for b in boxes)
    ys0 = min(b[1] for b in boxes)
    xs1 = max(b[2] for b in boxes)
    ys1 = max(b[3] for b in boxes)
    return (xs0, ys0, xs1, ys1)


def mesa(img, polygon, face, side_shift, side_color, strata):
    # side face: shift the right portion
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.polygon(polygon, fill=face + (255,))
    # strata clipped by redrawing mask
    miny = min(p[1] for p in polygon)
    maxy = max(p[1] for p in polygon)
    minx = min(p[0] for p in polygon) - 4
    maxx = max(p[0] for p in polygon) + 4
    y = int(miny) + 16
    while y < maxy - 8:
        d.line([(minx, y), (maxx, y)], fill=strata + (255,), width=3)
        y += 18
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    r, g, b, a = overlay.split()
    from PIL import ImageChops
    a = ImageChops.multiply(a, mask)
    img.alpha_composite(Image.merge("RGBA", (r, g, b, a)))

    if side_shift:
        side = [(p[0] + side_shift, p[1] + 6) for p in polygon]
        # only a slim right slab
        xs = [p[0] for p in polygon]
        cut = max(xs) - abs(side_shift) * 1.6
        slab = [p for p in polygon if p[0] >= cut - 30]
        if len(slab) >= 3:
            # build a quad from the right edge
            right = sorted(polygon, key=lambda p: -p[0])[:2]
            # top-right, bottom-right
            right = sorted(right, key=lambda p: p[1])
            top_r, bot_r = right[0], right[1]
            slab = [
                top_r,
                bot_r,
                (bot_r[0] + side_shift, bot_r[1] + 8),
                (top_r[0] + side_shift, top_r[1] + 8),
            ]
            sd = Image.new("RGBA", img.size, (0, 0, 0, 0))
            ImageDraw.Draw(sd).polygon(slab, fill=side_color + (255,))
            img.alpha_composite(sd)
        # cream cap along the top edge (highest segment)
        top_pts = sorted(polygon, key=lambda p: p[1])[:2]
        cap = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(cap).line(top_pts, fill=CREAM_HI + (230,), width=5)
        img.alpha_composite(cap)


def bush(img, x, y, s):
    d = ImageDraw.Draw(img)
    d.ellipse([x - s, y - s * 0.2, x + s * 0.3, y + s * 0.9], fill=SAGE_DARK + (255,))
    d.ellipse([x - s * 0.15, y - s * 1.05, x + s * 1.15, y + s * 0.45], fill=SAGE + (255,))
    d.ellipse([x + s * 0.55, y - s * 0.35, x + s * 1.45, y + s * 0.75], fill=SAGE_DARK + (255,))
    d.ellipse([x + s * 0.15, y - s * 0.85, x + s * 0.85, y - s * 0.15], fill=SHIRT_HI + (255,))


def capsule(d, a, b, width, fill):
    d.line([a, b], fill=fill, width=width)
    r = width / 2
    d.ellipse([a[0] - r, a[1] - r, a[0] + r, a[1] + r], fill=fill)
    d.ellipse([b[0] - r, b[1] - r, b[0] + r, b[1] + r], fill=fill)


def runner(img, cx, foot_y, scale, face=1):
    """Side-view runner. Local +y is up. face=1 runs right."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    def P(x, y):
        return (cx + face * x * scale, foot_y - y * scale)

    d.ellipse([P(-40, 0), P(50, -11)], fill=(92, 58, 34, 55))

    limb = max(5, int(13 * scale))
    arm = max(4, int(10 * scale))
    hip = P(-2, 64)
    shoulder = P(24, 108)
    chest = P(12, 90)
    # back leg, front leg — wide stride
    capsule(d, hip, P(-28, 34), limb, BROWN)
    capsule(d, P(-28, 34), P(-54, 4), limb, BROWN)
    capsule(d, hip, P(22, 36), limb, BROWN)
    capsule(d, P(22, 36), P(56, 12), limb, BROWN)
    # arms pump opposite the legs, kept clear of the head
    capsule(d, chest, P(-16, 102), arm, BROWN)
    capsule(d, P(-16, 102), P(-46, 86), arm, BROWN)
    capsule(d, chest, P(34, 112), arm, BROWN)
    capsule(d, P(34, 112), P(58, 100), arm, BROWN)
    # shoes
    capsule(d, P(-54, 4), P(-68, 2), max(4, limb - 2), BROWN_DARK)
    capsule(d, P(56, 12), P(72, 10), max(4, limb - 2), BROWN_DARK)
    # torso: brown edge, grass-green shirt, cream shorts
    body = max(10, int(28 * scale))
    capsule(d, hip, shoulder, body + max(4, int(6 * scale)), BROWN)
    capsule(d, hip, shoulder, body, SHIRT)
    capsule(d, hip, P(8, 80), max(8, int(20 * scale)), CREAM)
    hx, hy = P(32, 128)
    r = 16 * scale
    d.ellipse([hx - r - 2, hy - r - 2, hx + r + 2, hy + r + 2], fill=BROWN)
    d.ellipse([hx - r, hy - r, hx + r, hy + r], fill=CREAM)
    # dust behind the trailing foot
    for i, (dx, dy, rad) in enumerate(((-78, 8, 5), (-92, 12, 3.5))):
        px, py = P(dx, dy)
        rr = rad * scale
        d.ellipse([px - rr, py - rr * 0.65, px + rr, py + rr * 0.65], fill=CREAM + (160 - i * 40,))
    img.alpha_composite(layer)


def sun(img, cx, cy, r):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(10, 0, -1):
        rr = r + i * 14
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=CREAM + (12 + i,))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM_HI + (255,))
    img.alpha_composite(layer)


def clouds(img, blobs):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x, y, w, h, a in blobs:
        d.ellipse([x, y, x + w, y + h], fill=CREAM_HI + (a,))
    img.alpha_composite(layer)


def dune(img, y_wave, amp, phase, color, bottom):
    w = img.size[0]
    pts = []
    for x in range(0, w + 1, 16):
        pts.append((x, y_wave + amp * math.sin(x * 0.008 + phase)))
    pts += [(w, bottom), (0, bottom)]
    d = ImageDraw.Draw(img)
    d.polygon(pts, fill=color + (255,))


def path_stripe(img, y_wave, amp, phase, width, color):
    w = img.size[0]
    pts_top = []
    pts_bot = []
    for x in range(0, w + 1, 16):
        y = y_wave + amp * math.sin(x * 0.008 + phase)
        pts_top.append((x, y - width * 0.35))
        pts_bot.append((x, y + width * 0.65))
    d = ImageDraw.Draw(img)
    d.polygon(pts_top + pts_bot[::-1], fill=color + (255,))


def render_og():
    W, H = 1200, 630
    img = vgrad(W, H, [(0, SKY_TOP), (0.45, SKY), (0.78, SKY_DEEP), (1, HAZE)])
    sun(img, 1048, 108, 54)
    clouds(img, [(80, 70, 180, 36, 70), (220, 96, 120, 26, 50), (860, 64, 150, 28, 55)])

    # gateway cliffs, kept outside the centered title
    mesa(
        img,
        [(0, 250), (70, 168), (168, 188), (198, 280), (150, 390), (230, 500), (160, 630), (0, 630)],
        DUST,
        18,
        DUST_DEEP,
        BROWN,
    )
    mesa(
        img,
        [(1200, 220), (1120, 140), (1036, 168), (1004, 270), (1060, 400), (980, 520), (1040, 630), (1200, 630)],
        DUST,
        -16,
        BROWN,
        BROWN_DARK,
    )
    mesa(
        img,
        [(-20, 360), (40, 300), (120, 314), (90, 470), (40, 630), (-20, 630)],
        FAR,
        14,
        FAR_SIDE,
        DUST,
    )
    mesa(
        img,
        [(1220, 340), (1140, 286), (1088, 310), (1120, 470), (1160, 630), (1220, 630)],
        FAR,
        -12,
        FAR_SIDE,
        DUST,
    )

    dune(img, 500, 16, 0.4, SAGE_DARK, H)
    dune(img, 528, 18, 1.1, DUST, H)
    path_stripe(img, 568, 14, 0.6, 26, CREAM)

    # pebbles
    peb = ImageDraw.Draw(img)
    for x, y, r in ((340, 590, 7), (410, 604, 5), (760, 596, 6), (820, 612, 4)):
        peb.ellipse([x - r, y - r * 0.6, x + r, y + r * 0.6], fill=BROWN + (255,))

    for x, y, s in ((300, 548, 16), (390, 566, 12), (790, 552, 18), (880, 574, 13), (150, 560, 14)):
        bush(img, x, y, s)

    runner(img, 148, 592, 1.22, face=1)

    # lockup centered both ways. Sizes chosen so the wider word spans ~56% of width.
    lines = [
        ("ENDLESS", 132, (600, 268), "ms"),
        ("RUNNER", 142, (600, 400), "ms"),
    ]
    box = draw_title(img, lines, stroke=9, shadow=(5, 7))
    return img.convert("RGB"), box


def render_banner():
    W, H = 1200, 264
    img = vgrad(W, H, [(0, SKY_TOP), (0.55, SKY), (1, HAZE)])
    sun(img, 1040, 58, 32)
    clouds(img, [(620, 28, 150, 22, 60), (800, 46, 110, 18, 45)])

    # scenery lives right of the lockup and along the bottom strip
    mesa(
        img,
        [(820, 168), (880, 118), (980, 128), (1020, 176), (960, 220), (880, 236), (820, 210)],
        FAR,
        12,
        FAR_SIDE,
        DUST,
    )
    mesa(
        img,
        [(980, 120), (1040, 64), (1160, 78), (1200, 110), (1200, 230), (1080, 210), (1000, 180)],
        DUST,
        -14,
        BROWN,
        BROWN_DARK,
    )
    mesa(
        img,
        [(1180, 90), (1220, 70), (1240, 150), (1180, 170)],
        FAR,
        -8,
        FAR_SIDE,
        DUST,
    )

    dune(img, 196, 8, 0.2, SAGE_DARK, H)
    dune(img, 214, 7, 1.0, DUST, H)
    path_stripe(img, 232, 5, 0.5, 12, CREAM)

    for x, y, s in ((560, 214, 11), (640, 224, 9), (900, 218, 12), (1088, 226, 10)):
        bush(img, x, y, s)

    runner(img, 690, 238, 0.82, face=1)

    # left half, above the midline, clear of the bottom fifth
    lines = [
        ("ENDLESS", 70, (56, 92), "ls"),
        ("RUNNER", 76, (56, 168), "ls"),
    ]
    box = draw_title(img, lines, stroke=6, shadow=(3, 4))
    return img.convert("RGB"), box


def main():
    og, og_box = render_og()
    ban, ban_box = render_banner()
    og.save("/workspace/.grok/og-raw.png")
    ban.save("/workspace/.grok/banner-raw.png")
    print("og", og.size, "title_ink", og_box)
    print("banner", ban.size, "title_ink", ban_box)
    # gates
    l, t, r, b = og_box
    assert og.size == (1200, 630)
    assert l > 80 and r < 1120 and t > 40 and b < 590, og_box
    # roughly centered
    assert abs((l + r) / 2 - 600) < 40, og_box
    assert abs((t + b) / 2 - 315) < 70, og_box
    # half to two-thirds width
    width_frac = (r - l) / 1200
    assert 0.45 <= width_frac <= 0.72, width_frac

    l, t, r, b = ban_box
    assert ban.size == (1200, 264)
    assert l > 24, ban_box
    assert r < 600, ("right half", ban_box)
    assert t > 12, ban_box
    assert b < 264 * 0.8, ("bottom fifth", ban_box)
    assert (t + b) / 2 < 132, ("below midline", ban_box)
    print("gates ok", "og_width_frac", round(width_frac, 3))


if __name__ == "__main__":
    main()
