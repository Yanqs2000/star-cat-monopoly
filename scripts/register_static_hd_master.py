"""Register one inspected built-in ImageGen master without touching completed art."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def validate_panel_opacity(source: Image.Image, candidate: Image.Image, kind: str) -> None:
    """Reject accidental interior cutouts only when the original has a solid panel."""
    if kind not in {'activity-panel', 'ui-panel'} or max(source.size) <= 300:
        return
    def interior_alpha(image):
        width, height = image.size
        return image.convert('RGBA').getchannel('A').crop(
            (round(width * .05), round(height * .05), round(width * .95), round(height * .95)))
    if interior_alpha(source).getextrema()[0] < 250:
        return  # Floating maps and cutout props intentionally contain transparent space.
    alpha = interior_alpha(candidate)
    if sum(alpha.histogram()[:240]) > alpha.width * alpha.height * .001:
        raise ValueError('Solid panel has damaged interior opacity; regenerate before installing')


def register(source: str, generated: Path, prompt: str) -> dict:
    queue_path = ROOT / 'docs/modernization/static-hd-production.json'
    index_path = ROOT / 'src/modern/data/static-hd-assets.json'
    queue = json.loads(queue_path.read_text())
    job = next((job for job in queue['jobs'] if job['source'] == source), None)
    if job is None or job['status'] == 'installed-pending-user-review':
        raise ValueError('Not an uncompleted static artwork job; do not regenerate completed images')
    source_file = ROOT / 'public/modern' / source
    if sha(source_file) != job['sourceSha256']:
        raise ValueError('Original source changed')
    with Image.open(source_file) as original:
        width, height = original.size
        source_image = original.convert('RGBA')
        source_bounds = original.convert('RGBA').getchannel('A').point(lambda value: 255 if value >= 128 else 0).getbbox()
    with Image.open(generated) as original:
        image = original.convert('RGBA')
    density = 3 if job['kind'] in {'event-illustration', 'ui-panel'} else 4
    if job['kind'] == 'activity-panel' and max(width, height) > 600:
        density = 1.5
    registered_sprite = job['kind'] in {'property', 'neutral-property'}
    if registered_sprite:
        bounds = image.getchannel('A').point(lambda value: 255 if value >= 128 else 0).getbbox()
        if not source_bounds or not bounds:
            raise ValueError('Empty property sprite')
        effective_native_density = min((bounds[2] - bounds[0]) / (source_bounds[2] - source_bounds[0]),
                                       (bounds[3] - bounds[1]) / (source_bounds[3] - source_bounds[1]))
        if effective_native_density < 4:
            raise ValueError('Visible artwork is below 4x native density')
        scale_x = (source_bounds[2] - source_bounds[0]) / ((bounds[2] - bounds[0]) * width / image.width)
        scale_y = (source_bounds[3] - source_bounds[1]) / ((bounds[3] - bounds[1]) * height / image.height)
        density = max(4, math.ceil(4 * max(scale_x, scale_y)) + 1)
    if min(image.width / width, image.height / height) < density:
        raise ValueError(f'Master below {density}x native density')
    # Registered sprites align visible bounds in the renderer; their empty margins
    # may differ. Illustrations and UI canvases must retain their original aspect.
    if not registered_sprite and abs(image.width / image.height / (width / height) - 1) > 0.01:
        raise ValueError('Master aspect ratio differs from original logical canvas')
    validate_panel_opacity(source_image, image, job['kind'])
    relative = Path(source.removeprefix('assets/'))
    master = ROOT / 'public/modern/hd-static-masters' / relative.with_name(relative.stem + '-selected.png')
    output = ROOT / 'public/modern/hd-static' / relative.with_suffix('.webp')
    master.parent.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(generated, master)
    pixel_size = (round(width * density), round(height * density))
    image.resize(pixel_size, Image.Resampling.LANCZOS).save(
        output, 'WEBP', lossless=True, exact=True, method=6)
    with Image.open(output) as encoded:
        alpha = hashlib.sha256(encoded.convert('RGBA').getchannel('A').tobytes()).hexdigest()
        rendered_bounds = encoded.convert('RGBA').getchannel('A').point(lambda value: 255 if value >= 128 else 0).getbbox()
    entry = {'source': source, 'url': 'hd-static/' + relative.with_suffix('.webp').as_posix(),
             'logicalSize': [width, height], 'pixelSize': list(pixel_size), 'pixelDensity': density,
             'nativePixelSize': list(image.size), 'masterPath': master.relative_to(ROOT).as_posix(),
             'masterSha256': sha(master), 'outputSha256': sha(output), 'outputAlphaSha256': alpha,
             'method': f'built-in image_gen faithful redraw; downsampled for {density}x runtime',
             'enabled': True, 'reviewStatus': 'pending-user-review', 'prompt': prompt}
    if registered_sprite:
        entry['registration'] = {'sourceBounds': list(source_bounds),
                                 'renderedBounds': [value / density for value in rendered_bounds]}
        entry['method'] += '; visible bounds registered at render time; alpha unchanged'
    index = json.loads(index_path.read_text())
    index['assets'].append(entry)
    for alias in job['aliases']:
        index['assets'].append({**entry, 'source': alias})
    job.update(status='installed-pending-user-review', runtime=entry)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
    queue_path.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + '\n')
    return entry


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--generated', type=Path, required=True)
    parser.add_argument('--prompt-file', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(register(args.source, args.generated, args.prompt_file.read_text()), ensure_ascii=False))
