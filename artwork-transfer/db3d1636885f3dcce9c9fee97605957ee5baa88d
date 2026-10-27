"""Incrementally add the original brow2 clips; never re-export existing reactions."""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.analysis-cache/3c-cheer'
JAVA_SOURCE = ROOT / 'scripts/ExportReactionAssets.java'
spec = importlib.util.spec_from_file_location('reaction_export', ROOT / 'scripts/export-reaction-assets.py')
helpers = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = helpers
spec.loader.exec_module(helpers)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    jar = Path(os.environ.get('FFDEC_JAR', ROOT.parents[1] / '.analysis-tools/ffdec-26.2.1/ffdec.jar')).resolve()
    java = os.environ.get('FFDEC_JAVA', '/opt/homebrew/opt/openjdk/bin/java')
    version = subprocess.run([java, '-Djava.awt.headless=true', '-jar', str(jar), '-help'], check=True, capture_output=True, text=True).stdout
    if 'v.26.2.1' not in version:
        raise SystemExit('Expected JPEXS 26.2.1')
    classes = CACHE / 'java'; classes.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(Path(java).with_name('javac')), '-cp', str(jar), '-d', str(classes), str(JAVA_SOURCE)], check=True)
    source_manifest = json.loads((ROOT / 'public/original/manifest.json').read_text())
    declared = {item['name']: item['sha256'] for item in source_manifest['files']}
    definitions = {}; total_frames = 0
    for actor in range(1, 13):
        source = ROOT / f'public/original/star{actor}.swf'
        source_hash = digest(source)
        if source_hash != declared[f'star{actor}.swf']:
            raise SystemExit(f'Source hash mismatch: {source}')
        fingerprint = {'source': source_hash, 'java': digest(JAVA_SOURCE), 'jar': digest(jar)}
        raw = CACHE / 'raw' / str(actor); raw.mkdir(parents=True, exist_ok=True)
        meta_path = raw / 'metadata.json'; fingerprint_path = raw / 'fingerprint.json'
        if not (meta_path.exists() and fingerprint_path.exists() and json.loads(fingerprint_path.read_text()) == fingerprint):
            result = subprocess.run([java, '-Xmx2g', '-Djava.awt.headless=true', '-cp', os.pathsep.join([str(classes), str(jar)]), 'ExportReactionAssets', str(source), str(raw), str(CACHE / 'scratch' / str(actor)), str(actor), 'cheer'], check=True, capture_output=True, text=True)
            meta_path.write_text(result.stdout)
            fingerprint_path.write_text(json.dumps(fingerprint))
        metadata = json.loads(meta_path.read_text())
        if metadata['tool'] != 'JPEXS 26.2.1' or metadata['characterId'] != actor or len(metadata['clips']) != 4:
            raise SystemExit('Unexpected source cheer metadata')
        manifest_path = ROOT / f'public/modern/assets/characters/{actor}/reactions/manifest.json'
        manifest = json.loads(manifest_path.read_text())
        if manifest['sourceSha256'] != source_hash:
            raise SystemExit('Reaction source hash mismatch')
        manifest['clips'] = [clip for clip in manifest['clips'] if clip['name'] != 'cheer']
        definitions[str(actor)] = []
        for facing_index, item in enumerate(metadata['clips']):
            facing = helpers.FACINGS[facing_index]
            if item['name'] != 'cheer' or item['facing'] != facing or item['sourceRootFrame'] != facing_index * 30 + 2 or item['frames'] < 2:
                raise SystemExit('Invalid source cheer timeline')
            size = helpers.canvas_size(item['renderBoundsTwips']); origin = helpers.offset(item['renderBoundsTwips'])
            frames = []
            for index in range(1, item['frames'] + 1):
                input_png = raw / f'cheer/{facing}/{index}.png'
                image = helpers.decoded_rgba(input_png, size)
                url = f'assets/characters/{actor}/reactions/cheer/{facing}/{index}.png'
                output = ROOT / 'public/modern' / url; output.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(input_png, output)
                if helpers.decoded_rgba(output, size).tobytes() != image.tobytes():
                    raise SystemExit('RGBA changed during copy')
                frames.append({'url': url, 'width': size[0], 'height': size[1], 'offsetX': origin[0], 'offsetY': origin[1]})
            manifest['clips'].append({'name': 'cheer', 'facing': facing, 'fps': 30, 'loop': False, 'sourceRootFrame': item['sourceRootFrame'], 'sourceSymbol': item['sourceSymbol'], 'frames': frames})
            definitions[str(actor)].append([item['sourceSymbol'], item['frames']]); total_frames += item['frames']
        if digest(source) != source_hash:
            raise SystemExit('Original source changed')
        helpers.write_json(manifest_path, manifest)
        print(f'star{actor}: 4 original brow2 clips verified', flush=True)
    helpers.write_json(ROOT / 'src/modern/data/cheer-source.json', definitions)
    print(f'Verified 48 cheer clips / {total_frames} PNG frames; existing reactions untouched', flush=True)

if __name__ == '__main__':
    main()
