"""Index byte-identical animation frames in both artwork profiles; keep timelines intact."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public/modern'
overrides = {item['source']: item['url'] for item in json.loads((ROOT / 'src/modern/data/static-hd-assets.json').read_text())['assets'] if item['enabled']}
paths = [PUBLIC / 'assets/activities/manifest.json', *sorted((PUBLIC / 'assets/characters').glob('*/reactions/manifest.json'))]
groups = {}
for path in paths:
    for clip in json.loads(path.read_text())['clips']:
        for frame in clip['frames']:
            url = frame['url']
            prefix, number = url.rsplit('/', 1)
            groups.setdefault(prefix, {})[int(number.removesuffix('.png'))] = url
aliases = {}
for prefix, frames in sorted(groups.items()):
    seen, indices = {}, []
    for number, url in sorted(frames.items()):
        hd = overrides.get(url, url.replace('assets/', 'assets-hd/', 1).removesuffix('.png') + '.webp')
        key = tuple(hashlib.sha256((PUBLIC / name).read_bytes()).hexdigest() for name in (url, hd))
        indices.append(seen.setdefault(key, number))
    if any(number != index for number, index in zip(sorted(frames), indices)):
        aliases[prefix] = indices
output = ROOT / 'src/modern/data/animation-frame-aliases.json'
output.write_text('{\n' + ',\n'.join('  '+json.dumps(key)+':'+json.dumps(value,separators=(',',':')) for key,value in aliases.items()) + '\n}\n')
print(f'{len(aliases)} frame groups -> {output}')
