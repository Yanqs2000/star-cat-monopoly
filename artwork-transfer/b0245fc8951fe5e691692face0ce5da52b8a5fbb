"""Register one inspected built-in ImageGen master without touching completed art."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


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
    with Image.open(generated) as original:
        image = original.convert('RGBA')
    density = 3 if job['kind'] in {'event-illustration', 'ui-panel'} else 4
    if min(image.width / width, image.height / height) < density:
        raise ValueError(f'Master below {density}x native density')
    if abs(image.width / image.height / (width / height) - 1) > 0.01:
        raise ValueError('Master aspect ratio differs from original logical canvas')
    relative = Path(source.removeprefix('assets/'))
    master = ROOT / 'public/modern/hd-static-masters' / relative.with_name(relative.stem + '-selected.png')
    output = ROOT / 'public/modern/hd-static' / relative.with_suffix('.webp')
    master.parent.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(generated, master)
    image.resize((width * density, height * density), Image.Resampling.LANCZOS).save(
        output, 'WEBP', lossless=True, exact=True, method=6)
    with Image.open(output) as encoded:
        alpha = hashlib.sha256(encoded.convert('RGBA').getchannel('A').tobytes()).hexdigest()
    entry = {'source': source, 'url': 'hd-static/' + relative.with_suffix('.webp').as_posix(),
             'logicalSize': [width, height], 'pixelSize': [width * density, height * density], 'pixelDensity': density,
             'nativePixelSize': list(image.size), 'masterPath': master.relative_to(ROOT).as_posix(),
             'masterSha256': sha(master), 'outputSha256': sha(output), 'outputAlphaSha256': alpha,
             'method': f'built-in image_gen faithful redraw; downsampled for {density}x runtime',
             'enabled': True, 'reviewStatus': 'pending-user-review', 'prompt': prompt}
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
