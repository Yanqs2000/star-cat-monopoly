"""Verify map-only artwork provenance and replay the approved tile assembly."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image

from build_hd_map_region_sample import pack_map_region
from hd_map_tiles import split_map_image

ROOT = Path(__file__).resolve().parents[1]


def verify() -> dict:
    manifest = json.loads((ROOT / 'public/modern/hd-map/manifest.json').read_text())
    inventory = json.loads((ROOT / 'public/modern/hd-masters/map/inventory.json').read_text())
    for entry in inventory['images']:
        path = ROOT / entry['path']
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError(f'Map source changed: {path}')
    regions = manifest['mapRegions']
    if manifest['reviewStatus'] != 'approved' or len(regions) != 4:
        raise ValueError('Only the four approved sample tiles may be installed')
    master_path = ROOT / 'public/modern/hd-masters/map/region-11-9-v2/masters.json'
    with TemporaryDirectory() as temporary:
        output = Path(temporary) / 'map.png'
        packed = pack_map_region(master_path, ROOT, output)
        with Image.open(output) as image:
            chunks = split_map_image(image.convert('RGBA'), logical_rect=tuple(packed['logicalRect']),
                                     pixel_density=packed['pixelDensity'], tile_size=256, overlap=1.25)
        for chunk in chunks:
            matches = [item for item in regions if item['tileId'] == chunk['tileId']]
            if len(matches) != 1:
                raise ValueError('Missing or duplicated approved map tile')
            entry = matches[0]
            expected_path = f'hd-map/region-11-9/{chunk["tileId"]}.webp'
            if entry['path'] != expected_path or entry['reviewStatus'] != 'approved':
                raise ValueError('Unexpected map path or unapproved artwork')
            for key in ['logicalRect', 'pixelSize', 'pixelDensity', 'contentRect', 'overlapPixels']:
                if entry[key] != chunk[key]:
                    raise ValueError(f'Map tile geometry changed: {entry["path"]} {key}')
            expected_position = [chunk['logicalRect'][0] - 184, chunk['logicalRect'][1] - 313]
            if entry['scenePosition'] != expected_position or entry['sourceMapSha256'] != packed['sourceMapSha256']:
                raise ValueError('Map tile source/scene position changed')
            if entry['tileMasterSha256'] != {chunk['tileId']: packed['tileMasterSha256'][chunk['tileId']]}:
                raise ValueError('Map tile approval no longer matches its master')
            path = ROOT / 'public/modern' / expected_path
            if hashlib.sha256(path.read_bytes()).hexdigest() != entry['outputSha256']:
                raise ValueError(f'Map runtime tile changed: {path}')
            with Image.open(path) as encoded:
                actual = np.asarray(encoded.convert('RGBA'))
            expected = np.asarray(chunk['image'])
            # Fully transparent RGB is not displayed and may be discarded by WebP.
            if (not np.array_equal(actual[:, :, 3], expected[:, :, 3])
                    or not np.array_equal(actual[:, :, :3][expected[:, :, 3] > 0],
                                          expected[:, :, :3][expected[:, :, 3] > 0])):
                raise ValueError(f'Runtime tile differs from rebuilt master pixels: {path}')
    return {'mapSourceImages': len(inventory['images']), 'approvedRuntimeTiles': len(regions),
            'logicalRegion': [640, 420, 512, 512], 'characterArtImported': False}


if __name__ == '__main__':
    print(json.dumps(verify(), ensure_ascii=False))
