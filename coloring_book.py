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


def to_coloring_page(
    image: np.ndarray,
    *,
    style: str = "outline",
    detail: int = 9,
    blur: int = 7,
) -> np.ndarray:
    """Return a black-and-white coloring page (white background, dark outlines)."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    if style == "sketch":
        _, sketch = cv2.pencilSketch(
            image,
            sigma_s=60,
            sigma_r=0.07,
            shade_factor=0.04,
        )
        page = sketch
    else:
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
            page = cv2.erode(page, kernel, iterations=1)
        else:
            block = max(3, detail | 1)
            page = cv2.adaptiveThreshold(
                gray,
                255,
                cv2.ADAPTIVE_THRESH_MEAN_C,
                cv2.THRESH_BINARY,
                block,
                9,
            )

    return page


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
        choices=("outline", "bold", "sketch"),
        default="outline",
        help="Line style: outline (default), bold, or sketch",
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
    )
    save_page(page, output)
    print(f"Saved coloring page to {output}")


if __name__ == "__main__":
    main()
