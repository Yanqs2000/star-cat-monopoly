"""Check installed redraws and ensure previously completed artwork is untouched."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image

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
            if list(image.size) != entry['logicalSize']:
                raise ValueError(f'Logical canvas changed: {source}')
        with Image.open(output) as image:
            if list(image.size) != entry['pixelSize']:
                raise ValueError('Runtime bounds differ')
            alpha = image.convert('RGBA').getchannel('A')
            if hashlib.sha256(alpha.tobytes()).hexdigest() != entry['outputAlphaSha256']:
                raise ValueError('Generated alpha not preserved')
        if entry['pixelSize'] != [value * entry['pixelDensity'] for value in entry['logicalSize']]:
            raise ValueError('Runtime density differs from logical size')
    return {'protectedFilesUnchanged': len(queue['protectedExistingFiles']),
            'installedPaths': len(sources), 'distinctStaticJobs': len(queue['jobs']),
            'installedJobs': sum(job['status'] == 'installed-pending-user-review' for job in queue['jobs']),
            'complete': all(job['status'] == 'installed-pending-user-review' for job in queue['jobs'])
                        and queue['map']['status'] == 'complete'}


if __name__ == '__main__':
    print(json.dumps(verify(), ensure_ascii=False))
