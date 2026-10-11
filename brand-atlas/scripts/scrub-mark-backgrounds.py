#!/usr/bin/env python3
"""Strip near-solid corner backgrounds from PNG logos embedded in mark SVGs."""
from __future__ import annotations

import base64
import re
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image

MARKS = Path(__file__).resolve().parent.parent / "public" / "marks"
DATA_RE = re.compile(
    r'(href=")data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)(")',
    re.I,
)


def corner_colors(im: Image.Image, inset: int = 2):
    """Return opaque corner RGB samples only (ignore transparent corners)."""
    w, h = im.size
    pts = [
        (inset, inset),
        (w - 1 - inset, inset),
        (inset, h - 1 - inset),
        (w - 1 - inset, h - 1 - inset),
        (inset + 2, inset + 2),
        (w - 3 - inset, inset + 2),
        (inset + 2, h - 3 - inset),
        (w - 3 - inset, h - 3 - inset),
    ]
    out = []
    for pt in pts:
        px = im.getpixel(pt)
        if len(px) >= 4 and px[3] < 200:
            continue
        out.append(px[:3])
    return out


def close(a, b, tol=28):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def scrub_rgba(im: Image.Image) -> Image.Image | None:
    """Make dominant solid corner background transparent. Return None if not scrubbed."""
    rgba = im.convert("RGBA")
    corners = corner_colors(rgba)
    # Need at least 3 corners agreeing on a background color
    bg = None
    for c in corners:
        if sum(1 for o in corners if close(c, o)) >= 3:
            bg = c
            break
    if bg is None:
        return None

    pixels = list(rgba.getdata())
    n = len(pixels)
    bg_count = sum(1 for p in pixels if close(p[:3], bg) and p[3] > 8)
    if bg_count / n < 0.22:
        return None  # logo already fills most of the frame

    def lum(rgb):
        r, g, b = rgb
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    # Never scrub near-white / light grey fields — that destroys light wordmarks
    # we normalize for locked-tile invert visibility.
    if lum(bg) > 180:
        return None

    # Wider tolerance for branded solid fields (red Campari, purple Courvoisier, etc.)
    tol = 42
    out = []
    for r, g, b, a in pixels:
        if a < 8:
            out.append((r, g, b, 0))
        elif close((r, g, b), bg, tol=tol):
            out.append((r, g, b, 0))
        else:
            out.append((r, g, b, a))

    # Abort if scrubbing would erase the mark
    remaining = sum(1 for p in out if p[3] > 40)
    if remaining < max(30, int(0.02 * n)):
        return None

    rgba.putdata(out)
    return rgba


def process_svg(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    m = DATA_RE.search(text)
    if not m:
        return False
    mime = m.group(2).lower()
    if mime in ("jpg", "jpeg"):
        # JPEG has no alpha; convert via scrub then re-embed as PNG
        pass
    try:
        raw = base64.b64decode(m.group(3))
        im = Image.open(BytesIO(raw))
    except Exception:
        return False

    scrubbed = scrub_rgba(im)
    if scrubbed is None:
        return False

    buf = BytesIO()
    scrubbed.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    new_text = DATA_RE.sub(
        rf'\1data:image/png;base64,{b64}\4',
        text,
        count=1,
    )
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def main() -> int:
    changed = 0
    scanned = 0
    for path in sorted(MARKS.glob("*.svg")):
        # Skip nature silhouettes namespaces quickly by content check inside
        text_head = path.read_text(encoding="utf-8", errors="ignore")[:200]
        if "data:image" not in text_head and "data:image" not in path.read_text(encoding="utf-8", errors="ignore"):
            continue
        scanned += 1
        if process_svg(path):
            changed += 1
    print(f"scrubbed {changed} / {scanned} raster marks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
