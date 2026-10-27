"""Split a high-resolution map region into context-overlapped logical tiles."""
from __future__ import annotations

import math

from PIL import Image


def split_map_image(image: Image.Image, *, logical_rect: tuple[int, int, int, int],
                    pixel_density: float, tile_size: int = 256,
                    overlap: float = 1.0) -> list[dict]:
    x, y, width, height = logical_rect
    if not math.isfinite(pixel_density) or pixel_density < 4:
        raise ValueError('map tile density must be at least 4')
    if (tile_size <= 0 or not math.isfinite(overlap) or overlap <= 0
            or x < 0 or y < 0 or width <= 0 or height <= 0):
        raise ValueError('map tile geometry is invalid')
    if image.size != (round(width * pixel_density), round(height * pixel_density)):
        raise ValueError('map tile source pixel dimensions do not match logical region')

    bleed_pixels = max(1, round(overlap * pixel_density))
    columns = math.ceil(width / tile_size)
    rows = math.ceil(height / tile_size)
    chunks = []
    for row in range(rows):
        content_y = row * tile_size
        content_height = min(tile_size, height - content_y)
        pixel_y0 = round(content_y * pixel_density)
        pixel_y1 = round((content_y + content_height) * pixel_density)
        crop_y0 = max(0, pixel_y0 - bleed_pixels)
        crop_y1 = min(image.height, pixel_y1 + bleed_pixels)
        for col in range(columns):
            content_x = col * tile_size
            content_width = min(tile_size, width - content_x)
            pixel_x0 = round(content_x * pixel_density)
            pixel_x1 = round((content_x + content_width) * pixel_density)
            crop_x0 = max(0, pixel_x0 - bleed_pixels)
            crop_x1 = min(image.width, pixel_x1 + bleed_pixels)
            crop = image.crop((crop_x0, crop_y0, crop_x1, crop_y1))
            logical_rect = [
                round(x + crop_x0 / pixel_density, 6),
                round(y + crop_y0 / pixel_density, 6),
                round(crop.width / pixel_density, 6),
                round(crop.height / pixel_density, 6),
            ]
            content_rect = [x + content_x, y + content_y,
                            content_width, content_height]
            chunks.append({
                'tileId': f'r{row}c{col}',
                'contentRect': content_rect,
                'logicalRect': logical_rect,
                'pixelDensity': pixel_density,
                'pixelSize': list(crop.size),
                'overlapPixels': [pixel_x0 - crop_x0, pixel_y0 - crop_y0,
                                  crop_x1 - pixel_x1, crop_y1 - pixel_y1],
                'image': crop,
            })
    return chunks
