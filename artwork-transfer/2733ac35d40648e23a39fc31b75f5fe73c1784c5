"""Check installed redraws and ensure previously completed artwork is untouched."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image
from register_static_hd_master import validate_panel_opacity

ROOT = Path(__file__).resolve().parents[1]
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()


def verify() -> dict:
    queue = json.loads((ROOT / 'docs/modernization/static-hd-production.json').read_text())
    index = json.loads((ROOT / 'src/modern/data/static-hd-assets.json').read_text())
    for relative, expected in queue['protectedExistingFiles'].items():
        if sha(ROOT / relative) != expected:
            raise ValueError(f'Previously completed asset changed: {relative}')
    permitted = {source: job for job in queue['jobs'] for source in [job['source'], *job['aliases']]}
    sources = set()
    for entry in index['assets']:
        source = entry['source']
        if source not in permitted or source in sources:
            raise ValueError(f'Duplicate or out-of-scope replacement: {source}')
        sources.add(source)
        job = permitted[source]
        source_path = ROOT / 'public/modern' / source
        if sha(source_path) != job['sourceSha256'] or job['status'] != 'installed-pending-user-review':
            raise ValueError(f'Replacement does not match its original static job: {source}')
        if sha(ROOT / entry['masterPath']) != entry['masterSha256']:
            raise ValueError(f'Master changed: {entry["masterPath"]}')
        output = ROOT / 'public/modern' / entry['url']
        if not output.resolve().is_relative_to((ROOT / 'public/modern/hd-static').resolve()):
            raise ValueError('Runtime path outside static asset directory')
        if sha(output) != entry['outputSha256']:
            raise ValueError(f'Runtime image changed: {output}')
        with Image.open(source_path) as image:
            source_image = image.convert('RGBA')
            if list(image.size) != entry['logicalSize']:
                raise ValueError(f'Logical canvas changed: {source}')
            source_bounds = image.convert('RGBA').getchannel('A').point(lambda value: 255 if value >= 128 else 0).getbbox()
        with Image.open(output) as image:
            validate_panel_opacity(source_image, image, job['kind'])
            if list(image.size) != entry['pixelSize']:
                raise ValueError('Runtime bounds differ')
            alpha = image.convert('RGBA').getchannel('A')
            if hashlib.sha256(alpha.tobytes()).hexdigest() != entry['outputAlphaSha256']:
                raise ValueError('Generated alpha not preserved')
            bounds = alpha.point(lambda value: 255 if value >= 128 else 0).getbbox()
            registration = entry.get('registration')
            if registration:
                rendered = [value / entry['pixelDensity'] for value in bounds]
                if registration != {'sourceBounds': list(source_bounds), 'renderedBounds': rendered}:
                    raise ValueError('Sprite registration differs from measured source and output bounds')
                if min((bounds[2] - bounds[0]) / (source_bounds[2] - source_bounds[0]),
                       (bounds[3] - bounds[1]) / (source_bounds[3] - source_bounds[1])) < 4:
                    raise ValueError('Registered visible artwork is below 4x density')
        if entry['pixelSize'] != [round(value * entry['pixelDensity']) for value in entry['logicalSize']]:
            raise ValueError('Runtime density differs from logical size')
    return {'protectedFilesUnchanged': len(queue['protectedExistingFiles']),
            'installedPaths': len(sources), 'distinctStaticJobs': len(queue['jobs']),
            'installedJobs': sum(job['status'] == 'installed-pending-user-review' for job in queue['jobs']),
            'complete': all(job['status'] == 'installed-pending-user-review' for job in queue['jobs'])
                        and queue['map']['status'] == 'complete'}


if __name__ == '__main__':
    print(json.dumps(verify(), ensure_ascii=False))
