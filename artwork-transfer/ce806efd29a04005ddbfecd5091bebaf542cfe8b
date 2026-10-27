"""Pack one provenance-checked 4x map region from four generated context tiles."""
from __future__ import annotations

import hashlib
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

EXPECTED_RECT = [640, 420, 512, 512]
TILE_SIZE = 256
TILE_IDS = (('r0c0', 0, 0), ('r0c1', 1, 0), ('r1c0', 0, 1), ('r1c1', 1, 1))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _stitch_overlapping_tiles(tiles: dict[str, Image.Image], density: float,
                              padding: int) -> Image.Image:
    output_size = round(EXPECTED_RECT[2] * density)
    accumulated = np.zeros((output_size, output_size, 4), dtype=np.float32)
    total_weights = np.zeros((output_size, output_size), dtype=np.float32)
    tile_logical_size = TILE_SIZE + 2 * padding

    for name, col, row in TILE_IDS:
        tile = tiles[name]
        aligned_size = round(tile_logical_size * density)
        aligned = tile.resize((aligned_size, aligned_size), Image.Resampling.LANCZOS)
        tile_x, tile_y = col * TILE_SIZE, row * TILE_SIZE
        start_x = round((tile_x - padding) * density)
        start_y = round((tile_y - padding) * density)
        dest_x0, dest_y0 = max(0, start_x), max(0, start_y)
        dest_x1 = min(output_size, start_x + aligned_size)
        dest_y1 = min(output_size, start_y + aligned_size)
        if dest_x0 >= dest_x1 or dest_y0 >= dest_y1:
            continue
        source_x0, source_y0 = dest_x0 - start_x, dest_y0 - start_y
        source_x1 = source_x0 + dest_x1 - dest_x0
        source_y1 = source_y0 + dest_y1 - dest_y0
        pixels = np.asarray(aligned.crop((source_x0, source_y0, source_x1, source_y1)),
                            dtype=np.float32)

        logical_x = (np.arange(dest_x0, dest_x1, dtype=np.float32) + 0.5) / density
        logical_y = (np.arange(dest_y0, dest_y1, dtype=np.float32) + 0.5) / density
        weight_x = np.ones_like(logical_x)
        weight_y = np.ones_like(logical_y)
        if col > 0:
            weight_x = np.minimum(weight_x, np.clip(
                (logical_x - (tile_x - padding)) / (2 * padding), 0, 1))
        if col < 1:
            weight_x = np.minimum(weight_x, np.clip(
                (tile_x + TILE_SIZE + padding - logical_x) / (2 * padding), 0, 1))
        if row > 0:
            weight_y = np.minimum(weight_y, np.clip(
                (logical_y - (tile_y - padding)) / (2 * padding), 0, 1))
        if row < 1:
            weight_y = np.minimum(weight_y, np.clip(
                (tile_y + TILE_SIZE + padding - logical_y) / (2 * padding), 0, 1))
        weights = weight_y[:, None] * weight_x[None, :]
        accumulated[dest_y0:dest_y1, dest_x0:dest_x1] += pixels * weights[:, :, None]
        total_weights[dest_y0:dest_y1, dest_x0:dest_x1] += weights

    if np.any(total_weights <= 0):
        raise ValueError('map overlap blend left uncovered pixels')
    output = np.clip(np.rint(accumulated / total_weights[:, :, None]), 0, 255).astype(np.uint8)
    return Image.fromarray(output, mode='RGBA')


def _feather_outer_edges(image: Image.Image, density: float, logical_padding: int) -> Image.Image:
    pixels = np.asarray(image.convert('RGBA')).copy()
    height, width = pixels.shape[:2]
    fade = max(1, round(logical_padding * density))
    x_distance = np.minimum(np.arange(width), np.arange(width)[::-1])
    y_distance = np.minimum(np.arange(height), np.arange(height)[::-1])
    x_weight = np.clip(x_distance / fade, 0, 1)
    y_weight = np.clip(y_distance / fade, 0, 1)
    edge_weight = np.minimum(y_weight[:, None], x_weight[None, :])
    pixels[:, :, 3] = np.rint(pixels[:, :, 3].astype(np.float32) * edge_weight).astype(np.uint8)
    return Image.fromarray(pixels, mode='RGBA')


def _connected_sky_mask(image: Image.Image) -> np.ndarray:
    source = np.asarray(image.convert('RGB'))
    red, green, blue = source[:, :, 0], source[:, :, 1], source[:, :, 2]
    sky_blue = (blue >= 160) & (green >= 60) & (red <= 190) & ((blue - red) >= 45)
    cloud = (red >= 220) & (green >= 220) & (blue >= 220)
    traversable = sky_blue | cloud
    starts = [(0, x) for x in range(source.shape[1]) if sky_blue[0, x]]
    if not starts:
        return np.zeros(source.shape[:2], dtype=bool)
    connected = np.zeros(source.shape[:2], dtype=bool)
    queue = deque(starts)
    while queue:
        y, x = queue.popleft()
        if connected[y, x] or not traversable[y, x]:
            continue
        connected[y, x] = True
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= next_y < source.shape[0] and 0 <= next_x < source.shape[1] and not connected[next_y, next_x]:
                queue.append((next_y, next_x))
    return connected


def _preserve_original_sky(image: Image.Image, original_region: Image.Image) -> Image.Image:
    original_sky = Image.fromarray((_connected_sky_mask(original_region) * 255).astype(np.uint8), mode='L')
    generated_sky = Image.fromarray((_connected_sky_mask(image) * 255).astype(np.uint8), mode='L')
    source_mask = np.asarray(original_sky.resize(image.size, Image.Resampling.LANCZOS), dtype=np.float32) / 255
    generated_mask = np.asarray(generated_sky, dtype=np.float32) / 255
    high_resolution_mask = np.maximum(source_mask, generated_mask)
    pixels = np.asarray(image.convert('RGBA')).copy()
    pixels[:, :, 3] = np.rint(pixels[:, :, 3].astype(np.float32) * (1 - high_resolution_mask)).astype(np.uint8)
    return Image.fromarray(pixels, mode='RGBA')


def pack_map_region(manifest_path: Path, project_root: Path, destination: Path) -> dict:
    manifest = json.loads(manifest_path.read_text())
    if manifest.get('status') != 'unreviewed':
        raise ValueError('map region approval status is missing')
    if manifest.get('mapRect') != EXPECTED_RECT or manifest.get('logicalSize') != [512, 512]:
        raise ValueError(f'map region must preserve source rectangle {EXPECTED_RECT}')
    if manifest.get('gameWorldOffset') != [-184, -313]:
        raise ValueError('map world-offset reference differs from the original manifest')
    original = (project_root / manifest['sourceMap']).resolve()
    if not original.is_file() or sha256(original) != manifest.get('sourceMapSha256'):
        raise ValueError('original base-map source/hash is missing or changed')
    with Image.open(original) as source_map:
        rect = manifest['mapRect']
        original_region = source_map.convert('RGBA').crop((rect[0], rect[1], rect[0] + rect[2], rect[1] + rect[3]))
        if original_region.size != (EXPECTED_RECT[2], EXPECTED_RECT[3]):
            raise ValueError('original base-map source does not cover the logical sample region')
    reference_padding = manifest.get('paddingUsedForReference')
    if not isinstance(reference_padding, int) or reference_padding <= 0:
        raise ValueError('context bleed around generated tiles is required')
    tiles = manifest.get('tiles')
    if not isinstance(tiles, list) or len(tiles) != 4 or {tile.get('tile') for tile in tiles} != {item[0] for item in TILE_IDS}:
        raise ValueError('map sample must contain exactly four identified quadrant masters')

    density = None
    row_heights: set[int] = set()
    col_widths: set[int] = set()
    tile_hashes = {}
    tile_images: dict[str, Image.Image] = {}
    for name, col, row in TILE_IDS:
        tile = next(item for item in tiles if item.get('tile') == name)
        expected_pos = [EXPECTED_RECT[0] + col * TILE_SIZE, EXPECTED_RECT[1] + row * TILE_SIZE]
        if tile.get('logicalPosition') != expected_pos or tile.get('logicalSize') != [TILE_SIZE, TILE_SIZE]:
            raise ValueError(f'map tile position drift: {name}')
        source_path = (project_root / tile['sourcePath']).resolve()
        reference_path = (project_root / tile['inputReference']).resolve()
        if not source_path.is_relative_to(project_root.resolve()) or not source_path.is_file():
            raise ValueError(f'map tile master path is missing/outside the workspace: {tile.get("sourcePath")}')
        if sha256(source_path) != tile.get('sourceSha256'):
            raise ValueError(f'map tile source hash changed: {name}')
        with Image.open(source_path) as raw:
            raw.load()
            image = raw.convert('RGBA')
        if image.getchannel('A').getextrema() != (255, 255):
            raise ValueError(f'map artwork tile must be fully opaque in the source region: {name}')
        if isinstance(tile.get('generationResultPixels'), list) and tile['generationResultPixels'] != list(image.size):
            raise ValueError(f'map tile pixel metadata differs: {name}')
        if not reference_path.is_relative_to(project_root.resolve()) or not reference_path.is_file():
            raise ValueError(f'missing exact base-map context reference: {name}')
        if tile.get('inputReferenceSha256') and sha256(reference_path) != tile['inputReferenceSha256']:
            raise ValueError(f'map tile input reference hash changed: {name}')
        scale_x = image.width / 288
        scale_y = image.height / 288
        if abs(scale_x - scale_y) > 0.002 or min(scale_x, scale_y) < 4:
            raise ValueError(f'map source texture is below 4x logical density: {name} ({image.size})')
        crop = [round(reference_padding * scale_x),
                round(reference_padding * scale_y),
                round((reference_padding + TILE_SIZE) * scale_x),
                round((reference_padding + TILE_SIZE) * scale_y)]
        sample = image.crop(tuple(crop))
        if min(sample.width / TILE_SIZE, sample.height / TILE_SIZE) < 4:
            raise ValueError(f'map content region is below 4x: {name}')
        actual_density = sample.width / TILE_SIZE
        if density is None:
            density = actual_density
        elif abs(actual_density - density) > 0.002:
            raise ValueError(f'map tile texture densities disagree: {name}')
        tile_images[name] = image
        row_heights.add(sample.height)
        col_widths.add(sample.width)
        tile_hashes[name] = sha256(source_path)

    if len(row_heights) != 1 or len(col_widths) != 1:
        raise ValueError('the four packed source regions do not align as one 512x512 tile')
    result = _stitch_overlapping_tiles(tile_images, density, reference_padding)
    result = _feather_outer_edges(result, density, reference_padding)
    result = _preserve_original_sky(result, original_region)
    if result.getchannel('A').getextrema() != (0, 255):
        raise ValueError('the 512x512 map patch must blend at its edge and remain opaque in the center')
    destination.parent.mkdir(parents=True, exist_ok=True)
    result.save(destination, format='PNG', optimize=True)
    image_density = result.width / EXPECTED_RECT[2]
    return {
        'status': 'unreviewed', 'logicalRect': EXPECTED_RECT, 'logicalSize': [512, 512],
        'pixelSize': list(result.size), 'pixelDensity': image_density,
        'scenePosition': [EXPECTED_RECT[0] + manifest['gameWorldOffset'][0],
                          EXPECTED_RECT[1] + manifest['gameWorldOffset'][1]],
        'sourceMap': manifest['sourceMap'], 'sourceMapSha256': manifest['sourceMapSha256'],
        'tileMasterSha256': tile_hashes, 'outputSha256': sha256(destination),
    }


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    manifest = root / 'public/modern/hd-masters/map/region-11-9-v2/masters.json'
    output = root / '.analysis-cache/hd-rework/prepared/map-region-11-9-v2.png'
    print(json.dumps(pack_map_region(manifest, root, output), ensure_ascii=False, indent=2))
