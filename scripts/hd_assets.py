"""Non-destructive black-background extraction and narrowly scoped SWF patching.

Requires Pillow and numpy. Run from any directory; originals are never written.
"""
from pathlib import Path
import io
import json
import struct
import zlib
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'public/hd-review'
OUTPUT = ROOT / 'public/hd-assets'


def remove_black_background(image):
    rgb = np.array(image.convert('RGB'))
    # Flood only edge-connected near-black pixels. Black eyes and clothing
    # enclosed by the silhouette remain opaque, unlike global color-keying.
    dark = np.max(rgb, axis=2) <= 2
    mask = Image.fromarray(np.pad(np.where(dark, 0, 255).astype('uint8'), 1)).copy()
    ImageDraw.floodfill(mask, (0, 0), 128, thresh=0)
    outside = np.array(mask)[1:-1, 1:-1] == 128
    opaque = (~outside).astype('uint8') * 255
    # A narrow edge band softens the extracted silhouette; do not blur interiors.
    edge = np.array(Image.fromarray(outside.astype('uint8') * 255).filter(ImageFilter.MaxFilter(3))) > 0
    alpha = opaque.copy()
    soft = edge & ~outside
    alpha[soft] = np.clip((np.max(rgb, axis=2)[soft].astype(float) - 2) / 12 * 255, 0, 255).astype('uint8')
    result = np.dstack([rgb, alpha])
    # Remove black matte contamination only where alpha was softened.
    partial = (alpha > 0) & (alpha < 255)
    result[partial, :3] = np.minimum(255, rgb[partial].astype(float) * 255 / alpha[partial, None]).astype('uint8')
    result[outside, :3] = 0
    return Image.fromarray(result, 'RGBA')


class Bits:
    def __init__(self, data, bit=0):
        self.data, self.bit = data, bit

    def read(self, n, signed=False):
        value = 0
        for _ in range(n):
            value = value * 2 + ((self.data[self.bit // 8] >> (7 - self.bit % 8)) & 1)
            self.bit += 1
        return value - (1 << n) if signed and n and value & (1 << (n - 1)) else value

    def align(self):
        self.bit = (self.bit + 7) // 8 * 8


def matrix(data, start):
    bits = Bits(data, start * 8)
    sx = sy = 65536
    if bits.read(1):
        n = bits.read(5)
        sx, sy = bits.read(n, True), bits.read(n, True)
    r0 = r1 = 0
    if bits.read(1):
        n = bits.read(5)
        r0, r1 = bits.read(n, True), bits.read(n, True)
    n = bits.read(5)
    tx, ty = bits.read(n, True), bits.read(n, True)
    bits.align()
    return (sx, sy, r0, r1, tx, ty), bits.bit // 8


def encode_matrix(values):
    bits = ''
    def put(value, n):
        nonlocal bits
        bits += format(value & ((1 << n) - 1), f'0{n}b') if n else ''
    def pair(a, b):
        n = max(abs(a).bit_length(), abs(b).bit_length()) + 1
        put(n, 5)
        put(a, n)
        put(b, n)
    sx, sy, r0, r1, tx, ty = values
    put(1, 1)
    pair(sx, sy)
    put(bool(r0 or r1), 1)
    if r0 or r1:
        pair(r0, r1)
    pair(tx, ty)
    bits += '0' * ((-len(bits)) % 8)
    return int(bits, 2).to_bytes(len(bits) // 8, 'big')


def scale_bitmap_fill(shape, bitmap_id, ratio_x, ratio_y):
    # These original bitmap wrappers are DefineShape (tag 2), with initial
    # bitmap fills. Reject other structures rather than guessing byte offsets.
    bits = Bits(shape, 16)
    bits.read(bits.read(5) * 4)
    bits.align()
    p = bits.bit // 8
    count = shape[p]
    p += 1
    if count == 255:
        raise ValueError('Extended fill arrays are not supported')
    edits = []
    for _ in range(count):
        kind = shape[p]
        p += 1
        if kind == 0:
            p += 3
        elif kind in (0x40, 0x41, 0x42, 0x43):
            ref = struct.unpack_from('<H', shape, p)[0]
            p += 2
            start = p
            values, p = matrix(shape, p)
            if ref == bitmap_id:
                sx, sy, r0, r1, tx, ty = values
                scaled = (round(sx / ratio_x), round(sy / ratio_y), round(r0 / ratio_x), round(r1 / ratio_y), tx, ty)
                edits.append((start, p, shape[start:p] if ratio_x == ratio_y == 1 else encode_matrix(scaled)))
        else:
            raise ValueError(f'Unsupported fill style {kind}')
    if len(edits) != 1:
        raise ValueError(f'Expected exactly one reference to bitmap {bitmap_id}')
    for start, end, replacement in reversed(edits):
        shape = shape[:start] + replacement + shape[end:]
    return shape


def tags(body):
    p = (5 + 4 * (body[0] >> 3) + 7) // 8 + 4
    yield None, body[:p]
    while p < len(body):
        h = struct.unpack_from('<H', body, p)[0]
        p += 2
        size = h & 63
        if size == 63:
            size = struct.unpack_from('<I', body, p)[0]
            p += 4
        if p + size > len(body):
            raise ValueError('Truncated SWF tag')
        yield h >> 6, body[p:p + size]
        p += size


def tag(code, data):
    return struct.pack('<HI', (code << 6) | 63, len(data)) + data


def patch_swf(source, destination, assets):
    original = source.read_bytes()
    body = zlib.decompress(original[8:])
    replacements, ratios = {}, {}
    for asset in assets:
        image = Image.open(OUTPUT / (asset['key'] + '.png')).convert('RGBA')
        pixels = np.array(image).astype(np.uint16)
        argb = np.empty_like(pixels, dtype=np.uint8)
        argb[:, :, 0] = pixels[:, :, 3]
        argb[:, :, 1:] = ((pixels[:, :, :3] * pixels[:, :, 3:] + 127) // 255).astype('uint8')
        replacements[asset['tag']] = struct.pack('<HBHH', asset['tag'], 5, *image.size) + zlib.compress(argb.tobytes())
        old = Image.open(REVIEW / asset['originalFile'])
        ratios[asset['tag'] + 1] = (asset['tag'], image.width / old.width, image.height / old.height)
    chunks, changed_images, changed_shapes = [], set(), set()
    for code, data in tags(body):
        if code is None:
            chunks.append(data)
            continue
        identity = struct.unpack_from('<H', data)[0] if len(data) >= 2 else None
        if code == 35 and identity in replacements:
            code, data = 36, replacements[identity]
            changed_images.add(identity)
        elif code == 2 and identity in ratios:
            data = scale_bitmap_fill(data, *ratios[identity])
            changed_shapes.add(identity)
        chunks.append(tag(code, data))
    if changed_images != set(replacements) or changed_shapes != set(ratios):
        raise ValueError('Not all requested bitmap/shape pairs were found')
    result = b''.join(chunks)
    destination.write_bytes(b'CWS' + original[3:4] + struct.pack('<I', len(result) + 8) + zlib.compress(result))
    return {'file': destination.name, 'bitmapIds': sorted(changed_images), 'shapeIds': sorted(changed_shapes), 'originalSha256': hashlib.sha256(original).hexdigest()}


def main():
    OUTPUT.mkdir(exist_ok=True)
    assets = json.loads((REVIEW / 'batch-manifest.json').read_text())['assets']
    assets = [{'key': 'juanmao', 'tag': 1, 'swf': 'star1.swf', 'originalFile': 'juanmao-original.jpg', 'type': 'character'}, {'key': 'building', 'tag': 178, 'swf': 'play.swf', 'originalFile': 'building-original.jpg', 'type': 'building'}] + assets
    records = []
    for asset in assets:
        target = OUTPUT / (asset['key'] + '.png')
        rgba = remove_black_background(Image.open(REVIEW / (asset['key'] + '-hd-candidate.png')))
        rgba.save(target)
        alpha = np.array(rgba)[:, :, 3]
        if not (np.any(alpha == 0) and np.any(alpha == 255)):
            raise ValueError('Missing transparent or opaque pixels')
        records.append({'key': asset['key'], 'width': rgba.width, 'height': rgba.height, 'transparentPixels': int(np.sum(alpha == 0)), 'opaquePixels': int(np.sum(alpha == 255)), 'partialPixels': int(np.sum((alpha > 0) & (alpha < 255)))})
        print(asset['key'], 'RGBA', flush=True)
    # Buildings are static assets. Character frame patch is a separate preview
    # and is not used in the game until all animation frames are consistent.
    patched = [patch_swf(ROOT / 'public/original/play.swf', OUTPUT / 'play.swf', [a for a in assets if a['type'] == 'building']), patch_swf(ROOT / 'public/original/star1.swf', OUTPUT / 'star1-preview.swf', [assets[0]])]
    # The external character file has no self-running display timeline. Make
    # a renderer fixture using its actual patched shape, not a PNG overlay.
    stage = [0, 16000, 0, 8000]
    n = 16
    bits = format(n, '05b') + ''.join(format(v, f'0{n}b') for v in stage)
    bits += '0' * ((-len(bits)) % 8)
    sample = int(bits, 2).to_bytes(len(bits) // 8, 'big') + struct.pack('<HH', 24 * 256, 1)
    sample += tag(9, bytes([168, 221, 237]))
    for depth, (filename, bitmap, shape, scale, x, y) in enumerate([('play.swf', 178, 179, 1.5, 4000, 4200), ('star1-preview.swf', 1, 2, 3, 11200, 4000)], 1):
        for code, data in tags(zlib.decompress((OUTPUT / filename).read_bytes()[8:])):
            identity = int.from_bytes(data[:2], 'little')
            if (code == 36 and identity == bitmap) or (code == 2 and identity == shape):
                sample += tag(code, data)
        sample += tag(26, struct.pack('<BHH', 6, depth, shape) + encode_matrix((round(scale * 65536), round(scale * 65536), 0, 0, x, y)))
    sample += tag(1, b'') + tag(0, b'')
    (OUTPUT / 'render-check.swf').write_bytes(b'CWS\x08' + struct.pack('<I', len(sample) + 8) + zlib.compress(sample))
    (OUTPUT / 'manifest.json').write_text(json.dumps({'assets': records, 'patched': patched, 'characterAnimationIntegrated': False}, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
