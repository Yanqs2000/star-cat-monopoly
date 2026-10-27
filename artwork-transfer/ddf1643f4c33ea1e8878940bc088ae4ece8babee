"""Offline extraction of original map and four walking clips; no AI edits.

Set FFDEC_JAR and optionally FFDEC_JAVA, then run with Python + Pillow.
Published files are plain PNG/JSON; Java, JPEXS and SWF remain offline inputs.
"""
from pathlib import Path
import hashlib
import json
import math
import os
import shutil
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    jar = Path(os.environ.get('FFDEC_JAR', ROOT / '.analysis-tools/ffdec-26.2.1/ffdec.jar')).resolve()
    java = os.environ.get('FFDEC_JAVA', shutil.which('java') or 'java')
    if not jar.is_file():
        raise SystemExit('Set FFDEC_JAR to the verified JPEXS 26.2.1 ffdec.jar')
    command = [java, '-Xmx2g', '-Djava.awt.headless=true', '-jar', str(jar)]
    version = subprocess.run(command + ['-help'], check=True, capture_output=True, text=True).stdout
    if 'v.26.2.1' not in version:
        raise SystemExit('Expected JPEXS 26.2.1')
    original = ROOT / 'public/original'
    files = json.loads((original / 'manifest.json').read_text())['files']
    hashes = {}
    for name in ('play.swf', 'star1.swf'):
        digest = hashlib.sha256((original / name).read_bytes()).hexdigest()
        if digest != next(f['sha256'] for f in files if f['name'] == name):
            raise SystemExit(f'Original hash mismatch: {name}')
        hashes[name] = digest
    cache = ROOT / '.analysis-cache/modern-assets'
    output = ROOT / 'public/modern/assets'
    cache.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    for name, arguments in [
        ('map', ['-selectid', '20', '-format', 'image:png', '-export', 'image', str(cache / 'map'), str(original / 'play.swf')]),
        ('walk', ['-selectid', '130,308,488,664', '-format', 'sprite:png', '-export', 'sprite', str(cache / 'walk'), str(original / 'star1.swf')]),
    ]:
        result = subprocess.run(command + ['-onerror', 'abort'] + arguments, check=True, capture_output=True, text=True)
        (cache / f'{name}.log').write_text(result.stdout + result.stderr)
        if not result.stdout.strip().endswith('OK'):
            raise SystemExit(f'{name} export did not report OK')
    result = subprocess.run([java, '-Djava.awt.headless=true', '--class-path', str(jar), str(ROOT / 'scripts/OriginalSpriteBounds.java'), str(original / 'star1.swf')], check=True, capture_output=True, text=True)
    bounds = json.loads(result.stdout)
    (cache / 'bounds.json').write_text(result.stdout)
    map_path = cache / 'map/20_map.png'
    with Image.open(map_path) as image:
        image.load()
        if image.size != (2700, 2552) or image.mode != 'RGBA':
            raise SystemExit('Unexpected original map dimensions or alpha')
    shutil.copyfile(map_path, output / 'map.png')
    clips = []
    for facing, meta in zip(('down-right', 'down-left', 'up-left', 'up-right'), bounds):
        if meta['frames'] != 24:
            raise SystemExit(f'Unexpected walking duration: {facing}')
        target = output / 'walk' / facing
        target.mkdir(parents=True, exist_ok=True)
        x_min, x_max, y_min, y_max = meta['boundsTwips']
        tx, ty = meta['translateTwips']
        frames = []
        for index in range(1, 25):
            source = cache / f'walk/DefineSprite_{meta["id"]}/{index}.png'
            with Image.open(source) as image:
                image.load()
                expected = (math.ceil((x_max - x_min) / 20), math.ceil((y_max - y_min) / 20))
                if image.mode != 'RGBA' or image.size != expected:
                    raise SystemExit(f'Frame bounds or alpha mismatch: {source}')
                if image.getchannel('A').getextrema() != (0, 255):
                    raise SystemExit(f'Missing opaque/transparent pixels: {source}')
            shutil.copyfile(source, target / f'{index}.png')
            frames.append({'sourceFrame': index, 'url': f'assets/walk/{facing}/{index}.png', 'durationMs': 1000 / 30, 'offsetX': (x_min + tx) / 20, 'offsetY': (y_min + ty) / 20})
        clips.append({'facing': facing, 'sourceSpriteId': meta['id'], 'sourceBoundsTwips': meta['boundsTwips'], 'sourcePlacementTwips': meta['translateTwips'], 'frames': frames})
    manifest = {
        'version': 1, 'tool': 'JPEXS 26.2.1', 'sourceHashes': hashes,
        # Gametoxy copies source pixels from (184-game.x, 313-game.y).
        'map': {'url': 'assets/map.png', 'sourceId': 20, 'width': 2700, 'height': 2552, 'offsetX': -184, 'offsetY': -313},
        'clips': clips,
    }
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print('Exported original RGBA map and 96 walking frames with SWF-derived offsets')


if __name__ == '__main__':
    main()
