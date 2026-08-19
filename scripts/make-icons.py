from PIL import Image, ImageDraw
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT, "icons")

ORANGE_600 = (234, 88, 12, 255)
WHITE = (255, 255, 255, 255)


def draw_icon(size):
    S = 512
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    radius = int(S * 0.22)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=ORANGE_600)

    cx, cy = S / 2, S / 2
    r = S * 0.29
    lw = max(3, int(S * 0.045))

    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=WHITE, width=lw)

    # minute hand (vertical up)
    d.line([cx, cy, cx, cy - r * 0.68], fill=WHITE, width=lw)

    # hour hand (10:10 look, tilted right of up)
    ang = math.radians(-70)
    hx = cx + r * 0.42 * math.cos(ang)
    hy = cy + r * 0.42 * math.sin(ang)
    d.line([cx, cy, hx, hy], fill=WHITE, width=int(lw * 1.3))

    # center cap
    cap = int(lw * 0.9)
    d.ellipse([cx - cap, cy - cap, cx + cap, cy + cap], fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(ICONS_DIR, exist_ok=True)
    for size in (16, 32, 48, 128):
        draw_icon(size).save(os.path.join(ICONS_DIR, f"icon{size}.png"))
        print(f"icon{size}.png ok")


if __name__ == "__main__":
    main()