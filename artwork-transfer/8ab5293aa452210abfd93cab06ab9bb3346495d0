"""Hash-locked, offline original 3C artwork and timeline export."""
from pathlib import Path
import hashlib
import json
import math
import os
import subprocess
import argparse
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--task', choices=['2','3'], default='2')
    parser.add_argument('--metadata-file', type=Path, help='Reuse metadata from an already completed native export')
    parser.add_argument('--native-selection', help='Export one newly added native scene without repeating completed groups')
    args = parser.parse_args()
    source = ROOT / 'public/original/play.swf'
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise SystemExit('Original source hash mismatch')
    jar = Path(os.environ.get('FFDEC_JAR', ROOT.parents[1] / '.analysis-tools/ffdec-26.2.1/ffdec.jar'))
    java = os.environ.get('FFDEC_JAVA', '/opt/homebrew/opt/openjdk/bin/java')
    version = subprocess.run([java, '-jar', str(jar), '-help'], check=True, capture_output=True, text=True).stdout
    if 'v.26.2.1' not in version: raise SystemExit('Expected JPEXS26.2.1')
    output = ROOT / 'public/modern/assets/activities'
    cache = ROOT / '.analysis-cache/3c-assets/export'
    if args.metadata_file:
        data = json.loads(args.metadata_file.read_text())
    else:
        command = [java, '-Xmx2g', '-Djava.awt.headless=true', '--class-path', str(jar),
            str(ROOT / 'scripts/ExportActivityAssets.java'), str(source), str(output), str(cache)]
        if args.native_selection: command.append(args.native_selection)
        elif args.task == '3': command.append('task3')
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0: raise SystemExit(result.stderr)
        data = json.loads(result.stdout)
        cache.mkdir(parents=True, exist_ok=True)
        (cache / f'{args.native_selection or args.task}-metadata.json').write_text(result.stdout)
    for clip in data['clips']:
        bounds = clip['boundsTwips']
        with Image.open(output / clip['id'] / '1.png') as image:
            width, height = image.size
        # Native filters extend these dialogue/viewport canvases symmetrically.
        padding = 14 if clip['id']=='gamewin' else 12 if clip['id'] in ['witch', 'lottery','court-target','court-case','court-verdict','bankrupt','gamewin','gameover'] else 13 if clip['id']=='carnival-intro' else 9 if clip['id']=='ludo-dice' else 7 if clip['id']=='station' else 6 if clip['id'].startswith('trait-') or clip['id'] in ['show-npc4','show2'] else 0
        expected = (math.ceil((bounds[1]-bounds[0])/20)+padding*2, math.ceil((bounds[3]-bounds[2])/20)+padding*2)
        if (width,height) != expected: raise SystemExit(f'Unexpected source raster geometry {clip["id"]}: {(width,height)} expected {expected}')
        clip.update(fps=30, loop=False)
        for frame in clip['frames']:
            path = output / clip['id'] / f'{frame["sourceFrame"]}.png'
            with Image.open(path) as image:
                if image.mode!='RGBA' or image.size!=(width,height): raise SystemExit(f'Native frame mismatch: {path}')
            frame.update(url=f'assets/activities/{clip["id"]}/{frame["sourceFrame"]}.png', width=width, height=height,
                         offsetX=bounds[0]/20-padding, offsetY=bounds[2]/20-padding)
    previous_path = output / 'manifest.json'
    previous = json.loads(previous_path.read_text()) if previous_path.exists() else None
    if previous and previous['sourceSha256'] != SOURCE_SHA: raise SystemExit('Previous artwork source hash mismatch')
    clips = {clip['id']: clip for clip in previous['clips']} if previous else {}
    clips.update({clip['id']: clip for clip in data['clips']})
    manifest = dict(version=1, sourceSha256=SOURCE_SHA, clips=list(clips.values()))
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    if hashlib.sha256(source.read_bytes()).hexdigest()!=SOURCE_SHA: raise SystemExit('Source unexpectedly changed')
    print(f'Exported {sum(len(clip["frames"]) for clip in data["clips"])} native activity frames')

if __name__=='__main__': main()
