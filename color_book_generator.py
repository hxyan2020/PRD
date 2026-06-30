"""
Color Book Generator
====================
Given an input image, this script:
  1. Extracts N dominant colors via K-Means clustering.
  2. Converts the image to a coloring-book outline (edge-detection + invert).
  3. Produces a multi-page PDF color book containing:
       • Page 1 – the original photo
       • Page 2 – the coloring-book outline (ready to print and color)
       • Page 3+ – one color palette swatch page per discovered color,
                   with the color's hex code, RGB values, and approximate
                   name shown beneath each swatch.

Usage:
    python color_book_generator.py <image_path> [--colors N] [--output output.pdf]

Defaults: N=12 dominant colors, output = <image_stem>_color_book.pdf
"""

import argparse
import io
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps
from sklearn.cluster import KMeans
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors as rl_colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_image(path: str) -> Image.Image:
    img = Image.open(path).convert("RGB")
    return img


def extract_dominant_colors(img: Image.Image, n_colors: int = 12) -> np.ndarray:
    """Return (n_colors, 3) array of dominant RGB colors via K-Means."""
    # Downsample for speed
    small = img.copy()
    small.thumbnail((200, 200))
    pixels = np.array(small).reshape(-1, 3).astype(float)

    km = KMeans(n_clusters=n_colors, n_init=10, random_state=42)
    km.fit(pixels)

    # Sort by cluster size (most prominent first)
    counts = np.bincount(km.labels_)
    order = np.argsort(-counts)
    centers = km.cluster_centers_[order].astype(int)
    centers = np.clip(centers, 0, 255)
    return centers


def make_coloring_outline(img: Image.Image) -> Image.Image:
    """Convert source art to a coloring page without adding texture noise."""
    import cv2
    import numpy as np

    # 1. Convert to grayscale
    bgr = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # 2. Apply a strong median blur to remove texture
    blurred = cv2.medianBlur(gray, 21)

    # 3. Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 51, 5)

    # 4. Clean up noise with morphological operations
    kernel = np.ones((5,5), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)

    # 5. Apply a slight blur to smooth out the lines
    smoothed = cv2.GaussianBlur(cleaned, (3, 3), 0)

    # 6. Apply a threshold to make the lines crisp again
    _, final = cv2.threshold(smoothed, 127, 255, cv2.THRESH_BINARY)

    # 7. Add a thin black border
    h, w = final.shape
    cv2.rectangle(final, (0, 0), (w-1, h-1), (0, 0, 0), 2)

    return Image.fromarray(final).convert("RGB")


def generate_color_book(
    image_path: str,
    n_colors: int = 12,
    output_path: str | None = None,
) -> str:
    from coloring_book import is_line_art
    import cv2

    src = Path(image_path)
    if output_path is None:
        output_path = str(src.parent / f"{src.stem}_color_book.pdf")

    print(f"Loading image: {image_path}")
    img = load_image(image_path)
    bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    already_line_art = is_line_art(bgr)

    print("Generating coloring-book outline …")
    outline = make_coloring_outline(img)
    if already_line_art:
        print("Detected existing line art — using source exactly (no redrawing).")

    print(f"Building PDF: {output_path}")
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle(f"Color Book – {src.name}")
    c.setAuthor("Color Book Generator")

    add_original_page(c, img, src.name)
    c.showPage()

    add_outline_page(c, outline)
    c.showPage()

    if already_line_art:
        c.save()
        print(f"Done! 2 pages saved to: {output_path}")
        return output_path

    print(f"Extracting {n_colors} dominant colors …")
    dominant = extract_dominant_colors(img, n_colors)
    add_palette_page(c, dominant, page_num=3)
    add_individual_swatch_pages(c, dominant, start_page=4)

    c.save()
    total_pages = 3 + len(dominant)
    print(f"Done! {total_pages} pages saved to: {output_path}")
    return output_path


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


def approximate_color_name(r: int, g: int, b: int) -> str:
    """Very simple heuristic color namer."""
    h_max = max(r, g, b)
    h_min = min(r, g, b)
    lightness = (h_max + h_min) / 2 / 255

    if lightness > 0.92:
        return "White"
    if lightness < 0.08:
        return "Black"

    saturation = 0
    if h_max != h_min:
        diff = h_max - h_min
        saturation = diff / (255 - abs(2 * lightness * 255 - 255))

    if saturation < 0.12:
        if lightness < 0.35:
            return "Dark Gray"
        if lightness < 0.65:
            return "Gray"
        return "Light Gray"

    # Hue
    if h_max == r:
        hue = (g - b) / max(h_max - h_min, 1) % 6
    elif h_max == g:
        hue = (b - r) / max(h_max - h_min, 1) + 2
    else:
        hue = (r - g) / max(h_max - h_min, 1) + 4
    hue = hue * 60

    prefix = ""
    if lightness < 0.3:
        prefix = "Dark "
    elif lightness > 0.7:
        prefix = "Light "

    if hue < 15 or hue >= 345:
        name = "Red"
    elif hue < 45:
        name = "Orange"
    elif hue < 75:
        name = "Yellow"
    elif hue < 150:
        name = "Green"
    elif hue < 195:
        name = "Cyan"
    elif hue < 255:
        name = "Blue"
    elif hue < 285:
        name = "Indigo"
    elif hue < 345:
        name = "Purple"
    else:
        name = "Red"

    if 0.45 < saturation < 0.65 and prefix == "":
        prefix = "Muted "

    return prefix + name


def pil_image_to_reader(img: Image.Image) -> ImageReader:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


# ---------------------------------------------------------------------------
# PDF pages
# ---------------------------------------------------------------------------

PAGE_W, PAGE_H = letter  # 612 x 792 pts


def _title_bar(c: canvas.Canvas, title: str, subtitle: str = ""):
    c.setFillColorRGB(0.15, 0.15, 0.15)
    c.rect(0, PAGE_H - 60, PAGE_W, 60, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 38, title)
    if subtitle:
        c.setFont("Helvetica", 10)
        c.drawCentredString(PAGE_W / 2, PAGE_H - 52, subtitle)


def add_original_page(c: canvas.Canvas, img: Image.Image, source_name: str):
    c.setFillColorRGB(0.97, 0.97, 0.97)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    _title_bar(c, "Original Photo", source_name)

    # Draw image centered
    max_w = PAGE_W - 80
    max_h = PAGE_H - 140
    iw, ih = img.size
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    x = (PAGE_W - dw) / 2
    y = 60  # above footer

    c.drawImage(pil_image_to_reader(img), x, y, dw, dh)

    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_W / 2, 30, "Color Book Generator  •  Page 1")


def add_outline_page(c: canvas.Canvas, outline_img: Image.Image):
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    _title_bar(c, "Coloring Book Outline", "Print this page and color it in!")

    max_w = PAGE_W - 80
    max_h = PAGE_H - 140
    iw, ih = outline_img.size
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    x = (PAGE_W - dw) / 2
    y = 60

    c.drawImage(pil_image_to_reader(outline_img), x, y, dw, dh)

    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_W / 2, 30, "Color Book Generator  •  Page 2")


def add_palette_page(c: canvas.Canvas, colors: np.ndarray, page_num: int):
    """One page showing all dominant color swatches in a grid."""
    c.setFillColorRGB(0.97, 0.97, 0.97)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    _title_bar(c, "Dominant Color Palette", f"{len(colors)} colors extracted from your image")

    cols = 4
    rows = (len(colors) + cols - 1) // cols
    swatch_w = (PAGE_W - 80) / cols
    swatch_h = min(130, (PAGE_H - 120) / rows)
    margin_x = 40
    margin_y = 70  # bottom margin

    for idx, (r, g, b) in enumerate(colors):
        col = idx % cols
        row = idx // cols
        x = margin_x + col * swatch_w
        # rows go top-down
        y = PAGE_H - 80 - (row + 1) * swatch_h

        pad = 8
        # Swatch rectangle
        c.setFillColorRGB(r / 255, g / 255, b / 255)
        c.setStrokeColorRGB(0.7, 0.7, 0.7)
        c.roundRect(x + pad, y + 30, swatch_w - pad * 2, swatch_h - 40, 6, fill=1, stroke=1)

        # Text labels
        hex_code = rgb_to_hex(int(r), int(g), int(b))
        name = approximate_color_name(int(r), int(g), int(b))

        c.setFillColorRGB(0.15, 0.15, 0.15)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(x + swatch_w / 2, y + 18, hex_code)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + swatch_w / 2, y + 8, f"RGB({r}, {g}, {b})")
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(x + swatch_w / 2, y - 2, name)

    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_W / 2, 20, f"Color Book Generator  •  Page {page_num}")


def add_individual_swatch_pages(c: canvas.Canvas, colors: np.ndarray, start_page: int):
    """One large swatch page per color with color theory info."""
    for idx, (r, g, b) in enumerate(colors):
        page_num = start_page + idx
        c.showPage()

        r, g, b = int(r), int(g), int(b)
        hex_code = rgb_to_hex(r, g, b)
        name = approximate_color_name(r, g, b)

        # Background — very light tint of the color
        bg_r = min(1.0, r / 255 * 0.15 + 0.85)
        bg_g = min(1.0, g / 255 * 0.15 + 0.85)
        bg_b = min(1.0, b / 255 * 0.15 + 0.85)
        c.setFillColorRGB(bg_r, bg_g, bg_b)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

        # Big swatch centered
        sw = 260
        sh = 260
        sx = (PAGE_W - sw) / 2
        sy = PAGE_H / 2 - sh / 2 + 30
        c.setFillColorRGB(r / 255, g / 255, b / 255)
        c.setStrokeColorRGB(0.6, 0.6, 0.6)
        c.roundRect(sx, sy, sw, sh, 16, fill=1, stroke=1)

        # Color number badge
        c.setFillColorRGB(0.15, 0.15, 0.15)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(PAGE_W / 2, sy + sh + 20, f"Color {idx + 1} of {len(colors)}")

        # Hex + RGB
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(PAGE_W / 2, sy - 40, hex_code)

        c.setFont("Helvetica", 14)
        c.drawCentredString(PAGE_W / 2, sy - 62, f"RGB  {r}  ·  {g}  ·  {b}")

        c.setFont("Helvetica-Oblique", 16)
        c.drawCentredString(PAGE_W / 2, sy - 86, name)

        # Complementary color hint
        comp_r, comp_g, comp_b = 255 - r, 255 - g, 255 - b
        comp_hex = rgb_to_hex(comp_r, comp_g, comp_b)
        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.drawCentredString(PAGE_W / 2, sy - 110, f"Complementary: {comp_hex}")

        cw = 50
        ch = 28
        cx = PAGE_W / 2 - cw / 2
        cy = sy - 148
        c.setFillColorRGB(comp_r / 255, comp_g / 255, comp_b / 255)
        c.setStrokeColorRGB(0.7, 0.7, 0.7)
        c.roundRect(cx, cy, cw, ch, 6, fill=1, stroke=1)

        # Footer
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.setFont("Helvetica", 9)
        c.drawCentredString(PAGE_W / 2, 20, f"Color Book Generator  •  Page {page_num}")




# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate a color book PDF from an image.")
    parser.add_argument("image", help="Path to the source image file.")
    parser.add_argument("--colors", type=int, default=12, help="Number of dominant colors to extract (default: 12).")
    parser.add_argument("--output", default=None, help="Output PDF path (default: <image_stem>_color_book.pdf).")
    args = parser.parse_args()

    if not os.path.isfile(args.image):
        print(f"Error: file not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    generate_color_book(args.image, n_colors=args.colors, output_path=args.output)


if __name__ == "__main__":
    main()
