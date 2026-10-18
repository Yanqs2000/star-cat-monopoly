"""Create diagnostic comparisons; never changes production artwork or alpha."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parents[1]


def preview(asset: dict, scale: int = 3) -> Image.Image:
    image = Image.open(ROOT / 'public/modern' / asset['url']).convert('RGBA')
    source = asset['registration']['sourceBounds']
    rendered = asset['registration']['renderedBounds']
    sx = (source[2] - source[0]) / (rendered[2] - rendered[0])
    sy = (source[3] - source[1]) / (rendered[3] - rendered[1])
    dx, dy = source[0] - rendered[0] * sx, source[1] - rendered[1] * sy
    density = asset['pixelDensity']
    return image.transform((90 * scale, 124 * scale), Image.Transform.AFFINE,
                           (density / (scale * sx), 0, -dx * density / sx,
                            0, density / (scale * sy), -dy * density / sy),
                           Image.Resampling.BICUBIC)


def compare(output: Path) -> None:
    assets = {asset['source']: asset for asset in json.loads((ROOT / 'src/modern/data/static-hd-assets.json').read_text())['assets']}
    output.mkdir(parents=True, exist_ok=True)
    measurements = []
    for facing in [1, 2]:
        sheet = Image.new('RGB', (5 * 270, 5 * 400), '#18333e')
        draw = ImageDraw.Draw(sheet)
        for row, level in enumerate(range(1, 6)):
            key = lambda owner: f'assets/properties/houses/owner-{owner}/facing-{facing}/level-{level}.png'
            original = Image.open(ROOT / 'public/modern' / key(1)).convert('RGBA').resize((270, 372), Image.Resampling.NEAREST)
            sheet.paste(original, (0, row * 400 + 24), original)
            draw.text((4, row * 400 + 5), f'Original F{facing} L{level}', fill='white')
            for owner in [1, 2, 3, 4]:
                x, y = owner * 270, row * 400
                draw.text((x + 4, y + 5), f'P{owner} F{facing} L{level}', fill='white')
                if key(owner) in assets:
                    rendered = preview(assets[key(owner)])
                    sheet.paste(rendered, (x, y + 24), rendered)
                    if owner != 1 and key(1) in assets:
                        baseline = preview(assets[key(1)])
                        a = baseline.getchannel('A').point(lambda value: 255 if value >= 128 else 0).convert('1')
                        b = rendered.getchannel('A').point(lambda value: 255 if value >= 128 else 0).convert('1')
                        # Ignore the ownership cube, whose color is intentionally different.
                        ImageDraw.Draw(a).rectangle((25 * 3, 90 * 3, 68 * 3, 124 * 3), fill=0)
                        ImageDraw.Draw(b).rectangle((25 * 3, 90 * 3, 68 * 3, 124 * 3), fill=0)
                        intersection = ImageChops.logical_and(a, b)
                        union = ImageChops.logical_or(a, b)
                        area = lambda mask: ImageStat.Stat(mask.convert('L')).sum[0] / 255
                        difference = ImageChops.difference(baseline.convert('RGB'), rendered.convert('RGB'))
                        measurements.append({'facing': facing, 'level': level, 'owner': owner,
                            'bodySilhouetteIoU': area(intersection) / area(union),
                            'bodyRgbMae': sum(ImageStat.Stat(difference, intersection.convert('L')).mean) / 3,
                            'source': key(owner), 'masterSha256': assets[key(owner)]['masterSha256']})
                else:
                    draw.text((x + 30, y + 170), 'PENDING', fill='#ffe18a')
        path = output / f'house-colors-facing-{facing}.png'
        sheet.save(path)
        print(path)
    (output / 'measurements.json').write_text(json.dumps({'purpose': 'diagnostic only; requires visual part-by-part review', 'pairs': measurements}, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('/tmp/starcat-house-consistency'))
    compare(parser.parse_args().output)
