"""Offline extraction of the original map and all character walking clips.

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
FACINGS = ('down-right', 'down-left', 'up-left', 'up-right')
CHARACTER_NAMES = (
    '卷毛', '阿牛', '吉吉&米米', '佳佳', '大牌', '薇薇',
    '帅戈', '大尾', '阿飞', '阿杰', '怪卡', '妮妮',
)


def run_export(command, arguments, log_path):
    result = subprocess.run(
        command + ['-onerror', 'abort'] + arguments,
        check=True,
        capture_output=True,
        text=True,
    )
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(result.stdout + result.stderr)
    if not result.stdout.strip().endswith('OK'):
        raise SystemExit(f'{log_path.stem} export did not report OK')


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
    source_files = {
        item['name']: item['sha256']
        for item in json.loads((original / 'manifest.json').read_text())['files']
    }
    hashes = {}
    for name in ('play.swf', *(f'star{character_id}.swf' for character_id in range(1, 13))):
        digest = hashlib.sha256((original / name).read_bytes()).hexdigest()
        if digest != source_files.get(name):
            raise SystemExit(f'Original hash mismatch: {name}')
        hashes[name] = digest

    cache = ROOT / '.analysis-cache/modern-assets'
    output = ROOT / 'public/modern/assets'
    cache.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    map_cache = cache / 'map'
    run_export(
        command,
        ['-selectid', '20', '-format', 'image:png', '-export', 'image', str(map_cache), str(original / 'play.swf')],
        cache / 'map.log',
    )
    map_path = map_cache / '20_map.png'
    with Image.open(map_path) as image:
        image.load()
        if image.size != (2700, 2552) or image.mode != 'RGBA':
            raise SystemExit('Unexpected original map dimensions or alpha')
    shutil.copyfile(map_path, output / 'map.png')

    map_metadata = {
        'url': 'assets/map.png',
        'sourceId': 20,
        'width': 2700,
        'height': 2552,
        # Gametoxy copies source pixels from (184-game.x, 313-game.y).
        'offsetX': -184,
        'offsetY': -313,
    }
    index = {'version': 1, 'characters': []}
    frame_counts = {}
    for character_id, character_name in enumerate(CHARACTER_NAMES, start=1):
        star_name = f'star{character_id}.swf'
        star_path = original / star_name
        character_cache = cache / 'characters' / str(character_id)
        bounds_result = subprocess.run(
            [java, '-Djava.awt.headless=true', '--class-path', str(jar),
             str(ROOT / 'scripts/OriginalSpriteBounds.java'), str(star_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        bounds = json.loads(bounds_result.stdout)
        character_cache.mkdir(parents=True, exist_ok=True)
        (character_cache / 'bounds.json').write_text(bounds_result.stdout)
        if len(bounds) != 4 or [item['rootFrame'] for item in bounds] != [5, 35, 65, 95]:
            raise SystemExit(f'Unexpected walking root frames: {star_name}')
        for meta in bounds:
            if meta['frames'] <= 0 or abs(meta['frameRate'] - 30) > 0.0001:
                raise SystemExit(f'Unexpected walking timing: {star_name}')
            if meta['hasRotate'] or any(abs(scale - 1) > 0.0001 for scale in meta['scale']):
                raise SystemExit(f'Unsupported root transform: {star_name}')

        sprite_ids = ','.join(str(meta['id']) for meta in bounds)
        walk_cache = character_cache / 'walk'
        run_export(
            command,
            ['-selectid', sprite_ids, '-format', 'sprite:png', '-export', 'sprite', str(walk_cache), str(star_path)],
            character_cache / 'walk.log',
        )

        clips = []
        frame_counts[character_id] = []
        for facing, meta in zip(FACINGS, bounds):
            frame_count = meta['frames']
            frame_counts[character_id].append(frame_count)
            if character_id == 1:
                target = output / 'walk' / facing
                url_prefix = f'assets/walk/{facing}'
            else:
                target = output / 'characters' / str(character_id) / 'walk' / facing
                url_prefix = f'assets/characters/{character_id}/walk/{facing}'
            target.mkdir(parents=True, exist_ok=True)
            x_min, x_max, y_min, y_max = meta['boundsTwips']
            tx, ty = meta['translateTwips']
            frames = []
            for frame_index in range(1, frame_count + 1):
                source = walk_cache / f'DefineSprite_{meta["id"]}/{frame_index}.png'
                with Image.open(source) as image:
                    image.load()
                    expected = (math.ceil((x_max - x_min) / 20), math.ceil((y_max - y_min) / 20))
                    if image.mode != 'RGBA' or image.size != expected:
                        raise SystemExit(f'Frame bounds or alpha mismatch: {source}')
                    if image.getchannel('A').getextrema() != (0, 255):
                        raise SystemExit(f'Missing opaque/transparent pixels: {source}')
                shutil.copyfile(source, target / f'{frame_index}.png')
                frames.append({
                    'sourceFrame': frame_index,
                    'url': f'{url_prefix}/{frame_index}.png',
                    'durationMs': 1000 / meta['frameRate'],
                    'offsetX': (x_min + tx) / 20,
                    'offsetY': (y_min + ty) / 20,
                })
            clips.append({
                'facing': facing,
                'sourceSpriteId': meta['id'],
                'sourceBoundsTwips': meta['boundsTwips'],
                'sourcePlacementTwips': meta['translateTwips'],
                'frames': frames,
            })

        manifest = {
            'version': 1,
            'tool': 'JPEXS 26.2.1',
            'sourceHashes': {'play.swf': hashes['play.swf'], star_name: hashes[star_name]},
            'map': map_metadata,
            'clips': clips,
        }
        if character_id == 1:
            manifest_path = output / 'manifest.json'
            manifest_url = 'assets/manifest.json'
        else:
            manifest_path = output / 'characters' / str(character_id) / 'manifest.json'
            manifest_url = f'assets/characters/{character_id}/manifest.json'
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        index['characters'].append({
            'id': character_id,
            'name': character_name,
            'manifestUrl': manifest_url,
        })

    index_path = output / 'characters' / 'index.json'
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n')
    counts = ', '.join(f'{character_id}:{values[0]}' for character_id, values in frame_counts.items())
    print(f'Exported original RGBA map and all character walking clips ({counts} frames per direction)')


if __name__ == '__main__':
    main()
