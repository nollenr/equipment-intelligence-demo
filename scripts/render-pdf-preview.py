#!/usr/bin/env python3
"""Render one PDF page to PNG for authoring-time visual inspection."""

from __future__ import annotations

import argparse
from pathlib import Path

import pymupdf


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("page", type=int, help="One-based page number")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    document = pymupdf.open(args.pdf)
    page_index = args.page - 1
    if page_index < 0 or page_index >= document.page_count:
        raise SystemExit(
            f"page {args.page} is outside the PDF's 1-{document.page_count} range"
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    page = document.load_page(page_index)
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
    pixmap.save(args.output)
    print(
        f"rendered page {args.page}/{document.page_count} "
        f"({pixmap.width}x{pixmap.height}) to {args.output}"
    )


if __name__ == "__main__":
    main()
