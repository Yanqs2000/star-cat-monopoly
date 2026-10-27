"""Re-export original StarQ HUD bitmaps and button vectors without changing the SWF."""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba'
BITMAPS = {'emblem.png': 1672, 'cash.png': 1668, 'deposit.png': 1669,
           'tickets.png': 1670, 'card-rail.png': 1678}
VECTORS = {'portrait-ring.svg': ('shape', 1778, '1778.svg'),
           'button.svg': ('button', 2072, 'DefineButton2_2072/1_up.svg'),
           'button-hover.svg': ('button', 2072, 'DefineButton2_2072/2_over.svg')}

def main():
    source = ROOT / 'public/original/play.swf'
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise SystemExit('Original SWF hash mismatch')
    common_dir = Path(subprocess.check_output(['git', 'rev-parse', '--git-common-dir'], cwd=ROOT, text=True).strip())
    repository = (ROOT / common_dir).resolve().parent
    jar = Path(os.environ.get('FFDEC_JAR', repository / '.analysis-tools/ffdec-26.2.1/ffdec.jar'))
    java = os.environ.get('FFDEC_JAVA', '/opt/homebrew/opt/openjdk/bin/java')
    command = [java, '-Djava.awt.headless=true', '-jar', str(jar)]
    if 'v.26.2.1' not in subprocess.check_output(command + ['-help'], text=True):
        raise SystemExit('Expected JPEXS 26.2.1')
    destination = ROOT / 'public/modern/assets/ui'
    destination.mkdir(parents=True, exist_ok=True)
    assets = []
    with tempfile.TemporaryDirectory(prefix='starcat-game-ui-') as temporary:
        scratch = Path(temporary)
        groups = [('image', list(BITMAPS.values()), []), ('shape', [1778], ['-format', 'shape:svg']),
                  ('button', [2072], ['-format', 'button:svg'])]
        for kind, ids, options in groups:
            subprocess.run(command + ['-selectid', ','.join(map(str, ids))] + options +
                           ['-export', kind, str(scratch / kind), str(source)], check=True)
        for name, symbol in BITMAPS.items():
            shutil.copyfile(scratch / 'image' / f'{symbol}.png', destination / name)
        for name, (kind, symbol, relative) in VECTORS.items():
            shutil.copyfile(scratch / kind / relative, destination / name)
    for name, symbol in {**BITMAPS, **{name: spec[1] for name, spec in VECTORS.items()}}.items():
        assets.append({'url': f'assets/ui/{name}', 'sourceSymbol': symbol,
                       'sha256': hashlib.sha256((destination / name).read_bytes()).hexdigest()})
    (destination / 'manifest.json').write_text(json.dumps({'version': 1, 'sourceSha256': SOURCE_SHA,
        'tool': 'JPEXS 26.2.1', 'assets': assets}, indent=2) + '\n')
    print(f'Exported {len(assets)} original UI assets')

if __name__ == '__main__':
    main()
