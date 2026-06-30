#!/usr/bin/env python3
"""Convert photos into printable coloring-book line art."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def load_image(path: Path) -> np.ndarray:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    return image


def is_line_art(image: np.ndarray) -> bool:
    """True when the source is already a black-and-white coloring page."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    white = np.mean(gray > 235)
    black = np.mean(gray < 40)
    mid = np.mean((gray >= 40) & (gray <= 235))
    return white > 0.45 and black > 0.01 and mid < 0.2


def passthrough_line_art(image: np.ndarray) -> np.ndarray:
    """Preserve an existing coloring page without redrawing it."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, page = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    return page


def _estimate_background_color(image: np.ndarray) -> np.ndarray:
    h, w = image.shape[:2]
    pad = max(3, min(h, w) // 80)
    samples = np.concatenate(
        [
            image[:pad, :].reshape(-1, 3),
            image[-pad:, :].reshape(-1, 3),
            image[:, :pad].reshape(-1, 3),
            image[:, -pad:].reshape(-1, 3),
        ]
    )
    return np.median(samples, axis=0)


def _quantize_regions(image: np.ndarray, n_colors: int) -> np.ndarray:
    smoothed = cv2.bilateralFilter(image, 11, 90, 90)
    pixels = smoothed.reshape(-1, 3).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, centers = cv2.kmeans(
        pixels,
        n_colors,
        None,
        criteria,
        5,
        cv2.KMEANS_PP_CENTERS,
    )
    return centers[labels.flatten()].reshape(image.shape).astype(np.uint8)


def strict_coloring_page(image: np.ndarray, n_colors: int = 10) -> np.ndarray:
    """Trace only color-region boundaries; ignore paint texture."""
    if is_line_art(image):
        return passthrough_line_art(image)

    quantized = _quantize_regions(image, n_colors)
    h, w = quantized.shape[:2]
    flat = quantized.reshape(-1, 3)
    _, inverse = np.unique(flat, axis=0, return_inverse=True)
    label_map = inverse.reshape(h, w)
    bg = _estimate_background_color(image)

    page = np.full((h, w), 255, np.uint8)
    kernel = np.ones((21, 21), np.uint8)
    for label_id in np.unique(label_map):
        color = quantized[label_map == label_id][0]
        if np.all(np.abs(color.astype(np.int16) - bg.astype(np.int16)) < 35):
            continue
        mask = (label_map == label_id).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(page, contours, -1, 0, 2)

    return page


def to_coloring_page(
    image: np.ndarray,
    *,
    style: str = "strict",
    detail: int = 9,
    blur: int = 7,
    n_colors: int = 10,
) -> np.ndarray:
    """Return a black-and-white coloring page (white background, dark outlines)."""
    if style == "strict":
        return strict_coloring_page(image, n_colors=n_colors)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if style == "sketch":
        _, sketch = cv2.pencilSketch(
            image,
            sigma_s=60,
            sigma_r=0.07,
            shade_factor=0.04,
        )
        return sketch

    if style == "illustration":
        smooth = cv2.bilateralFilter(image, 9, 75, 75)
        smooth_gray = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY)
        if blur > 0:
            if blur % 2 == 0:
                blur += 1
            smooth_gray = cv2.medianBlur(smooth_gray, blur)
        median = float(np.median(smooth_gray))
        lower = int(max(0, 0.67 * median))
        upper = int(min(255, 1.33 * median))
        edges = cv2.Canny(smooth_gray, lower, upper)
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
        return cv2.bitwise_not(edges)

    if blur > 0:
        if blur % 2 == 0:
            blur += 1
        gray = cv2.medianBlur(gray, blur)

    if style == "bold":
        block = max(3, detail | 1)
        page = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY,
            block,
            2,
        )
        kernel = np.ones((2, 2), np.uint8)
        return cv2.erode(page, kernel, iterations=1)

    block = max(3, detail | 1)
    return cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        block,
        9,
    )


def save_page(page: np.ndarray, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(output_path), page):
        raise OSError(f"Failed to write output: {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a coloring-book page from a photo."
    )
    parser.add_argument("input", type=Path, help="Source image (jpg, png, webp, etc.)")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output image path (default: <input>_coloring.png)",
    )
    parser.add_argument(
        "--style",
        choices=("strict", "outline", "bold", "sketch", "illustration"),
        default="strict",
        help="strict traces color regions only; no improvisation (default)",
    )
    parser.add_argument(
        "--colors",
        type=int,
        default=10,
        help="Color regions for strict mode (default: 10)",
    )
    parser.add_argument(
        "--detail",
        type=int,
        default=9,
        help="Detail level for outline/bold styles (odd number, default: 9)",
    )
    parser.add_argument(
        "--blur",
        type=int,
        default=7,
        help="Noise reduction blur radius (odd number, default: 7)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output = args.output or args.input.with_name(f"{args.input.stem}_coloring.png")

    image = load_image(args.input)
    page = to_coloring_page(
        image,
        style=args.style,
        detail=args.detail,
        blur=args.blur,
        n_colors=args.colors,
    )
    save_page(page, output)
    mode = "passthrough (already line art)" if args.style == "strict" and is_line_art(image) else args.style
    print(f"Saved coloring page to {output} [{mode}]")


if __name__ == "__main__":
    main()
