#!/usr/bin/env python3
"""Normalize a logo PNG/JPEG into a light mark on a transparent background.

Reads image bytes from stdin, writes PNG bytes to stdout.
Handles:
  - black/dark silhouettes (RGB dark or alpha-only)
  - mono-color wordmarks on solid fields (e.g. Isuzu red, Kamaz blue)
  - light logos on solid backgrounds (scrub corners)
"""
from __future__ import annotations

import sys
from io import BytesIO

from PIL import Image, ImageOps


def close(a, b, tol: int = 30) -> bool:
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def lum(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def normalize(raw: bytes) -> bytes | None:
    im = Image.open(BytesIO(raw)).convert("RGBA")
    im.thumbnail((256, 256), Image.Resampling.LANCZOS)
    w, h = im.size
    px = list(im.getdata())
    opaque = [p for p in px if p[3] > 40]
    if not opaque:
        return None

    dark_rgb = sum(1 for r, g, b, a in opaque if lum(r, g, b) < 40) / len(opaque)
    if dark_rgb > 0.8:
        out = [(255, 255, 255, a) if a > 20 else (0, 0, 0, 0) for r, g, b, a in px]
        im.putdata(out)
    else:
        samples = []
        for i, j in [
            (0, 0),
            (w - 1, 0),
            (0, h - 1),
            (w - 1, h - 1),
            (2, 2),
            (w - 3, 2),
            (2, h - 3),
            (w - 3, h - 3),
        ]:
            r, g, b, a = px[j * w + i]
            if a >= 200:
                samples.append((r, g, b))
        bg = None
        if len(samples) >= 3:
            for c in samples:
                if sum(1 for o in samples if close(c, o, tol=25)) >= 3:
                    bg = c
                    break
        if bg is not None:
            bg_share = (
                sum(1 for r, g, b, a in px if a > 40 and close((r, g, b), bg, tol=40))
                / len(opaque)
            )
            if bg_share > 0.82:
                out = [(255, 255, 255, a) if a > 30 else (0, 0, 0, 0) for r, g, b, a in px]
                im.putdata(out)
            else:
                out = []
                for r, g, b, a in px:
                    if a < 8 or close((r, g, b), bg, tol=45):
                        out.append((0, 0, 0, 0))
                    else:
                        out.append((r, g, b, a))
                im.putdata(out)
                opaque2 = [p for p in out if p[3] > 40]
                if opaque2:
                    avg = sum(lum(r, g, b) for r, g, b, _ in opaque2) / len(opaque2)
                    if avg < 140:
                        r, g, b, a = im.split()
                        rgb = ImageOps.invert(Image.merge("RGB", (r, g, b)))
                        im = Image.merge("RGBA", (*rgb.split(), a))
        else:
            avg = sum(lum(r, g, b) for r, g, b, _ in opaque) / len(opaque)
            if avg < 140:
                r, g, b, a = im.split()
                rgb = ImageOps.invert(Image.merge("RGB", (r, g, b)))
                im = Image.merge("RGBA", (*rgb.split(), a))

    if sum(1 for p in im.getdata() if p[3] > 40) < 20:
        return None
    buf = BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def main() -> int:
    raw = sys.stdin.buffer.read()
    out = normalize(raw)
    if not out:
        return 1
    sys.stdout.buffer.write(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
