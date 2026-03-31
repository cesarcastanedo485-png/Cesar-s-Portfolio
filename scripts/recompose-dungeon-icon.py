"""Recompose dungeon-master-lite.png: crop outer glitch, center on white 682×1024."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "games" / "dungeon-master-lite.png"
OUT = SRC  # overwrite in place

# Match other game marketing PNGs (see chatling-ranch / choose-your-destiny).
CANVAS_W, CANVAS_H = 682, 1024
# Fraction of width to remove from each side (cuts TikTok asset outer black + streaks).
CROP_INSET_FRAC = 0.17
# Max size for the recomposed mark (Chatling content ~520px wide).
MAX_MARK = 520


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    if w != h:
        raise SystemExit(f"expected square source, got {w}×{h}")
    inset = int(round(w * CROP_INSET_FRAC))
    box = (inset, inset, w - inset, h - inset)
    mark = im.crop(box)

    mw, mh = mark.size
    scale = min(MAX_MARK / mw, MAX_MARK / mh)
    nw, nh = max(1, int(mw * scale)), max(1, int(mh * scale))
    mark = mark.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 255))
    x = (CANVAS_W - nw) // 2
    y = (CANVAS_H - nh) // 2
    canvas.paste(mark, (x, y), mark)
    canvas.convert("RGB").save(OUT, format="PNG", optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} ({CANVAS_W}×{CANVAS_H}, mark {nw}×{nh})")


if __name__ == "__main__":
    main()
